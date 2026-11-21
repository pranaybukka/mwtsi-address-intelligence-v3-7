import {missingHybridLines} from '@/lib/address-blocks';
import {getRecord} from '@/db/batches';
import {indexed} from '@/db/record-index';
import {db} from '@/db/connection';
import {pendingSelection} from '@/db/record-query';
import {AccessError} from '@/lib/auth';
import {visibleBatch,scopedBatch} from '@/lib/access';
import {AuthUser} from '@/lib/auth-types';
import {withAuth} from '@/lib/auth';
import {acceptPendingBatch} from '@/db/batches';import {apiError,checkLocalMutation} from '@/lib/api';
export const runtime='nodejs';
async function POSTHandler(req:Request,{params}:{params:Promise<{id:string}>},user:AuthUser){try{checkLocalMutation(req);const body=await req.json() as {action?:'PASS'|'ACCEPT';initials?:string;reviewer?:string;reason?:string;acknowledgeMissingLines?:boolean;allPending?:boolean;expectedRevision?:number;selection:{id:string;version:number}[]};
 const id=(await params).id;if(body.allPending){if(body.reason!==undefined&&body.reason!=='')throw new AccessError('Pass does not require or accept a reason',400);if(body.action!=='PASS')throw new AccessError('Choose Pass for all pending records',400);if(!Number.isInteger(body.expectedRevision))throw new AccessError('Reload the batch before passing pending records',409);const updated=db().transaction(()=>{const revision=(db().prepare('SELECT revision FROM batch_revision WHERE batch_id=?').get(id) as {revision:number}|undefined)?.revision||0;if(revision!==body.expectedRevision)throw new AccessError('Batch changed. Reload and confirm the current pending records.',409);const selection=pendingSelection(user,id);if(!selection.length)throw new AccessError('No pending records remain',409);acceptPendingBatch(id,selection,user.username,'','PASS',user,body.acknowledgeMissingLines===true);return selection.length;}).immediate();return Response.json({updated});}const visible=visibleBatch(user,id);if(!visible)throw new AccessError('Batch not found',404);if(user.role==='User'&&body.action!=='PASS')throw new AccessError('Users can only pass selected records');const allowed=new Set(visible.records.map(record=>record.id));if(!Array.isArray(body.selection)||body.selection.some(item=>!allowed.has(item.id)))throw new AccessError('Record selection is outside your access');
 if(body.action&&body.action!=='PASS'&&body.action!=='ACCEPT')throw Error('Invalid batch decision');const pass=body.action==='PASS',reviewer=user.username,reason=pass?(body.reason??''):body.reason;
 if(typeof reason!=='string')throw Error('A valid reason value is required');return Response.json(scopedBatch(user,acceptPendingBatch(id,body.selection,reviewer,reason,pass?'PASS':'ACCEPT',user,body.acknowledgeMissingLines===true)));
 }catch(e){return apiError(e,e instanceof Error&&e.message.startsWith('CONFLICT')?409:400);}}

export const POST=withAuth(POSTHandler);

export const GET=withAuth(async(_request:Request,{params}:{params:Promise<{id:string}>},user)=>{const id=(await params).id;return Response.json(indexed(d=>{const selection=pendingSelection(user,id);let count=0;const examples:string[]=[];for(const item of selection){const r=getRecord(item.id)!;const warnings=missingHybridLines(r);if(warnings.length){count++;if(examples.length<20)examples.push(`${r.source.recordKey||r.id}: ${warnings.map(w=>`${w.block} missing ${w.missing.join(' and ')}`).join('; ')}`);}}const revision=(d.prepare('SELECT revision FROM batch_revision WHERE batch_id=?').get(id) as {revision:number}|undefined)?.revision||0;return {revision,total:selection.length,warnings:{count,examples}};}));});
