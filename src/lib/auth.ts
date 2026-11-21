import {userEntitlements} from '@/db/entitlements';
import {hasEntitlement,type WorkspaceEntitlement} from './entitlements';
import {randomBytes,randomUUID,scrypt as derive,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import {cookies} from 'next/headers';
import {db} from '@/db/connection';
import {checkLocalMutation} from './api';
import type {AuthUser} from './auth-types';
export const SESSION_COOKIE='mwtsi-session';
const SESSION_MS=8*60*60*1000;
const scrypt=(password:string,salt:string,length:number,parameters:typeof options)=>new Promise<Buffer>((resolve,reject)=>derive(password,salt,length,parameters,(error,key)=>error?reject(error):resolve(key)));
const options={N:32768,r:8,p:1,maxmem:64*1024*1024};
export class AccessError extends Error {constructor(message:string,public status=403){super(message);}}
interface UserRow {id:string;username:string;password_hash:string;role:'Admin'|'User';group_name:string|null;must_change:number;active:number;}
const dto=(u:UserRow):AuthUser=>({id:u.id,username:u.username,role:u.role,group:u.group_name,mustChangePassword:!!u.must_change,active:!!u.active,entitlements:userEntitlements(u.id,u.role)});
export const tokenHash=(s:string)=>createHash('sha256').update(s).digest('hex');
export function authAudit(actor:AuthUser|null,action:string,target:string|null,detail=''){db().prepare('INSERT INTO auth_audit(at,actor_id,actor_username,action,target_id,detail) VALUES (?,?,?,?,?,?)').run(new Date().toISOString(),actor?.id??null,actor?.username??null,action,target,detail);}
export function initializeAuth(){
 if(db().prepare("SELECT value FROM metadata WHERE key='auth-initialized'").get())return;
 const salt=randomBytes(16).toString('hex');const hash='scrypt$'+salt+'$'+scryptSync('123456',salt,64,options).toString('hex');
 db().transaction(()=>{
  if(db().prepare("SELECT value FROM metadata WHERE key='auth-initialized'").get())return;
  db().prepare('INSERT INTO auth_users(id,username,password_hash,role,created_at) VALUES (?,?,?,?,?)').run(randomUUID(),'admin',hash,'Admin',new Date().toISOString());
  db().prepare("INSERT INTO metadata(key,value) VALUES ('auth-initialized','1')").run();
 })();
}
export function validatePassword(value:unknown):asserts value is string {if(typeof value!=='string'||value.length<12||value.length>128)throw new AccessError('Use a password of 12 to 128 characters',400);}
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');const key=await scrypt(password,salt,64,options) as Buffer;return 'scrypt$'+salt+'$'+key.toString('hex');}
async function matches(password:string,hash:string){const [,salt,hex]=hash.split('$');if(!salt||!hex)return false;const key=await scrypt(password,salt,64,options) as Buffer;const expected=Buffer.from(hex,'hex');return expected.length===key.length&&timingSafeEqual(expected,key);}
export function issueSession(userId:string){const token=randomBytes(32).toString('hex');db().prepare('DELETE FROM auth_sessions WHERE expires_at<=?').run(Date.now());db().prepare('INSERT INTO auth_sessions VALUES (?,?,?)').run(tokenHash(token),userId,Date.now()+SESSION_MS);return token;}
export function sessionUser(token:string|undefined){initializeAuth();if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const row=db().prepare('SELECT u.* FROM auth_users u JOIN auth_sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1').get(tokenHash(token),Date.now()) as UserRow|undefined;return row?dto(row):null;}
export function activeUser(id:string){const row=db().prepare('SELECT * FROM auth_users WHERE id=? AND active=1').get(id) as UserRow|undefined;return row?dto(row):null;}
export function assertEntitlement(user:AuthUser,key:WorkspaceEntitlement){if(!hasEntitlement(user,key))throw new AccessError('Workspace entitlement required: '+key);}
export async function currentUser(){return sessionUser((await cookies()).get(SESSION_COOKIE)?.value);}
export async function login(username:unknown,password:unknown){
 initializeAuth();if(typeof username!=='string'||typeof password!=='string'||username.length>64||password.length>128)throw new AccessError('Invalid username or password',401);
 const name=username.trim().toLowerCase(),now=Date.now();
 const attempt=db().prepare('SELECT failures,window_start FROM auth_login_attempts WHERE username=?').get(name) as {failures:number;window_start:number}|undefined;
 if(attempt&&attempt.failures>=5&&now-attempt.window_start<15*60*1000)throw new AccessError('Too many login attempts. Try again in 15 minutes.',429);
 const row=db().prepare('SELECT * FROM auth_users WHERE username=? COLLATE NOCASE').get(name) as UserRow|undefined;
 // Always perform password derivation, including unknown accounts.
 const dummy=db().prepare("SELECT password_hash FROM auth_users WHERE role='Admin' LIMIT 1").get() as {password_hash:string};
 const correct=await matches(password,row?.password_hash??dummy.password_hash);
 if(!row||!row.active||!correct){
  db().prepare('INSERT INTO auth_login_attempts VALUES (?,1,?) ON CONFLICT(username) DO UPDATE SET failures=CASE WHEN ?-window_start>=900000 THEN 1 ELSE failures+1 END,window_start=CASE WHEN ?-window_start>=900000 THEN ? ELSE window_start END').run(name,now,now,now,now);
  throw new AccessError('Invalid username or password',401);
 }
 const fresh=db().prepare('SELECT * FROM auth_users WHERE id=? AND password_hash=? AND active=1').get(row.id,row.password_hash) as UserRow|undefined;if(!fresh)throw new AccessError('Invalid username or password',401);
 db().prepare('DELETE FROM auth_login_attempts WHERE username=?').run(name);const user=dto(fresh);authAudit(user,'LOGIN',user.id);return {user,token:issueSession(user.id)};
}
export function cookieValue(token:string,request:Request,clear=false){const secure=process.env.ADDRESS_SECURE_COOKIES==='true'||new URL(request.url).protocol==='https:';return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear?0:SESSION_MS/1000}${secure?'; Secure':''}`;}
export function authError(error:unknown){const known=error instanceof AccessError;return Response.json({error:known?error.message:'The request could not be completed',...(known&&error.message==='Cross-origin request rejected'?{code:'SERVER_PROCESSING_FAILED',stage:'ORIGIN_VALIDATION'}:{})},{status:known?error.status:500,headers:{'Cache-Control':'no-store'}});}
export function withAuth<R extends Request,C>(handler:(request:R,context:C,user:AuthUser)=>Promise<Response>,adminOnly=false,allowPasswordChange=false,entitlement?:WorkspaceEntitlement){return async(request?:R,context?:C)=>{
 try{const user=await currentUser();if(!user)throw new AccessError('Sign in required',401);if(user.mustChangePassword&&!allowPasswordChange)throw new AccessError('Change your password before continuing',403);if(adminOnly&&user.role!=='Admin')throw new AccessError('Administrator access required');
  if(entitlement)assertEntitlement(user,entitlement);
  if(request&&!['GET','HEAD','OPTIONS'].includes(request.method)){try{checkLocalMutation(request);}catch{throw new AccessError('Cross-origin request rejected');}}
  const response=await handler(request as R,context as C,user);response.headers.set('Cache-Control','private, no-store');response.headers.set('Vary','Cookie');return response;
 }catch(error){return authError(error);}
 };}
export async function changePassword(user:AuthUser,current:unknown,password:unknown){validatePassword(password);if(typeof current!=='string'||current.length>128)throw new AccessError('Current password is incorrect',400);const row=db().prepare('SELECT * FROM auth_users WHERE id=?').get(user.id) as UserRow;
 if(!await matches(current,row.password_hash))throw new AccessError('Current password is incorrect',400);if(await matches(password,row.password_hash))throw new AccessError('Choose a different password',400);const hash=await hashPassword(password);
 return db().transaction(()=>{const changed=db().prepare('UPDATE auth_users SET password_hash=?,must_change=0 WHERE id=? AND password_hash=? AND active=1').run(hash,user.id,row.password_hash);if(!changed.changes)throw new AccessError('Account changed. Sign in again.',409);db().prepare('DELETE FROM auth_sessions WHERE user_id=?').run(user.id);authAudit(user,'PASSWORD_CHANGED',user.id);return issueSession(user.id);})();
}

export function withEntitlement<R extends Request,C>(handler:(request:R,context:C,user:AuthUser)=>Promise<Response>,key:WorkspaceEntitlement){return withAuth(handler,false,false,key);}
