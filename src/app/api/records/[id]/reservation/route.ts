import {withAuth,AccessError} from '@/lib/auth';
import {changeReservation} from '@/db/reservations';
export const runtime='nodejs';
function route(action:'claim'|'renew'|'release'){return withAuth(async(request:Request,{params}:{params:Promise<{id:string}>},user)=>{const body=await request.json();if(!body||typeof body!=='object'||Array.isArray(body))throw new AccessError('Invalid reservation request',400);return Response.json(changeReservation(user,(await params).id,action,body.token,body.force===true));});}
export const POST=route('claim');export const PATCH=route('renew');export const DELETE=route('release');
