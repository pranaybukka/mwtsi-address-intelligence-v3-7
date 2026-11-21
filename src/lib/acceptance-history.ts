import {RecordResult} from './domain';
/** Read-only classification of historical system decisions. No automatic acceptance is created. */
export function automaticApprovalOrigin(record:RecordResult){return [...record.reviews].reverse().find(event=>event.action==='ACCEPT')?.origin;}
export function isAutoApproved(record:RecordResult){return record.reviewState==='ACCEPTED'&&['AUTOMATIC_UNRESOLVED_TOWN','AUTOMATIC_NOTPROVIDED_CITY'].includes(automaticApprovalOrigin(record)||'');}
