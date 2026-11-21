import {withAuth} from '@/lib/auth';
import {isStatusFilter,type StatusFilter} from '@/lib/record-selection';
import {dashboard} from '@/db/dashboard';
export const runtime='nodejs';
export const GET=withAuth(async(request:Request,_context:unknown,user)=>{
 const query=new URL(request.url).searchParams,batchId=query.get('batchId')||'',group=query.get('group')||'all';
 if(query.getAll('batchId').length>1||query.getAll('group').length>1||batchId.length>200||group.length>206||!['all','blank'].includes(group)&&!group.startsWith('value:'))return Response.json({error:'Invalid dashboard batch or Group filter'},{status:400});
 const statuses=query.getAll('status');if(statuses.length>100||statuses.some(status=>!isStatusFilter(status)))return Response.json({error:'Invalid dashboard status filters'},{status:400});
 return Response.json(dashboard(user,batchId,group,statuses as StatusFilter[]));
});
