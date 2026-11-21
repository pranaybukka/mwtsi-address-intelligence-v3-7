import type {AddressBlockKey,RecordResult,StructuredAddress,ReviewEvent} from './domain';
import {addressBlocks} from './address-blocks';
import {latestDecision,canDecide,isPassed} from './review-decision';
import {suggestKeyColumn} from './source';
import {STATUS_OPTIONS,matchesStatus} from './record-selection';
export {PROCESSING_VERSION} from './processing-version';
export const CORRECTION_FIELDS=['name','primary','secondary','town','postal','subdivision','country'] as const;
export const COMPARISON_CATEGORIES=['Unchanged','Source changed','Processing changed','Processing unverified','Proposal changed','Other columns changed','Added','Removed','Duplicate key','Missing key'] as const;
export type ComparisonCategory=typeof COMPARISON_CATEGORIES[number];
export const FIELD_LABELS:Record<keyof StructuredAddress,string>={name:'Name',primary:'Primary address',secondary:'Secondary address',town:'Town / city',postal:'Postal code',subdivision:'State / province',country:'Country'};
export function sourceRecordKey(record:RecordResult):string|null {
 const source=record.source;if(source.recordKey!==undefined)return source.recordKey.trim()?source.recordKey:null;
 const columns=source.originalColumns||source.additionalColumns||[],header=suggestKeyColumn(columns.map(c=>c.header));const value=columns.find(c=>c.header===header)?.cell.value;
 return value!==undefined&&value!==null&&String(value).trim()?String(value):null;
}
export function canonical(value:unknown):string {if(value===undefined)return 'null';if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';return '{'+Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';}
export function proposalState(record:RecordResult){return addressBlocks(record).map(({key,result:r})=>({block:key,structured:r.intelligence.structured,lines:r.hybrid.lines,validation:r.validation,status:r.status,reasons:r.reasons}));}
export function processingContext(record:RecordResult){return addressBlocks(record).map(({key,result:r})=>({block:key,version:r.intelligence.processingVersion,reference:r.intelligence.referenceSignature,settings:r.intelligence.processingSettings,referenceData:r.intelligence.referenceData}));}
export function knownContext(record:RecordResult){return addressBlocks(record).every(({result:r})=>!!r.intelligence.processingVersion&&!!r.intelligence.referenceSignature&&typeof r.intelligence.processingSettings?.postalLookupEnabled==='boolean');}
export interface RecordSnapshot {id:string;version:number;key:string|null;group:string;name:string;state:string;statuses:string[];sources:Record<string,unknown>;proposals:ReturnType<typeof proposalState>;context:ReturnType<typeof processingContext>;knownContext:boolean;metadata:string;positiveDecision:boolean;open:boolean;decision?:Pick<ReviewEvent,'action'|'at'|'reviewer'|'actorUsername'|'origin'>;}
export interface ComparisonItem {id:string;key:string|null;group:string;category:ComparisonCategory;before:RecordSnapshot|null;after:RecordSnapshot|null;baselineCount:number;targetCount:number;sourceChanged:boolean;metadataChanged:boolean;contextMatch:boolean;reuseCandidate:boolean;reuseReason:string;}
export function snapshotRecord(record:RecordResult,metadataDigest:(value:unknown)=>string):RecordSnapshot {
 const decision=latestDecision(record);
 return {id:record.id,version:record.version,key:sourceRecordKey(record),group:record.source.Group??'',name:record.source.Name,state:record.reviewState,statuses:STATUS_OPTIONS.filter(s=>matchesStatus(record,s.value)).map(s=>s.value),sources:Object.fromEntries(addressBlocks(record).map(({key,result:r})=>[key,{Name:r.source.Name,Address1:r.source.Address1,Address2:r.source.Address2,Address3:r.source.Address3,Bank_Country:r.source.Bank_Country||''}])),proposals:proposalState(record),context:processingContext(record),knownContext:knownContext(record),metadata:metadataDigest({columns:[...(record.source.additionalColumns||[])].sort((a,b)=>a.header.localeCompare(b.header)),banking:record.source.banking}),positiveDecision:isPassed(record)&&!!decision&&!decision.origin&&['PASS','ACCEPT','APPROVE'].includes(decision.action),open:canDecide(record),decision:decision?{action:decision.action,at:decision.at,reviewer:decision.reviewer,actorUsername:decision.actorUsername,origin:decision.origin}:undefined};
}
export function compareSnapshots(baseline:RecordSnapshot[],target:RecordSnapshot[]):ComparisonItem[]{
 const identity=(row:RecordSnapshot,side:string)=>row.key===null?canonical([side,row.id]):canonical([row.group,row.key]);
 const before=new Map<string,RecordSnapshot[]>(),after=new Map<string,RecordSnapshot[]>();for(const [rows,map,side] of [[baseline,before,'before'],[target,after,'after']] as const)for(const row of rows){const key=identity(row,side);const list=map.get(key)||[];list.push(row);map.set(key,list);}
 const result:ComparisonItem[]=[];
 for(const id of new Set([...after.keys(),...before.keys()])){const old=before.get(id)||[],now=after.get(id)||[],a=old[0]??null,b=now[0]??null,row=b||a!;
  const sourceChanged=!!a&&!!b&&canonical(a.sources)!==canonical(b.sources),metadataChanged=!!a&&!!b&&a.metadata!==b.metadata,contextMatch=!!a&&!!b&&a.knownContext&&b.knownContext&&canonical(a.context)===canonical(b.context);
  const category:ComparisonCategory=row.key===null?'Missing key':old.length>1||now.length>1?'Duplicate key':!a?'Added':!b?'Removed':sourceChanged?'Source changed':!a.knownContext||!b.knownContext?'Processing unverified':!contextMatch?'Processing changed':canonical(a.proposals)!==canonical(b.proposals)?'Proposal changed':metadataChanged?'Other columns changed':'Unchanged';
  const reuseReason=!a||!b?'A unique record is required in both batches.':old.length!==1||now.length!==1||row.key===null?'A nonblank unique source Key plus exact Group is required.':sourceChanged?'Original address fields differ.':!contextMatch?'Processing provenance is missing or different.':!a.positiveDecision?'The baseline has no explicit positive decision.':!b.open?'The target already has a passed decision.':'Available for a decision-reuse preview; output will be checked again.';
  result.push({id,key:row.key,group:row.group,category,before:a,after:b,baselineCount:old.length,targetCount:now.length,sourceChanged,metadataChanged,contextMatch,reuseCandidate:!!a&&!!b&&old.length===1&&now.length===1&&row.key!==null&&!sourceChanged&&contextMatch&&a.positiveDecision&&b.open,reuseReason});
 }
 return result;
}
export interface ApprovedChange {block:AddressBlockKey;field:keyof StructuredAddress;before:string;after:string;}
/** Compare the first audited structured proposal with the currently passed proposal, never pretend it is raw source. */
export function approvedChanges(record:RecordResult):ApprovedChange[]{
 const decision=latestDecision(record);if(!isPassed(record)||!decision||decision.origin||!['PASS','ACCEPT','APPROVE'].includes(decision.action))return [];
 return addressBlocks(record).flatMap(({key,result})=>{const first=record.reviews.find(event=>key==='BNP'?!!(event.blocks?.BNP?.before||event.before):!!event.blocks?.ORP?.before);const before=key==='BNP'?first?.blocks?.BNP?.before||first?.before:first?.blocks?.ORP?.before;const approved=key==='BNP'?decision.blocks?.BNP?.after||decision.after:decision.blocks?.ORP?.after;if(!before||!approved||canonical(approved)!==canonical(result.intelligence.structured))return [];return CORRECTION_FIELDS.flatMap(field=>typeof before[field]==='string'&&before[field]!==result.intelligence.structured[field]?[{block:key,field,before:before[field],after:result.intelligence.structured[field]}]:[]);});
}
