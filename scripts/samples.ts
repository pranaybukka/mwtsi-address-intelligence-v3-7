import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import {ensureSeed} from '../src/db/seed';
import {reference} from '../src/lib/reference/sqlite';
import {processAddress} from '../src/lib/process';
import {exportWorkbook} from '../src/lib/excel/export';
import {AddressInput,Batch} from '../src/lib/domain';
async function main(){const out=process.argv[2]||'samples';fs.mkdirSync(out,{recursive:true});ensureSeed();const rawInputs:AddressInput[]=[
{Name:'EXAMPLE US BENEFICIARY',Address1:'100 MAIN STREET',Address2:'SUITE 400',Address3:'BOSTON MA 02110'},
{Name:'EXAMPLE GERMAN BENEFICIARY',Address1:'FRIEDRICHSTRASSE 100',Address2:'3. OG',Address3:'BERLIN 10117 GERMANY'},
{Name:'EXAMPLE CANADIAN BENEFICIARY',Address1:'88 KING STREET W',Address2:'FLOOR 5',Address3:'TORONTO ON M5H 1J9 CANADA'},
{Name:'EXAMPLE JAPANESE BENEFICIARY',Address1:'2-6-1 MARUNOUCHI',Address2:'11F',Address3:'TOKYO 100-0005 JAPAN'},
{Name:'EXAMPLE BRAZILIAN BENEFICIARY',Address1:'716 AV ENG LUIZ CARLOS BERRINI',Address2:'CJ 1204',Address3:'SÃO PAULO SP 04571-010 BRASIL'},
{Name:'EXAMPLE HONG KONG BENEFICIARY',Address1:'18 QUEENS ROAD CENTRAL',Address2:'ROOM 2208',Address3:'CENTRAL HONG KONG'},
{Name:'EXAMPLE UNRESOLVED BENEFICIARY',Address1:'100 EXAMPLE LANE',Address2:'ATTN COMMERCIAL CLAIMS AD',Address3:''},
{Name:'EXAMPLE NAME ONLY',Address1:'',Address2:'',Address3:''},
{Name:'JOHN MICHAEL SMITH',Address1:'AND MARIA ELENA RIVERA / 100 EXAMPLE ROAD',Address2:'FLOOR 2',Address3:'BERLIN 10117 GERMANY'},
{Name:'JOHN MICHAEL SMITH AND MARIA ELENA RIVERA INTERNATIONAL FAMILY SETTLEMENT TRUST',Address1:'JOHN MICHAEL SMITH',Address2:'100 EXAMPLE ROAD',Address3:'BERLIN 10117 GERMANY'}];
const inputs:AddressInput[]=rawInputs.map((record,index)=>({...record,Group:index%2?'Treasury':'Operations',additionalColumns:[{header:'Reference_ID',cell:{kind:'value',value:`SAMPLE-${String(index+1).padStart(4,'0')}`}},{header:'Notes',cell:{kind:'value',value:'Source metadata; do not analyze'}}]}));
const w=new ExcelJS.Workbook();const s=w.addWorksheet('Addresses');s.columns=['Name','Address1','Address2','Address3','Bank_Country','Group','Reference_ID','Notes'].map(k=>({header:k,key:k,width:35}));inputs.forEach(i=>s.addRow({...i,...Object.fromEntries((i.additionalColumns||[]).map(c=>[c.header,c.cell.value]))}));await w.xlsx.writeFile(path.join(out,'sample-input.xlsx'));const batch:Batch={id:'sample',filename:'sample-input.xlsx',createdAt:new Date().toISOString(),records:inputs.map((r,i)=>processAddress(r,reference,`sample:${i}`))};fs.writeFileSync(path.join(out,'sample-output.xlsx'),await exportWorkbook(batch));fs.writeFileSync(path.join(out,'sample-output-source-hybrid.xlsx'),await exportWorkbook(batch,undefined,'source-hybrid'));console.log(`Samples written to ${out}`);}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
