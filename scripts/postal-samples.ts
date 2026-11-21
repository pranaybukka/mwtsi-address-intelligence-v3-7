import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';
import {ensureSeed} from '../src/db/seed';
import {db} from '../src/db/connection';
import {processAddress} from '../src/lib/process';
import {reference} from '../src/lib/reference/sqlite';
import {exportWorkbook} from '../src/lib/excel/export';
async function main(){const out=process.argv[2]||'work/postal-samples';fs.mkdirSync(out,{recursive:true});ensureSeed();
 const examples=[['US','10001','New York'],['US','90012','Los Angeles'],['US','02110','Boston'],['US','10001-1234','Base ZIP fallback'],['AU','3000','Melbourne'],['GB','SW1A 1AA','London'],['CA','M5V 3L9','Toronto'],['JP','100-0005','Tokyo'],['FR','75008','Paris'],['DE','20095','Hamburg'],['US','99999','Not in local reference'],['','10001','Country required']];
 const rows=examples.map(([country,postal,scenario],i)=>({Name:`EXAMPLE POSTAL CUSTOMER ${i+1}`,Address1:'100 EXAMPLE ROAD',Address2:'',Address3:postal,Bank_Country:country,Group:'Postal lookup',additionalColumns:[{header:'Key Field',cell:{kind:'value' as const,value:`POSTAL-${String(i+1).padStart(3,'0')}`}},{header:'Scenario',cell:{kind:'value' as const,value:scenario}}]}));
 const w=new ExcelJS.Workbook();const s=w.addWorksheet('Source Data');s.columns=['Name','Address1','Address2','Address3','Bank_Country','Group','Key Field','Scenario'].map(header=>({header,key:header,width:28}));for(const row of rows)s.addRow({...row,'Key Field':row.additionalColumns[0].cell.value,Scenario:row.additionalColumns[1].cell.value});await w.xlsx.writeFile(path.join(out,'postal-town-lookup-sample.xlsx'));
 const records=rows.map((r,i)=>processAddress(r,reference,`postal:${i}`));fs.writeFileSync(path.join(out,'postal-town-lookup-results.xlsx'),await exportWorkbook({id:'postal-lookup-examples',filename:'postal-town-lookup-sample.xlsx',createdAt:new Date().toISOString(),records}));
 const coverage=db().prepare('SELECT z.country,z.postal,p.name AS town,p.subdivision,p.source FROM postal_codes z JOIN places p ON p.id=z.place_id ORDER BY z.country,z.postal,p.name').all() as {country:string;postal:string;town:string;subdivision:string;source:string}[];
 const escape=(v:string)=>'"'+v.replaceAll('"','""')+'"';fs.writeFileSync(path.join(out,'postal-reference-coverage.csv'),['Country,Postal,Town,Subdivision,Source',...coverage.map(r=>[r.country,r.postal,r.town,r.subdivision,r.source].map(escape).join(','))].join('\n'));
 const report={postalRelationships:coverage.length,distinctPostalCodes:new Set(coverage.map(r=>`${r.country}|${r.postal}`)).size,countries:new Set(coverage.map(r=>r.country)).size,towns:new Set(coverage.map(r=>`${r.country}|${r.town}|${r.subdivision}`)).size,examples:records.map(r=>({postal:r.source.Address3,country:r.source.Bank_Country,town:r.intelligence.structured.town,source:r.intelligence.town.source,status:r.status}))};fs.writeFileSync(path.join(out,'postal-lookup-coverage.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
