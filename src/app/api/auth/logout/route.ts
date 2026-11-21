import {cookies} from 'next/headers';
import {db} from '@/db/connection';
import {withAuth,SESSION_COOKIE,tokenHash,cookieValue,authAudit} from '@/lib/auth';
export const runtime='nodejs';
export const POST=withAuth(async(request:Request,_context:unknown,user)=>{const token=(await cookies()).get(SESSION_COOKIE)?.value;if(token)db().prepare('DELETE FROM auth_sessions WHERE token_hash=?').run(tokenHash(token));authAudit(user,'LOGOUT',user.id);return Response.json({ok:true},{headers:{'Set-Cookie':cookieValue('',request,true)}});},false,true);
