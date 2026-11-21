import fs from 'node:fs';
import path from 'node:path';
import {loadWorkbook} from '../src/lib/excel/load';
import {ensureSeed} from '../src/db/seed';
import {reference} from '../src/lib/reference/sqlite';
import {importWorkbook} from '../src/lib/excel/import';
import {processAddress} from '../src/lib/process';
import {summarize} from '../src/lib/summary';
import {exportWorkbook} from '../src/lib/excel/export';
import {key,normalize} from '../src/lib/parser/normalize';
async function main(){const file=process.argv[2];if(!file)throw Error('Usage: npm run regression -- workbook.xlsx [report-directory]');const out=process.argv[3]||'work/regression';fs.mkdirSync(out,{recursive:true});ensureSeed();const buffer=fs.readFileSync(file);const rows=await importWorkbook(buffer,path.basename(file));const results=rows.map((r,i)=>processAddress(r,reference,`regression:${i+2}`));
 const w=await loadWorkbook(buffer);const expected=w.getWorksheet('Expected Interpretation');
 const differences:{row:number;field:string;expected:string;actual:string;classification:string}[]=[];
 const goldenFailures:typeof differences=[];
 if(expected){for(let j=2;j<=expected.rowCount;j++){const e=expected.getRow(j);const rawRow=Number(e.getCell(1).value);const r=results[rawRow-2];if(!r)throw Error(`Missing raw row ${rawRow}`);
 const fields=[['primary',4],['secondary',5],['town',6],['subdivision',7],['postal',8],['country',9]] as const;
 for(const [field,col]of fields){const value=String(e.getCell(col).value||'');let target=value;if(field==='country'&&value){const c=reference.countries().find(c=>c.code===value||key(c.name)===key(value));target=c?.code||reference.countryMatches([key(value)])[0]?.country||value;}
 const actual=r.intelligence.structured[field];if(key(target)!==key(actual)){
 let classification='UNEXPLAINED';
 if(field==='primary'||field==='secondary'){const expectedAddress=key([e.getCell(4).text,e.getCell(5).text].join(' '));const actualAddress=key([r.intelligence.structured.primary,r.intelligence.structured.secondary].join(' '));const withoutRouting=actualAddress.replace(/^(C O RECEIVING|ATTN ACCOUNTS) /,'');if(actualAddress===expectedAddress)classification='Same content across logical lines; Hybrid engine independently applies raw-length combination';else if(withoutRouting===expectedAddress)classification='Routing attention text preserved; supplied interpretation omits original routing content';}
 if(field==='country'&&!target&&r.intelligence.country.confidence<.92)classification='Conservative non-authoritative country candidate retained; review required';
 if(field==='town'&&!target&&!r.intelligence.town.value)classification='No town expected';
 const d={row:rawRow,field,expected:value,actual,classification};differences.push(d);if(classification==='UNEXPLAINED')goldenFailures.push(d);
 }}
 const expectedReview=String(e.getCell(12).value)==='Y';const actualReview=r.reviewState==='PENDING';if(expectedReview!==actualReview)differences.push({row:rawRow,field:'review',expected:String(expectedReview),actual:String(actualReview),classification:'Documented policy difference: supplied interpretation review flags versus pasted thresholds / NAME_ONLY / safety rules (OPEN_QUESTIONS #4)'});
 }}
 const invariantFailures=results.flatMap((r,i)=>{
 const failures:string[]=[];if(r.status==='ERROR')failures.push('Unexpected processing failure');if(r.hybrid.lines.length>4)failures.push('Line count');if(r.validation.length!=='PASS')failures.push('Length');if(r.validation.duplication!=='PASS')failures.push('Duplicate');if(r.status==='AUTO_TRANSLATED'&&(r.validation.pmpg!=='PASS'||!r.intelligence.country.evidence.length||!r.intelligence.town.evidence.length))failures.push('Unsafe auto');return failures.map(f=>({row:i+2,failure:f}));});
 const nonUS=expected?Array.from({length:expected.rowCount-1},(_,i)=>expected.getRow(i+2).getCell(2).text).filter(x=>x!=='US').length:results.filter(r=>r.intelligence.country.value&&r.intelligence.country.value!=='US').length;
 const report={referenceSnapshot:reference.snapshot?.(),generatedAt:new Date().toISOString(),source:path.basename(file),summary:summarize(results),nonUS,nonUSShare:nonUS/results.length,unexpectedFailures:[...invariantFailures,...goldenFailures],interpretationDifferences:differences,notes:['Interpretation worksheet is reference evidence, not audited final slash output.','Source-preserving differences in primary/secondary are reported rather than stripped to match examples.','Confidence is heuristic. Global completeness is not established by this workbook.']};
 fs.writeFileSync(path.join(out,'regression-report.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'regression-report.md'),`# Supplied workbook regression\n\n${results.length} rows processed; ${nonUS} non-US (${(100*nonUS/results.length).toFixed(1)}%).\n\n${Object.entries(report.summary).map(([k,v])=>`- ${k}: ${v}`).join('\n')}\n\nUnexpected failures: ${report.unexpectedFailures.length}\n\nInterpretation differences: ${differences.length}. See JSON for row/field/value and classification.\n`);
 fs.writeFileSync(path.join(out,'processed-workbook.xlsx'),await exportWorkbook({id:'regression',filename:path.basename(file),createdAt:new Date().toISOString(),records:results}));
 console.log(JSON.stringify({summary:report.summary,nonUS,unexpectedFailures:report.unexpectedFailures,interpretationDifferenceCount:differences.length},null,2));if(report.unexpectedFailures.length||nonUS/results.length<.4)process.exitCode=1;
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
