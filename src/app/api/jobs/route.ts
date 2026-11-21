import type {AuthUser} from '@/lib/auth-types';
import {withEntitlement} from '@/lib/auth';
import {listJobs} from '@/db/jobs';export const runtime='nodejs';async function GETHandler(_request:Request,_context:unknown,user:AuthUser){return Response.json(listJobs(user),{headers:{'Cache-Control':'no-store'}});}

export const GET=withEntitlement(GETHandler,'uploadAddresses');
