import {randomBytes} from 'node:crypto';
import {db} from './connection';
import {getRecord} from './batches';
import {assertBatchComplete} from './jobs';
import {requireRecordAccess} from '../lib/access';
import {canDecide} from '../lib/review-decision';
import {AccessError,authAudit,tokenHash} from '../lib/auth';
import type {AuthUser} from '../lib/auth-types';
export const RESERVATION_MS=120000;
interface Reservation {record_id:string;user_id:string;username:string;token_hash:string;expires_at:number;}
export function reservation(id:string,now=Date.now()){return db().prepare('SELECT * FROM record_reservations WHERE record_id=? AND expires_at>?').get(id,now) as Reservation|undefined;}
function visible(row:Reservation|undefined,user:AuthUser){return row?{ownerUsername:row.username,expiresAt:row.expires_at,mine:row.user_id===user.id}:null;}
export function assertReservationAccess(id:string,token?:string,user?:Pick<AuthUser,'id'>){
 if(token!==undefined&&(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)))throw new AccessError('Invalid reservation token',400);
 const row=reservation(id);if(row){if(!user||row.user_id!==user.id||!token||tokenHash(token)!==row.token_hash)throw new AccessError(`Reserved by ${row.username}. Reload or ask an Admin to release the reservation.`,409);}
 else if(token)throw new AccessError('Reservation expired. Reload and reserve the record before saving.',409);
}
export function releaseDecisionReservation(id:string,user?:Pick<AuthUser,'id'>){if(user)db().prepare('DELETE FROM record_reservations WHERE record_id=? AND user_id=?').run(id,user.id);}
export function changeReservation(user:AuthUser,id:string,action:'claim'|'renew'|'release',token?:string,force=false,now=Date.now()){
 if(token!==undefined&&(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)))throw new AccessError('Invalid reservation token',400);
 return db().transaction(()=>{
  const record=getRecord(id);if(!record)throw new AccessError('Record not found',404);requireRecordAccess(user,record);assertBatchComplete(id.slice(0,id.lastIndexOf(':')));
  const current=reservation(id,now);
  if(action==='release'){
   if(force){if(user.role!=='Admin')throw new AccessError('Administrator access required');if(current)authAudit(user,'RECORD_RESERVATION_RELEASED',id,JSON.stringify({previousOwnerId:current.user_id}));db().prepare('DELETE FROM record_reservations WHERE record_id=?').run(id);return {released:true};}
   if(current&&(!token||current.user_id!==user.id||tokenHash(token)!==current.token_hash))throw new AccessError('Reservation belongs to another review window',409);
   db().prepare('DELETE FROM record_reservations WHERE record_id=? AND user_id=?').run(id,user.id);return {released:true};
  }
  if(!canDecide(record))throw new AccessError('This record already has a passed decision',409);
  if(action==='renew'){
   assertReservationAccess(id,token,user);if(!current||!token)throw new AccessError('Reservation expired. Reload and reserve the record before saving.',409);
   db().prepare('UPDATE record_reservations SET expires_at=? WHERE record_id=?').run(now+RESERVATION_MS,id);
   return {reservation:visible({...current,expires_at:now+RESERVATION_MS},user)};
  }
  if(current){if(token&&current.user_id===user.id&&tokenHash(token)===current.token_hash)return {record,reservation:visible(current,user),token};throw new AccessError(`Reserved by ${current.username}. Wait for release or ask an Admin.`,409);}
  const nextToken=token||randomBytes(32).toString('hex');const row={record_id:id,user_id:user.id,username:user.username,token_hash:tokenHash(nextToken),expires_at:now+RESERVATION_MS};
  db().prepare('INSERT OR REPLACE INTO record_reservations VALUES(?,?,?,?,?)').run(id,user.id,user.username,row.token_hash,row.expires_at);
  return {record,reservation:visible(row,user),token:nextToken};
 }).immediate();
}
