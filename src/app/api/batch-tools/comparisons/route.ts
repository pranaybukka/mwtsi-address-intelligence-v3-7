import {withAuth} from '@/lib/auth';
import {createComparison,listWorkflowSessions} from '@/db/batch-workflows';
import {workflowBody} from '@/lib/workflow-request';
export const runtime='nodejs';
export const POST=withAuth(async(request:Request,_context,user)=>{const body=await workflowBody(request);return Response.json(createComparison(user,body.baselineId as string,body.targetId as string));});

export const GET=withAuth(async(_request:Request,_context,user)=>Response.json(listWorkflowSessions(user,'comparison')));
