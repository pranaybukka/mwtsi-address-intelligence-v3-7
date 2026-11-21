import {indexRecord} from './record-index';
import {assertReservationAccess,releaseDecisionReservation} from './reservations';
import {processingSettings,storedBatchSettings,saveBatchSettings} from './settings';
import {DEFAULT_POLICY} from '../lib/domain';
import {assertBatchComplete} from './jobs';
import {randomUUID} from 'node:crypto';
import {db} from './connection';
import {ensureSeed} from './seed';
import {AddressInput,Batch,RecordResult} from '../lib/domain';
import {processAddress} from '../lib/process';
import {reviewRecord} from '../lib/review';
import {reference} from '../lib/reference/sqlite';
export function createBatch(filename:string,inputs:AddressInput[]):Batch {
 ensureSeed();const settings=processingSettings();const id=randomUUID();const createdAt=new Date().toISOString();const records=inputs.map((source,i)=>processAddress(source,reference,`${id}:${i+1}`,{...DEFAULT_POLICY,...settings}));
 db().transaction(()=>{db().prepare('INSERT INTO batches VALUES (?,?,?)').run(id,filename,createdAt);saveBatchSettings(id,settings);const stmt=db().prepare('INSERT INTO records VALUES (?,?,?,?)');const event=db().prepare('INSERT INTO review_events(record_id,event) VALUES (?,?)');for(const r of records){const inserted=stmt.run(r.id,id,JSON.stringify(r),r.version);indexRecord(r,db(),inserted.lastInsertRowid,id);for(const review of r.reviews)event.run(r.id,JSON.stringify(review));}})();return {id,filename,createdAt,records,processingSettings:settings};
}
export function getBatch(id:string):Batch|undefined {const b=db().prepare('SELECT * FROM batches WHERE id=?').get(id) as {id:string;filename:string;created_at:string}|undefined;if(!b)return;const meta=db().prepare('SELECT payload FROM batch_metadata WHERE batch_id=?').get(id) as {payload:string}|undefined;return {processingSettings:storedBatchSettings(id),...(meta?{importMetadata:JSON.parse(meta.payload)}:{}),id:b.id,filename:b.filename,createdAt:b.created_at,records:(db().prepare('SELECT payload FROM records WHERE batch_id=? ORDER BY rowid').all(id) as {payload:string}[]).map(r=>JSON.parse(r.payload) as RecordResult)};}
export function listBatches(){return db().prepare("SELECT id,filename,created_at FROM batches WHERE id NOT IN (SELECT id FROM jobs WHERE status<>'COMPLETED') ORDER BY created_at DESC LIMIT 50").all();}
export function getRecord(id:string){const r=db().prepare('SELECT payload FROM records WHERE id=?').get(id) as {payload:string}|undefined;return r?JSON.parse(r.payload) as RecordResult:undefined;}
export function saveReviewed(record:RecordResult,expectedVersion:number){assertBatchComplete(record.id.split(':')[0]);db().transaction(()=>{const res=db().prepare('UPDATE records SET payload=?,version=? WHERE id=? AND version=?').run(JSON.stringify(record),record.version,record.id,expectedVersion);if(!res.changes)throw Error('CONFLICT: Record was changed; reload before reviewing');indexRecord(record);db().prepare('INSERT INTO review_events (record_id,event) VALUES (?,?)').run(record.id,JSON.stringify(record.reviews.at(-1)));})();}

/** Accept an explicit versioned selection atomically; stale clients cannot partially accept a batch. */
export function acceptPendingBatch(batchId:string,selection:{id:string;version:number}[],reviewer:string,reason:string,action:'ACCEPT'|'PASS'='ACCEPT',actor?:{id:string;username:string},acknowledgeMissingLines=false):Batch {
 assertBatchComplete(batchId);
 if(!Array.isArray(selection)||!selection.length||selection.length>50000)throw Error('Select pending records to accept');
 if(new Set(selection.map(x=>x.id)).size!==selection.length)throw Error('Duplicate record selection');
 return db().transaction(()=>{
  const batch=getBatch(batchId);if(!batch)throw Error('Batch not found');const byId=new Map(batch.records.map(r=>[r.id,r]));
  const next=selection.map(item=>{const r=byId.get(item.id);if(!r)throw Error('Record does not belong to this batch');assertReservationAccess(r.id,undefined,actor);if(r.version!==item.version||r.reviewState!=='PENDING')throw Error('CONFLICT: Record changed; reload before accepting');return reviewRecord(r,action,reviewer,reason,undefined,reference,actor,{acknowledgeMissingLines});});
  const update=db().prepare('UPDATE records SET payload=?,version=? WHERE id=? AND version=?');
  const event=db().prepare('INSERT INTO review_events (record_id,event) VALUES (?,?)');
  for(const r of next){const changed=update.run(JSON.stringify(r),r.version,r.id,r.version-1);if(!changed.changes)throw Error('CONFLICT: Record changed; reload');indexRecord(r);releaseDecisionReservation(r.id,actor);event.run(r.id,JSON.stringify(r.reviews.at(-1)));byId.set(r.id,r);}
  return {...batch,records:batch.records.map(r=>byId.get(r.id)!)};
 }).immediate();
}
