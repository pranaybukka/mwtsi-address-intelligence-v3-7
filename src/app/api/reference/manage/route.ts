import {withAuth} from '@/lib/auth';
import {referenceManagement,queueReferenceAction,requireReferenceAdmin} from '@/db/reference-management';import {checkLocalMutation,apiError} from '@/lib/api';export const runtime='nodejs';
async function GETHandler(){try{return Response.json(referenceManagement(),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Reference catalog unavailable'},{status:500});}}
async function POSTHandler(req:Request){try{checkLocalMutation(req);requireReferenceAdmin(req);const body=await req.json();return Response.json(queueReferenceAction(body.action,body.versionId,body.actor,body.reason),{status:202});}catch(e){return apiError(e,e instanceof Error&&e.message==='Administrator token required'?403:409);}}

export const GET=withAuth(GETHandler,true);

export const POST=withAuth(POSTHandler,true);
