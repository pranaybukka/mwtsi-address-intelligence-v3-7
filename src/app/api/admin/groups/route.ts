import {withAuth} from '@/lib/auth';import {datasetGroups} from '@/lib/access';
export const runtime='nodejs';
export const GET=withAuth(async()=>Response.json(datasetGroups()),true);

import {createGroups} from '@/db/groups';
export const POST=withAuth(async(request:Request,_context:unknown,user)=>{const body=await request.json();return Response.json(createGroups(user,[body.name]),{status:201});},true);
