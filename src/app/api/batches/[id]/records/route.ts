import {withAuth} from '@/lib/auth';
import {batchPage,parseRecordQuery} from '@/db/record-query';
export const runtime='nodejs';
export const GET=withAuth(async(request:Request,{params}:{params:Promise<{id:string}>},user)=>{
 const query=new URL(request.url).searchParams;return Response.json(batchPage(user,(await params).id,parseRecordQuery(query),Number(query.get('page')||0),Number(query.get('pageSize')||15)));
});
