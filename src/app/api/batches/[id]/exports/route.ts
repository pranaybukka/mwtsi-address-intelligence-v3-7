import {withEntitlement,AccessError} from '@/lib/auth';
import {queueExport} from '@/db/exports';
export const runtime='nodejs';
export const POST=withEntitlement(async(request:Request,{params}:{params:Promise<{id:string}>},user)=>{
 const body=await request.json();if(!body||typeof body.query!=='string'||body.query.length>20000)throw new AccessError('Invalid export selection',400);
 return Response.json(queueExport(user,(await params).id,new URLSearchParams(body.query),body.requestKey),{status:202});
},'exportResults');
