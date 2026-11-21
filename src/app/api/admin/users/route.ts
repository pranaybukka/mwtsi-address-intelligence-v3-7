import {withAuth} from '@/lib/auth';import {listUsers,saveUser} from '@/db/users';
export const runtime='nodejs';
export const GET=withAuth(async()=>Response.json(listUsers()),true);
export const POST=withAuth(async(request:Request,_context:unknown,user)=>Response.json(await saveUser(user,null,await request.json()),{status:201}),true);
