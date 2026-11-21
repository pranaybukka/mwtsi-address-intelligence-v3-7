import {withAuth} from '@/lib/auth';
import {processingSettings} from '@/db/settings';
import {ensureSeed} from '@/db/seed';
import {reference} from '@/lib/reference/sqlite';
import {lookupPostalTown} from '@/lib/enrichment/postalTown';
export const runtime='nodejs';
async function GETHandler(request:Request){
 const params=new URL(request.url).searchParams;const postal=params.get('postal')||'',country=params.get('country')||'';
 if(postal.length>32||country.length>2)return Response.json({error:'Postal code or ISO-2 country is too long'},{status:400});
 try{const enabled=processingSettings().postalLookupEnabled;if(enabled)ensureSeed();const result=lookupPostalTown(postal,country,reference,enabled);return Response.json(result,{headers:{'Cache-Control':'no-store'}});}
 catch{return Response.json({error:'Postal lookup is unavailable. Try again or enter the town manually.'},{status:500});}
}

export const GET=withAuth(GETHandler);
