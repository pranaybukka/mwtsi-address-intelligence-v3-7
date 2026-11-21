import ExcelJS from 'exceljs';
import {loadWorkbook} from './load';
import {AddressInput,ImportMetadata} from '../domain';
import {MAIN_COLUMNS,suggestKeyColumn} from '../source';
export const ORP_COLUMNS=MAIN_COLUMNS.map(field=>'ORP_'+field);
const allFields=[...MAIN_COLUMNS,...ORP_COLUMNS,'Group'];
import {preserveCell} from './preserve';
import {checkWorkbookName,UploadError} from '../upload-errors';
import {UPLOAD_LIMIT} from '../upload-errors';
export {UPLOAD_LIMIT} from '../upload-errors';
export const ROW_LIMIT=50000;
const expected=['Name','Address1','Address2','Address3'];
function text(cell:ExcelJS.Cell):string {const v=cell.value;if(v===null||v===undefined)return '';if(typeof v==='object'){if('formula'in v||'sharedFormula'in v)throw Error(`Formula cells are unsupported (${cell.address}); paste values first`);if('richText'in v)return v.richText.map(x=>x.text).join('');throw Error(`Unsupported cell type at ${cell.address}; use text values`);}if(typeof v==='boolean')throw Error(`Boolean cell ${cell.address} is not address text`);const s=String(v);if(s.length>10000)throw Error(`Cell ${cell.address} exceeds 10,000 characters`);return s;}
export async function readUploadWorkbook(buffer:Buffer,filename:string){
 checkWorkbookName(filename);
 let stage='ARCHIVE_VALIDATION';
 try{
 if(buffer.length>UPLOAD_LIMIT)throw Error('Workbook exceeds 20 MB');
 if(buffer[0]!==0x50||buffer[1]!==0x4b)throw Error('Invalid Excel workbook signature');
 // Inspect ZIP central-directory advertised expansion before ExcelJS decompresses.
 let expanded=0,entries=0;for(let i=0;i<buffer.length-46;i++){if(buffer.readUInt32LE(i)===0x02014b50){entries++;expanded+=buffer.readUInt32LE(i+24);const n=buffer.readUInt16LE(i+28);const name=buffer.subarray(i+46,i+46+n).toString();if(/vbaProject|externalLinks\//i.test(name))throw Error('Macros and external links are unsupported');i+=45+n+buffer.readUInt16LE(i+30)+buffer.readUInt16LE(i+32);}}
 if(!entries||expanded>150*1024*1024||entries>10000)throw Error('Workbook archive expansion exceeds safe limits');
 stage='EXCEL_PARSE';
 const workbook=await loadWorkbook(buffer);
 return workbook;
 }catch(error){if(error instanceof UploadError)throw error;throw new UploadError(stage==='EXCEL_PARSE'?'EXCEL_PARSE_FAILED':'INVALID_EXCEL_FILE',stage,stage==='EXCEL_PARSE'?'Excel workbook could not be parsed. Re-save it as .xlsx in Excel and try again.':error instanceof Error?error.message:'Invalid workbook',400,{cause:error});}
}
export interface ImportOptions {profile?:"BNP_ONLY"|"BNP_ORP";worksheet?:string;fields?:Record<string,string|null>;keyColumn?:string|null;}
export async function inspectWorkbook(buffer:Buffer,filename:string){const w=await readUploadWorkbook(buffer,filename);if(!w.worksheets.length)throw new UploadError('INVALID_EXCEL_FILE','WORKSHEET_VALIDATION','Workbook has no worksheet');return w.worksheets.map(sheet=>{const headers:string[]=[];sheet.getRow(1).eachCell((c,i)=>{headers[i-1]=text(c);});const named=Array.from({length:sheet.columnCount},(_,i)=>headers[i]||'');return {name:sheet.name,headers:named,rows:Math.max(0,sheet.rowCount-1),preview:[2,3,4].filter(n=>n<=sheet.rowCount).map(n=>named.map((_,i)=>sheet.getRow(n).getCell(i+1).text))};});}
export async function importWorkbook(buffer:Buffer,filename:string,options?:ImportOptions):Promise<AddressInput[]>{
 let stage='WORKSHEET_VALIDATION';try{const workbook=await readUploadWorkbook(buffer,filename);
 const sheet=options?.worksheet?workbook.getWorksheet(options.worksheet):workbook.getWorksheet('Raw Test Data')||workbook.worksheets[0];if(!sheet)throw Error('Workbook has no worksheet');
 if(sheet.rowCount>ROW_LIMIT+1)throw Error(`Maximum ${ROW_LIMIT.toLocaleString()} rows per batch`);
 const originalHeaders:{header:string;column:number}[]=[];
 const headers=new Map<string,number>();const extraHeaders:{header:string;column:number}[]=[];const seen=new Set<string>();
 const canonical=new Map(allFields.map(header=>[header.toLowerCase(),header]));for(const field of MAIN_COLUMNS)canonical.set('bnp_'+field.toLowerCase(),field);
 sheet.getRow(1).eachCell((cell,column)=>{const original=text(cell);const trimmed=original.trim();if(!trimmed)return;const signature=trimmed.toLowerCase();if(seen.has(signature))throw Error(`Duplicate column: ${trimmed}`);seen.add(signature);originalHeaders.push({header:original,column});const main=canonical.get(signature);if(main){if(headers.has(main)&&!options?.fields)throw Error(`Ambiguous mapping for ${main}; use column mapping to choose one source column`);headers.set(main,column);}else extraHeaders.push({header:original,column});});
 if(options?.fields){
 const allowed=allFields;for(const field of Object.keys(options.fields))if(!allowed.includes(field as never))throw Error('Unsupported mapped field');
 const selected=Object.values(options.fields).filter((v):v is string=>typeof v==='string'&&!!v);if(new Set(selected).size!==selected.length)throw Error('Each source column can map to only one analyzed field');
 for(const field of ['Name','Address1'])if(!options.fields[field])throw Error(`Missing required column: map ${field}`);
 headers.clear();for(const field of allowed){const source=options.fields[field];if(source!==null&&source!==undefined&&typeof source!=='string')throw Error('Invalid column mapping');if(source){const match=originalHeaders.find(h=>h.header===source);if(!match)throw Error(`Mapped column not found: ${source}`);headers.set(field,match.column);}}
 if(options.keyColumn&&!originalHeaders.some(h=>h.header===options.keyColumn))throw Error('Key column not found');
 extraHeaders.splice(0,extraHeaders.length,...originalHeaders.filter(h=>![...headers.values()].includes(h.column)));
 }else for(const name of expected)if(!headers.has(name))throw Error(`Missing required column: ${name}`);
 if(options?.profile&&!['BNP_ONLY','BNP_ORP'].includes(options.profile))throw Error('Invalid address profile');
 const dual=options?.profile==='BNP_ORP'||options?.profile!=='BNP_ONLY'&&ORP_COLUMNS.some(field=>headers.has(field));
 if(dual)for(const name of ['ORP_Name','ORP_Address1'])if(!headers.has(name))throw Error(`Missing required column: map ${name}`);
 if(!dual)for(const field of ORP_COLUMNS)headers.delete(field);
 extraHeaders.splice(0,extraHeaders.length,...originalHeaders.filter(h=>![...headers.values()].includes(h.column)));


 stage='ROW_VALIDATION';
 const knownColumns=new Set(originalHeaders.map(h=>h.column));
 const result:AddressInput[]=[];
 for(let i=2;i<=sheet.rowCount;i++){const row=sheet.getRow(i);const field=(name:string)=>headers.has(name)?text(row.getCell(headers.get(name)!)):'';
 row.eachCell((cell,column)=>{if(!knownColumns.has(column)&&cell.value!==null&&cell.value!==undefined)throw Error(`Column ${column} has data but no header; add a header before upload`);});
 const source:AddressInput={Name:field('Name'),Address1:field('Address1'),Address2:field('Address2'),Address3:field('Address3'),Bank_Country:field('Bank_Country'),Group:field('Group'),additionalColumns:extraHeaders.map(h=>({header:h.header,cell:preserveCell(row.getCell(h.column))}))};
 if(dual){source.orp={Name:field('ORP_Name'),Address1:field('ORP_Address1'),Address2:field('ORP_Address2'),Address3:field('ORP_Address3'),Bank_Country:field('ORP_Bank_Country')};}
 if(options?.fields||dual){source.originalColumns=originalHeaders.map(h=>({header:h.header,cell:preserveCell(row.getCell(h.column))}));source.sourceRowNumber=i;const keyColumn=options?.keyColumn||(dual?suggestKeyColumn(originalHeaders.map(h=>h.header)):null);source.recordKey=keyColumn?String(row.getCell(originalHeaders.find(h=>h.header===keyColumn)!.column).text):'';}
 const hasMain=[...MAIN_COLUMNS,'Group'].some(k=>Boolean(source[k as keyof AddressInput]));
 const hasExtra=source.additionalColumns!.some(({cell})=>cell.value!==null&&cell.value!==''||cell.originalFormula);
 if(hasMain||hasExtra||source.orp&&Object.values(source.orp).some(Boolean))result.push(source);
 }
 if(!result.length)throw Error('No address records found');return result;
 }catch(error){
  if(error instanceof UploadError)throw error;
  const message=error instanceof Error?error.message:'Invalid Excel workbook';
  const missing=stage==='WORKSHEET_VALIDATION'&&message.startsWith('Missing required column:');
  const code=missing?'REQUIRED_COLUMNS_MISSING':stage==='EXCEL_PARSE'?'EXCEL_PARSE_FAILED':'INVALID_EXCEL_FILE';
  throw new UploadError(code,stage,stage==='EXCEL_PARSE'?'Excel workbook could not be parsed. Re-save it as .xlsx in Excel and try again.':message,400,{cause:error});
 }
}

