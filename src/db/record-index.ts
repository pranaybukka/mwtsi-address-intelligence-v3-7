import {addressBlocks} from '../lib/address-blocks';
import {ensureGroupTotals,changeGroupTotals,repairGroupTotals,IndexedInfo} from './group-totals';
import type Database from 'better-sqlite3';
import {db} from './connection';
import type {RecordResult} from '../lib/domain';
import {summarize} from '../lib/summary';
import {STATUS_OPTIONS,matchesStatus} from '../lib/record-selection';
import {groupKey,recordGroup} from '../lib/source';
export function indexRecord(record:RecordResult,d:Database.Database=db(),order?:number|bigint,batchId?:string){
 if(order===undefined||batchId===undefined){const row=d.prepare('SELECT rowid,batch_id FROM records WHERE id=?').get(record.id) as {rowid:number;batch_id:string}|undefined;if(!row)return;order=row.rowid;batchId=row.batch_id;}
 const group=recordGroup(record),info={status:record.status,reviewState:record.reviewState,group,groupKey:groupKey(group),search:JSON.stringify([record.source.Name,record.source.Group,addressBlocks(record).map(({result})=>result.intelligence.structured)]).toLowerCase(),summary:summarize([record]),statuses:Object.fromEntries(STATUS_OPTIONS.map(option=>[option.value,Number(!!matchesStatus(record,option.value))])),legacy:record.status!=='ERROR'&&!record.intelligence.nameInterpretation};
 const previous=d.prepare('SELECT batch_id,info FROM record_index WHERE record_id=?').get(record.id) as {batch_id:string;info:string}|undefined;
 const before=previous?JSON.parse(previous.info) as IndexedInfo:undefined;
 if(before)ensureGroupTotals(d,previous!.batch_id,before.group);ensureGroupTotals(d,batchId!,group);
 d.prepare('INSERT OR REPLACE INTO record_index VALUES(?,?,?,?)').run(record.id,batchId,order,JSON.stringify(info));
 if(before&&previous!.batch_id===batchId&&before.group===group)changeGroupTotals(d,batchId!,group,[{info:before,sign:-1},{info,sign:1}]);
 else {if(before)changeGroupTotals(d,previous!.batch_id,before.group,[{info:before,sign:-1}]);changeGroupTotals(d,batchId!,group,[{info,sign:1}]);}
 d.prepare('DELETE FROM record_index_dirty WHERE record_id=?').run(record.id);
}
export function warmRecordIndex(d:Database.Database=db()){
 while(d.prepare('SELECT 1 FROM record_index_dirty LIMIT 1').get())d.transaction(()=>{
  const rows=d.prepare('SELECT r.rowid,r.payload FROM records r JOIN record_index_dirty q ON q.record_id=r.id LIMIT 256').all() as {rowid:number;payload:string}[];
  for(const row of rows)indexRecord(JSON.parse(row.payload),d,row.rowid);
  d.prepare('DELETE FROM record_index_dirty WHERE NOT EXISTS(SELECT 1 FROM records WHERE id=record_id)').run();
 }).immediate();
 for(const row of d.prepare('SELECT batch_id,group_name FROM record_totals_dirty').all() as {batch_id:string;group_name:string}[])d.transaction(()=>repairGroupTotals(d,row.batch_id,row.group_name)).immediate();
}
const needsIndex=Symbol('index');
/** Read rows, counts and revision from one SQLite snapshot. Dirty legacy writes are repaired first. */
export function indexed<T>(read:(d:Database.Database)=>T,d:Database.Database=db(),write=false):T {
 for(let attempt=0;attempt<5;attempt++)try{const tx=d.transaction(()=>{if(d.prepare('SELECT 1 FROM record_index_dirty LIMIT 1').get()||d.prepare('SELECT 1 FROM record_totals_dirty LIMIT 1').get())throw needsIndex;return read(d);});return write?tx.immediate():tx();}catch(error){if(error!==needsIndex)throw error;warmRecordIndex(d);}
 throw Error('Record index is busy; retry shortly');
}
