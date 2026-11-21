import {withAuth} from '@/lib/auth';
import {previewPage,applyPreview} from '@/db/batch-workflows';
import {workflowBody} from '@/lib/workflow-request';
export const runtime='nodejs';
export const GET=withAuth(async(request:Request,{params}:{params:Promise<{id:string}>},user)=>Response.json(previewPage(user,(await params).id,new URL(request.url).searchParams)));
export const POST=withAuth(async(request:Request,{params}:{params:Promise<{id:string}>},user)=>{const body=await workflowBody(request);return Response.json(applyPreview(user,(await params).id,body.confirmed===true,body.acknowledgeMissingLines===true));});
