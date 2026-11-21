import type {ReportDirection} from '@/lib/report-navigation-types';
import {withAuth} from '@/lib/auth';
import {navigateReport} from '@/db/report-navigation';
import {parseRecordQuery} from '@/db/record-query';
export const runtime='nodejs';
export const GET=withAuth(async(request:Request,{params}:{params:Promise<{id:string}>},user)=>{
 const query=new URL(request.url).searchParams,direction=query.get('direction')||'current';
 if(!['current','previous','next','after'].includes(direction))return Response.json({error:'Invalid report direction'},{status:400});
 return Response.json(navigateReport(user,(await params).id,parseRecordQuery(query),query.get('recordId')||'',direction as ReportDirection,Number(query.get('pageSize')||15)));
});
