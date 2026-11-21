import {withEntitlement,AccessError} from '@/lib/auth';
import {getExport,exportDto,changeExport} from '@/db/exports';
export const runtime='nodejs';
export const GET=withEntitlement(async(_request:Request,{params}:{params:Promise<{id:string}>},user)=>Response.json(exportDto(getExport(user,(await params).id))),'exportResults');
export const PATCH=withEntitlement(async(request:Request,{params}:{params:Promise<{id:string}>},user)=>{const {action}=await request.json();if(action!=='cancel'&&action!=='retry')throw new AccessError('Choose cancel or retry',400);return Response.json(changeExport(user,(await params).id,action));},'exportResults');
