import ExcelJS from 'exceljs';
import {PreservedCell} from '../domain';
/** Extra columns are never address evidence or executable workbook logic. */
export function preserveCell(cell:ExcelJS.Cell):PreservedCell {
 const v=cell.value;const base=cell.numFmt?{numberFormat:cell.numFmt}:{};
 if(v===null||v===undefined)return {...base,kind:'value',value:null};
 if(v instanceof Date)return {...base,kind:'date',value:v.toISOString()};
 if(typeof v==='string'||typeof v==='number'||typeof v==='boolean')return {...base,kind:'value',value:v};
 if('richText' in v)return {...base,kind:'value',value:v.richText.map(t=>t.text).join('')};
 if('formula' in v||'sharedFormula' in v){const formula=cell.formula||('formula'in v?v.formula:String(v.sharedFormula));const result=v.result;
  return {...base,kind:'formula',originalFormula:formula,value:result instanceof Date?result.toISOString():result&&typeof result==='object'&&'error'in result?result.error:typeof result==='string'||typeof result==='number'||typeof result==='boolean'?result:`=${formula}`};
 }
 if('hyperlink'in v)return {...base,kind:'value',value:v.text,originalHyperlink:v.hyperlink};
 if('error'in v)return {...base,kind:'error',value:v.error};
 throw Error(`Unsupported additional-column cell type at ${cell.address}`);
}
export function preservedValue(cell:PreservedCell):ExcelJS.CellValue {return cell.kind==='date'&&typeof cell.value==='string'?new Date(cell.value):cell.value;}
