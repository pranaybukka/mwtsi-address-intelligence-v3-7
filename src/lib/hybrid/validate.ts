import {isIsoCountryCode} from '../reference/iso-country';
import { HybridOutput, StructuredAddress, Validation } from '../domain';
import {assessSelection} from './selection';
import { length } from './truncate';
const norm=(s:string)=>s.normalize('NFD').replace(/\p{M}/gu,'').toUpperCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function containsPhrase(text:string,phrase:string){return !!phrase&&(` ${norm(text)} `).includes(` ${norm(phrase)} `);}
/** Explicit street-name overlap is meaningful address content, not locality repetition. */
export function legitimateStreetOverlap(payload:string,town:string){const p=norm(payload),t=norm(town);return !!t&&(p.includes(t+' ROAD')||p.includes(t+' STREET')||p.includes(t+' AVENUE')||(t==='CENTRAL'&&/QUEENS ROAD CENTRAL/.test(p)));}
export function validate(a:StructuredAddress,h:HybridOutput,conflicts:string[]=[],countryAliases:string[]=[],nameOnly=false,validCountry=true):Validation {
 const priority=assessSelection(a,h,nameOnly);
 const issues:string[]=[...priority.issues];const lengthIssues:string[]=[];
 if(!a.name.trim())issues.push('Name required');
 const names=h.lines.filter(l=>l.startsWith('1/'));
 if(!names.length||names.length>2||!h.lines[0]?.startsWith('1/'))issues.push('One or two leading name records required');
 if(names.join('|')!==[h.candidates['1a'],h.candidates['1b']].filter(Boolean).join('|'))issues.push('Name lines differ from candidates');
 if(h.lines.some(l=>/[\u0000-\u001f\u007f]/.test(l)))issues.push('Control characters in payload');
 if(h.lines.filter(line=>line.startsWith('2/')).length>2)issues.push('At most two 2/ address records allowed');
 if(h.lines.length>4)lengthIssues.push('Maximum four lines');
 for(const l of h.lines){if(!/^[123]\//.test(l))issues.push('Unsupported line prefix');if(length(l.slice(2))>33)lengthIssues.push('Payload exceeds 33 characters');}
 if(length(a.town)>30 && !h.truncations.some(x=>x.field==='Town'))lengthIssues.push('Unaudited Town truncation');
 const threes=h.lines.filter(x=>x.startsWith('3/'));
 if(!nameOnly){
 if(threes.length!==1)issues.push('Exactly one 3/ line required');
 if(!isIsoCountryCode(a.country)||!validCountry)issues.push('Country unresolved or invalid');
 if(!a.town||a.town==='NOTPROVIDED')issues.push('Town unresolved');
 if(threes[0]!==h.candidates['3a'])issues.push('Country/Town line differs from candidate');
 }
 const unstructured=h.lines.filter(x=>x.startsWith('2/'));
 // 2z intentionally holds structured postal/subdivision under the internal profile.
 const duplicates=unstructured.filter(l=>l!==h.candidates['2z']).some(l=>[a.town,...countryAliases,a.country].filter(x=>x&&x!=='ZZ'&&x!=='NOTPROVIDED').some(v=>containsPhrase(l.slice(2),v)&&!(v===a.town&&legitimateStreetOverlap(l.slice(2),a.town))));
 if(duplicates)issues.push('Structured Town/Country duplicated in free-form content (or legitimate street-name overlap requires review)');
 if(conflicts.length)issues.push(...conflicts);
 issues.push(...lengthIssues);
 return {priority:priority.status,pmpg:nameOnly?'NOT_APPLICABLE':issues.length?'FAIL':'PASS',duplication:duplicates?'FAIL':'PASS',length:lengthIssues.length?'FAIL':'PASS',issues,evidenceConflict:!!conflicts.length};
}
