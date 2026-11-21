import {withEntitlement} from '@/lib/auth';
import {db} from '@/db/connection';export const runtime='nodejs';async function GETHandler(){const row=db().prepare("SELECT value FROM metadata WHERE key='worker-health'").get() as {value:string}|undefined;const health=row?JSON.parse(row.value):null;return Response.json({online:!!health&&Date.now()-Date.parse(health.at)<45000,lastSeen:health?.at||null},{headers:{'Cache-Control':'no-store'}});}

export const GET=withEntitlement(GETHandler,'uploadAddresses');
