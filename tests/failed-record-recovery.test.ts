import {beforeEach,it,expect,vi} from 'vitest';
import {cookies} from 'next/headers';
import ExcelJS from 'exceljs';
import {db} from '../src/db/connection';
import {createBatch,getBatch,getRecord} from '../src/db/batches';
import {createGroups} from '../src/db/groups';
import {saveUser} from '../src/db/users';
import {issueSession,sessionUser} from '../src/lib/auth';
import type {AuthUser} from '../src/lib/auth-types';
import {canDecide} from '../src/lib/review-decision';
import {dashboard} from '../src/db/dashboard';
import {selectRecords} from '../src/lib/record-selection';
import {PATCH} from '../src/app/api/records/[id]/route';
import {POST as bulkPass} from '../src/app/api/batches/[id]/accept/route';
import {exportWorkbook} from '../src/lib/excel/export';
const source={Name:'RECOVERABLE CUSTOMER',Address1:'100 EXAMPLE ROAD',Address2:'',Address3:'',Bank_Country:'US',Group:'Recovery A',recordKey:'0001'};
let admin:AuthUser;
function cookie(token?:string){vi.mocked(cookies).mockResolvedValue({get:(name:string)=>name==='mwtsi-session'&&token?{value:token}:undefined} as never);}
const send=(id:string,body:unknown)=>PATCH(new Request('http://localhost/api/records/id',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),{params:Promise.resolve({id})});
beforeEach(()=>{db().exec('DELETE FROM review_events;DELETE FROM records;DELETE FROM jobs;DELETE FROM job_rows;DELETE FROM batches;DELETE FROM batch_settings;');const row=db().prepare("SELECT id FROM auth_users WHERE username='admin'").get() as {id:string};const token=issueSession(row.id);admin=sessionUser(token)!;cookie(token);createGroups(admin,['Recovery A','Recovery B']);});
async function user(group:string|null='Recovery A'){const saved=await saveUser(admin,null,{username:'recovery-'+Math.random().toString(36).slice(2),password:'Recovery-temporary-2026',role:'User',group,active:true});db().prepare('UPDATE auth_users SET must_change=0 WHERE id=?').run(saved.id);const token=issueSession(saved.id);cookie(token);return sessionUser(token)!;}
async function failed(action:'FAIL'|'REJECT'='FAIL'){const record=createBatch('recovery.xlsx',[source]).records[0];const response=await send(record.id,{action,reason:'Original failure: address evidence missing',version:0});expect(response.status).toBe(200);return await response.json() as typeof record;}
it('permits decisions on failed/rejected output while keeping passed/accepted/approved output locked',async()=>{
 const record=await failed();for(const state of ['PENDING','NONE','FAILED','REJECTED','PASSED','ACCEPTED','APPROVED'] as const)expect(canDecide({...record,reviewState:state}),state).toBe(['PENDING','NONE','FAILED','REJECTED'].includes(state));
});
it.each([['FAIL','Admin'],['REJECT','Admin'],['FAIL','User'],['REJECT','User']] as const)('%s records can be corrected and passed by %s with immutable source and prior audit',async(action,role)=>{
 const before=await failed(action),actor=role==='User'?await user():admin,original=structuredClone(before.reviews);
 expect(dashboard(actor).totals).toMatchObject({total:1,failed:1,passed:0,readyForExport:0,leftToFix:1});
 const response=await send(before.id,{action:'PASS',version:1,edits:{town:'BERLIN',country:'DE',primary:'200 CORRECTED ROAD',Group:'Recovery B'},reviewer:'FORGED',actorUsername:'FORGED'});expect(response.status).toBe(200);const result=await response.json();
 expect(result.reviewState).toBe('PASSED');expect(result.version).toBe(2);expect(result.source).toEqual(before.source);expect(result.intelligence.structured).toMatchObject({town:'BERLIN',country:'DE',primary:'200 CORRECTED ROAD'});expect(result.hybrid.lines).toContain('3/DE/BERLIN');expect(result.reviews.slice(0,1)).toEqual(original);expect(result.reviews[1]).toMatchObject({action:'PASS',reason:'',actorId:actor.id,actorUsername:actor.username,reviewer:actor.username,before:before.intelligence.structured,after:result.intelligence.structured});expect(result.reviews[1].decisionOutput.lines).toEqual(result.hybrid.lines);expect(result.intelligence.town.confidence).toBe(0);
 expect(getRecord(before.id)).toEqual(result);const events=db().prepare('SELECT event FROM review_events WHERE record_id=? ORDER BY id').all(before.id) as {event:string}[];expect(events.map(row=>JSON.parse(row.event))).toEqual(result.reviews);
 expect(dashboard(actor).totals).toMatchObject({total:1,failed:0,passed:1,readyForExport:1,leftToFix:0});expect(selectRecords([result],['failed','rejected','leftToFix'])).toHaveLength(0);expect(selectRecords([result],['passed','readyForExport'])).toHaveLength(1);
});
it('supports the existing draft-edit API on failed records before a later pass and retains each event',async()=>{
 const before=await failed();const actor=await user();const draft=await send(before.id,{action:'EDIT',version:1,reason:'Correct town from source evidence',edits:{town:'BERLIN',country:'DE'}});expect(draft.status).toBe(200);const edited=await draft.json();expect(edited.reviewState).toBe('PENDING');expect(edited.reviews[0]).toEqual(before.reviews[0]);expect(edited.reviews[1]).toMatchObject({action:'EDIT',actorId:actor.id});expect(dashboard(actor).totals).toMatchObject({leftToReview:1,failed:0,readyForExport:0});expect((await send(before.id,{action:'PASS',version:2})).status).toBe(200);expect(getRecord(before.id)?.reviews.map(event=>event.action)).toEqual(['FAIL','EDIT','PASS']);
});
it('requires a new reason for another failure, allows correction, and rejects stale/duplicate passes atomically',async()=>{
 const before=await failed();for(const reason of [undefined,'','  ',42,'x'.repeat(2001)])expect((await send(before.id,{action:'FAIL',version:1,...(reason===undefined?{}:{reason})})).status).toBe(400);expect(getRecord(before.id)).toEqual(before);
 expect((await send(before.id,{action:'FAIL',version:1,reason:'Still missing confirmation',edits:{primary:'200 CORRECTED ROAD'}})).status).toBe(200);expect(getRecord(before.id)?.version).toBe(2);expect((await send(before.id,{action:'PASS',version:1,edits:{town:'STALE'}})).status).toBe(409);expect(getRecord(before.id)?.intelligence.structured.town).toBe(before.intelligence.structured.town);
 expect((await send(before.id,{action:'PASS',version:2})).status).toBe(200);expect((await send(before.id,{action:'PASS',version:2})).status).toBe(409);expect((await send(before.id,{action:'FAIL',version:3,reason:'Cannot change a passed record'})).status).toBe(409);expect(getRecord(before.id)?.reviews.map(event=>event.action)).toEqual(['FAIL','FAIL','PASS']);
});
it('cannot recover foreign, blank or differently cased groups; an unassigned User cannot recover any record',async()=>{
 const before=await failed();await user('Recovery B');for(const action of ['EDIT','PASS','FAIL'])expect((await send(before.id,{action,version:1,reason:action==='PASS'?'':'Attempt',edits:{town:'BERLIN'}})).status).toBe(404);
 await user(null);expect((await send(before.id,{action:'PASS',version:1})).status).toBe(404);expect(getRecord(before.id)).toEqual(before);
 const token=issueSession(admin.id);cookie(token);const b=createBatch('scopes.xlsx',[{...source,Group:''},{...source,Group:'recovery a'}]);for(const record of b.records)expect((await send(record.id,{action:'FAIL',version:0,reason:'Evidence missing'})).status).toBe(200);await user();for(const record of b.records)expect((await send(record.id,{action:'PASS',version:1})).status).toBe(404);
});
it('does not silently include failed records in the existing bulk-pass-pending action',async()=>{
 const before=await failed(),batchId=before.id.split(':')[0];const response=await bulkPass(new Request('http://localhost/accept',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'PASS',selection:[{id:before.id,version:1}]})}),{params:Promise.resolve({id:batchId})});expect(response.status).toBe(409);expect(getRecord(before.id)).toEqual(before);
});
it('allows corrected Pass on failed processing-error output while retaining the error and failure snapshots',async()=>{
 const before=await failed();const error={...before,status:'ERROR' as const};db().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify(error),before.id);const response=await send(before.id,{action:'PASS',version:1,edits:{town:'BERLIN',country:'DE'}});expect(response.status).toBe(200);const result=await response.json();expect(result).toMatchObject({reviewState:'PASSED',status:'ERROR'});expect(result.intelligence.structured.town).toBe('BERLIN');expect(result.reviews[0]).toEqual(before.reviews[0]);expect(result.reviews[1].decisionOutput.status).toBe('ERROR');
});
it('exports the current Pass and corrected Hybrid lines with the original failure retained in review audit',async()=>{
 const before=await failed('REJECT');expect((await send(before.id,{action:'PASS',version:1,edits:{town:'BERLIN',country:'DE'}})).status).toBe(200);const batch=getBatch(before.id.split(':')[0])!,result=batch.records[0];
 const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(await exportWorkbook(batch) as never);const sheet=workbook.getWorksheet('Results')!,headers=(sheet.getRow(1).values as string[]).slice(1),get=(key:string)=>sheet.getRow(2).getCell(headers.indexOf(key)+1).value;
 expect(get('Review_Decision')).toBe('PASS');expect(get('Output_Failed')).toBe(false);expect(get('Decision_User')).toBe('admin');expect(get('Decision_Reason')||'').toBe('');expect(get('Hybrid_Line'+(result.hybrid.lines.indexOf('3/DE/BERLIN')+1))).toBe('3/DE/BERLIN');expect(JSON.parse(String(get('Review_History')))[0]).toEqual(before.reviews[0]);expect(workbook.getWorksheet('Audit')!.getRows(2,workbook.getWorksheet('Audit')!.rowCount-1)!.some(row=>row.getCell(2).text==='reviews'&&row.getCell(4).text.includes('Original failure: address evidence missing'))).toBe(true);
 const compact=new ExcelJS.Workbook();await compact.xlsx.load(await exportWorkbook(batch,undefined,'source-hybrid') as never);expect(compact.getWorksheet('Results')!.getRow(2).values).toContain('3/DE/BERLIN');
});
