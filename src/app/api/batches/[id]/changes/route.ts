import {withEntitlement} from '@/lib/auth';
import {changesSummary} from '@/db/changes';
export const runtime='nodejs';
export const GET=withEntitlement(async(request:Request,{params}:{params:Promise<{id:string}>},user)=>Response.json(changesSummary(user,(await params).id,new URL(request.url).searchParams)),'exportResults');
