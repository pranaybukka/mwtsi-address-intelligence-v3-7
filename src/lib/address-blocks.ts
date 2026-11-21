import type {AddressBlockKey,AddressBlockResult,RecordResult,Validation,MissingHybridLine} from './domain';
export const BLOCK_KEYS=['BNP','ORP'] as const;
/** BNP retains the established top-level representation; legacy payloads remain byte-identical. */
export function blockRecord(record:RecordResult,key:AddressBlockKey='BNP'):RecordResult {
 const {orp,bnpStatus,bnpReasons,bnpValidation,schemaVersion,...base}=record;
 if(key==='ORP'){if(!orp)throw Error('ORP is not enabled for this record');return {...base,...orp,source:{...orp.source,Group:record.source.Group,recordKey:record.source.recordKey}};}
 return {...base,status:bnpStatus??base.status,reasons:bnpReasons??base.reasons,validation:bnpValidation??base.validation};
}
export function addressBlocks(record:RecordResult){return (record.orp?BLOCK_KEYS:['BNP'] as const).map(key=>({key,result:blockRecord(record,key)}));}
export function blockResult(record:RecordResult):AddressBlockResult {return {source:record.source,intelligence:record.intelligence,hybrid:record.hybrid,validation:record.validation,status:record.status,reasons:record.reasons};}
function aggregateValidation(a:Validation,b:Validation):Validation {
 const checks=(key:'pmpg'|'priority'|'duplication'|'length')=>[a[key],b[key]].includes('FAIL')?'FAIL':[a[key],b[key]].every(v=>v==='NOT_APPLICABLE')?'NOT_APPLICABLE':'PASS';
 return {pmpg:checks('pmpg'),priority:checks('priority') as 'PASS'|'FAIL',duplication:checks('duplication') as 'PASS'|'FAIL',length:checks('length') as 'PASS'|'FAIL',evidenceConflict:a.evidenceConflict||b.evidenceConflict,issues:[...a.issues.map(v=>'BNP: '+v),...b.issues.map(v=>'ORP: '+v)]};
}
export function combineBlocks(parent:RecordResult,bnp:RecordResult,orp:RecordResult):RecordResult {
 const results=[bnp,orp];const status=results.some(r=>r.status==='ERROR')?'ERROR':results.some(r=>r.status==='PROPOSED_REVIEW_REQUIRED')?'PROPOSED_REVIEW_REQUIRED':results.every(r=>r.status==='NAME_ONLY')?'NAME_ONLY':'AUTO_TRANSLATED';
 return {...parent,...blockResult(bnp),source:parent.source,schemaVersion:3,bnpStatus:bnp.status,bnpValidation:bnp.validation,bnpReasons:bnp.reasons,orp:blockResult(orp),status,validation:aggregateValidation(bnp.validation,orp.validation),reasons:results.flatMap((r,i)=>r.reasons.map(reason=>`${i?'ORP':'BNP'}: ${reason}`)),reviewState:parent.reviewState==='NONE'||parent.reviewState==='PENDING'?status==='PROPOSED_REVIEW_REQUIRED'||status==='ERROR'?'PENDING':'NONE':parent.reviewState};
}
export function missingHybridLines(record:RecordResult):MissingHybridLine[]{return addressBlocks(record).flatMap(({key,result})=>{const missing=(['1/','3/'] as const).filter(prefix=>!result.hybrid.lines.some(line=>line.startsWith(prefix)));return missing.length?[{block:key,missing,nameOnly:result.status==='NAME_ONLY'||result.validation.pmpg==='NOT_APPLICABLE'}]:[];});}
export class MissingHybridLinesError extends Error {
 readonly status=409;readonly code='MISSING_HYBRID_LINES_ACK_REQUIRED';
 constructor(readonly warnings:MissingHybridLine[]){super('Confirm passing output with missing 1/ or 3/ lines, or return to review.');}
}
