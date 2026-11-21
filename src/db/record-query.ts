import {wasExportedSql,exportCoverage,recordExportHistory} from './export-tracking';
import {isExportState,type ExportStateFilter} from '../lib/export-tracking-types';
import {GroupTotals,addSummary} from './group-totals';
import type Database from 'better-sqlite3';
import {db} from './connection';
import {indexed} from './record-index';
import {AccessError} from '../lib/auth';
import type {AuthUser} from '../lib/auth-types';
import type {BatchPage,RecordSummary} from '../lib/page-types';
import type {Batch,RecordResult} from '../lib/domain';
import {summarize} from '../lib/summary';
import {isStatusFilter,STATUS_OPTIONS,StatusFilter} from '../lib/record-selection';
import type {GroupSort} from '../lib/source';
export interface RecordQuery {group:string;groupSort:GroupSort;statuses:StatusFilter[];search:string;exportState?:ExportStateFilter;focusStatus?:StatusFilter;}
export const defaultQuery=():RecordQuery=>({group:'all',groupSort:'original',statuses:[],search:'',exportState:'all'});
export function parseRecordQuery(params:URLSearchParams):RecordQuery {
 const group=params.get('groupMissing')==='1'?'blank':params.has('group')?`value:${params.get('group')}`:params.get('groupFilter')||'all';
 const focusStatus=params.get('focusStatus');if(focusStatus&&!isStatusFilter(focusStatus))throw new AccessError('Invalid report focus',400);
 const exportState=params.get('exportState')||'all';if(!isExportState(exportState))throw new AccessError('Invalid export tracking filter',400);
 const groupSort=params.get('groupSort')||'original',statuses=params.getAll('status'),search=params.get('search')||'';
 if(!['original','asc','desc'].includes(groupSort)||!['all','blank'].includes(group)&&!group.startsWith('value:')||group.length>10005||search.length>1000||statuses.length>100||statuses.some(value=>!isStatusFilter(value))||params.has('group')&&params.get('groupMissing')==='1')throw new AccessError('Invalid record filters',400);
 return {group,groupSort:groupSort as GroupSort,statuses:[...new Set(statuses)] as StatusFilter[],search:search.trim(),exportState,...(focusStatus?{focusStatus:focusStatus as StatusFilter}:{})};
}
const g="json_extract(i.info,'$.group')",gk="json_extract(i.info,'$.groupKey')";
export function recordWhere(id:string,user:AuthUser,q:RecordQuery,applySelection=true){
 const clauses=['i.batch_id=?'],args:(string|number)[]=[id];
 if(user.role!=='Admin'){if(!user.group?.trim())clauses.push('0');else{clauses.push(`${g}=?`);args.push(user.group);}}
 if(q.group!=='all'){clauses.push(`${gk}=?`);args.push(q.group);}
 if(applySelection&&q.focusStatus)clauses.push(`json_extract(i.info,'$.statuses.${q.focusStatus}')=1`);
 if(applySelection&&q.statuses.length){clauses.push('('+q.statuses.map(status=>`json_extract(i.info,'$.statuses.${status}')=1`).join(' OR ')+')');}
 if(q.exportState==='exported')clauses.push(wasExportedSql);else if(q.exportState==='remaining')clauses.push('NOT '+wasExportedSql);
 if(applySelection&&q.search){clauses.push("instr(json_extract(i.info,'$.search'),?)>0");args.push(q.search.toLowerCase());}
 return {sql:clauses.join(' AND '),args};
}
export function batchMetadata(d:Database.Database,id:string,user:AuthUser):Omit<Batch,'records'>{
 const b=d.prepare('SELECT id,filename,created_at FROM batches WHERE id=?').get(id) as {id:string;filename:string;created_at:string}|undefined;
 const accessible=user.role==='Admin'||!!user.group?.trim()&&!!d.prepare(`SELECT 1 FROM record_index i WHERE i.batch_id=? AND ${g}=? LIMIT 1`).get(id,user.group);
 if(!b||!accessible)throw new AccessError('Batch not found',404);
 const job=d.prepare('SELECT status FROM jobs WHERE id=?').get(id) as {status:string}|undefined;if(job&&job.status!=='COMPLETED')throw new AccessError('Batch processing is not complete',409);
 const settings=d.prepare('SELECT payload FROM batch_settings WHERE batch_id=?').get(id) as {payload:string}|undefined,meta=d.prepare('SELECT payload FROM batch_metadata WHERE batch_id=?').get(id) as {payload:string}|undefined;
 return {id:b.id,filename:b.filename,createdAt:b.created_at,processingSettings:settings?JSON.parse(settings.payload):{postalLookupEnabled:true},...(meta?{importMetadata:JSON.parse(meta.payload)}:{})};
}
export function scopedGroupTotals(d:Database.Database,id:string,user:AuthUser,q:RecordQuery){
 const clauses=['batch_id=?'],args:string[]=[id];if(user.role!=='Admin'){if(!user.group?.trim())clauses.push('0');else{clauses.push('group_name=?');args.push(user.group);}}
 if(q.group!=='all'){clauses.push('group_key=?');args.push(q.group);}
 return (d.prepare('SELECT group_name,group_key,info FROM record_group_totals WHERE '+clauses.join(' AND ')+' ORDER BY first_order').all(...args) as {group_name:string;group_key:string;info:string}[]).map(row=>({...row,stats:JSON.parse(row.info) as GroupTotals}));
}
export function aggregate(d:Database.Database,id:string,user:AuthUser,q:RecordQuery):RecordSummary {
 const empty=summarize([]);if(!q.focusStatus&&(!q.exportState||q.exportState==='all')&&!q.search&&q.statuses.length<=1){for(const row of scopedGroupTotals(d,id,user,q)){const selected=q.statuses.length?row.stats.byStatus[q.statuses[0]]:row.stats.all;if(selected)addSummary(empty,selected);}return empty;}
 const w=recordWhere(id,user,q);
 return d.prepare(`SELECT ${Object.keys(empty).map(k=>`coalesce(sum(json_extract(i.info,'$.summary.${k}')),0) AS "${k}"`).join(',')} FROM record_index i WHERE ${w.sql}`).get(...w.args) as RecordSummary;
}
const collator=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
export function compareReportGroups(a:string,b:string,sort:GroupSort){return !a.trim()||!b.trim()?Number(!a.trim())-Number(!b.trim()):collator.compare(a,b)*(sort==='desc'?-1:1);}
/** Equal natural-sort group names share a bucket, preserving original row order within ties. */
export function groupBuckets(d:Database.Database,id:string,user:AuthUser,q:RecordQuery){
 const w=recordWhere(id,user,q);const groups=d.prepare(`SELECT ${g} AS name,count(*) AS count FROM record_index i WHERE ${w.sql} GROUP BY ${g} ORDER BY min(i.source_order)`).all(...w.args) as {name:string;count:number}[];
 groups.sort((a,b)=>compareReportGroups(a.name,b.name,q.groupSort));
 const buckets:{names:string[];count:number}[]=[];
 for(const group of groups){const prev=buckets.at(-1);if(prev&&((!prev.names[0].trim()&&!group.name.trim())||prev.names[0].trim()&&group.name.trim()&&collator.compare(prev.names[0],group.name)===0)){prev.names.push(group.name);prev.count+=group.count;}else buckets.push({names:[group.name],count:group.count});}
 return buckets;
}
export function selectedRows(d:Database.Database,id:string,user:AuthUser,q:RecordQuery,limit:number,offset=0):RecordResult[]{
 const w=recordWhere(id,user,q),base=`SELECT r.payload FROM record_index i JOIN records r ON r.id=i.record_id WHERE ${w.sql}`;
 if(q.groupSort==='original')return (d.prepare(base+' ORDER BY i.source_order LIMIT ? OFFSET ?').all(...w.args,limit,offset) as {payload:string}[]).map(row=>JSON.parse(row.payload));
 const result:RecordResult[]=[];
 for(const bucket of groupBuckets(d,id,user,q)){if(offset>=bucket.count){offset-=bucket.count;continue;}const rows=d.prepare(base+` AND ${g} IN (SELECT value FROM json_each(?)) ORDER BY i.source_order LIMIT ? OFFSET ?`).all(...w.args,JSON.stringify(bucket.names),limit-result.length,offset) as {payload:string}[];result.push(...rows.map(row=>JSON.parse(row.payload)));offset=0;if(result.length>=limit)break;}
 return result;
}
const cache=new Map<string,{batchSummary:RecordSummary;groupSummary:RecordSummary;summary:RecordSummary;groups:{key:string;label:string}[];statusCounts:Record<string,number>;legacy:boolean}>();
export function batchPage(user:AuthUser,id:string,q:RecordQuery,page=0,pageSize=15):BatchPage {
 if(!Number.isInteger(page)||page<0||page>1000000||!Number.isInteger(pageSize)||pageSize<1||pageSize>100)throw new AccessError('Invalid page or page size (maximum 100)',400);
 return indexed(d=>{
  const metadata=batchMetadata(d,id,user),revision=(d.prepare('SELECT revision FROM batch_revision WHERE batch_id=?').get(id) as {revision:number}|undefined)?.revision||0;
  const key=JSON.stringify([id,revision,user.role,user.group,q]);let data=cache.get(key);
  if(!data){const all=defaultQuery(),group={...q,statuses:[],search:'',focusStatus:undefined},w=recordWhere(id,user,all),gw=recordWhere(id,user,group);
   const allGroups=scopedGroupTotals(d,id,user,all),groupRows=q.group==='all'?allGroups:scopedGroupTotals(d,id,user,group);
   const groups=[...new Map(allGroups.map(row=>[row.group_key,{key:row.group_key,label:row.group_key==='blank'?'(No group)':row.group_name}])).values()];groups.sort((a,b)=>a.key==='blank'?1:b.key==='blank'?-1:collator.compare(a.label,b.label));
   const statusCounts=q.exportState&&q.exportState!=='all'?d.prepare(`SELECT ${STATUS_OPTIONS.map(option=>`coalesce(sum(json_extract(i.info,'$.statuses.${option.value}')),0) AS "${option.value}"`).join(',')} FROM record_index i WHERE ${gw.sql}`).get(...gw.args) as Record<string,number>:Object.fromEntries(STATUS_OPTIONS.map(option=>[option.value,groupRows.reduce((n,row)=>n+(row.stats.byStatus[option.value]?.total||0),0)]));
   const batchSummary=aggregate(d,id,user,all),groupSummary=q.group==='all'&&(!q.exportState||q.exportState==='all')?batchSummary:aggregate(d,id,user,group),summary=!q.focusStatus&&!q.statuses.length&&!q.search?groupSummary:aggregate(d,id,user,q);
   data={batchSummary,groupSummary,summary,groups,statusCounts,legacy:allGroups.some(row=>row.stats.legacy>0)};
   if(cache.size>=100)cache.clear();cache.set(key,data);
  }
  const actualPage=Math.min(page,Math.max(0,Math.ceil(data.summary.total/pageSize)-1));
  const records=selectedRows(d,id,user,q,pageSize,actualPage*pageSize);
  return {...metadata,...data,revision,page:actualPage,pageSize,records,exportCoverage:exportCoverage(d,id,recordWhere(id,user,{...q,exportState:'all'})),recordExports:recordExportHistory(d,id,records.map(record=>record.id))};
 });
}
export function pendingSelection(user:AuthUser,id:string){return indexed(d=>{batchMetadata(d,id,user);const w=recordWhere(id,user,{...defaultQuery(),statuses:['pending']});return d.prepare(`SELECT r.id,r.version FROM record_index i JOIN records r ON r.id=i.record_id WHERE ${w.sql} ORDER BY i.source_order`).all(...w.args) as {id:string;version:number}[];});}
/** Lazily traverse the selected snapshot without retaining all record payloads in memory. */
export function* iterateSelectedRows(d:Database.Database,id:string,user:AuthUser,q:RecordQuery):Generator<RecordResult>{
 const w=recordWhere(id,user,q),base=`SELECT r.payload FROM record_index i JOIN records r ON r.id=i.record_id WHERE ${w.sql}`;
 if(q.groupSort==='original'){for(const row of d.prepare(base+' ORDER BY i.source_order').iterate(...w.args) as Iterable<{payload:string}>)yield JSON.parse(row.payload);return;}
 for(const bucket of groupBuckets(d,id,user,q))for(const row of d.prepare(base+` AND ${g} IN (SELECT value FROM json_each(?)) ORDER BY i.source_order`).iterate(...w.args,JSON.stringify(bucket.names)) as Iterable<{payload:string}>)yield JSON.parse(row.payload);
}

/** Compact manifest from the same immutable read snapshot as the workbook. */
export function selectedIdentities(d:Database.Database,id:string,user:AuthUser,q:RecordQuery){const w=recordWhere(id,user,q);return d.prepare(`SELECT r.id,r.version FROM record_index i JOIN records r ON r.id=i.record_id WHERE ${w.sql}`).all(...w.args) as {id:string;version:number}[];}
