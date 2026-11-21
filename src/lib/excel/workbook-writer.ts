import ExcelJS from 'exceljs';
import fs from 'node:fs';
import {PassThrough} from 'node:stream';
import {setImmediate} from 'node:timers/promises';
import type {Batch,RecordResult} from '../domain';
import type {ExportMode} from '../export-options';
import {HYBRID_OUTPUT_COLUMNS} from '../export-options';
import {addressBlocks} from '../address-blocks';
import {MAIN_COLUMNS} from '../source';
import {preservedValue} from './preserve';
import {summarize} from '../summary';
import {exportRow,sourceOutputRow,hybridOutputRow} from './export';
export async function writeWorkbook(batch:Omit<Batch,'records'>,records:()=>Iterable<RecordResult>,selection:string,mode:ExportMode,file?:string,progress?:(rows:number)=>void){
 if(mode==='changes'){const {writeChangesWorkbook}=await import('./changes-writer');return writeChangesWorkbook(batch,records,selection,file,progress);}
 let mapped=false,dual=false,first:RecordResult|undefined,scanned=0;const extraHeaders=new Set<string>();
 for(const r of records()){first??=r;if(r.orp){dual=true;first=r;}mapped||=!!r.source.originalColumns;for(const c of r.source.originalColumns||r.source.additionalColumns||[])extraHeaders.add(c.header);if(++scanned%500===0){progress?.(0);await setImmediate();}}
 if(!first)throw Error('No records match the export selection');
 const stream=file?fs.createWriteStream(file,{flags:'wx',mode:0o600}):new PassThrough(),chunks:Buffer[]=[];
 if(!file)stream.on('data',(chunk:Buffer)=>chunks.push(Buffer.from(chunk)));
 // Observe stream errors immediately, including while scanning/writing worksheets.
 let streamFailure:Error|undefined;stream.on('error',(error:Error)=>{streamFailure=error;});
 const w=new ExcelJS.stream.xlsx.WorkbookWriter({stream,useStyles:true,useSharedStrings:false});w.creator='MWTSI Address Intelligence';w.created=new Date();
 try{
 const sheet=w.addWorksheet('Results',{views:[{state:'frozen',ySplit:1,xSplit:1}]}),extras=[...extraHeaders],sourceHeaders=mapped?[]:[...MAIN_COLUMNS,'Group',...(dual?MAIN_COLUMNS.map(k=>'ORP_'+k):[])];
 const firstData=mode==='full'?exportRow(first,dual):{...sourceOutputRow(first),...hybridOutputRow(first,dual)};
 const computedKeys=mode==='source-hybrid'?Object.keys(hybridOutputRow(first,dual)):Object.keys(firstData).filter(k=>!sourceHeaders.includes(k));
 const used=new Set([...sourceHeaders,...extras].map(h=>h.trim().toLowerCase())),mappings:{field:string;header:string}[]=[];
 const computed=computedKeys.map(key=>{let header=key;while(used.has(header.trim().toLowerCase()))header='Remediation.'+header;used.add(header.trim().toLowerCase());if(header!==key)mappings.push({field:key,header});return {key,header};});
 sheet.columns=[...sourceHeaders.map(key=>({header:key,key})),...extras.map((header,i)=>({header,key:`__extra_${i}`})),...computed].map(c=>({...c,width:/Address|Audit|Evidence|Notes|Issues/.test(c.header)?42:24}));
 if(sheet.columns.length>16384)throw Error('Export exceeds the Excel column limit; reduce source columns or split the workbook');
 sheet.autoFilter={from:'A1',to:{row:1,column:sheet.columns.length}};
 const decorate=(s:ExcelJS.Worksheet)=>{s.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};s.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF173D3A'}};s.getRow(1).height=25;};
 decorate(sheet);for(const mapping of mappings)sheet.getRow(1).getCell(sheet.columns.findIndex(c=>c.header===mapping.header)+1).note=`Transformed field ${mapping.field}; original source header is preserved separately.`;sheet.getRow(1).commit();
 const totals=summarize([]);let count=0;
 for(const record of records()){
  const cells=new Map((record.source.originalColumns||record.source.additionalColumns||[]).map(c=>[c.header,c.cell]));
  const data=mode==='full'?exportRow(record,dual):{...sourceOutputRow(record),...hybridOutputRow(record,dual)};
  const row=sheet.addRow({...data,...Object.fromEntries(extras.map((header,i)=>{const c=cells.get(header);return [`__extra_${i}`,c?preservedValue(c):null];}))});
  extras.forEach((h,i)=>{const cell=cells.get(h);if(cell?.numberFormat)row.getCell(`__extra_${i}`).numFmt=cell.numberFormat;});
  row.eachCell(cell=>{if(typeof cell.value==='string'){if(mode==='full'&&cell.value.length>32000)cell.value=cell.value.slice(0,31900)+' [Full value in Audit chunks]';else if(mode==='source-hybrid'&&cell.value.length>32767)throw Error('Source value exceeds Excel cell capacity; use Full analysis for lossless audit chunks');}});row.commit();
  if(mode==='full'){const one=summarize([record]);for(const key of Object.keys(totals) as (keyof typeof totals)[])totals[key]+=one[key];}
  if(++count%200===0){progress?.(count);if(streamFailure)throw streamFailure;await setImmediate();}
 }
 sheet.commit();progress?.(count);
 if(mode==='full'){
  const summary=w.addWorksheet('Summary');const addRows=(rows:unknown[][])=>{for(const row of rows)summary.addRow(row);};addRows([['Metric','Value'],['Batch',batch.id],['Source file',batch.filename],['Export selection',selection],['Export format','Full analysis'],['Postal lookup enabled',batch.processingSettings?.postalLookupEnabled??true],['Import column mapping',JSON.stringify(batch.importMetadata||'Standard headers').slice(0,31000)],['Profile','Internal slash hybrid v1.0; not ISO20022 message certification'],['Confidence','Heuristic evidence score, not calibrated probability'],['Priority policy','Mandatory Name and Country/Town reservation, then 2a > 2z > 2c > 2b > 2d; at most two address records'],['Acceptance','Reviewer acceptance does not change validation findings, processing status, or evidence confidence'],...Object.entries(totals)]);
  addRows([[],['Source columns','Group and all additional columns are preserved; only the mapped Name, Address1, Address2, Address3 and Bank_Country in each enabled BNP/ORP block are analyzed'],['Formula handling','Additional-column formulas use cached values, or inert formula text if uncached; original formula text remains in the source audit'],...mappings.map(m=>[`Computed field ${m.field}`,`Exported as ${m.header} to preserve an original input column of the same name`])]);decorate(summary);summary.commit();
  const audit=w.addWorksheet('Audit');audit.columns=[{header:'Record_ID',key:'id',width:40},{header:'Type',key:'type',width:22},{header:'Chunk',key:'chunk',width:10},{header:'JSON_Value',key:'value',width:100}];decorate(audit);audit.getRow(1).commit();let auditRows=1;
  const add=(id:string,type:string,value:unknown)=>{const json=JSON.stringify(value);for(let pos=0;pos<json.length;pos+=30000){if(++auditRows>1048576)throw Error('Audit exceeds the Excel row limit; split the export selection');audit.addRow({id,type,chunk:pos/30000+1,value:json.slice(pos,pos+30000)}).commit();}};
  add(batch.id,'processing_settings',batch.processingSettings||{postalLookupEnabled:true});if(batch.importMetadata)add(batch.id,'import_mapping',batch.importMetadata);
  let processed=0;for(const r of records()){for(const [type,value] of Object.entries({source:r.source,evidence:r.intelligence,candidates:r.hybrid.candidates,dropped:r.hybrid.dropped,truncation:r.hybrid.truncations,reviews:r.reviews}))add(r.id,type,value);if(r.orp)for(const {key,result} of addressBlocks(r))add(r.id,key+'_analysis',result);if(++processed%200===0){progress?.(count);if(streamFailure)throw streamFailure;await setImmediate();}}audit.commit();
 }
 await w.commit();if(streamFailure)throw streamFailure;return file?undefined:Buffer.concat(chunks);
 }catch(error){stream.destroy();throw error;}
}
