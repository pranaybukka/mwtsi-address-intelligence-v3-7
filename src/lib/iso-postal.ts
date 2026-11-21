import type {RecordResult} from './domain';
import {hasStreet} from './parser/locality';
import {isIsoCountryCode} from './reference/iso-country';

/** PostalAddress24 element order/lengths. AdrTp is optional and is not inferred. */
export const ISO_POSTAL_FIELDS = [
 {key:'Dept',label:'Department',max:70}, {key:'SubDept',label:'Sub-department',max:70},
 {key:'StrtNm',label:'Street name',max:70}, {key:'BldgNb',label:'Building number',max:16},
 {key:'BldgNm',label:'Building name',max:35}, {key:'Flr',label:'Floor',max:70},
 {key:'PstBx',label:'Post box',max:16}, {key:'Room',label:'Room / suite / unit',max:70},
 {key:'PstCd',label:'Postal code',max:16}, {key:'TwnNm',label:'Town / city',max:35},
 {key:'TwnLctnNm',label:'Town location',max:35}, {key:'DstrctNm',label:'District',max:35},
 {key:'CtrySubDvsn',label:'State / province',max:35}, {key:'Ctry',label:'Country (ISO-2)',max:2},
] as const;
export type IsoPostalKey=typeof ISO_POSTAL_FIELDS[number]['key'];
export type IsoPostalElements=Record<IsoPostalKey,string>;
export interface IsoPostalProposal {elements:IsoPostalElements;hybridAddress:string;unmapped:string[];}
export interface IsoPostalIssue {field:string;message:string;omitted?:string;}
export interface IsoPostalOutput {xml:string;issues:IsoPostalIssue[];}
const flat=(text:string)=>text.replace(/\s+/gu,' ').trim();
const placeholder=(text:string)=>/^(?:NOT\s*PROVIDED|UNRESOLVED|UNKNOWN|NULL|N\/A)$/iu.test(text.trim());
const escaped=(text:string)=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const whole=(text:string,value:string)=>!!value&&new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped(value)}(?=$|[^\\p{L}\\p{N}])`,'iu').test(text);
export const escapeXml=(text:string)=>text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');

/** Conservative proposals, never a global street-address parser. Unknown text stays visible. */
export function proposeIsoPostal(record:RecordResult):IsoPostalProposal {
 const a=record.intelligence.structured;
 const elements=Object.fromEntries(ISO_POSTAL_FIELDS.map(f=>[f.key,''])) as IsoPostalElements;
 Object.assign(elements,{PstCd:a.postal,TwnNm:a.town,CtrySubDvsn:a.subdivision,Ctry:a.country});
 const unmapped:string[]=[];
 const assign=(key:IsoPostalKey,value:string)=>{if(elements[key])return false;elements[key]=value;return true;};
 const parts=[a.primary,a.secondary].filter(Boolean).flatMap(text=>text.split(/[,;]\s*|\s+(?=(?:(?:SUB[- ]?)?DEPT|DEPARTMENT|SUITE|APT|APARTMENT|UNIT|ROOM|BUILDING|BLDG|\d+(?:ST|ND|RD|TH)?\s+FLOOR)\b|(?:FLOOR|FLR)\s+(?:\d+|GROUND|BASEMENT)\b)/iu)).map(flat).filter(Boolean);
 for(const part of parts){
  let match:RegExpMatchArray|null;
  if((match=part.match(/^(?:P\.?\s*O\.?\s+BOX|POST\s+OFFICE\s+BOX)\s+([\p{L}\p{N}/-]+)$/iu))&&assign('PstBx',match[1]))continue;
  if((match=part.match(/^(?:SUB[- ]?DEPT|SUB[- ]?DEPARTMENT)\s+(.+)$/iu))&&assign('SubDept',match[1]))continue;
  if((match=part.match(/^(?:DEPT|DEPARTMENT)\s+(.+)$/iu))&&assign('Dept',match[1]))continue;
  if(/^(?:SUITE|APT|APARTMENT|UNIT|ROOM)\s+.+$/iu.test(part)&&assign('Room',part))continue;
  if((match=part.match(/^(?:FLOOR|FLR)\s+([\p{L}\p{N}-]+)$/iu))&&assign('Flr',match[1]))continue;
  if((match=part.match(/^(\d+(?:ST|ND|RD|TH)?)\s+FLOOR$/iu))&&assign('Flr',match[1]))continue;
  if((match=part.match(/^(?:BUILDING|BLDG)\s+(.+)$/iu))&&/\p{L}/u.test(match[1])&&assign('BldgNm',match[1]))continue;
  if(!elements.StrtNm&&hasStreet(part)&&!/\b(?:PO BOX|P\.?O\.? BOX)\b/iu.test(part)){
   // A recognisable street is needed before a leading number can be a building number.
   match=part.match(/^(\d+[\p{L}]?(?:[-/]\d+[\p{L}]?)?)\s+(.+)$/u);
   if(match&&hasStreet(match[2])){elements.BldgNb=match[1];elements.StrtNm=match[2];continue;}
   // Only propose trailing numbers in selected number-after-street countries; avoid US highway numbers.
   match=part.match(/^(.+?)\s+(\d+[\p{L}]?(?:[-/]\d+[\p{L}]?)?)$/u);
   if(match&&['DE','AT','CH','BE','NL','DK','SE','NO','FI','CZ','SK','PL'].includes(a.country)&&hasStreet(match[1])){elements.StrtNm=match[1];elements.BldgNb=match[2];continue;}
   if(!/^\d/u.test(part)&&!/(?:\d|\b(?:SUITE|APT|ROOM|FLOOR|UNIT)\b)$/iu.test(part)){elements.StrtNm=part;continue;}
  }
  unmapped.push(part);
 }
 // Use pre-slash logical lines. The MT Name/capacity/33-character limits do not apply here.
 return {elements,hybridAddress:[a.primary,a.secondary].filter(Boolean).join('\n'),unmapped};
}
function xmlText(value:string,field:string,issues:IsoPostalIssue[]){
 const valid=Array.from(value).filter(char=>{const n=char.codePointAt(0)!;return n===9||n===10||n===13||n>=32&&n<=0xd7ff||n>=0xe000&&n<=0xfffd||n>=0x10000&&n<=0x10ffff;}).join('');
 if(valid!==value)issues.push({field,message:`${field}: unsupported XML characters were removed from the draft.`});
 return flat(valid);
}
function bounded(value:string,max:number,field:string,issues:IsoPostalIssue[]){
 const chars=Array.from(value);
 if(chars.length>max)issues.push({field,message:`${field}: exceeds ${max} characters; the extra text is not in this XML draft.`,omitted:chars.slice(max).join('')});
 return chars.slice(0,max).join('');
}
function linesFor(text:string,issues:IsoPostalIssue[]){
 const input=text.split(/\r\n?|\n/u).map(line=>xmlText(line,'AdrLine',issues)).filter(Boolean);
 if(input.length<=2&&input.every(line=>Array.from(line).length<=70))return input;
 let chars=Array.from(input.join(' '));const result:string[]=[];
 while(chars.length&&result.length<2){let end=Math.min(70,chars.length);if(chars.length>70){const space=chars.slice(0,71).lastIndexOf(' ');if(space>=40)end=space;}result.push(chars.slice(0,end).join(''));chars=chars.slice(end);while(chars[0]===' ')chars.shift();}
 if(chars.length)issues.push({field:'AdrLine',message:'AdrLine: the address exceeds two 70-character lines. Review the extra text.',omitted:chars.join('')});
 return result;
}
function serialize(elements:Partial<IsoPostalElements>,lines:string[]=[]){
 const entries=ISO_POSTAL_FIELDS.filter(field=>elements[field.key]).map(field=>`  <${field.key}>${escapeXml(elements[field.key]!)}</${field.key}>`);
 entries.push(...lines.map(line=>`  <AdrLine>${escapeXml(line)}</AdrLine>`));
 return entries.length?`<PstlAdr>\n${entries.join('\n')}\n</PstlAdr>`:'';
}
/** Address fragments only; the enclosing party/message supplies Nm and the message namespace. */
export function isoPostalOutputs(proposal:IsoPostalProposal):{structured:IsoPostalOutput;hybrid:IsoPostalOutput}{
 const common:IsoPostalIssue[]=[],elements:Partial<IsoPostalElements>={};
 for(const field of ISO_POSTAL_FIELDS){
  let value=xmlText(proposal.elements[field.key],field.key,common);if(!value)continue;
  if(field.key==='Ctry'){value=value.toUpperCase();if(!isIsoCountryCode(value)){common.push({field:'Ctry',message:'Ctry: enter an assigned two-letter ISO country code. Invalid country was omitted.'});continue;}}
  if(field.key==='TwnNm'&&placeholder(value)){common.push({field:'TwnNm',message:'TwnNm: enter a town / city; a placeholder is not a town. It was omitted.'});continue;}
  elements[field.key]=bounded(value,field.max,field.key,common);
 }
 for(const field of ['TwnNm','Ctry'] as const)if(!elements[field])common.push({field,message:`${field}: required for this postal-address profile.`});
 const structuredIssues=[...common];
 for(const text of proposal.unmapped)if(!Object.values(proposal.elements).some(value=>flat(value).toUpperCase()===flat(text).toUpperCase()))structuredIssues.push({field:'Unmapped source',message:'Source address text has not been assigned to a structured element.',omitted:text});
 const hybridIssues=common.filter(issue=>['PstCd','TwnNm','CtrySubDvsn','Ctry'].includes(issue.field));
 const lines=linesFor(proposal.hybridAddress,hybridIssues);
 const hybridElements:Partial<IsoPostalElements>={PstCd:elements.PstCd,TwnNm:elements.TwnNm,CtrySubDvsn:elements.CtrySubDvsn,Ctry:elements.Ctry};
 // Never delete a building or street merely because it resembles a locality/postal token.
 for(const key of ['PstCd','TwnNm','CtrySubDvsn','Ctry'] as const){const value=hybridElements[key];if(value&&lines.some(line=>whole(line,value)))hybridIssues.push({field:key,message:`${key}: the same text also occurs in AdrLine. Check that structured data is not repeated; retain genuine street/building content.`});}
 return {structured:{xml:serialize(elements),issues:structuredIssues},hybrid:{xml:serialize(hybridElements,lines),issues:hybridIssues}};
}
