import {it,expect} from 'vitest';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import {Readable} from 'node:stream';
import {createRequire} from 'node:module';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
it('writes and reads streamed XLSX with styles, strings and additional columns',async()=>{
 const w=new ExcelJS.stream.xlsx.WorkbookWriter({useStyles:true,useSharedStrings:true});
 const s=w.addWorksheet('Source Data');s.addRow(['Name','Address1','Address2','Address3','Group','Key Field']).commit();
 s.addRow(['São Paulo Trust',"12 Manny's Road",'Suite 2','BERLIN 10117 GERMANY','Group 2','000012']).commit();s.commit();await w.commit();
 const buffer=(w as unknown as {stream:{read():Buffer}}).stream.read();expect(buffer.length).toBeGreaterThan(1000);
 const regular=new ExcelJS.Workbook();await regular.xlsx.load(buffer as never);expect(regular.worksheets[0].getCell('F2').value).toBe('000012');
 const reader=new ExcelJS.stream.xlsx.WorkbookReader(Readable.from([buffer]),{worksheets:'emit',sharedStrings:'cache',styles:'cache'});const values:unknown[]=[];
 for await(const sheet of reader)for await(const row of sheet)values.push(row.values);
 expect(values).toHaveLength(2);expect(values[1]).toEqual([undefined,'São Paulo Trust',"12 Manny's Road",'Suite 2','BERLIN 10117 GERMANY','Group 2','000012']);
});
it('preserves CSV quoting and Unicode through the updated CSV dependencies',async()=>{
 const w=new ExcelJS.Workbook();const s=w.addWorksheet('CSV');s.addRow(['Name','Address']);s.addRow(['São Paulo Trust','12 "Manny", Road']);
 const csv=await w.csv.writeBuffer();const read=new ExcelJS.Workbook();await read.csv.read(Readable.from([csv]));
 expect(read.worksheets[0].getCell('A2').value).toBe('São Paulo Trust');expect(read.worksheets[0].getCell('B2').value).toBe('12 "Manny", Road');
});
it('generates conditional-format UUIDs using the CommonJS-compatible patched UUID library',async()=>{
 const w=new ExcelJS.Workbook();const s=w.addWorksheet('Data');s.addRow([1]);s.addRow([2]);s.addConditionalFormatting({ref:'A1:A2',rules:[{type:'dataBar',priority:1,cfvo:[{type:'min'},{type:'max'}]}]});
 const bytes=await w.xlsx.writeBuffer();const zip=await JSZip.loadAsync(bytes);const xml=await zip.file('xl/worksheets/sheet1.xml')!.async('string');
 expect(xml).toMatch(/\{[A-F0-9]{8}-[A-F0-9]{4}-4[A-F0-9]{3}-[89AB][A-F0-9]{3}-[A-F0-9]{12}\}/);
 const read=new ExcelJS.Workbook();await read.xlsx.load(bytes);expect(read.worksheets[0].getCell('A2').value).toBe(2);
});
it('retains archive glob behavior after the archive dependency updates',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'mwtsi-archive-'));
 try{
  writeFileSync(path.join(dir,'test.txt'),'archive compatibility');const requireExcel=createRequire(import.meta.resolve('exceljs'));
  const zip=requireExcel('archiver')('zip');const chunks:Buffer[]=[];zip.on('data',(b:Buffer)=>chunks.push(b));
  const done=new Promise<void>((resolve,reject)=>{zip.on('end',resolve);zip.on('error',reject);});zip.glob('*.txt',{cwd:dir});await zip.finalize();await done;
  const result=await JSZip.loadAsync(Buffer.concat(chunks));expect(await result.file('test.txt')!.async('string')).toBe('archive compatibility');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
