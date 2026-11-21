import fs from 'node:fs';
import path from 'node:path';
import {safeUnlink,exportDirectory} from './exports';
import {db} from './connection';
import type {AuthUser} from '../lib/auth-types';
import {AccessError,authAudit} from '../lib/auth';

/** Serialize against job claims/resumes and remove all batch-owned rows atomically. */
export function deleteBatch(actor:AuthUser,id:string){
 if(actor.role!=='Admin')throw new AccessError('Administrator access required');
 const files:string[]=[];const exportIds:string[]=[];
 const receipt=db().transaction(()=>{
  const batch=db().prepare('SELECT id FROM batches WHERE id=?').get(id);
  if(!batch)throw new AccessError('Batch not found',404);
  const job=db().prepare('SELECT status FROM jobs WHERE id=?').get(id) as {status:string}|undefined;
  if(job&&!['COMPLETED','PAUSED','FAILED','CANCELLED'].includes(job.status))throw new AccessError('Pause or cancel processing before deleting this batch',409);
  const exports=db().prepare('SELECT id,file_path FROM export_jobs WHERE batch_id=?').all(id) as {id:string;file_path:string|null}[];for(const row of exports){exportIds.push(row.id);if(row.file_path)files.push(row.file_path);}
  const deletedReviewEvents=db().prepare('DELETE FROM review_events WHERE record_id IN (SELECT id FROM records WHERE batch_id=?)').run(id).changes;
  const deletedRecords=db().prepare('DELETE FROM records WHERE batch_id=?').run(id).changes;
  const deletedSourceRows=db().prepare('DELETE FROM job_rows WHERE job_id=?').run(id).changes;
  db().prepare('DELETE FROM jobs WHERE id=?').run(id);
  db().prepare('DELETE FROM export_jobs WHERE batch_id=?').run(id);
  db().prepare('DELETE FROM export_run_records WHERE batch_id=?').run(id);
  db().prepare('DELETE FROM export_runs WHERE batch_id=?').run(id);
  db().prepare('DELETE FROM export_tracking_legacy_batches WHERE batch_id=?').run(id);
  db().prepare('DELETE FROM batch_revision WHERE batch_id=?').run(id);
  db().prepare('DELETE FROM record_group_totals WHERE batch_id=?').run(id);
  db().prepare('DELETE FROM record_totals_dirty WHERE batch_id=?').run(id);
  db().prepare('DELETE FROM batch_metadata WHERE batch_id=?').run(id);
  db().prepare('DELETE FROM batch_settings WHERE batch_id=?').run(id);
  db().prepare('DELETE FROM batches WHERE id=?').run(id);
  const receipt={id,deletedRecords,deletedReviewEvents,deletedSourceRows};
  // Retain accountability without retaining names, addresses, workbook bytes or failure reasons.
  authAudit(actor,'BATCH_DELETED',id,JSON.stringify({deletedRecords,deletedReviewEvents,deletedSourceRows,jobStatus:job?.status??'LEGACY'}));
  return receipt;
 }).immediate();
 for(const file of files)safeUnlink(file);const directory=exportDirectory();if(fs.existsSync(directory))for(const name of fs.readdirSync(directory))if(exportIds.some(id=>name.startsWith(id+'-')))safeUnlink(path.join(directory,name));return receipt;
}
