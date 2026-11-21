import {AddressInput,AddressAnalysisInput,RecordResult} from './domain';
/** Only these fields can reach address intelligence. Group and extra columns are pass-through data. */
export const MAIN_COLUMNS=['Name','Address1','Address2','Address3','Bank_Country'] as const;
export function analysisInput(source:AddressInput):AddressAnalysisInput {return {Name:source.Name,Address1:source.Address1,Address2:source.Address2,Address3:source.Address3,Bank_Country:source.Bank_Country};}
export const recordGroup=(record:RecordResult)=>record.source.Group??'';
export type GroupSort='original'|'asc'|'desc';
/** Prefixes distinguish actual group names from the All / No group options. */
export const groupKey=(group:string)=>group.trim()===''?'blank':`value:${group}`;
const collator=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
export function filterAndSortGroups(records:RecordResult[],filter='all',sort:GroupSort='original'):RecordResult[]{
 const selected=records.filter(r=>filter==='all'||groupKey(recordGroup(r))===filter);
 if(sort==='original')return selected;
 return selected.sort((a,b)=>{const x=recordGroup(a),y=recordGroup(b);if(!x.trim()||!y.trim())return Number(!x.trim())-Number(!y.trim());return collator.compare(x,y)*(sort==='desc'?-1:1);});
}
export function groupOptions(records:RecordResult[]){return [...new Map(records.map(r=>{const value=recordGroup(r);return [groupKey(value),{key:groupKey(value),label:value.trim()?value:'(No group)'}];})).values()].sort((a,b)=>a.key==='blank'?1:b.key==='blank'?-1:collator.compare(a.label,b.label));}

export function suggestKeyColumn(headers:string[]){const preferred=['keyfield','recordkey','key','externalkey','recordid','referenceid'];for(const key of preferred){const header=headers.find(header=>header.toLowerCase().replace(/[\s_-]/g,'')===key);if(header)return header;}return null;}
