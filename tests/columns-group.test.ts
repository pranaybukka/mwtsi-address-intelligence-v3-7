import {it,expect,beforeAll} from 'vitest';
import ExcelJS from 'exceljs';
import {ensureSeed} from '../src/db/seed';
import {reference} from '../src/lib/reference/sqlite';
import {processAddress} from '../src/lib/process';
import {importWorkbook} from '../src/lib/excel/import';
import {exportWorkbook} from '../src/lib/excel/export';
import {createBatch,getBatch,saveReviewed} from '../src/db/batches';
import {reviewRecord} from '../src/lib/review';
import {filterAndSortGroups,groupOptions} from '../src/lib/source';
import {GET as exportApi} from '../src/app/api/batches/[id]/export/route';
import {AddressInput} from '../src/lib/domain';
beforeAll(()=>ensureSeed());
const core=['Name','Address1','Address2','Address3','Bank_Country'];
const source:AddressInput={Name:'TEST',Address1:'100 EXAMPLE ROAD',Address2:'',Address3:'BERLIN 10117 GERMANY',Bank_Country:''};
async function input(headers:string[],rows:unknown[][],format?:(s:ExcelJS.Worksheet)=>void){const w=new ExcelJS.Workbook();const s=w.addWorksheet('Source');s.addRow(headers);rows.forEach(row=>s.addRow(row));format?.(s);return Buffer.from(await w.xlsx.writeBuffer());}
async function read(buffer:Buffer){const w=new ExcelJS.Workbook();await w.xlsx.load(buffer as never);return w;}
const columns=(s:ExcelJS.Worksheet)=>new Map((s.getRow(1).values as string[]).slice(1).map((h,i)=>[h,i+1]));
it('Group and arbitrary extra data cannot alter parsing, evidence, confidence, validation or status',()=>{
 const plain=processAddress(source,reference,'plain');const enriched=processAddress({...source,Group:'CANADA with odd CASE',additionalColumns:[{header:'Country',cell:{kind:'value',value:'CANADA TORONTO ON M5H 1J9'}},{header:'Town',cell:{kind:'value',value:'DUBAI UAE'}}]},reference,'extra');
 expect(enriched.intelligence).toEqual(plain.intelligence);expect(enriched.hybrid).toEqual(plain.hybrid);expect(enriched.validation).toEqual(plain.validation);expect(enriched.status).toBe(plain.status);
});
it('roundtrips additional text, leading zeros, number formats, numbers, booleans, dates and blank columns through persistence and acceptance',async()=>{
 const date=new Date('2026-10-15T00:00:00Z');const buffer=await input([...core,'Group','Reference_ID','Amount','Active','Review_Date','Blank',' Cost Center '],[['Original Name','Unknown address','','','','Batch 10','000045',0,false,date,null,'  APAC  ']],s=>{s.getCell('J2').numFmt='yyyy-mm-dd';s.getCell('G2').numFmt='@';});
 const rows=await importWorkbook(buffer,'extra.xlsx');expect(rows[0].Group).toBe('Batch 10');const batch=createBatch('extra.xlsx',rows);const record=batch.records[0];const accepted=reviewRecord(record,'ACCEPT','Operator','Accept draft',undefined,reference);saveReviewed(accepted,record.version);
 const stored=getBatch(batch.id)!;expect(stored.records[0].source).toEqual(rows[0]);const w=await read(await exportWorkbook(stored));const sheet=w.getWorksheet('Results')!,c=columns(sheet);const value=(h:string)=>sheet.getRow(2).getCell(c.get(h)!).value;
 expect(value('Group')).toBe('Batch 10');expect(value('Reference_ID')).toBe('000045');expect(value('Amount')).toBe(0);expect(value('Active')).toBe(false);expect(value('Review_Date')).toEqual(date);expect(value('Blank')).toBe(null);expect(value(' Cost Center ')).toBe('  APAC  ');expect(sheet.getRow(2).getCell(c.get('Review_Date')!).numFmt).toBe('yyyy-mm-dd');
});
it('preserves original column collisions and renames computed output fields without overwriting source values',async()=>{
 const rows=await importWorkbook(await input([...core,'Hybrid_Status','Remediation.Hybrid_Status','__proto__','__extra_0'],[['N','Somewhere','','','','SOURCE STATUS','SOURCE NAMESPACE','SOURCE PROTO','SOURCE KEY']]),'collision.xlsx');const batch=createBatch('collision.xlsx',rows);const w=await read(await exportWorkbook(batch));const s=w.getWorksheet('Results')!,c=columns(s),v=(header:string)=>s.getRow(2).getCell(c.get(header)!).text;
 expect(v('Hybrid_Status')).toBe('SOURCE STATUS');expect(v('Remediation.Hybrid_Status')).toBe('SOURCE NAMESPACE');expect(v('Remediation.Remediation.Hybrid_Status')).toBe('PROPOSED_REVIEW_REQUIRED');expect(v('__proto__')).toBe('SOURCE PROTO');expect(v('__extra_0')).toBe('SOURCE KEY');expect(new Set([...c.keys()]).size).toBe(c.size);
});
it('carries formulas as cached values or inert text while retaining the original formula in audit metadata',async()=>{
 const rows=await importWorkbook(await input([...core,'Cached','Uncached'],[['N','Somewhere','','','',{formula:'1+1',result:2},{formula:'SUM(1,2)'}]]),'formula-extra.xlsx');expect(rows[0].additionalColumns![0].cell.originalFormula).toBe('1+1');
 const w=await read(await exportWorkbook(createBatch('formula-extra.xlsx',rows)));const s=w.getWorksheet('Results')!,c=columns(s);expect(s.getRow(2).getCell(c.get('Cached')!).value).toBe(2);expect(s.getRow(2).getCell(c.get('Uncached')!).value).toBe('=SUM(1,2)');expect(s.getRow(2).getCell(c.get('Uncached')!).type).not.toBe(ExcelJS.ValueType.Formula);
});
it('includes extra columns appearing only on later rows and retains metadata-only rows with zero or false',async()=>{
 const batch=createBatch('late.xlsx',[source,{...source,Name:'LATER',additionalColumns:[{header:'Late_Only',cell:{kind:'value',value:'retained'}}]}]);const w=await read(await exportWorkbook(batch));const s=w.getWorksheet('Results')!,c=columns(s);expect(s.getRow(2).getCell(c.get('Late_Only')!).value).toBeNull();expect(s.getRow(3).getCell(c.get('Late_Only')!).value).toBe('retained');
 const rows=await importWorkbook(await input([...core,'Metadata'],[['','','','','',0],['','','','','',false]]),'metadata.xlsx');expect(rows).toHaveLength(2);
});
it('rejects ambiguous duplicate headers and data in an unnamed column',async()=>{
 await expect(importWorkbook(await input([...core,'Notes',' notes '],[['N','Somewhere','','','','A','B']]),'duplicate.xlsx')).rejects.toThrow('Duplicate column');
 await expect(importWorkbook(await input([...core,''],[['N','Somewhere','','','','unlabeled']]),'unnamed.xlsx')).rejects.toThrow('no header');
});
it('filters exact Group values, sorts naturally in both directions, leaves missing groups last and preserves source order',()=>{
 const records=['Batch 10','Batch 2','','all'].map((Group,i)=>processAddress({...source,Name:String(i),Group},reference,String(i)));const before=records.map(r=>r.id);
 expect(filterAndSortGroups(records,'all','asc').map(r=>r.source.Group)).toEqual(['all','Batch 2','Batch 10','']);expect(filterAndSortGroups(records,'all','desc').map(r=>r.source.Group)).toEqual(['Batch 10','Batch 2','all','']);expect(records.map(r=>r.id)).toEqual(before);
 expect(filterAndSortGroups(records,'value:all')).toHaveLength(1);expect(filterAndSortGroups(records,'blank')[0].source.Group).toBe('');expect(filterAndSortGroups(records,'value:Batch 2')[0].source.Group).toBe('Batch 2');expect(groupOptions(records).at(-1)?.key).toBe('blank');
 const legacy=processAddress(source,reference,'old');expect(filterAndSortGroups([legacy],'blank')).toHaveLength(1);
});
it('HTTP Excel export applies Group filtering and sorting while retaining additional columns',async()=>{
 const batch=createBatch('groups.xlsx',['Batch 10','Batch 2','Batch 2',''].map((Group,i)=>({...source,Name:`ROW ${i}`,Group,additionalColumns:[{header:'Reference',cell:{kind:'value' as const,value:`REF-${i}`}}]})));const params={params:Promise.resolve({id:batch.id})};
 const res=await exportApi(new Request('http://localhost/export?group=Batch%202&groupSort=desc'),params);expect(res.status).toBe(200);const w=await read(Buffer.from(await res.arrayBuffer()));const s=w.getWorksheet('Results')!,c=columns(s);expect(s.rowCount).toBe(3);expect(s.getRow(2).getCell(c.get('Group')!).text).toBe('Batch 2');expect(s.getRow(3).getCell(c.get('Reference')!).text).toBe('REF-2');
 const sorted=await exportApi(new Request('http://localhost/export?groupSort=asc'),params);const sw=await read(Buffer.from(await sorted.arrayBuffer()));expect(sw.getWorksheet('Results')!.getRow(2).getCell(6).text).toBe('Batch 2');
 const blank=await exportApi(new Request('http://localhost/export?groupMissing=1'),params);const bw=await read(Buffer.from(await blank.arrayBuffer()));expect(bw.getWorksheet('Results')!.rowCount).toBe(2);expect((await exportApi(new Request('http://localhost/export?groupSort=bad'),params)).status).toBe(400);
});
it('preserves custom numeric display formats and hyperlink targets in the source audit',async()=>{
 const rows=await importWorkbook(await input([...core,'Account_Code','Link'],[['N','Somewhere','','','',42,{text:'Reference document',hyperlink:'https://example.com/reference'}]],s=>{s.getCell('F2').numFmt='000000';}),'formatted.xlsx');
 expect(rows[0].additionalColumns![1].cell.originalHyperlink).toBe('https://example.com/reference');const w=await read(await exportWorkbook(createBatch('formatted.xlsx',rows)));const s=w.getWorksheet('Results')!,c=columns(s);expect(s.getRow(2).getCell(c.get('Account_Code')!).value).toBe(42);expect(s.getRow(2).getCell(c.get('Account_Code')!).numFmt).toBe('000000');expect(s.getRow(2).getCell(c.get('Link')!).text).toBe('Reference document');
});
