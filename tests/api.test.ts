import {it,expect} from 'vitest';
import {NextRequest} from 'next/server';
import {POST as upload} from '../src/app/api/batches/route';
import {GET as template} from '../src/app/api/template/route';
import {GET as exportBatch} from '../src/app/api/batches/[id]/export/route';
import {PATCH as review} from '../src/app/api/records/[id]/route';
import {Batch} from '../src/lib/domain';
it('HTTP handlers accept XLSX upload, preserve rows, validate reviews and export workbook',async()=>{
 const t=await template();const form=new FormData();form.append('file',new File([await t.arrayBuffer()],'test.xlsx',{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
 const res=await upload(new NextRequest('http://localhost/api/batches',{method:'POST',body:form}));expect(res.status).toBe(200);const batch=await res.json() as Batch;expect(batch.records).toHaveLength(1);expect(batch.records[0].hybrid.lines.at(-1)).toBe('3/BE/BRUSSELS');
 const bad=await review(new Request('http://localhost/api/records/id',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'APPROVE',reviewer:'Operator',reason:'Verified',version:99})}),{params:Promise.resolve({id:batch.records[0].id})});expect(bad.status).toBe(409);
 const out=await exportBatch(new Request('http://localhost/export'),{params:Promise.resolve({id:batch.id})});expect(out.status).toBe(200);expect(out.headers.get('Content-Type')).toContain('spreadsheet');expect((await out.arrayBuffer()).byteLength).toBeGreaterThan(1000);
});
it('HTTP upload returns a helpful error for missing file',async()=>{const r=await upload(new NextRequest('http://localhost/api/batches',{method:'POST',body:new FormData()}));expect(r.status).toBe(400);expect((await r.json()).error).toContain('Excel');});
it('HTTP record acceptance succeeds with unresolved data and preserves findings',async()=>{
 const {createBatch}=await import('../src/db/batches');const r=createBatch('pending.xlsx',[{Name:'UNKNOWN',Address1:'UNKNOWN ADDRESS',Address2:'',Address3:''}]).records[0];
 const response=await review(new Request('http://localhost/api/records/id',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'ACCEPT',reviewer:'Operator',reason:'Accept existing output',edits:r.intelligence.structured,version:r.version})}),{params:Promise.resolve({id:r.id})});expect(response.status).toBe(200);const n=await response.json();expect(n.reviewState).toBe('ACCEPTED');expect(n.validation).toEqual(r.validation);expect(n.intelligence).toEqual(r.intelligence);expect(n.hybrid).toEqual(r.hybrid);
});
it('HTTP batch acceptance accepts pending records and rejects stale retry',async()=>{
 const {POST:accept}=await import('../src/app/api/batches/[id]/accept/route');const {createBatch}=await import('../src/db/batches');const b=createBatch('pending.xlsx',[{Name:'UNKNOWN',Address1:'UNKNOWN ADDRESS',Address2:'',Address3:''}]);const body={reviewer:'Operator',reason:'Accept batch output',selection:b.records.map(r=>({id:r.id,version:r.version}))};const request=()=>new Request('http://localhost/api/batches/id/accept',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const params={params:Promise.resolve({id:b.id})};const res=await accept(request(),params);expect(res.status).toBe(200);expect((await res.json()).records[0].reviewState).toBe('ACCEPTED');expect((await accept(request(),params)).status).toBe(409);
});
it('HTTP Name editing reruns Name segmentation and truncation while retaining raw source',async()=>{
 const {createBatch}=await import('../src/db/batches');const source={Name:'JOHN MICHAEL SMITH',Address1:'AND MARIA ELENA RIVERA / 100 EXAMPLE ROAD',Address2:'FLOOR 2',Address3:'BERLIN 10117 GERMANY'};const r=createBatch('names.xlsx',[source]).records[0];const name='JOHN MICHAEL SMITH AND MARIA ELENA RIVERA INTERNATIONAL FAMILY SETTLEMENT TRUST';
 const response=await review(new Request('http://localhost/api/records/id',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'ACCEPT',reviewer:'Operator',reason:'Accept revised Name',edits:{name},version:r.version})}),{params:Promise.resolve({id:r.id})});expect(response.status).toBe(200);const n=await response.json();expect(n.source).toEqual(source);expect(n.reviewState).toBe('ACCEPTED');expect(n.hybrid.lines.slice(0,2)).toEqual(['1/'+name.slice(0,33),'1/'+name.slice(33,66)]);expect(n.hybrid.truncations.some((entry:{field:string})=>entry.field==='Name')).toBe(true);
});
