import {db} from '@/db/connection';
import {getBatch} from '@/db/batches';
import {AccessError} from './auth';
import {AuthUser} from './auth-types';
import {Batch,RecordResult} from './domain';
import {recordGroup} from './source';
export function canAccessRecord(user:AuthUser,record:RecordResult){return user.role==='Admin'||!!user.group?.trim()&&recordGroup(record)===user.group;}
export function requireRecordAccess(user:AuthUser,record:RecordResult){if(!canAccessRecord(user,record))throw new AccessError('Record not found',404);}
export function scopedBatch(user:AuthUser,batch:Batch){if(user.role==='Admin')return batch;const records=batch.records.filter(record=>canAccessRecord(user,record));return records.length?{...batch,records}:undefined;}
export function visibleBatch(user:AuthUser,id:string){const batch=getBatch(id);return batch?scopedBatch(user,batch):undefined;}
export function visibleBatches(user:AuthUser){return user.role==='Admin'?db().prepare("SELECT id,filename,created_at FROM batches WHERE id NOT IN (SELECT id FROM jobs WHERE status<>'COMPLETED') ORDER BY created_at DESC LIMIT 50").all():!user.group?.trim()?[]:db().prepare("SELECT b.id,b.filename,b.created_at FROM batches b WHERE b.id NOT IN (SELECT id FROM jobs WHERE status<>'COMPLETED') AND EXISTS (SELECT 1 FROM records r WHERE r.batch_id=b.id AND json_extract(r.payload,'$.source.Group')=?) ORDER BY b.created_at DESC LIMIT 50").all(user.group);}
export function datasetGroups(){db().prepare("INSERT OR IGNORE INTO auth_groups(name,created_at) SELECT DISTINCT json_extract(payload,'$.source.Group'),? FROM records WHERE trim(coalesce(json_extract(payload,'$.source.Group'),''))<>''").run(new Date().toISOString());return (db().prepare('SELECT name FROM auth_groups ORDER BY name COLLATE NOCASE').all() as {name:string}[]).map(row=>row.name);}
