import ExcelJS from 'exceljs';
import JSZip from 'jszip';
/** ExcelJS 4.4 expects unprefixed SpreadsheetML elements. Normalize only prefixes
 * explicitly bound to the standard SpreadsheetML namespace; source values unchanged.
 * Call only after archive expansion validation in importWorkbook for untrusted files.
 */
export async function loadWorkbook(buffer:Buffer){const zip=await JSZip.loadAsync(buffer);let changed=false;
 for(const [name,entry]of Object.entries(zip.files)){if((!name.endsWith('.xml')&&!name.endsWith('.rels'))||entry.dir)continue;let xml=await entry.async('string');const prefixes=[...xml.matchAll(/xmlns:([\w]+)=["']http:\/\/schemas.openxmlformats.org\/spreadsheetml\/2006\/main["']/g)].map(m=>m[1]);
 if(name.startsWith('xl/worksheets/_rels/')){const next=xml.replace(/Target="\/xl\/tables\//g,'Target="../tables/');if(next!==xml){xml=next;changed=true;zip.file(name,xml);}}
 for(const prefix of prefixes){xml=xml.replace(new RegExp(`(<\\/?)${prefix}:`,'g'),'$1');changed=true;}if(prefixes.length)zip.file(name,xml);}
 const w=new ExcelJS.Workbook();await w.xlsx.load((changed?await zip.generateAsync({type:'nodebuffer'}):buffer) as never);return w;}
