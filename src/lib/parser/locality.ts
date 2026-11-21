import { key, normalize } from './normalize';
import { containsPhrase } from '../hybrid/validate';
import { AuditEntry } from '../domain';
export function removePhrase(text:string,value:string):string {
 // Work on normalized tokens, preserving unmatched original Unicode words.
 const source=text.match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*|[^\p{L}\p{N}]+/gu)||[];
 const wanted=key(value).split(' ');let output='';
 for(let i=0;i<source.length;){let j=i,combined='';let end=-1;
  if(/[\p{L}\p{N}]/u.test(source[i])){while(j<source.length&&j<i+wanted.length*3+4){combined+=source[j];const k=key(combined);if(k===key(value)){end=j+1;break;}if(k.length>key(value).length+1)break;j++;}}
  if(end>i){output+=' ';i=end;}else{output+=source[i];i++;}}
 return output.replace(/^[\s,;:/!?-]+|[\s,;:/!?-]+$/g,'').replace(/\s+/g,' ').trim();
}
// Shared by locality eligibility, postal extraction and source sanitizing. A
// person/place word in a street name must not become independent town evidence.
export const hasStreet=(s:string)=>/\b(?:STREET|ST\.?|ROAD|RD|AVENUE|AVE?|DRIVE|DR\.?|COURT|CT|CRESCENT|CRES|TERRACE|TER|TRAIL|TRL|PARKWAY|PKWY|PLACE|PL|CIRCLE|CIR|CLOSE|CALLE|CARRER|VIA|RUE|STRASSE|STRAẞE|LANE|LN|BOULEVARD|BLVD|QUEENS|MARUNOUCHI|HIGHWAY|HWY|WAY|PASEO|PO BOX|P\.?O\.? BOX)\b/i.test(s)||/\b[\p{L}]*(?:STRASSE|STRAẞE|GATAN|VEJ|VEIEN|KATU|STRAAT|ULICE|ODOS|CADDESI)\b/u.test(s);
export function isLocalityLine(line:string,town:string,countryAliases:string[],postal:string,subdivision:string){
 if(!containsPhrase(line,town))return false;
 let rest=line;
 for(const v of [town,...countryAliases,postal,subdivision].filter(Boolean).sort((a,b)=>b.length-a.length))rest=removePhrase(rest,v);
 return !key(rest)||(!hasStreet(line)&&!/^\d+\s+\p{L}/u.test(rest)&&key(rest).split(' ').length<=2);
}
export function sanitize(lines:string[],town:string,townAliases:string[],countryAliases:string[],postal:string,subdivision:string,audit:AuditEntry[],subdivisionAliases:string[]=[]):string[]{
 return lines.map((line,index)=>{
 const locality=[town,...townAliases].some(t=>isLocalityLine(line,t,countryAliases,postal,subdivision));
 const countryOnly=countryAliases.some(c=>key(c)===key(line));
 let postalRemainder=line;for(const value of [postal,subdivision,...subdivisionAliases,...countryAliases].filter(Boolean).sort((a,b)=>b.length-a.length))postalRemainder=removePhrase(postalRemainder,value);
 const postalOnly=!!postal&&!hasStreet(line)&&!key(postalRemainder);
 if(!locality&&!countryOnly&&!postalOnly)return normalize(line);
 let out=line;
 for(const v of [...townAliases,town,...countryAliases,postal,subdivision,...subdivisionAliases].filter(Boolean).sort((a,b)=>b.length-a.length)){
 const next=removePhrase(out,v);if(next!==out){audit.push({field:`Address${index+1}`,value:v,reason:`Removed matched structured component; before=${out}; after=${next}`});out=next;}}
 return normalize(out);
 });
}
