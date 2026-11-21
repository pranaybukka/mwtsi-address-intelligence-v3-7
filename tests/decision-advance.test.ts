import {beforeEach,it,expect} from 'vitest';
import {db} from '../src/db/connection';
import {createBatch,getRecord} from '../src/db/batches';
import {navigateReport} from '../src/db/report-navigation';
import {defaultQuery,batchPage,type RecordQuery} from '../src/db/record-query';
import {changeReservation,reservation} from '../src/db/reservations';
import {trackDirectExport} from '../src/db/export-tracking';
import {filterAndSortGroups} from '../src/lib/source';
import {issueSession,sessionUser} from '../src/lib/auth';
import type {AuthUser} from '../src/lib/auth-types';
import type {RecordResult} from '../src/lib/domain';
import {PATCH} from '../src/app/api/records/[id]/route';
import {GET} from '../src/app/api/batches/[id]/navigation/route';
let admin:AuthUser;
beforeEach(()=>{db().exec('DELETE FROM records;DELETE FROM batches;');const row=db().prepare("SELECT id FROM auth_users WHERE username='admin'").get() as {id:string};admin=sessionUser(issueSession(row.id))!;});
function fixture(n=40){return createBatch('Advance.xlsx',Array.from({length:n},(_,i)=>({Name:`CUSTOMER ${i}`,Address1:'100 EXAMPLE ROAD',Address2:'',Address3:'',Bank_Country:'US',Group:['Group 10','Group 2','group 2','Group 02','','   '][i%6],recordKey:'SAME KEY'})));}
async function decide(r:RecordResult,action:'PASS'|'FAIL'='PASS'){
 const claim=changeReservation(admin,r.id,'claim');const res=await PATCH(new Request('http://localhost/record',{method:'PATCH',body:JSON.stringify({action,version:r.version,reservationToken:claim.token,...(action==='FAIL'?{reason:'Evidence incomplete'}:{})})}),{params:Promise.resolve({id:r.id})});expect(res.status).toBe(200);return await res.json() as RecordResult;
}
it('advances from the stable source position when Pass removes the anchor from Pending, including a page boundary',async()=>{
 const b=fixture(),q={...defaultQuery(),statuses:['pending'] as const} as RecordQuery;
 await decide(b.records[14]);expect(reservation(b.records[14].id)).toBeUndefined();
 const next=navigateReport(admin,b.id,q,b.records[14].id,'after');expect(next.record?.id).toBe(b.records[15].id);expect(next).toMatchObject({position:15,total:39,page:0});
 await decide(b.records[15]);expect(navigateReport(admin,b.id,q,b.records[15].id,'after').record?.id).toBe(b.records[16].id);
 expect(()=>navigateReport(admin,b.id,q,b.records[14].id,'current')).toThrow('no longer in');
});
it.each(['PASS','FAIL'] as const)('does not reopen or skip a retained anchor after %s in a multi-status or unfiltered report',async action=>{
 const b=fixture(3),r=b.records[0];await decide(r,action);
 for(const statuses of [[],['pending','failed','passed']] as RecordQuery['statuses'][]){expect(navigateReport(admin,b.id,{...defaultQuery(),statuses},r.id,'after').record?.id).toBe(b.records[1].id);}
});
it.each(['original','asc','desc'] as const)('matches report %s order after disappearing anchors and natural-sort Group ties',async sort=>{
 const b=fixture(18),ordered=filterAndSortGroups(b.records,'all',sort),q={...defaultQuery(),statuses:['pending'],groupSort:sort} as RecordQuery;
 for(let i=0;i<ordered.length;i++){await decide(ordered[i]);const next=navigateReport(admin,b.id,q,ordered[i].id,'after');expect(next.record?.id).toBe(ordered[i+1]?.id);expect(next.total).toBe(ordered.length-i-1);}
 expect(navigateReport(admin,b.id,q,ordered.at(-1)!.id,'after')).toMatchObject({record:null,total:0,page:0,hasNext:false});
});
it('does not wrap at the end while earlier matching records remain',async()=>{const b=fixture(3);await decide(b.records[2]);expect(navigateReport(admin,b.id,{...defaultQuery(),statuses:['pending']},b.records[2].id,'after')).toMatchObject({record:null,total:2,page:0,hasNext:false});});
it('preserves Group, ANY status, focused metric, search and export-state intersections after a decision',async()=>{
 const b=fixture(30),q={...defaultQuery(),group:'value:Group 10',statuses:['pending','failed'],focusStatus:'leftToReview',search:'CUSTOMER',exportState:'remaining',groupSort:'desc'} as RecordQuery;
 trackDirectExport(admin,b.id,'full',[b.records[6]]);const expected=batchPage(admin,b.id,q).records;expect(expected.length).toBeGreaterThan(2);await decide(expected[0],'FAIL');
 const next=navigateReport(admin,b.id,q,expected[0].id,'after');expect(next.record?.id).toBe(expected[1].id);expect(next.total).toBe(expected.length-1);
});
it('uses the saved position even when edited structured data no longer matches search',()=>{const b=fixture(3);for(const r of b.records){r.intelligence.structured.town='LOOKUPTOWN';db().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify(r),r.id);}const r=b.records[0];r.intelligence.structured.town='CORRECTED';r.reviewState='PASSED';db().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify(r),r.id);expect(navigateReport(admin,b.id,{...defaultQuery(),search:'LOOKUPTOWN'},r.id,'after').record?.id).toBe(b.records[1].id);});
it('enforces exact assigned Group, selected Group and batch boundaries for saved anchors',()=>{
 const b=fixture(),user={...admin,role:'User' as const,group:'Group 2'},q=defaultQuery(),own=b.records.filter(r=>r.source.Group==='Group 2');
 expect(navigateReport(user,b.id,q,own[0].id,'after').record?.id).toBe(own[1].id);
 for(const r of [b.records[0],b.records[2],b.records[3]])expect(()=>navigateReport(user,b.id,q,r.id,'after')).toThrow('no longer in');
 expect(()=>navigateReport(admin,b.id,{...q,group:'value:Group 2'},b.records[0].id,'after')).toThrow('no longer in');
 expect(()=>navigateReport({...user,group:null},b.id,q,own[0].id,'after')).toThrow('Batch not found');
 const other=fixture(1);expect(()=>navigateReport(admin,b.id,q,other.records[0].id,'after')).toThrow('no longer in');
});
it('returns a reserved neighbor without stealing its lease and retrying GET never repeats a decision',async()=>{
 const b=fixture(3),saved=await decide(b.records[0],'FAIL'),other={...admin,id:'other-reviewer',username:'other-reviewer'};changeReservation(other,b.records[1].id,'claim');
 const events=db().prepare('SELECT * FROM review_events WHERE record_id=?').all(saved.id),before=reservation(b.records[1].id);
 for(let i=0;i<3;i++)expect(navigateReport(admin,b.id,defaultQuery(),saved.id,'after').record?.id).toBe(b.records[1].id);
 expect(reservation(b.records[1].id)).toEqual(before);expect(getRecord(saved.id)).toEqual(saved);expect(db().prepare('SELECT * FROM review_events WHERE record_id=?').all(saved.id)).toEqual(events);expect(events).toHaveLength(1);
});
it('exposes validated after navigation through the authenticated route',async()=>{const b=fixture(2),r=await decide(b.records[0]),ctx={params:Promise.resolve({id:b.id})};const res=await GET(new Request(`http://localhost/navigation?recordId=${encodeURIComponent(r.id)}&direction=after&status=pending`),ctx);expect(res.status).toBe(200);expect((await res.json()).record.id).toBe(b.records[1].id);expect((await GET(new Request(`http://localhost/navigation?recordId=${r.id}&direction=invalid`),ctx)).status).toBe(400);});
