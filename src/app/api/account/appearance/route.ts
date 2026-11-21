import {withAuth,AccessError} from '@/lib/auth';
import {userAppearance,saveUserAppearance} from '@/db/appearance';
export const runtime='nodejs';
export const GET=withAuth(async(_request:Request,_context:unknown,user)=>Response.json(userAppearance(user.id)));
export const PATCH=withAuth(async(request:Request,_context:unknown,user)=>{
 const raw=await request.text();
 if(raw.length>1024)throw new AccessError('Appearance request is too large',400);
 let value:unknown;
 try{value=JSON.parse(raw);}catch{throw new AccessError('Invalid appearance request',400);}
 return Response.json(saveUserAppearance(user.id,value));
});
