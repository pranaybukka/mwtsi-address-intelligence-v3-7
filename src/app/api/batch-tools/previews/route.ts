import {AccessError,withAuth} from '@/lib/auth';
import {createCorrection,createReuse,listWorkflowSessions,type BulkRequest} from '@/db/batch-workflows';
import {workflowBody} from '@/lib/workflow-request';
export const runtime='nodejs';
export const POST=withAuth(async(request:Request,_context,user)=>{const body=await workflowBody(request);if(body.kind==='reuse')return Response.json(createReuse(user,body.comparisonId as string,body.positions as number[]));if(body.kind==='correction')return Response.json(createCorrection(user,body as unknown as BulkRequest));throw new AccessError('Choose correction or decision reuse',400);});

export const GET=withAuth(async(request:Request,_context,user)=>Response.json(listWorkflowSessions(user,new URL(request.url).searchParams.get('kind')==='reuse'?'reuse':'correction')));
