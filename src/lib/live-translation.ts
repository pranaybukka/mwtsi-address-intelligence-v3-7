import type {AddressInput,RecordResult} from './domain';
export interface LiveInput {name:string;address:string;country:string;}
export interface LiveTranslation {record:RecordResult;postalLookupEnabled:boolean;}
export const LIVE_LIMITS={name:1000,address:4000,country:100,bodyBytes:32768} as const;
/** Use the same analyzed fields as uploaded workbooks. Keep every nonblank address line. */
export function liveSource(input:LiveInput):AddressInput {
 const lines=input.address.replace(/\r\n?/g,'\n').split('\n').filter(line=>line.trim());
 return {Name:input.name,Address1:lines[0]||'',Address2:lines[1]||'',Address3:lines.slice(2).join(' / '),Bank_Country:input.country};
}
/** Copy only selected, already transformed lines; never restore truncated or priority-dropped data. */
export function liveCopy(record:RecordResult){const lines=record.hybrid.lines;return {name:lines.filter(line=>line.startsWith('1/')).map(line=>line.slice(2)).join('\n'),address:lines.filter(line=>!line.startsWith('1/')).map(line=>line.slice(2)).join('\n'),hybrid:lines.join('\n')};}
