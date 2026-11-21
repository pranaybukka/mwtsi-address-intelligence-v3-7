import type {RecordResult} from './domain';

type WorkflowRecord=Pick<RecordResult,'reviewState'|'status'>;
export const isPassedOutput=(record:WorkflowRecord)=>['PASSED','ACCEPTED','APPROVED'].includes(record.reviewState);
export const isFailedOutput=(record:WorkflowRecord)=>['FAILED','REJECTED'].includes(record.reviewState);
/** Preserve the existing policy: human acceptance overrides findings; automatic name-only output is eligible. */
export const isReadyForExport=(record:WorkflowRecord)=>isPassedOutput(record)||(record.reviewState==='NONE'&&['AUTO_TRANSLATED','NAME_ONLY'].includes(record.status));
export const isLeftToReview=(record:WorkflowRecord)=>!isReadyForExport(record)&&!isFailedOutput(record);
export const isLeftToFix=(record:WorkflowRecord)=>!isReadyForExport(record);
export const emptyProgress=()=>({total:0,passed:0,failed:0,automaticReady:0,readyForExport:0,leftToReview:0,leftToFix:0});
export type ProgressTotals=ReturnType<typeof emptyProgress>;
export function addProgress(totals:ProgressTotals,record:WorkflowRecord){
 totals.total++;
 if(isReadyForExport(record)){totals.readyForExport++;if(isPassedOutput(record))totals.passed++;else totals.automaticReady++;}
 else {totals.leftToFix++;if(isFailedOutput(record))totals.failed++;else totals.leftToReview++;}
 return totals;
}
export function progressTotals(records:readonly WorkflowRecord[]){return records.reduce(addProgress,emptyProgress());}
