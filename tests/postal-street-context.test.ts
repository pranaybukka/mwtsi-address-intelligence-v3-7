import {beforeAll,beforeEach,it,expect} from 'vitest';
import {NextRequest} from 'next/server';import ExcelJS from 'exceljs';
import {ensureSeed} from '../src/db/seed';import {db} from '../src/db/connection';
import {saveProcessingSettings} from '../src/db/settings';import {getBatch} from '../src/db/batches';
import {queueBatch,claimJob,processJobChunk,getJob} from '../src/db/jobs';
import {reference} from '../src/lib/reference/sqlite';import {processAddress} from '../src/lib/process';
import {postalPatternMatches} from '../src/lib/enrichment/postal';
import {DEFAULT_POLICY,type AddressInput} from '../src/lib/domain';
import {POST as live} from '../src/app/api/translate/route';import {POST as upload} from '../src/app/api/batches/route';
import {exportWorkbook} from '../src/lib/excel/export';
const source:AddressInput={Name:'JOHNNY APPLESEED',Address1:'12345 SAMUEL LINCOLN DRIVE',Address2:'',Address3:'01588',Bank_Country:'US',Group:'Postal regression',recordKey:'POSTAL-001'};
beforeAll(()=>{ensureSeed();for(const [id,town,subdivision,postal,aliases] of [
 ['street:whitinsville','WHITINSVILLE','MA','01588',['WHITINSVILLE']],
 ['street:schenectady','SCHENECTADY','NY','12345',['SCHENECTADY']],
 // Reproduce the expanded gazetteer's alias match inside the street name.
 ['street:mandan','MANDAN','ND','58554',['MANDAN','LINCOLN']]
] as const){db().prepare('INSERT INTO places VALUES(?,?,?,?,?,?)').run(id,'US',town,town,subdivision,'TEST_REFERENCE');db().prepare('INSERT INTO postal_codes VALUES(?,?,?,?)').run('US',postal,id,subdivision);for(const alias of aliases)db().prepare('INSERT INTO place_aliases VALUES(?,?)').run(alias,id);}reference.invalidate();});
beforeEach(()=>saveProcessingSettings({postalLookupEnabled:true}));
it.each(['DRIVE','DR','DR.','COURT','CT','CRESCENT','TERRACE','TRAIL','PARKWAY','PLACE','CIRCLE','CLOSE'])('keeps five-digit building numbers and locality words in a %s street out of postal/town inference',suffix=>{
 const input={...source,Address1:`12345 SAMUEL LINCOLN ${suffix}`},r=processAddress(input,reference,'street');
 expect(r.intelligence.structured).toMatchObject({primary:input.Address1,postal:'01588',town:'WHITINSVILLE',country:'US'});expect(r.source).toEqual(input);expect(r.intelligence.town.source).toBe('POSTAL_TOWN_LOOKUP');expect(r.intelligence.town.evidence[0].detail).toContain('Postal 01588;');expect(r.hybrid.lines).toContain('3/US/WHITINSVILLE');expect(r.hybrid.lines).toContain('2/01588');expect(r.hybrid.selectionAudit?.status).toBe('PASS');
 expect(postalPatternMatches([input.Address1],'US',reference)).toMatchObject([{value:'12345',accepted:false}]);expect(r.intelligence.postal.evidence.some(e=>e.type==='Rejected house-number postal match'&&e.value==='12345')).toBe(true);
});
it.each([
 ['12345 SAMUEL LINCOLN DRIVE','01588',''],
 ['01588','12345 SAMUEL LINCOLN DRIVE',''],
 ['12345 SAMUEL LINCOLN DRIVE 01588','',''],
 ['12345 SAMUEL LINCOLN DRIVE','','01588-1234']
])('selects the supplied postal in any analyzed source line, retaining leading zeros and ZIP+4: %j',(a,b,c)=>{const r=processAddress({...source,Address1:a,Address2:b,Address3:c},reference,'layout');expect(r.intelligence.structured.postal).toBe(c||'01588');expect(r.intelligence.structured.town).toBe('WHITINSVILLE');expect(r.intelligence.structured.primary).toContain('12345 SAMUEL LINCOLN DRIVE');});
it('does not invent a postal code or town from a building number when no postal is supplied',()=>{const r=processAddress({...source,Address3:''},reference,'missing');expect(r.intelligence.structured).toMatchObject({primary:source.Address1,postal:'',town:''});expect(r.intelligence.town.source).toBe('UNRESOLVED');});
it('keeps the building number when it happens to equal the genuine supplied postal code',()=>{const r=processAddress({...source,Address3:'12345'},reference,'same');expect(r.intelligence.structured).toMatchObject({primary:source.Address1,postal:'12345',town:'SCHENECTADY'});});
it('keeps genuine postal-first locality lines eligible for gazetteer matching',()=>{const r=processAddress({...source,Address3:'01588 WHITINSVILLE MA'},reference,'postal-first');expect(r.intelligence.structured).toMatchObject({primary:source.Address1,postal:'01588',town:'WHITINSVILLE'});expect(r.intelligence.town.source).toBe('GAZETTEER_MATCH');expect(r.hybrid.lines).toContain('2/01588 MA');});
it('retains explicit town evidence and flags a disagreement instead of replacing it with postal lookup',()=>{const r=processAddress({...source,Address3:'BOSTON MA 01588'},reference,'conflict');expect(r.intelligence.structured.town).toBe('BOSTON');expect(r.validation.evidenceConflict).toBe(true);});
it('Off leaves town unresolved while preserving the real postal and complete street',()=>{const r=processAddress(source,reference,'off',{...DEFAULT_POLICY,postalLookupEnabled:false});expect(r.intelligence.structured).toMatchObject({primary:source.Address1,postal:'01588',town:''});expect(r.intelligence.town.source).toBe('UNRESOLVED');});
it('does not infer country from a locality alias embedded in the street',()=>{const r=processAddress({...source,Bank_Country:'',Address3:''},reference,'country');expect(r.intelligence.structured).toMatchObject({primary:source.Address1,postal:'',town:'',country:''});});
it.each([['DE','12345 BERLINSTRASSE','10117','BERLIN'],['AU','2000 EXAMPLE DRIVE','3000','MELBOURNE']])('applies the same street protection to %s postal patterns',(country,street,postal,town)=>{const r=processAddress({...source,Address1:street,Address3:postal,Bank_Country:country},reference,'international');expect(r.intelligence.structured).toMatchObject({primary:street,postal,town});expect(postalPatternMatches([street],country,reference)[0].accepted).toBe(false);});
it('Live translate uses the corrected shared engine and respects the current postal toggle',async()=>{for(const enabled of [true,false]){saveProcessingSettings({postalLookupEnabled:enabled});const response=await live(new Request('http://localhost/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:source.Name,address:source.Address1+'\n01588',country:'US'})}),undefined);expect(response.status).toBe(200);const {record}=await response.json();expect(record.intelligence.structured).toMatchObject({primary:source.Address1,postal:'01588',town:enabled?'WHITINSVILLE':''});expect(record.reviews).toEqual([]);}});
it('uploaded Excel bytes persist the corrected proposal and both export formats retain original source and correct Hybrid',async()=>{
 const w=new ExcelJS.Workbook(),s=w.addWorksheet('Source');s.addRow(['Name','Address1','Address2','Address3','Bank_Country','Group','Key Field']);s.addRow([source.Name,source.Address1,'','01588','US',source.Group,'POSTAL-001']);const form=new FormData();form.set('file',new File([await w.xlsx.writeBuffer() as ArrayBuffer],'Postal context.xlsx',{type:'application/octet-stream'}));const response=await upload(new NextRequest('http://localhost/api/batches',{method:'POST',body:form}));expect(response.status).toBe(200);const batch=await response.json(),saved=getBatch(batch.id)!;expect(saved.records[0].intelligence.structured).toMatchObject({primary:source.Address1,postal:'01588',town:'WHITINSVILLE'});
 for(const mode of ['full','source-hybrid'] as const){const out=new ExcelJS.Workbook();await out.xlsx.load(await exportWorkbook(saved,undefined,mode) as never);const sheet=out.getWorksheet('Results')!,headers=(sheet.getRow(1).values as string[]).slice(1),value=(header:string)=>sheet.getRow(2).getCell(headers.indexOf(header)+1).text;expect(value('Address1')).toBe(source.Address1);expect(value('Address3')).toBe('01588');expect(value('Hybrid_Line4')).toBe('3/US/WHITINSVILLE');}
});
it('recoverable batch worker uses the same fix and honors its captured postal setting',()=>{for(const enabled of [true,false]){saveProcessingSettings({postalLookupEnabled:enabled});const job=queueBatch('Worker postal context.xlsx',[source]);saveProcessingSettings({postalLookupEnabled:!enabled});expect(claimJob('postal-regression')?.id).toBe(job.id);expect(processJobChunk(job.id,'postal-regression')).toBe(true);expect(getJob(job.id)?.status).toBe('COMPLETED');const r=getBatch(job.id)!.records[0];expect(r.intelligence.structured).toMatchObject({primary:source.Address1,postal:'01588',town:enabled?'WHITINSVILLE':''});}});
