import {activeUser,assertEntitlement} from '@/lib/auth';
import {hasEntitlement} from '@/lib/entitlements';
import {createHash,randomUUID} from 'node:crypto';
import {db} from './connection';
import {indexed} from './record-index';
import {batchMetadata,defaultQuery,parseRecordQuery,selectedRows,type RecordQuery} from './record-query';
import {getRecord,saveReviewed} from './batches';
import {reservation,assertReservationAccess} from './reservations';
import {processingSettings} from './settings';
import {AccessError,authAudit} from '../lib/auth';
import {requireRecordAccess} from '../lib/access';
import type {AuthUser} from '../lib/auth-types';
import type {RecordResult,StructuredAddress,MissingHybridLine} from '../lib/domain';
import {addressBlocks,blockRecord,missingHybridLines} from '../lib/address-blocks';
import {reviewRecord,PENDING_EDIT_NOTICE} from '../lib/review';
import {canDecide} from '../lib/review-decision';
import {normalize} from '../lib/parser/normalize';
import {resolveCountry} from '../lib/enrichment/country';
import {reference} from '../lib/reference/sqlite';
import {canonical,compareSnapshots,snapshotRecord,proposalState,processingContext,CORRECTION_FIELDS,PROCESSING_VERSION,type ComparisonItem} from '../lib/batch-workflows';
const PREVIEW_MS=30*60*1000;
export const MAX_CORRECTIONS=1000;
const digest=(value:unknown)=>createHash('sha256').update(canonical(value)).digest('hex');
const conflict=(message='The batch changed. Generate a fresh preview before applying.')=>new AccessError(message,409);
interface Session {id:string;kind:'comparison'|'correction'|'reuse';owner_id:string;owner_role:string;owner_group:string|null;target_batch:string;baseline_batch:string|null;created_at:number;expires_at:number;state:'PREVIEW'|'APPLIED';payload:string;}
interface Receipt {updated:number;skipped:number;appliedAt:string;targetBatchId:string;}
interface Header {targetRevision:number;baselineRevision?:number;reference:string;total:number;summary:Record<string,number>;groups?:string[];receipt?:Receipt;}
interface PlanItem {recordId:string;version:number;before:ReturnType<typeof snapshotRecord>;after:ReturnType<typeof snapshotRecord>|null;edits?:StructuredAddress;orpEdits?:StructuredAddress;expected?:string;skip?:string;warnings:MissingHybridLine[];baselineRecordId?:string;baselineVersion?:number;baselineDecisionAt?:string;baselineReviewer?:string;}
const revision=(id:string)=>(db().prepare('SELECT revision FROM batch_revision WHERE batch_id=?').get(id) as {revision:number}|undefined)?.revision||0;
// A prior pending-edit notice is workflow state, not an address finding. All checks and other reasons must reproduce.
const decisionOutput=(state:ReturnType<typeof proposalState>)=>state.map(block=>({...block,reasons:block.reasons.filter(reason=>reason!==PENDING_EDIT_NOTICE)}));
const context=()=>digest({engine:PROCESSING_VERSION,reference:reference.context(),settings:processingSettings()});
function actor(user:AuthUser){const fresh=db().prepare('SELECT role,group_name,must_change FROM auth_users WHERE id=? AND active=1').get(user.id) as {role:string;group_name:string|null;must_change:number}|undefined;if(!fresh||fresh.must_change||fresh.role!==user.role||fresh.group_name!==user.group)throw new AccessError('Your access changed. Sign in again.',403);}
function capability(user:AuthUser,kind:Session['kind']){actor(user);const key=kind==='correction'?'bulkCorrections':'compareBatches';assertEntitlement(user,key);const fresh=activeUser(user.id);if(!fresh)throw new AccessError('Sign in required',401);assertEntitlement(fresh,key);}
function cleanup(){const d=db(),now=Date.now();d.prepare('DELETE FROM workflow_items WHERE session_id IN (SELECT id FROM workflow_sessions WHERE expires_at<=?)').run(now);d.prepare("DELETE FROM workflow_sessions WHERE expires_at<=? AND state='PREVIEW'").run(now);}
function session(user:AuthUser,id:string,kind?:string){
 const row=db().prepare('SELECT * FROM workflow_sessions WHERE id=?').get(id) as Session|undefined;
 if(!row||row.owner_id!==user.id||kind&&row.kind!==kind)throw new AccessError('Preview not found',404);capability(user,row.kind);
 if(row.owner_role!==user.role||row.owner_group!==user.group)throw new AccessError('Your access changed. Generate a new preview.',403);
 batchMetadata(db(),row.target_batch,user);if(row.baseline_batch)batchMetadata(db(),row.baseline_batch,user);
 if(row.expires_at<=Date.now()&&row.state!=='APPLIED')throw new AccessError('This preview expired. Generate a new preview.',410);
 return row;
}
function isStale(row:Session,h:Header){return revision(row.target_batch)!==h.targetRevision||!!row.baseline_batch&&revision(row.baseline_batch)!==h.baselineRevision||context()!==h.reference;}
function store(user:AuthUser,kind:Session['kind'],target:string,baseline:string|null,header:Header,items:unknown[]){
 return db().transaction(()=>{capability(user,kind);batchMetadata(db(),target,user);if(baseline)batchMetadata(db(),baseline,user);if(revision(target)!==header.targetRevision||baseline&&revision(baseline)!==header.baselineRevision||context()!==header.reference)throw conflict();cleanup();const id=randomUUID(),now=Date.now();db().prepare("INSERT INTO workflow_sessions VALUES(?,?,?,?,?,?,?,?,?,'PREVIEW',?)").run(id,kind,user.id,user.role,user.group,target,baseline,now,now+PREVIEW_MS,JSON.stringify(header));const stmt=db().prepare('INSERT INTO workflow_items VALUES(?,?,?,?)');items.forEach((item,index)=>stmt.run(id,index,(item as PlanItem).recordId||null,JSON.stringify(item)));return id;}).immediate();
}
export function workflowBatchOptions(user:AuthUser,search='',page=0){actor(user);if(!hasEntitlement(user,'compareBatches')&&!hasEntitlement(user,'bulkCorrections'))throw new AccessError('Workspace entitlement required: compareBatches or bulkCorrections');
 if(search.length>200||!Number.isInteger(page)||page<0||page>100000)throw new AccessError('Invalid batch search',400);
 if(user.role!=='Admin'&&!user.group?.trim())return {total:0,page,pageSize:50,rows:[]};
 return indexed(d=>{const where="NOT EXISTS(SELECT 1 FROM jobs j WHERE j.id=b.id AND j.status<>'COMPLETED') AND instr(lower(b.filename),?)>0"+(user.role==='Admin'?'':" AND EXISTS(SELECT 1 FROM record_index i WHERE i.batch_id=b.id AND json_extract(i.info,'$.group')=?)");const args=user.role==='Admin'?[search.toLowerCase()]:[search.toLowerCase(),user.group?.trim()?user.group:'\u0000'];const total=(d.prepare('SELECT count(*) n FROM batches b WHERE '+where).get(...args) as {n:number}).n;return {total,page,pageSize:50,rows:d.prepare('SELECT b.id,b.filename,b.created_at FROM batches b WHERE '+where+' ORDER BY b.created_at DESC,b.id LIMIT 50 OFFSET ?').all(...args,page*50)};});
}
export function createComparison(user:AuthUser,baselineId:string,targetId:string){capability(user,'comparison');
 if(typeof baselineId!=='string'||typeof targetId!=='string'||baselineId===targetId)throw new AccessError('Choose two different completed batches',400);
 const data=indexed(d=>{batchMetadata(d,baselineId,user);batchMetadata(d,targetId,user);const rows=(id:string)=>{const args=user.role==='Admin'?[id]:[id,user.group];const where=user.role==='Admin'?'':" AND json_extract(payload,'$.source.Group')=?";const values=[];for(const row of d.prepare('SELECT payload FROM records WHERE batch_id=?'+where+' ORDER BY rowid').iterate(...args) as Iterable<{payload:string}>)values.push(snapshotRecord(JSON.parse(row.payload),digest));return values;};const old=rows(baselineId),now=rows(targetId),items=compareSnapshots(old,now);const summary:Record<string,number>={baselineRecords:old.length,targetRecords:now.length,items:items.length,reuseCandidates:items.filter(i=>i.reuseCandidate).length};for(const item of items)summary[item.category]=(summary[item.category]||0)+1;return {items,header:{targetRevision:revision(targetId),baselineRevision:revision(baselineId),reference:context(),total:items.length,summary,groups:[...new Set(items.map(i=>i.group))]} satisfies Header};});
 const id=store(user,'comparison',targetId,baselineId,data.header,data.items);return comparisonPage(user,id,new URLSearchParams());
}
function pageOptions(params:URLSearchParams){const page=Number(params.get('page')||0),size=20;if(!Number.isInteger(page)||page<0||page>100000)throw new AccessError('Invalid page',400);return {page,size};}
export function comparisonPage(user:AuthUser,id:string,params:URLSearchParams){
 const row=session(user,id,'comparison'),h=JSON.parse(row.payload) as Header,{page,size}=pageOptions(params),q=parseRecordQuery(params),category=params.get('category')||'all';
 const clauses=['session_id=?'],args:unknown[]=[id];if(q.group!=='all'){clauses.push("json_extract(data,'$.group')=?");args.push(q.group==='blank'?'':q.group.slice(6));}if(category!=='all'){clauses.push("json_extract(data,'$.category')=?");args.push(category);}if(q.search){clauses.push("instr(lower(coalesce(json_extract(data,'$.key'),'')||' '||json_extract(data,'$.group')||' '||coalesce(json_extract(data,'$.before.name'),'')||' '||coalesce(json_extract(data,'$.after.name'),'')),?)>0");args.push(q.search.toLowerCase());}if(q.statuses.length){clauses.push("EXISTS(SELECT 1 FROM json_each(coalesce(json_extract(data,'$.after.statuses'),json_extract(data,'$.before.statuses'))) s WHERE s.value IN(SELECT value FROM json_each(?)))");args.push(JSON.stringify(q.statuses));}
 const where=clauses.join(' AND '),total=(db().prepare('SELECT count(*) n FROM workflow_items WHERE '+where).get(...args) as {n:number}).n;
 const items=(db().prepare('SELECT position,data FROM workflow_items WHERE '+where+' ORDER BY position LIMIT ? OFFSET ?').all(...args,size,page*size) as {position:number;data:string}[]).map(i=>({position:i.position,...JSON.parse(i.data) as ComparisonItem}));
 return {id,kind:row.kind,targetBatchId:row.target_batch,targetBatch:batchMetadata(db(),row.target_batch,user),baselineBatchId:row.baseline_batch,baselineBatch:row.baseline_batch?batchMetadata(db(),row.baseline_batch,user):null,createdAt:row.created_at,expiresAt:row.expires_at,stale:isStale(row,h),summary:h.summary,groups:h.groups,page,pageSize:size,total,items};
}
export interface BulkRequest {kind:'correction';targetId:string;query:string;block:'BNP'|'ORP'|'BOTH';field:keyof StructuredAddress;operation:'set'|'replace';match:string;value:string;reason:string;}
function validateBulk(body:BulkRequest){if(!['BNP','ORP','BOTH'].includes(body.block)||!CORRECTION_FIELDS.includes(body.field)||!['set','replace'].includes(body.operation)||typeof body.match!=='string'||body.match.length>10000||typeof body.value!=='string'||body.value.length>10000||body.operation==='replace'&&!normalize(body.match)||typeof body.reason!=='string'||!body.reason.trim()||body.reason.length>2000||typeof body.query!=='string'||body.query.length>6000||typeof body.targetId!=='string')throw new AccessError('Choose a block, field, exact match/replacement and a reason (up to 2,000 characters).',400);}
function previewItem(record:RecordResult,user:AuthUser,edits:StructuredAddress,orpEdits:StructuredAddress|undefined,kind:'correction'|'reuse',reason:string):PlanItem {
 const before=snapshotRecord(record,digest),item:PlanItem={recordId:record.id,version:record.version,before,after:null,edits,orpEdits,warnings:[]};
 if(kind==='correction'&&record.status==='ERROR'){item.skip='Processing error; reprocess this record before bulk correction.';return item;}
 if(!canDecide(record)){item.skip='Already passed; bulk corrections edit only records open for review.';return item;}if(reservation(record.id)){item.skip='Reserved in Record Review. Close the review window before generating this preview.';return item;}
 const next=reviewRecord(record,kind==='reuse'?'PASS':'EDIT',user.username,kind==='reuse'?'':reason,edits,reference,user,{orpEdits,acknowledgeMissingLines:true,pendingCorrection:kind==='correction'});
 item.after=snapshotRecord(next,digest);item.expected=digest(proposalState(next));item.warnings=kind==='reuse'?missingHybridLines(next):[];return item;
}
export function createCorrection(user:AuthUser,body:BulkRequest){capability(user,'correction');
 validateBulk(body);const q=parseRecordQuery(new URLSearchParams(body.query));
 const data=indexed(d=>{batchMetadata(d,body.targetId,user);const records=selectedRows(d,body.targetId,user,q,MAX_CORRECTIONS+1);if(records.length>MAX_CORRECTIONS)throw new AccessError(`Narrow the filters to ${MAX_CORRECTIONS.toLocaleString()} records or fewer per preview. No records were changed.`,400);const items:PlanItem[]=[];
 for(const record of records){const drafts=Object.fromEntries(addressBlocks(record).map(({key,result})=>[key,{...result.intelligence.structured}])) as Record<string,StructuredAddress>;let changed=false;
  for(const {key} of addressBlocks(record)){if(body.block!=='BOTH'&&body.block!==key)continue;const before=drafts[key][body.field],match=normalize(body.match),value=normalize(body.value);let next=body.operation==='set'?(normalize(before)===match?value:before):before.split(match).join(value);if(body.field==='country')next=resolveCountry(next).code||next;if(before!==next){drafts[key][body.field]=next;changed=true;}}
  if(!changed){items.push({recordId:record.id,version:record.version,before:snapshotRecord(record,digest),after:null,skip:'No matching field change in the selected block(s).',warnings:[]});continue;}
  items.push(previewItem(record,user,drafts.BNP,drafts.ORP,'correction',body.reason.trim()));
 }
 const applicable=items.filter(i=>!i.skip).length;return {items,header:{targetRevision:revision(body.targetId),reference:context(),total:items.length,summary:{selected:items.length,applicable,skipped:items.length-applicable}} satisfies Header};});
 const id=store(user,'correction',body.targetId,null,{...data.header,reason:body.reason.trim()} as Header,data.items);return previewPage(user,id,new URLSearchParams());
}
export function createReuse(user:AuthUser,comparisonId:string,positions:number[]){
 if(typeof comparisonId!=='string'||!Array.isArray(positions)||!positions.length||positions.length>MAX_CORRECTIONS||positions.some(p=>!Number.isInteger(p)||p<0)||new Set(positions).size!==positions.length)throw new AccessError('Select unique comparison items (maximum 1,000).',400);
 const comparison=session(user,comparisonId,'comparison'),oldHeader=JSON.parse(comparison.payload) as Header;if(isStale(comparison,oldHeader))throw conflict();
 const data=indexed(()=>{const items:PlanItem[]=[];
 for(const position of positions){const stored=db().prepare('SELECT data FROM workflow_items WHERE session_id=? AND position=?').get(comparisonId,position) as {data:string}|undefined;if(!stored)throw new AccessError('Comparison item not found',404);const pair=JSON.parse(stored.data) as ComparisonItem;
  if(!pair.reuseCandidate||!pair.before||!pair.after)throw new AccessError('Select only items available for a decision-reuse preview.',400);
  const base=getRecord(pair.before.id),target=getRecord(pair.after.id);if(!base||!target||base.version!==pair.before.version||target.version!==pair.after.version)throw conflict();requireRecordAccess(user,base);requireRecordAccess(user,target);
  const item=previewItem(target,user,{...base.intelligence.structured},base.orp?{...base.orp.intelligence.structured}:undefined,'reuse','');item.baselineRecordId=base.id;item.baselineVersion=base.version;item.baselineDecisionAt=pair.before.decision?.at;item.baselineReviewer=pair.before.decision?.actorUsername||pair.before.decision?.reviewer;
  if(!item.skip&&(canonical(processingContext(base))!==canonical(processingContext(target))||addressBlocks(target).some(({result:r})=>r.intelligence.referenceSignature!==reference.context())||digest(decisionOutput(proposalState(base)))!==digest(decisionOutput(item.after!.proposals)))){item.skip='The prior output/checks cannot be reproduced under the current processing context. Review manually.';item.after=null;}
  items.push(item);
 }
 if(isStale(comparison,oldHeader))throw conflict();const applicable=items.filter(i=>!i.skip).length;return {items,header:{targetRevision:oldHeader.targetRevision,baselineRevision:oldHeader.baselineRevision,reference:context(),total:items.length,summary:{selected:items.length,applicable,skipped:items.length-applicable}} satisfies Header};});
 const id=store(user,'reuse',comparison.target_batch,comparison.baseline_batch,data.header,data.items);return previewPage(user,id,new URLSearchParams());
}
export function previewPage(user:AuthUser,id:string,params:URLSearchParams){const row=session(user,id);if(row.kind==='comparison')throw new AccessError('Choose a correction preview',400);const h=JSON.parse(row.payload) as Header,{page,size}=pageOptions(params);return {id,kind:row.kind,targetBatchId:row.target_batch,targetBatch:batchMetadata(db(),row.target_batch,user),state:row.state,summary:h.summary,receipt:h.receipt,expiresAt:row.expires_at,stale:row.state==='PREVIEW'&&isStale(row,h),page,pageSize:size,total:h.total,items:(db().prepare('SELECT position,data FROM workflow_items WHERE session_id=? ORDER BY position LIMIT ? OFFSET ?').all(id,size,page*size) as {position:number;data:string}[]).map(i=>({position:i.position,...JSON.parse(i.data) as PlanItem})),missingLineRecords:(db().prepare("SELECT count(*) n FROM workflow_items WHERE session_id=? AND json_array_length(json_extract(data,'$.warnings'))>0 AND json_extract(data,'$.skip') IS NULL").get(id) as {n:number}).n};}
export function applyPreview(user:AuthUser,id:string,confirmed:boolean,acknowledgeMissingLines=false){
 if(confirmed!==true)throw new AccessError('Confirm the preview before applying it',400);
 return db().transaction(()=>{const row=session(user,id);if(row.kind==='comparison')throw new AccessError('Choose a correction preview',400);const h=JSON.parse(row.payload) as Header&{reason?:string};if(row.state==='APPLIED')return h.receipt!;if(isStale(row,h))throw conflict();
 const items=(db().prepare('SELECT data FROM workflow_items WHERE session_id=? ORDER BY position').all(id) as {data:string}[]).map(i=>JSON.parse(i.data) as PlanItem).filter(i=>!i.skip);if(!items.length)throw new AccessError('This preview contains no applicable changes',400);
 if(row.kind==='reuse'&&items.some(i=>i.warnings.length)&&acknowledgeMissingLines!==true)throw new AccessError('Acknowledge the missing 1/ or 3/ lines before reusing these passed decisions.',409);
 const ready=items.map(item=>{const record=getRecord(item.recordId);if(!record||record.version!==item.version||!canDecide(record))throw conflict();requireRecordAccess(user,record);assertReservationAccess(record.id,undefined,user);
  if(item.baselineRecordId){const base=getRecord(item.baselineRecordId);if(!base||base.version!==item.baselineVersion)throw conflict();requireRecordAccess(user,base);}
  const next=reviewRecord(record,row.kind==='reuse'?'PASS':'EDIT',user.username,row.kind==='reuse'?'':h.reason!,item.edits,reference,user,{orpEdits:item.orpEdits,acknowledgeMissingLines,pendingCorrection:row.kind==='correction'});if(digest(proposalState(next))!==item.expected)throw conflict('The proposed output changed. Generate a fresh preview.');
  next.reviews.at(-1)!.workflow={id:row.id,kind:row.kind==='reuse'?'REUSED_DECISION':'BULK_CORRECTION',...(row.baseline_batch?{baselineBatchId:row.baseline_batch,baselineRecordId:item.baselineRecordId,baselineVersion:item.baselineVersion,baselineDecisionAt:item.baselineDecisionAt,baselineReviewer:item.baselineReviewer}:{})};return {next,item};});
 for(const {next,item} of ready)saveReviewed(next,item.version);
 const receipt:Receipt={updated:ready.length,skipped:h.summary.skipped,appliedAt:new Date().toISOString(),targetBatchId:row.target_batch};db().prepare("UPDATE workflow_sessions SET state='APPLIED',payload=? WHERE id=?").run(JSON.stringify({...h,receipt}),id);authAudit(user,row.kind==='reuse'?'BATCH_DECISIONS_REUSED':'BULK_CORRECTION_APPLIED',id,JSON.stringify({batchId:row.target_batch,count:ready.length}));return receipt;
 }).immediate();
}
export function listWorkflowSessions(user:AuthUser,kind:'comparison'|'correction'|'reuse'){
 capability(user,kind);const rows=db().prepare("SELECT * FROM workflow_sessions WHERE owner_id=? AND owner_role=? AND owner_group IS ? AND kind=? AND (expires_at>? OR state='APPLIED') ORDER BY created_at DESC LIMIT 12").all(user.id,user.role,user.group,kind,Date.now()) as Session[];
 return rows.flatMap(row=>{try{batchMetadata(db(),row.target_batch,user);if(row.baseline_batch)batchMetadata(db(),row.baseline_batch,user);return [{id:row.id,kind:row.kind,targetBatchId:row.target_batch,baselineBatchId:row.baseline_batch,createdAt:row.created_at,expiresAt:row.expires_at,state:row.state,summary:(JSON.parse(row.payload) as Header).summary}];}catch{return [];}});
}
