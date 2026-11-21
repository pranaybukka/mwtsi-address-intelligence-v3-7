import {beforeEach,it,expect,vi} from 'vitest';
import {cookies} from 'next/headers';
import {db} from '../src/db/connection';
import {createBatch,getBatch,getRecord,saveReviewed} from '../src/db/batches';
import {deleteBatch} from '../src/db/delete-batch';
import {queueBatch,claimJob,processJobChunk,changeJob,getJob,jobByRequest} from '../src/db/jobs';
import {createGroups} from '../src/db/groups';
import {saveUser} from '../src/db/users';
import {issueSession,sessionUser} from '../src/lib/auth';
import type {AuthUser} from '../src/lib/auth-types';
import {reviewRecord} from '../src/lib/review';
import {reference} from '../src/lib/reference/sqlite';
import {dashboard} from '../src/db/dashboard';
import {DELETE,GET} from '../src/app/api/batches/[id]/route';
import {GET as batches} from '../src/app/api/batches/route';
import {PATCH as review} from '../src/app/api/records/[id]/route';
import {GET as exportApi} from '../src/app/api/batches/[id]/export/route';
const source={Name:'DELETE TARGET CUSTOMER',Address1:'100 EXAMPLE ROAD',Address2:'',Address3:'',Bank_Country:'US',Group:'Delete A'};
const metadata={worksheet:'Source',fields:{Name:'Name',Address1:'Address1'},headers:['Name','Address1']};
let admin:AuthUser,adminToken:string;
function cookie(token?:string){vi.mocked(cookies).mockResolvedValue({get:(name:string)=>name==='mwtsi-session'&&token?{value:token}:undefined} as never);}
const context=(id:string)=>({params:Promise.resolve({id})});
const request=(id:string,body:unknown={confirmation:id},headers:Record<string,string>={})=>DELETE(new Request('http://localhost/api/batches/'+id,{method:'DELETE',headers:{'Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)}),context(id));
beforeEach(()=>{db().exec('DELETE FROM review_events;DELETE FROM records;DELETE FROM jobs;DELETE FROM job_rows;DELETE FROM batches;DELETE FROM batch_metadata;DELETE FROM batch_settings;DELETE FROM upload_drafts;');db().prepare("DELETE FROM metadata WHERE key IN ('reference-switch','active-reference-version')").run();const row=db().prepare("SELECT id FROM auth_users WHERE username='admin'").get() as {id:string};db().prepare('UPDATE auth_users SET must_change=0 WHERE id=?').run(row.id);adminToken=issueSession(row.id);admin=sessionUser(adminToken)!;cookie(adminToken);createGroups(admin,['Delete A','Delete B']);});
async function user(group:string|null='Delete A'){const saved=await saveUser(admin,null,{username:'delete-user-'+Math.random().toString(36).slice(2),password:'Delete-temporary-2026',role:'User',group,active:true});db().prepare('UPDATE auth_users SET must_change=0 WHERE id=?').run(saved.id);const token=issueSession(saved.id);cookie(token);return sessionUser(token)!;}
const scalar=(query:string,...values:string[])=>Number((db().prepare(query).get(...values) as {n:number}).n);
function assertRemoved(id:string){expect(getBatch(id)).toBeUndefined();expect(getJob(id)).toBeUndefined();for(const [table,column] of [['records','batch_id'],['job_rows','job_id'],['batch_metadata','batch_id'],['batch_settings','batch_id']] as const)expect(scalar(`SELECT count(*) AS n FROM ${table} WHERE ${column}=?`,id)).toBe(0);}
it('Admin deletes an entire reviewed mixed-group batch atomically and retains only a minimal actor audit',async()=>{
 const batch=createBatch("São Paulo / Manny's (1).xlsx",[source,{...source,Group:'Delete B'},{...source,Group:''}]),other=createBatch('keep.xlsx',[source]);saveReviewed(reviewRecord(batch.records[0],'FAIL',admin.username,'Original private failure',undefined,reference,admin),0);saveReviewed(reviewRecord(batch.records[1],'PASS',admin.username,'',undefined,reference,admin),0);db().prepare('INSERT INTO batch_metadata VALUES (?,?)').run(batch.id,JSON.stringify(metadata));db().prepare('INSERT INTO upload_drafts VALUES (?,?,?,?)').run('unrelated-draft','keep.xlsx',Buffer.from('unrelated bytes'),new Date().toISOString());
 const groups=db().prepare('SELECT * FROM auth_groups ORDER BY name').all(),users=db().prepare('SELECT * FROM auth_users ORDER BY id').all(),settings=db().prepare('SELECT * FROM metadata ORDER BY key').all();const response=await request(batch.id);expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toContain('no-store');expect(await response.json()).toEqual({id:batch.id,deletedRecords:3,deletedReviewEvents:2,deletedSourceRows:0});assertRemoved(batch.id);expect(scalar('SELECT count(*) AS n FROM review_events WHERE record_id IN (?,?,?)',...batch.records.map(row=>row.id))).toBe(0);expect(getBatch(other.id)).toEqual(other);expect(db().prepare('SELECT * FROM auth_groups ORDER BY name').all()).toEqual(groups);expect(db().prepare('SELECT * FROM auth_users ORDER BY id').all()).toEqual(users);expect(db().prepare('SELECT * FROM metadata ORDER BY key').all()).toEqual(settings);expect(scalar('SELECT count(*) AS n FROM upload_drafts')).toBe(1);
 const audit=db().prepare("SELECT * FROM auth_audit WHERE action='BATCH_DELETED' AND target_id=?").get(batch.id) as {actor_id:string;actor_username:string;detail:string};expect(audit).toMatchObject({actor_id:admin.id,actor_username:admin.username});expect(JSON.parse(audit.detail)).toEqual({deletedRecords:3,deletedReviewEvents:2,deletedSourceRows:0,jobStatus:'LEGACY'});expect(audit.detail).not.toContain(source.Name);expect(audit.detail).not.toContain('Original private failure');expect(dashboard(admin).totals.total).toBe(1);expect((await(await batches()).json()).map((row:{id:string})=>row.id)).not.toContain(batch.id);expect((await GET(new Request('http://localhost/api/batches/'+batch.id),context(batch.id))).status).toBe(404);expect((await exportApi(new Request('http://localhost/export'),context(batch.id))).status).toBe(404);
});
it.each(['COMPLETED','PAUSED','FAILED','CANCELLED'] as const)('deletes a %s processing batch, mapping, settings, staged rows and request key',async status=>{
 const job=queueBatch(status+'.xlsx',[source,source,source],metadata,'request-key');claimJob('test');processJobChunk(job.id,'test',status==='COMPLETED'?3:1);if(status==='PAUSED')changeJob(job.id,'pause');if(status==='CANCELLED')changeJob(job.id,'cancel');if(status==='FAILED')db().prepare("UPDATE jobs SET status='FAILED',lease_owner=NULL,lease_until=NULL WHERE id=?").run(job.id);const count=getBatch(job.id)!.records.length;const response=await request(job.id);expect(response.status).toBe(200);expect((await response.json()).deletedRecords).toBe(count);assertRemoved(job.id);expect(jobByRequest('request-key')).toBeUndefined();expect(processJobChunk(job.id,'test',1)).toBe(false);
});
it.each(['QUEUED','RUNNING'] as const)('refuses deletion of %s processing until explicitly paused/cancelled',async status=>{
 const job=queueBatch('active.xlsx',[source]);if(status==='RUNNING')claimJob('worker');const before=getJob(job.id);const response=await request(job.id);expect(response.status).toBe(409);expect((await response.json()).error).toContain('Pause or cancel');expect(getJob(job.id)).toEqual(before);expect(getBatch(job.id)).toBeDefined();expect(scalar("SELECT count(*) AS n FROM auth_audit WHERE action='BATCH_DELETED' AND target_id=?",job.id)).toBe(0);changeJob(job.id,'pause');expect((await request(job.id)).status).toBe(200);assertRemoved(job.id);
});
it.each(['Delete A','Delete B',null])('denies deletion to a User assigned to %s in the API and database helper',async group=>{
 const batch=createBatch('protected.xlsx',[source]),actor=await user(group);expect((await request(batch.id)).status).toBe(403);expect((await request('unknown')).status).toBe(403);expect(()=>deleteBatch(actor,batch.id)).toThrow('Administrator access required');expect(getBatch(batch.id)).toEqual(batch);
});
it('requires authentication, password change and matching origin before deletion',async()=>{
 const batch=createBatch('protected.xlsx',[source]);cookie();expect((await request(batch.id)).status).toBe(401);cookie(adminToken);db().prepare('UPDATE auth_users SET must_change=1 WHERE id=?').run(admin.id);expect((await request(batch.id)).status).toBe(403);db().prepare('UPDATE auth_users SET must_change=0 WHERE id=?').run(admin.id);expect((await request(batch.id,{confirmation:batch.id},{Origin:'http://attacker.example'})).status).toBe(403);expect(getBatch(batch.id)).toEqual(batch);
});
it('requires explicit confirmation for the exact batch and rejects malformed/empty request bodies',async()=>{
 const batch=createBatch('confirm.xlsx',[source]);for(const body of [{},null,[],{confirmation:'wrong'},{confirmation:true},'not-json'])expect((await request(batch.id,body)).status).toBe(400);const empty=await DELETE(new Request('http://localhost/api/batches/'+batch.id,{method:'DELETE'}),context(batch.id));expect(empty.status).toBe(400);expect(getBatch(batch.id)).toEqual(batch);expect(scalar("SELECT count(*) AS n FROM auth_audit WHERE action='BATCH_DELETED' AND target_id=?",batch.id)).toBe(0);
});
it('returns 404 on missing/repeated deletion without creating duplicate audit entries',async()=>{
 const batch=createBatch('once.xlsx',[source]);expect((await request('missing')).status).toBe(404);expect((await request(batch.id)).status).toBe(200);expect((await request(batch.id)).status).toBe(404);expect(scalar("SELECT count(*) AS n FROM auth_audit WHERE action='BATCH_DELETED' AND target_id=?",batch.id)).toBe(1);
});
it('rolls back every owned row and audit when any part of deletion fails',async()=>{
 const batch=createBatch('rollback.xlsx',[source]);saveReviewed(reviewRecord(batch.records[0],'PASS',admin.username,'',undefined,reference,admin),0);const before=getBatch(batch.id),events=db().prepare('SELECT * FROM review_events').all();db().exec("CREATE TRIGGER block_test_delete BEFORE DELETE ON batches BEGIN SELECT RAISE(ABORT,'injected deletion failure'); END;");try{expect((await request(batch.id)).status).toBe(500);expect(getBatch(batch.id)).toEqual(before);expect(db().prepare('SELECT * FROM review_events').all()).toEqual(events);expect(scalar("SELECT count(*) AS n FROM auth_audit WHERE action='BATCH_DELETED' AND target_id=?",batch.id)).toBe(0);}finally{db().exec('DROP TRIGGER block_test_delete');}
});
it('fences a worker that read a lease before cancellation/deletion and prevents row resurrection',()=>{
 const job=queueBatch('race.xlsx',[source]);claimJob('old');const snapshot=reference.snapshot.bind(reference);const spy=vi.spyOn(reference,'snapshot').mockImplementationOnce(()=>{changeJob(job.id,'cancel');deleteBatch(admin,job.id);return snapshot();});try{expect(processJobChunk(job.id,'old',1)).toBe(false);assertRemoved(job.id);expect(claimJob('new')).toBeUndefined();}finally{spy.mockRestore();}
});
it('rejects a stale reviewer after deletion without restoring the record or review event',async()=>{
 const batch=createBatch('stale.xlsx',[source]),record=batch.records[0];const proposed=reviewRecord(record,'PASS',admin.username,'',undefined,reference,admin);deleteBatch(admin,batch.id);expect(()=>saveReviewed(proposed,0)).toThrow('CONFLICT');expect(getRecord(record.id)).toBeUndefined();expect(scalar('SELECT count(*) AS n FROM review_events WHERE record_id=?',record.id)).toBe(0);const response=await review(new Request('http://localhost/api/records/'+record.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'PASS',version:0})}),context(record.id));expect(response.status).toBe(404);
});
it('removes deleted rows from assigned-User totals while retaining their account, Group and other batches',async()=>{
 const deleted=createBatch('deleted.xlsx',[source]),kept=createBatch('kept.xlsx',[source]);deleteBatch(admin,deleted.id);const actor=await user();expect(dashboard(actor).totals.total).toBe(1);expect(dashboard(actor).options.batches.map(batch=>batch.id)).toEqual([kept.id]);expect((await GET(new Request('http://localhost/batch'),context(deleted.id))).status).toBe(404);expect((await GET(new Request('http://localhost/batch'),context(kept.id))).status).toBe(200);
});
