import {withAuth} from '@/lib/auth';
import {processingSettings,saveProcessingSettings} from '@/db/settings';
import {checkLocalMutation,apiError} from '@/lib/api';
export const runtime='nodejs';
async function GETHandler(){return Response.json(processingSettings(),{headers:{'Cache-Control':'no-store'}});}
async function PATCHHandler(request:Request){try{checkLocalMutation(request);return Response.json(saveProcessingSettings(await request.json()));}catch(e){return apiError(e,e instanceof Error&&e.message==='Cross-origin request rejected'?403:400);}}

export const GET=withAuth(GETHandler);

export const PATCH=withAuth(PATCHHandler,true);
