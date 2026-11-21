import {beforeEach,it,expect,vi} from 'vitest';
import {cookies} from 'next/headers';
import ExcelJS from 'exceljs';
import {db} from '../src/db/connection';
import {createBatch,getBatch} from '../src/db/batches';
import {queueBatch} from '../src/db/jobs';
import {issueSession,sessionUser} from '../src/lib/auth';
import {saveUser} from '../src/db/users';
import {createGroups} from '../src/db/groups';
import {dashboard} from '../src/db/dashboard';
import {AuthUser} from '../src/lib/auth-types';
import {RecordResult} from '../src/lib/domain';
import {progressTotals,isReadyForExport} from '../src/lib/readiness';
import {selectRecords} from '../src/lib/record-selection';
import {GET} from '../src/app/api/dashboard/route';
import {PATCH as review} from '../src/app/api/records/[id]/route';
import {POST as passBatch} from '../src/app/api/batches/[id]/accept/route';
import {GET as exportApi} from '../src/app/api/batches/[id]/export/route';
const source={Name:'TEST CUSTOMER',Address1:'100 EXAMPLE ROAD',Address2:'',Address3:'',Bank_Country:'US',Group:'Group A'};
const context=(id:string)=>({params:Promise.resolve({id})});
function cookie(token?:string){vi.mocked(cookies).mockResolvedValue({get:(name:string)=>name==='mwtsi-session'&&token?{value:token}:undefined} as never);}
let admin:AuthUser;
beforeEach(()=>{db().exec('DELETE FROM review_events;DELETE FROM records;DELETE FROM jobs;DELETE FROM job_rows;DELETE FROM batches;DELETE FROM batch_settings;DELETE FROM batch_metadata;');const row=db().prepare("SELECT id FROM auth_users WHERE username='admin'").get() as {id:string};db().prepare('UPDATE auth_users SET must_change=0 WHERE id=?').run(row.id);const token=issueSession(row.id);admin=sessionUser(token)!;cookie(token);createGroups(admin,['Group A','Group B']);});
function state(record:RecordResult,reviewState:RecordResult['reviewState'],status:RecordResult['status']=record.status){const next={...record,reviewState,status};db().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify(next),record.id);return next;}
function sample(){const batch=createBatch('mixed.xlsx',Array.from({length:8},(_,i)=>({...source,Name:`CUSTOMER ${i}`,Group:i===7?'':i===6?'Group B':'Group A'})));const r=batch.records;state(r[0],'PASSED');state(r[1],'ACCEPTED');state(r[2],'APPROVED');state(r[3],'FAILED');state(r[4],'REJECTED');state(r[5],'NONE','AUTO_TRANSLATED');state(r[6],'NONE','NAME_ONLY');return getBatch(batch.id)!;}
async function reviewer(group:string|null){const saved=await saveUser(admin,null,{username:'dashboard-'+Math.random().toString(36).slice(2),password:'Review-password-2026',role:'User',group,active:true});db().prepare('UPDATE auth_users SET must_change=0 WHERE id=?').run(saved.id);return {user:sessionUser(issueSession(saved.id))!,token:issueSession(saved.id)};}
const request=(query='')=>new Request('http://localhost/api/dashboard'+query);
it('partitions every supported and legacy state and preserves human passes with unresolved findings',()=>{
 const records=sample().records;expect(progressTotals(records)).toEqual({total:8,passed:3,failed:2,automaticReady:2,readyForExport:5,leftToReview:1,leftToFix:3});
 for(const reviewState of ['NONE','PENDING','PASSED','FAILED','ACCEPTED','APPROVED','REJECTED'] as const)for(const status of ['AUTO_TRANSLATED','PROPOSED_REVIEW_REQUIRED','NAME_ONLY','ERROR'] as const){const r={...records[0],reviewState,status};const totals=progressTotals([r]);expect(totals.total).toBe(totals.readyForExport+totals.leftToReview+totals.failed);expect(totals.leftToFix).toBe(totals.leftToReview+totals.failed);expect(totals.passed).toBeLessThanOrEqual(totals.readyForExport);expect(isReadyForExport(r)).toBe(['PASSED','ACCEPTED','APPROVED'].includes(reviewState)||reviewState==='NONE'&&['AUTO_TRANSLATED','NAME_ONLY'].includes(status));}
 expect(records[0].validation.pmpg).toBe('FAIL');expect(isReadyForExport(records[0])).toBe(true);
});
it('Admin aggregates all groups including ungrouped and applies batch/Group intersections',async()=>{
 const b=sample(),other=createBatch('other.xlsx',[{...source,Group:'Group B'}]);const all=await GET(request());expect(all.status).toBe(200);expect(all.headers.get('Cache-Control')).toContain('no-store');const result=await all.json();expect(result.totals).toMatchObject({total:9,passed:3,failed:2,readyForExport:5,leftToReview:2,leftToFix:4});expect(result.options.groups.map((g:{key:string})=>g.key)).toEqual(expect.arrayContaining(['value:Group A','value:Group B','blank']));expect(result.batches.map((row:{totals:{total:number}})=>row.totals.total).reduce((a:number,b:number)=>a+b,0)).toBe(9);
 expect(dashboard(admin,b.id,'value:Group A').totals).toMatchObject({total:6,passed:3,failed:2,readyForExport:4,leftToReview:0});expect(dashboard(admin,'','blank').totals.total).toBe(1);expect(dashboard(admin,other.id,'value:Group A').totals.total).toBe(0);expect(JSON.stringify(result)).not.toContain('100 EXAMPLE ROAD');expect(JSON.stringify(result)).not.toContain('TEST CUSTOMER');
});
it('includes completed batches beyond the recent menu cap of 50 without reusing duplicate source keys',()=>{
 const b=createBatch('first.xlsx',[{...source,recordKey:'same'}]);const record=b.records[0];const insertBatch=db().prepare('INSERT INTO batches VALUES (?,?,?)'),insertRecord=db().prepare('INSERT INTO records VALUES (?,?,?,?)');db().transaction(()=>{for(let i=1;i<=60;i++){const id=`extra-${i}`;insertBatch.run(id,`extra-${i}.xlsx`,new Date().toISOString());insertRecord.run(`${id}:1`,id,JSON.stringify({...record,id:`${id}:1`}),0);}})();const data=dashboard(admin);expect(data.totals.total).toBe(61);expect(data.batches).toHaveLength(61);expect(data.options.batches).toHaveLength(61);
});
it('excludes every unfinished job state, including partially materialized rows, until completed',()=>{
 const b=sample();for(const status of ['QUEUED','RUNNING','PAUSED','FAILED','CANCELLED'] as const){const job=queueBatch(status+'.xlsx',[source]);db().prepare('INSERT INTO records VALUES (?,?,?,?)').run(job.id+':1',job.id,JSON.stringify({...b.records[0],id:job.id+':1'}),0);db().prepare('UPDATE jobs SET status=? WHERE id=?').run(status,job.id);expect(dashboard(admin).totals.total).toBe(8);expect(dashboard(admin).options.batches.some(item=>item.id===job.id)).toBe(false);db().prepare("UPDATE jobs SET status='COMPLETED' WHERE id=?").run(job.id);expect(dashboard(admin).totals.total).toBe(9);db().prepare('DELETE FROM records WHERE batch_id=?').run(job.id);db().prepare('DELETE FROM jobs WHERE id=?').run(job.id);db().prepare('DELETE FROM batches WHERE id=?').run(job.id);}
});
it('enforces assigned Group in the query before aggregation and exposes no foreign options or totals',async()=>{
 const b=sample(),foreign=createBatch('PRIVATE-FILENAME.xlsx',[{...source,Group:'Group B'}]),caseVariant=createBatch('case.xlsx',[{...source,Group:'group a'}]);const account=await reviewer('Group A');cookie(account.token);const data=await(await GET(request())).json();expect(data.totals).toMatchObject({total:6,passed:3,failed:2,readyForExport:4,leftToReview:0});expect(data.options.groups).toEqual([{key:'value:Group A',label:'Group A'}]);expect(data.options.batches.map((item:{id:string})=>item.id)).toEqual([b.id]);expect(JSON.stringify(data)).not.toContain('PRIVATE-FILENAME');expect(JSON.stringify(data)).not.toContain(caseVariant.id);
 expect((await(await GET(request('?group=value:Group%20B'))).json()).totals.total).toBe(0);expect((await(await GET(request('?group=blank'))).json()).totals.total).toBe(0);expect((await GET(request('?batchId='+foreign.id))).status).toBe(404);expect((await GET(request('?batchId='+caseVariant.id))).status).toBe(404);
 const second=createBatch('assigned-again.xlsx',[source]);expect(dashboard(account.user).totals.total).toBe(7);expect(dashboard(account.user,second.id).totals.total).toBe(1);
});
it('returns empty scoped results to an unassigned User even with a guessed batch and Group',async()=>{
 const b=sample(),account=await reviewer(null);cookie(account.token);const data=await(await GET(request('?group=value:Group%20A'))).json();expect(data.totals.total).toBe(0);expect(data.batches).toEqual([]);expect(data.options).toEqual({batches:[],groups:[]});expect((await GET(request('?batchId='+b.id))).status).toBe(404);
});
it('protects authentication and first-login access and rejects malformed filters',async()=>{
 cookie();expect((await GET(request())).status).toBe(401);const row=db().prepare("SELECT id FROM auth_users WHERE username='admin'").get() as {id:string};cookie(issueSession(row.id));db().prepare('UPDATE auth_users SET must_change=1 WHERE id=?').run(row.id);expect((await GET(request())).status).toBe(403);db().prepare('UPDATE auth_users SET must_change=0 WHERE id=?').run(row.id);
 for(const query of ['?group=invalid','?group=all&group=blank','?batchId=a&batchId=b','?batchId='+ 'a'.repeat(201),'?group=value:'+ 'a'.repeat(201)])expect((await GET(request(query))).status).toBe(400);
});
it('recomputes authoritative totals immediately after edit, pass, fail and bulk pass',async()=>{
 const b=createBatch('decisions.xlsx',Array.from({length:4},()=>source));const act=async(index:number,action:string,extra={})=>review(new Request('http://localhost/api/records/id',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,version:getBatch(b.id)!.records[index].version,...extra})}),context(b.records[index].id));
 expect(dashboard(admin).totals.leftToReview).toBe(4);expect((await act(0,'EDIT',{reason:'Town correction',edits:{town:'BERLIN',country:'DE'}})).status).toBe(200);expect(dashboard(admin).totals.leftToReview).toBe(4);expect((await act(0,'PASS')).status).toBe(200);expect(dashboard(admin).totals).toMatchObject({passed:1,readyForExport:1,leftToReview:3,failed:0});expect((await act(1,'FAIL',{reason:'Insufficient evidence'})).status).toBe(200);expect(dashboard(admin).totals).toMatchObject({passed:1,readyForExport:1,leftToReview:2,failed:1,leftToFix:3});
 const selection=getBatch(b.id)!.records.filter(r=>r.reviewState==='PENDING').map(r=>({id:r.id,version:r.version}));expect((await passBatch(new Request('http://localhost/api/batches/id/accept',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'PASS',selection})}),context(b.id))).status).toBe(200);expect(dashboard(admin).totals).toMatchObject({total:4,passed:3,readyForExport:3,leftToReview:0,failed:1,leftToFix:1});
});
it('ready selection agrees with dashboard and both export formats; overlapping statuses remain unique',async()=>{
 const b=sample(),ready=selectRecords(b.records,['readyForExport']);expect(ready).toHaveLength(dashboard(admin,b.id).totals.readyForExport);expect(selectRecords(b.records,['readyForExport','passed']).map(r=>r.id)).toEqual(ready.map(r=>r.id));expect(selectRecords(b.records,['leftToFix'])).toHaveLength(3);expect(selectRecords(b.records,['leftToReview'])).toHaveLength(1);
 for(const mode of ['full','source-hybrid']){const response=await exportApi(new Request(`http://localhost/export?scope=selected&status=readyForExport&status=passed&mode=${mode}`),context(b.id));expect(response.status).toBe(200);const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(Buffer.from(await response.arrayBuffer()) as never);expect(workbook.getWorksheet('Results')!.rowCount-1).toBe(5);}
 const account=await reviewer('Group A');cookie(account.token);expect((await exportApi(new Request('http://localhost/export?scope=selected&status=readyForExport'),context(b.id))).status).toBe(403);
});
it('supports exact international and blank group filters without filename or key assumptions',()=>{
 const group="São Paulo / Manny's (1)",b=createBatch('C:\\fakepath\\Address Test.xlsx',[{...source,Group:group},{...source,Group:'   '},{...source,Group:''}]);expect(dashboard(admin,b.id,`value:${group}`).totals.total).toBe(1);expect(dashboard(admin,b.id,'blank').totals.total).toBe(2);expect(dashboard(admin).options.groups).toEqual(expect.arrayContaining([{key:`value:${group}`,label:group},{key:'blank',label:'(No group)'}]));
});
