import {withAuth,changePassword,cookieValue} from '@/lib/auth';
export const runtime='nodejs';
export const POST=withAuth(async(request:Request,_context:unknown,user)=>{const body=await request.json();const token=await changePassword(user,body.currentPassword,body.password);return Response.json({ok:true},{headers:{'Set-Cookie':cookieValue(token,request)}});},false,true);
