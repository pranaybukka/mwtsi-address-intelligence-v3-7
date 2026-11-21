import {assertReservationAccess,releaseDecisionReservation} from '@/db/reservations';
import {db} from '@/db/connection';
import {AccessError} from '@/lib/auth';
import {requireRecordAccess} from '@/lib/access';
import {AuthUser} from '@/lib/auth-types';
import {withAuth} from '@/lib/auth';
import {getRecord,saveReviewed} from '@/db/batches';
import {reviewRecord} from '@/lib/review';import {reference} from '@/lib/reference/sqlite';
import {apiError,checkLocalMutation} from '@/lib/api';import {ReviewEvent,StructuredAddress} from '@/lib/domain';
export const runtime='nodejs';
async function PATCHHandler(req:Request,{params}:{params:Promise<{id:string}>},user:AuthUser){try{
 checkLocalMutation(req);const record=getRecord((await params).id);if(!record)return Response.json({error:'Record not found'},{status:404});
 requireRecordAccess(user,record);const body=await req.json() as {action:ReviewEvent['action'];initials?:string;reviewer?:string;reason?:string;edits?:Partial<StructuredAddress>;version:number;reservationToken?:string;orpEdits?:Partial<StructuredAddress>;acknowledgeMissingLines?:boolean};
 if(user.role==='User'&&!['PASS','FAIL','EDIT'].includes(body.action))throw new AccessError('Users can only edit, pass or fail');
 if(body.version!==record.version)throw Error('CONFLICT: Record changed; reload');const modern=body.action==='PASS'||body.action==='FAIL';
 // Client-supplied reviewer/initials never determine attribution.
 const reviewer=user.username;const reason=modern?(body.reason??''):body.reason;
 if(typeof reason!=='string')throw Error('A valid reason value is required');
 const next=db().transaction(()=>{assertReservationAccess(record.id,body.reservationToken,user);const next=reviewRecord(record,body.action,reviewer,reason,body.edits,reference,user,{orpEdits:body.orpEdits,acknowledgeMissingLines:body.acknowledgeMissingLines});saveReviewed(next,body.version);if(modern||body.action==='ACCEPT'||body.action==='APPROVE'||body.action==='REJECT')releaseDecisionReservation(record.id,user);return next;}).immediate();return Response.json(next);
 }catch(e){return apiError(e,e instanceof Error&&e.message.startsWith('CONFLICT')?409:400);}}

export const PATCH=withAuth(PATCHHandler);

export const GET=withAuth(async(_request:Request,{params}:{params:Promise<{id:string}>},user)=>{const record=getRecord((await params).id);if(!record)throw new AccessError('Record not found',404);requireRecordAccess(user,record);return Response.json(record);});
