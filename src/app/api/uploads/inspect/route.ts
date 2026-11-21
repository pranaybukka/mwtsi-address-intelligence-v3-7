import {requireUploadGroup} from '@/db/workspace-resources';
import type {AuthUser} from '@/lib/auth-types';
import {AccessError} from '@/lib/auth';
import {withEntitlement} from '@/lib/auth';
import {checkLocalMutation} from '@/lib/api';import {inspectWorkbook,UPLOAD_LIMIT} from '@/lib/excel/import';import {saveDraft} from '@/db/uploads';import {UploadError,uploadName} from '@/lib/upload-errors';
export const runtime='nodejs';
async function POSTHandler(req:Request,_context:unknown,user:AuthUser){try{requireUploadGroup(user);checkLocalMutation(req);if(Number(req.headers.get('content-length'))>UPLOAD_LIMIT+1048576)throw new UploadError('INVALID_EXCEL_FILE','FILE_VALIDATION','Upload exceeds 20 MB',413);const form=await req.formData();const file=form.get('file');if(!(file instanceof File))throw new UploadError('FILE_NOT_SELECTED','FILE_SELECTION','Choose an Excel file');if(file.size>UPLOAD_LIMIT)throw new UploadError('INVALID_EXCEL_FILE','FILE_VALIDATION','Upload exceeds 20 MB',413);const bytes=Buffer.from(await file.arrayBuffer());const sheets=await inspectWorkbook(bytes,file.name);const filename=uploadName(file.name);return Response.json({draftId:saveDraft(filename,bytes,user),filename,sheets});}catch(e){if(e instanceof AccessError)return Response.json({error:e.message},{status:e.status});const error=e instanceof UploadError?e:new UploadError('UPLOAD_TRANSPORT_FAILED','UPLOAD_INSPECTION',e instanceof Error&&e.message==='Cross-origin request rejected'?e.message:'Could not receive the workbook. Check the browser can read it, then retry.');return Response.json({error:error.message,code:error.code,stage:error.stage},{status:error.status});}}

export const POST=withEntitlement(POSTHandler,'uploadAddresses');
