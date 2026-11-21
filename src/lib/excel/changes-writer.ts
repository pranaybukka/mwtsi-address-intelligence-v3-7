import ExcelJS from 'exceljs';
import fs from 'node:fs';
import {PassThrough} from 'node:stream';
import {setImmediate} from 'node:timers/promises';
import type {Batch,RecordResult} from '../domain';
import {approvedChanges,sourceRecordKey,FIELD_LABELS} from '../batch-workflows';
import {latestDecision} from '../review-decision';
function chunks(value:string){const result:string[]=[];let part='';for(const char of value){if(part.length+char.length>30000){result.push(part);part='';}part+=char;}result.push(part);return result;}
/** Field deltas, not a guessed mapping back into Address1–3. Strings remain inert Excel strings. */
export async function writeChangesWorkbook(batch:Omit<Batch,'records'>,records:()=>Iterable<RecordResult>,selection:string,file?:string,progress?:(count:number)=>void){
 const stream=file?fs.createWriteStream(file,{flags:'wx',mode:0o600}):new PassThrough(),buffers:Buffer[]=[];if(!file)stream.on('data',(chunk:Buffer)=>buffers.push(Buffer.from(chunk)));let failure:Error|undefined;stream.on('error',(error:Error)=>{failure=error;});
 const book=new ExcelJS.stream.xlsx.WorkbookWriter({stream,useStyles:true,useSharedStrings:false});book.creator='MWTSI Address Intelligence';const sheet=book.addWorksheet('Changes',{views:[{state:'frozen',ySplit:1}]});
 const headers=['Record_ID','Key','Group','Block','Field','Before_Value','Approved_Value','Part','Parts','Record_Version','Decision_User','Decision_At','Decision_Action','Basis'];sheet.columns=headers.map(header=>({header,key:header,width:header.includes('Value')?50:24}));sheet.autoFilter={from:'A1',to:{row:1,column:headers.length}};sheet.getRow(1).font={bold:true};sheet.getRow(1).commit();let count=0,fields=0,rows=0;
 try{for(const record of records()){const changes=approvedChanges(record);if(!changes.length)continue;const key=sourceRecordKey(record)||'',group=record.source.Group||'';if(key.length>32767||group.length>32767)throw Error('Source value exceeds Excel identity cell limit; use Full analysis.');const decision=latestDecision(record)!;
  for(const change of changes){const before=chunks(change.before),after=chunks(change.after),parts=Math.max(before.length,after.length);fields++;
   for(let part=0;part<parts;part++){if(++rows>=1048576)throw Error('Export exceeds the Excel row limit; narrow the selection.');sheet.addRow({Record_ID:record.id,Key:key,Group:group,Block:change.block,Field:FIELD_LABELS[change.field],Before_Value:before[part]||'',Approved_Value:after[part]||'',Part:part+1,Parts:parts,Record_Version:record.version,Decision_User:decision.actorUsername||decision.reviewer,Decision_At:decision.at,Decision_Action:decision.action,Basis:'First audited structured proposal → current passed proposal'}).commit();}
  }
  count++;if(count%100===0){progress?.(count);await setImmediate();if(failure)throw failure;}
 }
 sheet.commit();const summary=book.addWorksheet('Summary');for(const row of [['Batch',batch.filename],['Selection',selection],['Distinct records',count],['Changed fields',fields],['Change rows including chunks',rows],['Basis','Before values are the first audited structured proposal, not raw Name/Address1–3. Only explicit positive decisions with net field changes are included.'],['Long values','Reassemble Before_Value and Approved_Value by Record_ID + Block + Field, ordered by Part. Empty parts are intentional.'],['Export tracking','Only distinct records included in Changes are added to the existing any-format export ledger. Repeated exports do not duplicate coverage.']])summary.addRow(row).commit();summary.commit();await book.commit();if(failure)throw failure;progress?.(count);return file?undefined:Buffer.concat(buffers);
 }catch(error){stream.destroy();throw error;}
}
