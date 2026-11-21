import {Check,X} from 'lucide-react';
import type {RecordResult} from '@/lib/domain';
import {isPassed,isFailed} from '@/lib/review-decision';
import {isAutoApproved} from '@/lib/acceptance-history';
import {hasUnresolvedFindings} from '@/lib/summary';
const statusLabel=(s:string)=>({AUTO_TRANSLATED:'Auto translated',PROPOSED_REVIEW_REQUIRED:'Review required',NAME_ONLY:'Name only',ERROR:'Error'}[s]||s);
export default function Badge({record}:{record:RecordResult}){const passed=isPassed(record),failed=isFailed(record);const label=isAutoApproved(record)?'Previously auto-approved':failed?'Failed':passed?(hasUnresolvedFindings(record)?'Passed with issues':'Passed'):statusLabel(record.status);return <span className={`badge ${failed?'error':passed?(hasUnresolvedFindings(record)?'proposed_review_required':'approved'):record.status.toLowerCase()}`}>{failed?<X size={12}/>:passed||record.status==='AUTO_TRANSLATED'?<Check size={12}/>:<span className="dot"/>}{label}</span>;}
