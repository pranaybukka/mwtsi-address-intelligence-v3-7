import {withAuth} from '@/lib/auth';
import {expandedManifest,referenceSnapshot,referenceQualityPolicy} from '@/lib/reference/expanded';
export const runtime='nodejs';
async function GETHandler(){try{const manifest=expandedManifest();return Response.json(manifest?{status:'INSTALLED',qualityPolicy:referenceQualityPolicy,snapshot:referenceSnapshot(),attribution:manifest.attribution,files:manifest.files,coverage:manifest.stats.coverage}:{status:'STARTER_ONLY',message:'Starter reference active. Run npm run reference:install to install the GeoNames reference.'},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({status:'UNAVAILABLE',message:'Expanded reference could not be read. Stop the app and reinstall the reference.'},{status:500});}}

export const GET=withAuth(GETHandler);
