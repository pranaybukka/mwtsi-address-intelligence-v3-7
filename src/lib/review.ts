import {RecordResult,StructuredAddress,ReviewEvent} from './domain';
import {blockRecord,combineBlocks,missingHybridLines,MissingHybridLinesError,addressBlocks} from './address-blocks';
import {ReferenceRepository} from './reference/types';
import {finalize} from './process';
import {candidate,evidence} from './enrichment/evidence';
import {resolveCountry} from './enrichment/country';
import {normalize} from './parser/normalize';
import {decisionInitials,canDecide} from './review-decision';
export const PENDING_EDIT_NOTICE='Awaiting explicit human approval of saved edits';
function reviewSingleRecord(record:RecordResult,action:ReviewEvent['action'],reviewer:string,reason:string,edits:Partial<StructuredAddress>|undefined,ref:ReferenceRepository,actor?:{id:string;username:string},pendingCorrection=false):RecordResult {
 const decision=action==='PASS'||action==='FAIL';
 if(actor)reviewer=actor.username;
 if(decision){if(!actor)reviewer=decisionInitials(reviewer);if(!canDecide(record))throw Error('CONFLICT: Decision already recorded; reload');if(action==='PASS'&&reason.trim())throw Error('Pass does not require or accept a reason');if(action==='FAIL'&&(!reason.trim()||reason.trim().length>2000))throw Error('Fail requires a reason (up to 2,000 characters)');}
 else if(!reviewer.trim()||!reason.trim())throw Error('Reviewer and reason are required');
 if(!['PASS','FAIL','ACCEPT','APPROVE','EDIT','REJECT'].includes(action))throw Error('Invalid review action');
 if(record.status==='ERROR'&&!decision&&action!=='REJECT'&&action!=='ACCEPT')throw Error('Processing errors must be reprocessed before approval');
 const before=record.intelligence.structured;const after={...before};
 if(edits){for(const k of ['name','primary','secondary','town','country','postal','subdivision'] as const){if(edits[k]!==undefined){if(typeof edits[k]!=='string'||edits[k]!.length>10000)throw Error('Invalid edit value');after[k]=normalize(edits[k]!);}}}
 if(edits?.country!==undefined)after.country=resolveCountry(after.country).code||after.country;
 function updateName(intelligence:RecordResult['intelligence'],verified:boolean){
  if(after.name===before.name)return;
  const current=intelligence.nameInterpretation||{originalName:normalize(record.source.Name),candidate:candidate(before.name,1,'SOURCE_NAME'),addressLines:[record.source.Address1,record.source.Address2,record.source.Address3],audit:[],reviewReasons:[]};
  current.candidate=candidate(after.name,verified?1:0,verified?'HUMAN_REVIEW':'HUMAN_SUPPLIED_EDIT',[...current.candidate.evidence,evidence('Human supplied Name',after.name,verified?1:0,'HUMAN_REVIEW',`${reviewer}: ${reason}`)],'HUMAN_REVIEW');current.candidate.reviewRequired=!verified;current.reviewReasons=[];
  current.audit.push({field:'Name',action:'MANUAL_NAME_EDIT',nameText:after.name,sourceText:record.source.Name,beforeName:before.name,afterName:after.name,reason:`Name edited by ${reviewer}: ${reason}`});intelligence.nameInterpretation=current;
 }
 // Acceptance records an operational decision; it does not certify components or erase findings.
 if(action==='ACCEPT'||decision||pendingCorrection){
  const changed=JSON.stringify(before)!==JSON.stringify(after);
  let accepted=structuredClone(record);
  if(changed){
   const intelligence=structuredClone(record.intelligence);intelligence.structured=after;updateName(intelligence,false);
   for(const k of ['country','town','postal','subdivision'] as const){if(before[k]!==after[k])intelligence[k]=candidate(after[k],0,'HUMAN_SUPPLIED_EDIT',[...intelligence[k].evidence,evidence('Human supplied edit',after[k],0,'HUMAN_REVIEW',`${reviewer}: ${reason}; accepted without verification`)],'HUMAN_REVIEW');}
   const computed=finalize(record.source,intelligence,ref);
   accepted={...accepted,...computed,status:record.status==='ERROR'?'ERROR':'PROPOSED_REVIEW_REQUIRED'};
  }
  const snapshot={lines:[...accepted.hybrid.lines],validation:structuredClone(accepted.validation),status:accepted.status,reasons:[...accepted.reasons]};
  const event:ReviewEvent={at:new Date().toISOString(),action,reviewer:reviewer.trim(),...(actor?{actorId:actor.id,actorUsername:actor.username}:decision?{initials:reviewer}:{}),reason:reason.trim(),before:structuredClone(before),after:structuredClone(after),...(!pendingCorrection&&action!=='FAIL'?{acceptedOutput:snapshot}:{}),...(decision?{decisionOutput:snapshot}:{})};
  if(pendingCorrection)return {...accepted,status:'PROPOSED_REVIEW_REQUIRED',reasons:[...accepted.reasons,PENDING_EDIT_NOTICE],reviewState:'PENDING',reviews:[...record.reviews,event],version:record.version+1};
  return {...accepted,reviewState:action==='PASS'?'PASSED':action==='FAIL'?'FAILED':'ACCEPTED',reviews:[...record.reviews,event],version:record.version+1};
 }
 const i=structuredClone(record.intelligence);i.structured=after;if(action!=='REJECT')updateName(i,true);
 if(action!=='REJECT'){
  for(const k of ['country','town','postal','subdivision'] as const)i[k]=candidate(after[k],after[k]?1:0,'HUMAN_REVIEW',[...i[k].evidence,evidence('Human verified value',after[k],1,'HUMAN_REVIEW',`${reviewer}: ${reason}`)],'HUMAN_REVIEW');
  i.conflicts=[];i.notes.push(`Original evidence conflicts acknowledged by ${reviewer}: ${reason}`);i.notes=i.notes.filter(x=>!/require review/i.test(x));
 }
 const computed=action==='REJECT'?record:finalize(record.source,i,ref);
 if(action==='APPROVE'&&computed.status!=='AUTO_TRANSLATED'&&computed.status!=='NAME_ONLY')throw Error('Cannot approve: correct unresolved or invalid components first');
 const event:ReviewEvent={at:new Date().toISOString(),action,reviewer:reviewer.trim(),...(actor?{actorId:actor.id,actorUsername:actor.username}:{}),reason:reason.trim(),before,after};
 return {...record,...computed,...(action==='EDIT'?{status:'PROPOSED_REVIEW_REQUIRED' as const,reasons:[...computed.reasons,PENDING_EDIT_NOTICE]}:{}),reviewState:action==='REJECT'?'REJECTED':action==='APPROVE'?'APPROVED':'PENDING',reviews:[...record.reviews,event],version:record.version+1};
}

export function reviewRecord(record:RecordResult,action:ReviewEvent['action'],reviewer:string,reason:string,edits:Partial<StructuredAddress>|undefined,ref:ReferenceRepository,actor?:{id:string;username:string},options:{orpEdits?:Partial<StructuredAddress>;acknowledgeMissingLines?:boolean;pendingCorrection?:boolean}={}):RecordResult {
 for(const value of [edits,options.orpEdits])if(value!==undefined&&(!value||typeof value!=='object'||Array.isArray(value)))throw Error('Invalid structured address edits');
 if(options.orpEdits&&!record.orp)throw Error('ORP is not enabled for this record');
 if(options.pendingCorrection&&action!=='EDIT')throw Error('Pending corrections require EDIT');
 const bnp=reviewSingleRecord(blockRecord(record),action,reviewer,reason,edits,ref,actor,options.pendingCorrection);
 let next=bnp;
 if(record.orp){const orp=reviewSingleRecord(blockRecord(record,'ORP'),action,reviewer,reason,options.orpEdits,ref,actor,options.pendingCorrection);next={...combineBlocks(record,bnp,orp),reviewState:bnp.reviewState,version:bnp.version,reviews:bnp.reviews};const event=next.reviews.at(-1)!;event.blocks=Object.fromEntries(addressBlocks(next).map(({key,result})=>[key,{before:structuredClone(blockRecord(record,key).intelligence.structured),after:structuredClone(result.intelligence.structured),output:{lines:[...result.hybrid.lines],validation:structuredClone(result.validation),status:result.status,reasons:[...result.reasons]}}]));}
 const warnings=missingHybridLines(next);if(action==='PASS'&&warnings.length){if(options.acknowledgeMissingLines!==true)throw new MissingHybridLinesError(warnings);next.reviews.at(-1)!.acknowledgedMissingLines=warnings;}
 return next;
}
