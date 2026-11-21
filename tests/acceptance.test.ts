import {it,expect,beforeAll} from 'vitest';
import {ensureSeed} from '../src/db/seed';
import {reference} from '../src/lib/reference/sqlite';
import {reviewRecord} from '../src/lib/review';
import {createBatch,getRecord,getBatch,saveReviewed,acceptPendingBatch} from '../src/db/batches';
import {exportRow,exportWorkbook} from '../src/lib/excel/export';
import {summarize} from '../src/lib/summary';
import ExcelJS from 'exceljs';
beforeAll(()=>ensureSeed());
const missing={Name:'UNRESOLVED',Address1:'SOMEWHERE',Address2:'',Address3:''};
it('accepts unresolved output exactly as-is without changing evidence, confidence or validation',async()=>{
 const b=createBatch('accept.xlsx',[missing]);const r=b.records[0];const before=structuredClone(r);expect(r.validation.pmpg).toBe('FAIL');
 const next=reviewRecord(r,'ACCEPT','Operator','Accept proposed remediation',undefined,reference);saveReviewed(next,r.version);
 expect(r).toEqual(before);expect(next.reviewState).toBe('ACCEPTED');expect(next.hybrid).toEqual(r.hybrid);expect(next.intelligence).toEqual(r.intelligence);expect(next.source).toEqual(r.source);expect(next.validation).toEqual(r.validation);expect(next.status).toBe('PROPOSED_REVIEW_REQUIRED');expect(next.reasons).toEqual(r.reasons);expect(next.reviews[0].acceptedOutput?.lines).toEqual(r.hybrid.lines);
 const saved=getRecord(r.id)!;const row=exportRow(saved);expect(row.Output_Accepted).toBe(true);expect(row.Accepted_With_Issues).toBe(true);expect(row.Hybrid_Review_Required).toBe(false);expect(row.PMPG_Hybrid_Validation).toBe('FAIL');expect(row.Accepted_By).toBe('Operator');expect(summarize([saved])).toMatchObject({accepted:1,acceptedWithIssues:1,pending:0,pmpgFail:1,AUTO_TRANSLATED:0});
 const out=await exportWorkbook(getBatch(b.id)!);const w=new ExcelJS.Workbook();await w.xlsx.load(out as never);const sheet=w.getWorksheet('Results')!;const headers=sheet.getRow(1).values as string[];expect(sheet.getRow(2).getCell(headers.indexOf('Review_State')).text).toBe('ACCEPTED');expect(sheet.getRow(2).getCell(headers.indexOf('PMPG_Hybrid_Validation')).text).toBe('FAIL');
});
it('acceptance preserves explicit banking conflicts and failed length checks',()=>{
 const r=createBatch('conflict.xlsx',[{...missing,Address3:'BERLIN 10117 GERMANY',Bank_Country:'CA'}]).records[0];expect(r.validation.evidenceConflict).toBe(true);
 r.validation.length='FAIL';r.validation.issues.push('Imported length finding');
 const n=reviewRecord(r,'ACCEPT','Operator','Known exceptions accepted',undefined,reference);expect(n.intelligence.conflicts).toEqual(r.intelligence.conflicts);expect(n.validation).toEqual(r.validation);expect(n.intelligence.country.confidence).toBe(r.intelligence.country.confidence);
});
it('accepts processing-error output without disguising it as successful processing',()=>{const r=createBatch('error.xlsx',[missing]).records[0];r.status='ERROR';const n=reviewRecord(r,'ACCEPT','Operator','Accept error proposal for further handling',undefined,reference);expect(n.reviewState).toBe('ACCEPTED');expect(n.status).toBe('ERROR');expect(n.hybrid).toEqual(r.hybrid);});
it('accepts edited unresolved values without promoting them to verified or automatic',()=>{const r=createBatch('edit.xlsx',[missing]).records[0];const n=reviewRecord(r,'ACCEPT','Operator','Accept incomplete draft',{town:'UNVERIFIED',country:'XX'},reference);expect(n.reviewState).toBe('ACCEPTED');expect(n.hybrid.lines.at(-1)).toBe('3/XX/UNVERIFIED');expect(n.validation.pmpg).toBe('FAIL');expect(n.intelligence.country.confidence).toBe(0);expect(n.status).not.toBe('AUTO_TRANSLATED');});
it('batch acceptance is atomic on stale versions and preserves per-record findings',()=>{
 const b=createBatch('batch.xlsx',[missing,{...missing,Name:'SECOND'}]);const selection=b.records.map(r=>({id:r.id,version:r.version}));
 expect(()=>acceptPendingBatch(b.id,[selection[0],{...selection[1],version:99}],'Reviewer','Accepted as-is')).toThrow('CONFLICT');expect(getBatch(b.id)!.records.every(r=>r.reviewState==='PENDING')).toBe(true);
 const n=acceptPendingBatch(b.id,selection,'Reviewer','Accepted as-is');expect(n.records.every(r=>r.reviewState==='ACCEPTED')).toBe(true);expect(n.records.map(r=>r.hybrid)).toEqual(b.records.map(r=>r.hybrid));expect(n.records.every(r=>r.validation.pmpg==='FAIL')).toBe(true);expect(()=>acceptPendingBatch(b.id,selection,'Reviewer','Retry')).toThrow('CONFLICT');
});
it('retains reviewer audit requirements and prevents cross-batch selections',()=>{const b=createBatch('one.xlsx',[missing]),other=createBatch('two.xlsx',[missing]);expect(()=>reviewRecord(b.records[0],'ACCEPT','','Accepted',undefined,reference)).toThrow('Reviewer');expect(()=>acceptPendingBatch(b.id,[{id:other.records[0].id,version:0}],'Reviewer','Accept')).toThrow('does not belong');});
