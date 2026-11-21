import {db} from './connection';
import {AccessError,activeUser,assertEntitlement} from '@/lib/auth';
import type {AuthUser} from '@/lib/auth-types';
import type {AddressInput} from '@/lib/domain';
export function requireUploadGroup(user:AuthUser){assertEntitlement(user,'uploadAddresses');if(user.role==='User'&&!user.group?.trim())throw new AccessError('An assigned Group is required before uploading. Ask your Admin to assign one.');}
export function checkUploadRows(user:AuthUser,rows:AddressInput[]){requireUploadGroup(user);if(user.role==='User'&&rows.some(r=>r.Group!==user.group))throw new AccessError('Every uploaded row must have Group exactly matching your assignment. No rows were imported.');}
export function ownResource(kind:string,id:string,user:AuthUser){db().prepare('INSERT OR REPLACE INTO workspace_resource_owners VALUES(?,?,?,?,?)').run(kind,id,user.id,user.role==='User'?user.group:null,Date.now());}
export function resourceOwner(kind:string,id:string){return db().prepare('SELECT owner_id,group_name FROM workspace_resource_owners WHERE kind=? AND resource_id=?').get(kind,id) as {owner_id:string;group_name:string|null}|undefined;}
export function canUseResource(kind:string,id:string,user:AuthUser){if(user.role==='Admin')return true;const row=resourceOwner(kind,id);return !!row&&row.owner_id===user.id&&!!user.group?.trim()&&row.group_name===user.group;}
export function requireResource(kind:string,id:string,user:AuthUser){if(!canUseResource(kind,id,user))throw new AccessError('Upload resource not found',404);}
export function uploadJobOwnerActive(id:string){const row=resourceOwner('job',id);if(!row)return true;const user=activeUser(row.owner_id);if(!user||user.mustChangePassword)return false;try{requireUploadGroup(user);return user.role==='Admin'||user.group===row.group_name}catch{return false}}
