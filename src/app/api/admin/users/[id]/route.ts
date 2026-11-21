import {withAuth} from '@/lib/auth';import {saveUser,deleteUser} from '@/db/users';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
export const PATCH=withAuth(async(request:Request,{params}:Context,user)=>Response.json(await saveUser(user,(await params).id,await request.json())),true);
export const DELETE=withAuth(async(_request:Request,{params}:Context,user)=>{deleteUser(user,(await params).id);return Response.json({ok:true});},true);
