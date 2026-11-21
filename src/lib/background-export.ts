import {changeMembership} from '../db/changes';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import Database from 'better-sqlite3';
import {db} from '../db/connection';
import {recordExport} from '../db/export-tracking';
import {warmRecordIndex} from '../db/record-index';
import {batchMetadata,aggregate,iterateSelectedRows,selectedIdentities} from '../db/record-query';
import {ExportRow,ExportOptions,exportDirectory,safeUnlink,exportRequester} from '../db/exports';
import {writeWorkbook} from './excel/workbook-writer';
import type {AuthUser} from './auth-types';
export async function runExport(row:ExportRow,owner:string){
 const d=db(),directory=exportDirectory(),base=row.id+'-'+randomUUID(),temporary=path.join(directory,base+'.partial'),file=path.join(directory,base+'.xlsx');let reader:Database.Database|undefined,completed=false;
 const heartbeat=(progress?:number)=>{exportRequester(row);
  const changed=d.prepare("UPDATE export_jobs SET progress=max(progress,?),lease_until=?,updated_at=? WHERE id=? AND lease_owner=? AND status='RUNNING' AND expires_at>? AND EXISTS(SELECT 1 FROM batches WHERE id=export_jobs.batch_id)").run(progress??0,Date.now()+30000,Date.now(),row.id,owner,Date.now());
  if(!changed.changes)throw Error('EXPORT_STOPPED');
 };
 let stopped=false;const timer=setInterval(()=>{try{heartbeat();}catch{stopped=true;}},5000);
 try{
  heartbeat();fs.mkdirSync(directory,{recursive:true,mode:0o700});if(fs.lstatSync(directory).isSymbolicLink())throw Error('UNSAFE_EXPORT_DIRECTORY');
  const user=exportRequester(row);
  const options=JSON.parse(row.options) as ExportOptions;
  for(let attempt=0;attempt<5;attempt++){
   warmRecordIndex(d);reader=new Database(process.env.ADDRESS_DB_PATH||path.join(process.cwd(),'data','address.db'),{readonly:true,fileMustExist:true,timeout:5000});reader.exec('BEGIN');
   if(!reader.prepare('SELECT 1 FROM record_index_dirty LIMIT 1').get()&&!reader.prepare('SELECT 1 FROM record_totals_dirty LIMIT 1').get())break;reader.exec('ROLLBACK');reader.close();reader=undefined;
  }
  if(!reader)throw Error('Record index is busy; retry shortly');
  const snapshot=reader,batch=batchMetadata(snapshot,row.batch_id,user),changed=options.mode==='changes'?changeMembership(snapshot,row.batch_id,user,options.query):null,total=changed?changed.changedRecords:aggregate(snapshot,row.batch_id,user,options.query).total;if(!total)throw Error('No records match the export selection');
  const updated=d.prepare("UPDATE export_jobs SET total=? WHERE id=? AND lease_owner=? AND status='RUNNING'").run(total,row.id,owner);if(!updated.changes)throw Error('EXPORT_STOPPED');
  await writeWorkbook(batch,()=>iterateSelectedRows(snapshot,row.batch_id,user,options.query),options.selection+`; unique records: ${total}`,options.mode,temporary,count=>{if(stopped)throw Error('EXPORT_STOPPED');heartbeat(count);});
  const identities=changed?changed.identities:selectedIdentities(snapshot,row.batch_id,user,options.query);if(identities.length!==total)throw Error('Export membership changed; retry');
  snapshot.exec('COMMIT');snapshot.close();reader=undefined;heartbeat(total);fs.renameSync(temporary,file);
  d.transaction(()=>{exportRequester(row);const result=d.prepare("UPDATE export_jobs SET status='COMPLETED',progress=total,file_path=?,lease_owner=NULL,lease_until=NULL,updated_at=? WHERE id=? AND lease_owner=? AND status='RUNNING' AND expires_at>? AND EXISTS(SELECT 1 FROM batches WHERE id=export_jobs.batch_id)").run(file,Date.now(),row.id,owner,Date.now());if(!result.changes)throw Error('EXPORT_STOPPED');recordExport(d,user,row.batch_id,options.mode,identities,row.id);}).immediate();completed=true;
 }catch(error){
  const message=error instanceof Error?error.message:'';
  const known=/^(No records match|Source value exceeds|Export exceeds|Audit exceeds|Record index is busy)/.test(message);
  d.prepare("UPDATE export_jobs SET status='FAILED',error=?,lease_owner=NULL,lease_until=NULL,updated_at=? WHERE id=? AND lease_owner=? AND status='RUNNING'").run(known?message:'Workbook generation interrupted. Retry, or ask your Admin to check server storage.',Date.now(),row.id,owner);
  console.error('Background export failed',{jobId:row.id,stage:'WORKBOOK_GENERATION',code:message==='EXPORT_STOPPED'?'EXPORT_STOPPED':(error as NodeJS.ErrnoException)?.code||'EXPORT_GENERATION_FAILED'});
 }finally{clearInterval(timer);if(reader){if(reader.inTransaction)reader.exec('ROLLBACK');reader.close();}safeUnlink(temporary);if(!completed)safeUnlink(file);}
}
