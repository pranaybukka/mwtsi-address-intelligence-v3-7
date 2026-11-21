import {userEntitlements,storeEntitlements} from './entitlements';
import {validateEntitlements} from '@/lib/entitlements';
import {randomUUID} from 'node:crypto';
import {db} from './connection';
import {AccessError,authAudit,hashPassword,validatePassword} from '@/lib/auth';
import {AuthUser} from '@/lib/auth-types';
import {datasetGroups} from '@/lib/access';
export function listUsers(){const rows=db().prepare('SELECT id,username,role,group_name AS "group",must_change AS mustChangePassword,active,created_at AS createdAt FROM auth_users ORDER BY username COLLATE NOCASE').all() as AuthUser[];return rows.map(row=>({...row,entitlements:userEntitlements(row.id,row.role)}));}
export async function saveUser(actor:AuthUser,id:string|null,body:Record<string,unknown>){
 if(typeof body.username!=='string'||! /^[a-zA-Z0-9._-]{1,64}$/.test(body.username))throw new AccessError('Username must be 1–64 letters, numbers, dots, underscores or hyphens',400);
 if(body.role!=='Admin'&&body.role!=='User')throw new AccessError('Choose Admin or User',400);
 if(typeof body.active!=='boolean')throw new AccessError('Choose an active status',400);
 const group=body.role==='User'?(body.group??null):null;if(group!==null&&(typeof group!=='string'||!datasetGroups().includes(group)))throw new AccessError('Choose a Group from a loaded dataset',400);
 let entitlementValues;try{entitlementValues=body.entitlements===undefined?undefined:validateEntitlements(body.entitlements,id?userEntitlements(id,'User'):undefined);}catch(e){throw new AccessError((e as Error).message,400);}
 const password=body.password;if(!id||password!==undefined)validatePassword(password);const hash=typeof password==='string'?await hashPassword(password):null;
 return db().transaction(()=>{
  const old=id?db().prepare('SELECT id,role,active,group_name FROM auth_users WHERE id=?').get(id) as {id:string;role:string;active:number;group_name:string|null}|undefined:null;
  if(id&&!old)throw new AccessError('User not found',404);
  if(id===actor.id&&(body.role!=='Admin'||!body.active))throw new AccessError('You cannot disable or demote your own account',400);
  if(old?.role==='Admin'&&old.active&&(body.role!=='Admin'||!body.active)){const count=db().prepare("SELECT count(*) AS n FROM auth_users WHERE role='Admin' AND active=1").get() as {n:number};if(count.n<=1)throw new AccessError('Keep at least one active Admin',400);}
  const duplicate=db().prepare('SELECT id FROM auth_users WHERE username=? COLLATE NOCASE AND id<>?').get(body.username,id??'');if(duplicate)throw new AccessError('Username already exists',409);
  const target=id??randomUUID();
  if(id){db().prepare('UPDATE auth_users SET username=?,role=?,group_name=?,active=? WHERE id=?').run(body.username,body.role,group,Number(body.active),id);if(hash)db().prepare('UPDATE auth_users SET password_hash=?,must_change=1 WHERE id=?').run(hash,id);db().prepare('DELETE FROM auth_sessions WHERE user_id=?').run(id);}
  else db().prepare('INSERT INTO auth_users(id,username,password_hash,role,group_name,active,created_at) VALUES (?,?,?,?,?,?,?)').run(target,body.username,hash,body.role,group,Number(body.active),new Date().toISOString());
  if(entitlementValues)storeEntitlements(target,entitlementValues);
  authAudit(actor,id?'USER_UPDATED':'USER_CREATED',target,JSON.stringify({username:body.username,role:body.role,group,active:body.active,passwordReset:!!hash,...(entitlementValues?{entitlements:entitlementValues}:{})}));return {id:target};
 })();
}
export function deleteUser(actor:AuthUser,id:string){db().transaction(()=>{if(id===actor.id)throw new AccessError('You cannot delete your own account',400);const old=db().prepare('SELECT role,active FROM auth_users WHERE id=?').get(id) as {role:string;active:number}|undefined;if(!old)throw new AccessError('User not found',404);if(old.role==='Admin'&&old.active){const count=db().prepare("SELECT count(*) AS n FROM auth_users WHERE role='Admin' AND active=1").get() as {n:number};if(count.n<=1)throw new AccessError('Keep at least one active Admin',400);}db().prepare('DELETE FROM auth_sessions WHERE user_id=?').run(id);db().prepare('DELETE FROM auth_user_entitlements WHERE user_id=?').run(id);db().prepare('DELETE FROM auth_users WHERE id=?').run(id);authAudit(actor,'USER_DELETED',id);})();}
