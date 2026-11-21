import {addressBlocks,blockRecord,missingHybridLines} from './address-blocks';
import {isReadyForExport,isLeftToReview,isLeftToFix} from './readiness';
import {isPassed,isFailed} from './review-decision';
import {RecordResult} from './domain';
import {hasUnresolvedFindings} from './summary';
import {isAutoApproved} from './acceptance-history';
import {isTownUnresolved} from './town-status';
export const STATUS_OPTIONS=[
 {value:'dualAddress',label:'BNP + ORP records',group:'Address blocks'},
 {value:'bnpReview',label:'BNP has findings',group:'Address blocks'},
 {value:'orpReview',label:'ORP has findings',group:'Address blocks'},
 {value:'bothReview',label:'Both blocks have findings',group:'Address blocks'},
 {value:'bnpHybridPass',label:'BNP Hybrid pass',group:'Address blocks'},
 {value:'bnpHybridFail',label:'BNP Hybrid fail',group:'Address blocks'},
 {value:'orpHybridPass',label:'ORP Hybrid pass',group:'Address blocks'},
 {value:'orpHybridFail',label:'ORP Hybrid fail',group:'Address blocks'},
 {value:'bnpPassOrpReview',label:'BNP Hybrid pass AND ORP findings',group:'Address blocks'},
 {value:'orpPassBnpReview',label:'ORP Hybrid pass AND BNP findings',group:'Address blocks'},
 {value:'missingHybridLines',label:'Missing 1/ or 3/ lines',group:'Address blocks'},
 {value:'AUTO_TRANSLATED',label:'Auto translated',group:'Processing status'},
 {value:'PROPOSED_REVIEW_REQUIRED',label:'Review required',group:'Processing status'},
 {value:'NAME_ONLY',label:'Name only',group:'Processing status'},
 {value:'ERROR',label:'Errors',group:'Processing status'},
 {value:'readyForExport',label:'Ready for export',group:'Review progress'},
 {value:'leftToReview',label:'Left to review',group:'Review progress'},
 {value:'leftToFix',label:'Left to fix',group:'Review progress'},
 {value:'pending',label:'Pending review',group:'Review decision'},
 {value:'passed',label:'Passed',group:'Review decision'},
 {value:'failed',label:'Failed',group:'Review decision'},
 {value:'accepted',label:'Accepted output',group:'Review decision'},
 {value:'acceptedWithIssues',label:'Accepted with issues',group:'Review decision'},
 {value:'autoApproved',label:'Previously auto-approved',group:'Review decision'},
 {value:'approved',label:'Verified approval',group:'Review decision'},
 {value:'rejected',label:'Rejected',group:'Review decision'},
 {value:'pmpgPass',label:'Hybrid pass',group:'Validation and findings'},
 {value:'pmpgFail',label:'Hybrid fail',group:'Validation and findings'},
 {value:'pmpgNA',label:'Hybrid not applicable',group:'Validation and findings'},
 {value:'duplicatePass',label:'Duplicate pass',group:'Validation and findings'},
 {value:'duplicateFail',label:'Duplicate fail',group:'Validation and findings'},
 {value:'conflicts',label:'Evidence conflicts',group:'Validation and findings'},
 {value:'truncation',label:'With truncation',group:'Validation and findings'},
 {value:'dropped',label:'With dropped data',group:'Validation and findings'},
 {value:'countryLow',label:'Country below threshold',group:'Validation and findings'},
 {value:'townLow',label:'Town below threshold',group:'Validation and findings'},
 {value:'unresolvedTown',label:'Unresolved town',group:'Validation and findings'}
] as const;
export type StatusFilter=typeof STATUS_OPTIONS[number]['value'];
export function isStatusFilter(value:string):value is StatusFilter{return STATUS_OPTIONS.some(option=>option.value===value);}
export function matchesStatus(record:RecordResult,status:StatusFilter){
 switch(status){
 case 'dualAddress':return !!record.orp;
 case 'bnpReview':return hasUnresolvedFindings(blockRecord(record));
 case 'orpReview':return !!record.orp&&hasUnresolvedFindings(blockRecord(record,'ORP'));
 case 'bothReview':return !!record.orp&&hasUnresolvedFindings(blockRecord(record))&&hasUnresolvedFindings(blockRecord(record,'ORP'));
 case 'bnpHybridPass':return blockRecord(record).validation.pmpg==='PASS';
 case 'bnpHybridFail':return blockRecord(record).validation.pmpg==='FAIL';
 case 'orpHybridPass':return !!record.orp&&record.orp.validation.pmpg==='PASS';
 case 'orpHybridFail':return !!record.orp&&record.orp.validation.pmpg==='FAIL';
 case 'bnpPassOrpReview':return !!record.orp&&blockRecord(record).validation.pmpg==='PASS'&&hasUnresolvedFindings(blockRecord(record,'ORP'));
 case 'orpPassBnpReview':return !!record.orp&&record.orp.validation.pmpg==='PASS'&&hasUnresolvedFindings(blockRecord(record));
 case 'missingHybridLines':return missingHybridLines(record).length>0;
 case 'AUTO_TRANSLATED':case 'PROPOSED_REVIEW_REQUIRED':case 'NAME_ONLY':case 'ERROR':return record.status===status;
 case 'readyForExport':return isReadyForExport(record);
 case 'leftToReview':return isLeftToReview(record);
 case 'leftToFix':return isLeftToFix(record);
 case 'pending':return record.reviewState==='PENDING';
 case 'passed':return isPassed(record);
 case 'failed':return isFailed(record);
 case 'accepted':return record.reviewState==='ACCEPTED';
 case 'acceptedWithIssues':return record.reviewState==='ACCEPTED'&&hasUnresolvedFindings(record);
 case 'autoApproved':return isAutoApproved(record);
 case 'approved':return record.reviewState==='APPROVED';
 case 'rejected':return record.reviewState==='REJECTED';
 case 'pmpgPass':return record.validation.pmpg==='PASS';
 case 'pmpgFail':return record.validation.pmpg==='FAIL';
 case 'pmpgNA':return record.validation.pmpg==='NOT_APPLICABLE';
 case 'duplicatePass':return record.validation.duplication==='PASS';
 case 'duplicateFail':return record.validation.duplication==='FAIL';
 case 'conflicts':return record.validation.evidenceConflict;
 case 'truncation':return addressBlocks(record).some(({result})=>result.hybrid.truncations.length>0);
 case 'dropped':return addressBlocks(record).some(({result})=>result.hybrid.dropped.length>0);
 case 'countryLow':return addressBlocks(record).some(({result})=>result.intelligence.country.confidence<.92);
 case 'townLow':return addressBlocks(record).some(({result})=>result.intelligence.town.confidence<.9);
 case 'unresolvedTown':return addressBlocks(record).some(({result})=>result.status!=='NAME_ONLY'&&isTownUnresolved(result.intelligence.structured.town));
 }
}
/** Match ANY chosen status, then search, preserving order and one row per internal record ID. */
export function selectRecords(records:RecordResult[],statuses:readonly StatusFilter[]=[],search=''){
 const selected=[...new Set(statuses)],term=search.trim().toLowerCase(),seen=new Set<string>();
 return records.filter(record=>{
  if(seen.has(record.id)||selected.length&&!selected.some(status=>matchesStatus(record,status)))return false;
  if(term&&!JSON.stringify([record.source.Name,record.source.Group,addressBlocks(record).map(({result})=>result.intelligence.structured)]).toLowerCase().includes(term))return false;
  seen.add(record.id);return true;
 });
}
