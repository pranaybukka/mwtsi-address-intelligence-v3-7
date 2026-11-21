import {withAuth} from '@/lib/auth';
import {workflowBatchOptions} from '@/db/batch-workflows';
export const runtime='nodejs';
export const GET=withAuth(async(request:Request,_context,user)=>{const q=new URL(request.url).searchParams;return Response.json(workflowBatchOptions(user,q.get('search')||'',Number(q.get('page')||0)));});
