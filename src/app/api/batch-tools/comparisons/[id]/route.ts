import {withAuth} from '@/lib/auth';
import {comparisonPage} from '@/db/batch-workflows';
export const runtime='nodejs';
export const GET=withAuth(async(request:Request,{params}:{params:Promise<{id:string}>},user)=>Response.json(comparisonPage(user,(await params).id,new URL(request.url).searchParams)));
