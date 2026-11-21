import {changeMembership} from './changes';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {db} from './connection';
import {indexed} from './record-index';
import {batchMetadata,aggregate,parseRecordQuery,RecordQuery} from './record-query';
import type {AuthUser} from '../lib/auth-types';
import {AccessError,authAudit,activeUser,assertEntitlement} from '../lib/auth';
import {isExportMode,ExportMode} from '../lib/export-options';
import type {ExportJob} from '../lib/export-job-types';
export interface ExportOptions {query:RecordQuery;mode:ExportMode;selection:string;access?:{role:'Admin'|'User';group:string|null};}
export interface ExportRow {id:string;batch_id:string;filename:string;requested_by:string;requested_username:string;options:string;status:ExportJob['status'];total:number;progress:number;created_at:number;updated_at:number;expires_at:number;file_path:string|null;error:string|null;lease_owner:string|null;lease_until:number|null;request_key:string|null;}
export const EXPORT_RETENTION_MS=24*60*60*1000;
export function exportDirectory(){const database=process.env.ADDRESS_DB_PATH||path.join(process.cwd(),'data','address.db');return path.join(path.dirname(path.resolve(database)),'export-files');}
export function exportDto(row:ExportRow):ExportJob{return {id:row.id,batchId:row.batch_id,filename:row.filename,requestedBy:row.requested_username,status:row.status,total:row.total,progress:row.progress,mode:(JSON.parse(row.options) as ExportOptions).mode,selection:(JSON.parse(row.options) as ExportOptions).selection,createdAt:row.created_at,updatedAt:row.updated_at,expiresAt:row.expires_at,error:row.error};}
export function getExportRow(id:string){return db().prepare('SELECT * FROM export_jobs WHERE id=?').get(id) as ExportRow|undefined;}
export function getExport(user:AuthUser,id:string){assertEntitlement(user,'exportResults');const row=getExportRow(id);if(!row||!db().prepare('SELECT 1 FROM batches WHERE id=?').get(row.batch_id))throw new AccessError('Export not found',404);if(user.role==='User'){const access=(JSON.parse(row.options) as ExportOptions).access;if(row.requested_by!==user.id||access?.role!=='User'||!user.group?.trim()||access.group!==user.group)throw new AccessError('Export not found',404);}return row;}
export function queueExport(user:AuthUser,batchId:string,params:URLSearchParams,requestKey?:string){
 assertEntitlement(user,'exportResults');const mode=params.get('mode')||'full';if(!isExportMode(mode))throw new AccessError('Choose full, source-hybrid or changes export mode',400);
 const scope=params.get('scope')||'all';if(!['all','selected'].includes(scope))throw new AccessError('Invalid export scope',400);
 const query=parseRecordQuery(params);if(scope==='all'){query.statuses=[];query.search='';delete query.focusStatus;}
 if(requestKey!==undefined&&(typeof requestKey!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(requestKey)))throw new AccessError('Invalid export request key',400);
 return indexed(d=>d.transaction(()=>{
  const batch=batchMetadata(d,batchId,user),total=mode==='changes'?changeMembership(d,batchId,user,query).changedRecords:aggregate(d,batchId,user,query).total;
  if(!total)throw new AccessError(mode==='changes'?'No approved field changes match this export selection':'No records match this export selection',400);
  if(requestKey){const existing=d.prepare('SELECT * FROM export_jobs WHERE request_key=?').get(requestKey) as ExportRow|undefined;if(existing){if(existing.requested_by!==user.id||existing.batch_id!==batchId||JSON.parse(existing.options).mode!==mode||JSON.stringify({...JSON.parse(existing.options).query,exportState:JSON.parse(existing.options).query.exportState||'all'})!==JSON.stringify(query)||JSON.stringify(JSON.parse(existing.options).access||{role:'Admin',group:null})!==JSON.stringify({role:user.role,group:user.group}))throw new AccessError('Export request key is already in use',409);return exportDto(existing);}}
  const selection=`Group: ${query.group}; sort: ${query.groupSort}; scope: ${scope}; statuses (ANY): ${query.statuses.join(', ')||'All'}; focus (AND): ${query.focusStatus||'None'}; search: ${query.search||'None'}; export tracking: ${query.exportState||'all'}; snapshot taken when worker starts`;
  const options:ExportOptions={query,mode,selection,access:{role:user.role,group:user.group}};const id=randomUUID(),now=Date.now();
  d.prepare("INSERT INTO export_jobs(id,batch_id,filename,requested_by,requested_username,options,status,total,created_at,updated_at,expires_at,request_key) VALUES(?,?,?,?,?,?,'QUEUED',?,?,?,?,?)").run(id,batchId,batch.filename,user.id,user.username,JSON.stringify(options),total,now,now,now+EXPORT_RETENTION_MS,requestKey||null);
  authAudit(user,'EXPORT_QUEUED',id,JSON.stringify({batchId,mode,total}));return exportDto(getExportRow(id)!);
 })(),db(),true);
}
export function listExports(user:AuthUser){assertEntitlement(user,'exportResults');return (user.role==='Admin'?db().prepare('SELECT e.* FROM export_jobs e JOIN batches b ON b.id=e.batch_id ORDER BY e.created_at DESC LIMIT 30').all():db().prepare("SELECT e.* FROM export_jobs e JOIN batches b ON b.id=e.batch_id WHERE e.requested_by=? AND json_extract(e.options,'$.access.role')='User' AND json_extract(e.options,'$.access.group')=? ORDER BY e.created_at DESC LIMIT 30").all(user.id,user.group??'\u0000') as ExportRow[]).map(row=>exportDto(row as ExportRow));}
export function changeExport(user:AuthUser,id:string,action:'cancel'|'retry'){
 return db().transaction(()=>{const row=getExport(user,id);if(action==='cancel'){if(!['QUEUED','RUNNING'].includes(row.status))throw new AccessError('Export is no longer running',409);db().prepare("UPDATE export_jobs SET status='CANCELLED',lease_owner=NULL,lease_until=NULL,updated_at=? WHERE id=?").run(Date.now(),id);}
 else {if(!['FAILED','CANCELLED','EXPIRED'].includes(row.status))throw new AccessError('Export cannot be retried in this state',409);exportRequester(row);db().prepare("UPDATE export_jobs SET status='QUEUED',progress=0,error=NULL,file_path=NULL,lease_owner=NULL,lease_until=NULL,updated_at=?,expires_at=? WHERE id=?").run(Date.now(),Date.now()+EXPORT_RETENTION_MS,id);}
 authAudit(user,action==='cancel'?'EXPORT_CANCELLED':'EXPORT_RETRIED',id);return exportDto(getExportRow(id)!);}).immediate();
}
/** Re-evaluate access, but never widen a queued User snapshot after promotion. */
export function exportRequester(row:ExportRow):AuthUser{const current=activeUser(row.requested_by);if(!current||current.mustChangePassword)throw new AccessError('The requesting account is no longer eligible for this export.',409);assertEntitlement(current,'exportResults');const access=(JSON.parse(row.options) as ExportOptions).access||{role:'Admin' as const,group:null};if(access.role==='Admin'){if(current.role!=='Admin')throw new AccessError('The requesting account access changed.',409);return current;}if(!access.group?.trim()||current.role!=='Admin'&&current.group!==access.group)throw new AccessError('The requesting Group changed; prepare a new export.',409);return {...current,role:'User',group:access.group};}
export function claimExport(owner:string){return db().transaction(()=>{
 const row=db().prepare("SELECT e.* FROM export_jobs e JOIN batches b ON b.id=e.batch_id WHERE e.expires_at>? AND (e.status='QUEUED' OR (e.status='RUNNING' AND e.lease_until<?)) ORDER BY e.created_at LIMIT 1").get(Date.now(),Date.now()) as ExportRow|undefined;
 if(!row)return;db().prepare("UPDATE export_jobs SET status='RUNNING',lease_owner=?,lease_until=?,progress=0,error=NULL,updated_at=? WHERE id=?").run(owner,Date.now()+30000,Date.now(),row.id);return getExportRow(row.id)!;
 }).immediate();}
export function releaseExports(owner:string){db().prepare("UPDATE export_jobs SET status='QUEUED',lease_owner=NULL,lease_until=NULL WHERE status='RUNNING' AND lease_owner=?").run(owner);}
export function cleanExports(){
 const d=db(),now=Date.now();const expired=d.prepare("SELECT id,file_path FROM export_jobs WHERE expires_at<=? AND status<>'EXPIRED'").all(now) as {id:string;file_path:string|null}[];
 for(const row of expired){const changed=d.prepare("UPDATE export_jobs SET status='EXPIRED',file_path=NULL,lease_owner=NULL,lease_until=NULL WHERE id=? AND expires_at<=? AND status<>'EXPIRED'").run(row.id,now);if(changed.changes&&row.file_path)safeUnlink(row.file_path);}
 const directory=exportDirectory();if(!fs.existsSync(directory))return;
 const active=new Set((d.prepare("SELECT file_path FROM export_jobs WHERE status='COMPLETED' AND expires_at>?").all(now) as {file_path:string}[]).map(r=>r.file_path));
 for(const name of fs.readdirSync(directory)){if(!/^[a-f0-9-]+\.(?:xlsx|partial)$/.test(name))continue;const file=path.join(directory,name);if(!fs.existsSync(file))continue;if(!active.has(file)&&!(d.prepare("SELECT 1 FROM export_jobs WHERE status='RUNNING' AND ? LIKE id||'-%'").get(name))&&now-fs.statSync(file).mtimeMs>3600000)safeUnlink(file);}
}
export function safeUnlink(file:string){if(path.dirname(path.resolve(file))!==path.resolve(exportDirectory()))return;try{fs.unlinkSync(file);}catch{/* A missing expired file needs no further work. */}}
