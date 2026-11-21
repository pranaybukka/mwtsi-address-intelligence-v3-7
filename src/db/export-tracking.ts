import type Database from 'better-sqlite3';
import {randomUUID} from 'node:crypto';
import {db} from './connection';
import type {AuthUser} from '../lib/auth-types';
import {AccessError,authAudit,activeUser,assertEntitlement} from '../lib/auth';
import type {ExportMode} from '../lib/export-options';
import type {ExportCoverage,RecordExportHistory} from '../lib/export-tracking-types';

/** One durable membership manifest per successful workbook. Call within its completion transaction. */
export function recordExport(d:Database.Database,user:AuthUser,batchId:string,mode:ExportMode,records:readonly {id:string;version:number}[],jobId:string|null=null){
 const current=activeUser(user.id);if(!current||current.mustChangePassword)throw new AccessError('Export account is no longer active');assertEntitlement(current,'exportResults');if(current.role==='User'&&(user.role!=='User'||current.group!==user.group))throw new AccessError('Export Group access changed');if(user.role==='User'&&!user.group?.trim())throw new AccessError('An assigned Group is required');
 if(!d.prepare('SELECT 1 FROM batches WHERE id=?').get(batchId))throw new AccessError('Batch no longer exists',409);
 const unique=new Map(records.map(record=>[record.id,record.version]));if(!unique.size)throw new AccessError('No records to track',400);
 const id=randomUUID(),now=Date.now();
 d.prepare('INSERT INTO export_runs VALUES(?,?,?,?,?,?,?,?,?)').run(id,batchId,jobId,mode,user.id,user.username,now,unique.size,jobId?'BACKGROUND':'DIRECT');
 const insert=d.prepare('INSERT INTO export_run_records SELECT ?,id,batch_id,? FROM records WHERE id=? AND batch_id=?');
 for(const [recordId,version]of unique){if(user.role==='User'&&!d.prepare("SELECT 1 FROM records WHERE id=? AND batch_id=? AND json_extract(payload,'$.source.Group')=?").get(recordId,batchId,user.group))throw new AccessError('Export record is outside your Group',403);if(!insert.run(id,version,recordId,batchId).changes)throw new AccessError('Export source changed; retry the export',409);}
 d.prepare('INSERT INTO batch_revision VALUES(?,1) ON CONFLICT(batch_id) DO UPDATE SET revision=revision+1').run(batchId);
 authAudit(user,'EXPORT_COMPLETED',id,JSON.stringify({batchId,jobId,mode,records:unique.size}));return id;
}
export function trackDirectExport(user:AuthUser,batchId:string,mode:ExportMode,records:readonly {id:string;version:number}[]){return db().transaction(()=>recordExport(db(),user,batchId,mode,records)).immediate();}
export const wasExportedSql="EXISTS(SELECT 1 FROM export_run_records e WHERE e.batch_id=i.batch_id AND e.record_id=i.record_id)";
/** Caller supplies an authorized Group/status/search scope, without the export-state filter. */
export function exportCoverage(d:Database.Database,batchId:string,where:{sql:string;args:(string|number)[]}):ExportCoverage{
 const counts=d.prepare(`SELECT count(*) total,coalesce(sum(CASE WHEN ${wasExportedSql} THEN 1 ELSE 0 END),0) exported FROM record_index i WHERE ${where.sql}`).get(...where.args) as {total:number;exported:number};
 const started=d.prepare("SELECT value FROM metadata WHERE key='export-tracking-started-at'").get() as {value:string};
 return {...counts,remaining:counts.total-counts.exported,trackingStartedAt:Number(started.value),historicalCoverageIncomplete:!!d.prepare('SELECT 1 FROM export_tracking_legacy_batches WHERE batch_id=?').get(batchId)};
}
export function recordExportHistory(d:Database.Database,batchId:string,ids:readonly string[]):Record<string,RecordExportHistory>{
 if(!ids.length)return {};
 const rows=d.prepare('SELECT e.record_id,count(*) count,min(r.completed_at) firstExportedAt,max(r.completed_at) lastExportedAt,max(e.record_version) highestExportedVersion FROM export_run_records e JOIN export_runs r ON r.id=e.run_id WHERE e.batch_id=? AND e.record_id IN (SELECT value FROM json_each(?)) GROUP BY e.record_id').all(batchId,JSON.stringify(ids)) as ({record_id:string}&RecordExportHistory)[];
 return Object.fromEntries(rows.map(({record_id,...value})=>[record_id,value]));
}
