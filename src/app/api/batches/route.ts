import {checkUploadRows,requireResource,ownResource} from '@/db/workspace-resources';
import {visibleBatches} from '@/lib/access';
import {AuthUser} from '@/lib/auth-types';
import {withAuth,withEntitlement,AccessError} from '@/lib/auth';
import {createHash} from 'node:crypto';
import {queueBatch,jobByRequest} from '@/db/jobs';
import {draft} from '@/db/uploads';
import {db} from '@/db/connection';
import {randomUUID} from 'node:crypto';
import {NextRequest} from 'next/server';
import {createBatch,listBatches} from '@/db/batches';
import {importWorkbook,UPLOAD_LIMIT} from '@/lib/excel/import';
import {checkLocalMutation} from '@/lib/api';
import {UploadError,uploadName,checkWorkbookName} from '@/lib/upload-errors';
export const runtime='nodejs';
async function GETHandler(_request:Request,_context:unknown,user:AuthUser){return Response.json(visibleBatches(user));}
async function POSTHandler(req:NextRequest,_context:unknown,user:AuthUser){
 const requestId=randomUUID();let stage='ORIGIN_VALIDATION';
 try{
  checkLocalMutation(req);
  stage='UPLOAD_TRANSPORT';
  if(Number(req.headers.get('content-length'))>UPLOAD_LIMIT+1024*1024)throw new UploadError('INVALID_EXCEL_FILE','FILE_VALIDATION','Upload exceeds 20 MB',413);
  const data=await req.formData();const draftId=data.get('draftId');
  if(typeof draftId==='string'){
   const options=JSON.parse(String(data.get('mapping')||'{}'));if(!options||typeof options!=='object'||Array.isArray(options)||!options.fields||typeof options.fields!=='object'||Array.isArray(options.fields))throw new UploadError('INVALID_EXCEL_FILE','MAPPING_VALIDATION','Choose valid source-column mappings');
   const requestKey=createHash('sha256').update(user.id+'|'+draftId+'|'+JSON.stringify(options)).digest('hex');const existing=jobByRequest(requestKey);if(existing){requireResource('job',existing.id,user);return Response.json({job:existing},{status:202});}
   const saved=draft(draftId,user);const rows=await importWorkbook(saved.bytes,saved.filename,options);checkUploadRows(user,rows);const job=queueBatch(saved.filename,rows,{profile:options.profile||'BNP_ONLY',worksheet:options.worksheet,fields:options.fields,keyColumn:options.keyColumn,headers:rows[0]?.originalColumns?.map(c=>c.header)||[]},requestKey,user);db().prepare('DELETE FROM upload_drafts WHERE id=?').run(draftId);return Response.json({job},{status:202});
  }
  const file=data.get('file');
  if(!(file instanceof File))throw new UploadError('FILE_NOT_SELECTED','FILE_SELECTION','Choose an Excel file');
  checkWorkbookName(file.name);
  if(file.size>UPLOAD_LIMIT)throw new UploadError('INVALID_EXCEL_FILE','FILE_VALIDATION','Upload exceeds 20 MB',413);
  stage='FILE_READ';const buffer=Buffer.from(await file.arrayBuffer());
  const rows=await importWorkbook(buffer,file.name);
  checkUploadRows(user,rows);stage='SERVER_PROCESSING';
  // Filename is display metadata in SQLite, never a filesystem destination.
  return Response.json(createBatch(Array.from(uploadName(file.name)).slice(0,200).join(''),rows));
 }catch(error){
  if(error instanceof AccessError)return Response.json({error:error.message},{status:error.status});
  const failure=error instanceof UploadError?error:new UploadError(stage==='UPLOAD_TRANSPORT'||stage==='FILE_READ'?'UPLOAD_TRANSPORT_FAILED':'SERVER_PROCESSING_FAILED',stage,stage==='ORIGIN_VALIDATION'?'Cross-origin request rejected':stage==='FILE_READ'?'The browser-uploaded workbook could not be read. Save a copy, close Excel if it has locked the file, and select it again.':stage==='UPLOAD_TRANSPORT'?'The file upload could not be received. Select the workbook and try again.':'The server could not process the workbook. Check the server terminal using the request ID.',stage==='ORIGIN_VALIDATION'?403:stage==='SERVER_PROCESSING'?500:400,{cause:error});
  const diagnostics:Record<string,unknown>={event:'workbook_upload_failed',requestId,code:failure.code,stage:failure.stage,status:failure.status};
  // Do not log names, paths, cell values, parser messages or request bodies.
  if(process.env.NODE_ENV!=='production'){
   diagnostics.errorType=error instanceof Error?error.name:typeof error;
   const cause=error instanceof Error&&error.cause instanceof Error?error.cause:error;
   diagnostics.frames=cause instanceof Error?cause.stack?.split('\n').filter(line=>/^\s+at\s/.test(line)):[];
  }
  console.error(diagnostics);
  return Response.json({error:failure.message,code:failure.code,stage:failure.stage,requestId},{status:failure.status});
 }
}

export const GET=withAuth(GETHandler);

export const POST=withEntitlement(POSTHandler,'uploadAddresses');
