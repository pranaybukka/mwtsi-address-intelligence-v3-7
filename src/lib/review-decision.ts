import {RecordResult} from './domain';
import {suggestKeyColumn} from './source';
export {isPassedOutput as isPassed,isFailedOutput as isFailed} from './readiness';
import {isPassedOutput as isPassed,isFailedOutput as isFailed} from './readiness';
/** Failed/rejected output can be corrected and reviewed again; retain every prior event. */
export const canDecide=(record:RecordResult)=>['PENDING','NONE','FAILED','REJECTED'].includes(record.reviewState);
export function reviewDecision(record:RecordResult){return isPassed(record)?'PASS':isFailed(record)?'FAIL':record.reviewState==='PENDING'?'PENDING':'NONE';}
export function latestDecision(record:RecordResult){return [...record.reviews].reverse().find(event=>['PASS','FAIL','ACCEPT','APPROVE','REJECT'].includes(event.action));}
export function displayRecordKey(record:RecordResult){
 if(record.source.recordKey!==undefined)return record.source.recordKey.trim()?record.source.recordKey:record.id;
 const columns=record.source.originalColumns||record.source.additionalColumns||[];const header=suggestKeyColumn(columns.map(column=>column.header));const column=columns.find(column=>column.header===header);
 return column?.cell.value!==null&&column?.cell.value!==undefined&&String(column.cell.value).trim()?String(column.cell.value):record.id;
}
export function decisionInitials(value:string){if(typeof value!=='string')throw Error('Enter initials (1–12 characters)');const normalized=value.normalize('NFKC').trim().toUpperCase();if(!normalized||Array.from(normalized).length>12)throw Error('Enter initials (1–12 characters)');return normalized;}
