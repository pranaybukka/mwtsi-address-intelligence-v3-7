import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import {ensureSeed} from '../src/db/seed';
import {reference} from '../src/lib/reference/sqlite';
import {processAddress} from '../src/lib/process';
import {importWorkbook,ImportOptions} from '../src/lib/excel/import';
import {exportWorkbook} from '../src/lib/excel/export';
import {Batch} from '../src/lib/domain';
async function main(){
 const out=process.argv[2]||'samples';fs.mkdirSync(out,{recursive:true});ensureSeed();
 const workbook=new ExcelJS.Workbook();const guide=workbook.addWorksheet('Dataset Guide');guide.addRows([
 ['MWTSI column-mapping sample','All customer names and street addresses are fictional.'],
 ['Worksheet','Select Customers; the guide is not source data.'],
 ['Name / Address1 / Address2 / Address3','Client Full Name / Street Text / Extra Address / Locality Text'],
 ['Bank_Country / Group / Record key','Bank ISO / Desk / External Key'],
 ['Other fields','Group Details, Amount and Name are preserved source metadata.'],
 ['Key behavior','Duplicate and blank External Key values are intentional; internal Record_ID stays unique.'],
 ['Expected output','Source + Hybrid retains exact original headers and types; Full analysis also contains mapped canonical fields and audit.']]);guide.columns=[{width:38},{width:105}];
 const sheet=workbook.addWorksheet('Customers');sheet.addRow(['External Key','Client Full Name','Street Text','Extra Address','Locality Text','Bank ISO','Desk','Group Details','Amount','Name']);
 const rows=[
 ['000001','AMELIA CEDARBRIDGE FAMILY SETTLEMENT TRUST','100 EXAMPLE ROAD','SUITE 4','BOSTON MA 02110','US','Operations','Domestic batch',19.5,'Preserve this unrelated source Name'],
 ['000002','MATTEO ELMHAVEN INTERNATIONAL BENEFICIARY SERVICES AND LONG TERM TRUST','55 FICTIONAL AVENUE','','BERLIN 10117 GERMANY','DE','Treasury','European batch',1200,'Pass-through metadata'],
 ['000003','SOFIA MEADOWLARK','SOFIA MEADOWLARK / 88 EXAMPLE STREET','FLOOR 2','TORONTO ON M5H 1J9 CANADA','CA','Operations','Name repeated in Address1',0,'Not an analyzed name'],
 ['000003','ELIAS SILVERBROOK','AND MARIA CEDARGLEN / 100 EXAMPLE ROAD','','BERLIN 10117 GERMANY','DE','Treasury','Duplicate key; explicit joint continuation',15,'Do not parse this column'],
 ['', 'NORA WILLOWCREST','','','','','Unassigned','Incomplete address and blank source key',7.25,'Source metadata only'],
 ['000006','LUCAS ASHFORD','716 EXAMPLE AVENUE','','SAO PAULO SP 04571-010 BRAZIL','BR','Operations','International batch',42,'Preserved original value']
 ];rows.forEach(r=>sheet.addRow(r));sheet.getColumn(9).numFmt='0.00';sheet.columns.forEach(c=>c.width=30);
 const filename='mapping-sample-input.xlsx',bytes=Buffer.from(await workbook.xlsx.writeBuffer());fs.writeFileSync(path.join(out,filename),bytes);
 const mapping:ImportOptions={worksheet:'Customers',fields:{Name:'Client Full Name',Address1:'Street Text',Address2:'Extra Address',Address3:'Locality Text',Bank_Country:'Bank ISO',Group:'Desk'},keyColumn:'External Key'};
 const inputs=await importWorkbook(bytes,filename,mapping);const batch:Batch={id:'mapping-sample',filename,createdAt:new Date().toISOString(),importMetadata:{worksheet:mapping.worksheet!,fields:mapping.fields!,keyColumn:mapping.keyColumn,headers:inputs[0].originalColumns!.map(c=>c.header)},records:inputs.map((input,i)=>processAddress(input,reference,`mapping-sample:${i+1}`))};
 fs.writeFileSync(path.join(out,'mapping-sample-output-full-analysis.xlsx'),await exportWorkbook(batch));
 fs.writeFileSync(path.join(out,'mapping-sample-output-source-hybrid.xlsx'),await exportWorkbook(batch,undefined,'source-hybrid'));
 fs.writeFileSync(path.join(out,'mapping-sample-options.json'),JSON.stringify(mapping,null,2));console.log(`Six synthetic mapped samples written to ${out}`);
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Sample generation failed');process.exitCode=1;});
