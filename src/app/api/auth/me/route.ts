import {withAuth} from '@/lib/auth';
export const runtime='nodejs';
export const GET=withAuth(async(_request,_context,user)=>Response.json({user}),false,true);
