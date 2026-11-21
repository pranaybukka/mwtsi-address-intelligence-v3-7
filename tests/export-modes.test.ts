import {beforeAll,it,expect} from 'vitest';
import ExcelJS from 'exceljs';
import {ensureSeed} from '../src/db/seed';
import {createBatch} from '../src/db/batches';
import {reference} from '../src/lib/reference/sqlite';
import {reviewRecord} from '../src/lib/review';
import {exportWorkbook} from '../src/lib/excel/export';
import {HYBRID_OUTPUT_COLUMNS} from '../src/lib/export-options';
import {GET as exportApi} from '../src/app/api/batches/[id]/export/route';
import {AddressInput} from '../src/lib/domain';
beforeAll(()=>ensureSeed());
const source:AddressInput={Name:'Original Name',Address1:'Unknown address',Address2:'',Address3:'',Bank_Country:'',Group:'Group 2',additionalColumns:[{header:'Reference_ID',cell:{kind:'value',value:'000045'}},{header:'Amount',cell:{kind:'value',value:0}},{header:'Enabled',cell:{kind:'value',value:false}},{header:'Source_Date',cell:{kind:'date',value:'2026-11-01T00:00:00.000Z',numberFormat:'yyyy-mm-dd'}}]};
async function read(buffer:Buffer){const w=new ExcelJS.Workbook();await w.xlsx.load(buffer as never);return w;}
const headers=(s:ExcelJS.Worksheet)=>(s.getRow(1).values as string[]).slice(1);
const value=(s:ExcelJS.Worksheet,row:number,header:string)=>s.getRow(row).getCell(headers(s).indexOf(header)+1).value;
it('keeps full analysis as the backward-compatible default',async()=>{
 const batch=createBatch('input.xlsx',[source]);for(const mode of [undefined,'full'] as const){const w=await read(await exportWorkbook(batch,undefined,mode));expect(w.worksheets.map(s=>s.name)).toEqual(['Results','Summary','Audit']);expect(headers(w.getWorksheet('Results')!)).toContain('Enrichment_Evidence');expect(headers(w.getWorksheet('Results')!)).toContain('Reference_ID');expect(headers(w.getWorksheet('Results')!)).toContain('Review_State');}
});
it('source-hybrid contains only source fields, extras and exactly four transformed columns with preserved data types',async()=>{
 const batch=createBatch('input.xlsx',[source]);expect(batch.records[0].validation.pmpg).toBe('FAIL');const w=await read(await exportWorkbook(batch,undefined,'source-hybrid'));expect(w.worksheets.map(s=>s.name)).toEqual(['Results']);const s=w.getWorksheet('Results')!;
 expect(headers(s)).toEqual(['Name','Address1','Address2','Address3','Bank_Country','Group','Reference_ID','Amount','Enabled','Source_Date',...HYBRID_OUTPUT_COLUMNS]);expect(value(s,2,'Name')).toBe('Original Name');expect(value(s,2,'Reference_ID')).toBe('000045');expect(value(s,2,'Amount')).toBe(0);expect(value(s,2,'Enabled')).toBe(false);expect(value(s,2,'Source_Date')).toEqual(new Date('2026-11-01T00:00:00.000Z'));
 for(const [index,h]of HYBRID_OUTPUT_COLUMNS.entries())expect(value(s,2,h)||'').toBe(batch.records[0].hybrid.lines[index]||'');expect(headers(s)).not.toContain('Hybrid_Status');expect(headers(s)).not.toContain('PMPG_Hybrid_Validation');
});
it('compact export does not overwrite colliding source Hybrid_Line fields',async()=>{
 const batch=createBatch('collision.xlsx',[{...source,additionalColumns:[{header:'Hybrid_Line1',cell:{kind:'value',value:'ORIGINAL FIELD'}},{header:'Remediation.Hybrid_Line1',cell:{kind:'value',value:'ORIGINAL NAMESPACE'}}]}]);const w=await read(await exportWorkbook(batch,undefined,'source-hybrid'));const s=w.getWorksheet('Results')!;expect(value(s,2,'Hybrid_Line1')).toBe('ORIGINAL FIELD');expect(value(s,2,'Remediation.Hybrid_Line1')).toBe('ORIGINAL NAMESPACE');expect(value(s,2,'Remediation.Remediation.Hybrid_Line1')).toBe(batch.records[0].hybrid.lines[0]);expect(s.getRow(1).getCell(headers(s).indexOf('Remediation.Remediation.Hybrid_Line1')+1).note).toBeTruthy();expect(w.worksheets).toHaveLength(1);
});
it('both formats export the stored accepted proposal and name-only continuation without reprocessing',async()=>{
 const batch=createBatch('stored.xlsx',[source,{Name:'N'.repeat(35),Address1:'',Address2:'',Address3:''}]);batch.records[0]=reviewRecord(batch.records[0],'ACCEPT','Operator','Accepted with edits',{country:'XX',town:'UNVERIFIED'},reference);expect(batch.records[0].validation.pmpg).toBe('FAIL');
 for(const mode of ['full','source-hybrid'] as const){const w=await read(await exportWorkbook(batch,undefined,mode));const s=w.getWorksheet('Results')!;batch.records.forEach((r,row)=>HYBRID_OUTPUT_COLUMNS.forEach((h,i)=>expect(value(s,row+2,h)||'').toBe(r.hybrid.lines[i]||'')));}
});
it('API validates mode and honors Group selection and sorting in both formats without requiring acceptance',async()=>{
 const b=createBatch('groups.xlsx',[{...source,Name:'TEN',Group:'Group 10'},{...source,Name:'TWO A'},{...source,Name:'TWO B'}]);const params={params:Promise.resolve({id:b.id})};
 for(const mode of ['full','source-hybrid']){const r=await exportApi(new Request(`http://localhost/export?mode=${mode}&group=Group%202&groupSort=desc`),params);expect(r.status).toBe(200);expect(r.headers.get('Content-Disposition')).toContain(mode==='full'?'hybrid-address-results.xlsx':'hybrid-address-source-hybrid.xlsx');const w=await read(Buffer.from(await r.arrayBuffer()));const s=w.getWorksheet('Results')!;expect(s.rowCount).toBe(3);expect(value(s,2,'Name')).toBe('TWO A');expect(value(s,3,'Group')).toBe('Group 2');expect(w.worksheets.length).toBe(mode==='full'?3:1);}
 const invalid=await exportApi(new Request('http://localhost/export?mode=unknown'),params);expect(invalid.status).toBe(400);expect((await invalid.json()).error).toContain('export mode');
});
it('compact export retains valid Excel source text above the full-analysis display threshold',async()=>{
 const text='A'.repeat(32500);const batch=createBatch('long.xlsx',[{...source,additionalColumns:[{header:'Long_Source',cell:{kind:'value',value:text}}]}]);const compact=await read(await exportWorkbook(batch,undefined,'source-hybrid'));expect(value(compact.getWorksheet('Results')!,2,'Long_Source')).toBe(text);
 const full=await read(await exportWorkbook(batch));expect(String(value(full.getWorksheet('Results')!,2,'Long_Source'))).toContain('Full value in Audit chunks');expect(full.getWorksheet('Audit')).toBeDefined();
});

it('exports recomputed priority decisions and postal reason in full analysis',async()=>{const b=createBatch('postal.xlsx',[{Name:'TEST CUSTOMER',Address1:'100 EXAMPLE ROAD',Address2:'SUITE 5',Address3:'BOSTON MA 02110',Bank_Country:'US'}]);const w=await read(await exportWorkbook(b));const sheet=w.getWorksheet('Results')!;expect(value(sheet,2,'Hybrid_Priority_Validation')).toBe('PASS');expect(value(sheet,2,'Postal_Selection_Status')).toBe('RETAINED_2Z');expect(JSON.parse(String(value(sheet,2,'Selected_Candidate_IDs')))).toContain('2z');expect(String(value(sheet,2,'Postal_Selection_Reason'))).toContain('retained');});
