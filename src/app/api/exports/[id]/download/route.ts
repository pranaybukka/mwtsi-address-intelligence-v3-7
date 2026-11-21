import {db} from '@/db/connection';
import fs from 'node:fs';
import path from 'node:path';
import {Readable} from 'node:stream';
import {withEntitlement,AccessError,authAudit} from '@/lib/auth';
import {getExport,exportDirectory} from '@/db/exports';
export const runtime='nodejs';
export const GET=withEntitlement(async(_request:Request,{params}:{params:Promise<{id:string}>},user)=>{
 const row=getExport(user,(await params).id);if(row.expires_at<=Date.now()||row.status==='EXPIRED')throw new AccessError('This export has expired. Prepare a new export.',410);
 if(row.status!=='COMPLETED')throw new AccessError('The export is not ready for download',409);
 if(!row.file_path||path.dirname(path.resolve(row.file_path))!==path.resolve(exportDirectory())||!fs.existsSync(row.file_path)){db().prepare("UPDATE export_jobs SET status='FAILED',file_path=NULL,error='The export file is unavailable. Retry the export.' WHERE id=? AND status='COMPLETED'").run(row.id);throw new AccessError('The export file is unavailable. Retry the export.',410);}
 const stat=fs.lstatSync(row.file_path);if(!stat.isFile()||stat.isSymbolicLink())throw new AccessError('Export file unavailable',410);
 authAudit(user,'EXPORT_DOWNLOADED',row.id,JSON.stringify({batchId:row.batch_id}));
 return new Response(Readable.toWeb(fs.createReadStream(row.file_path)) as ReadableStream,{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Length':String(stat.size),'Content-Disposition':`attachment; filename="${JSON.parse(row.options).mode==='full'?'hybrid-address-results.xlsx':JSON.parse(row.options).mode==='changes'?'hybrid-address-changes.xlsx':'hybrid-address-source-hybrid.xlsx'}"`}});
},'exportResults');
