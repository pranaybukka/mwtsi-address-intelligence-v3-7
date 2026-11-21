import {Batch} from './domain';
import {checkWorkbookName,UPLOAD_LIMIT,UploadError} from './upload-errors';
export async function sendUploadedFile<T>(file:File|undefined,endpoint:string,send:typeof fetch=fetch):Promise<T>{
 if(!file)throw new UploadError('FILE_NOT_SELECTED','FILE_SELECTION','Choose an Excel file to upload.');
 checkWorkbookName(file.name);
 if(file.size>UPLOAD_LIMIT)throw new UploadError('INVALID_EXCEL_FILE','FILE_VALIDATION','Workbook exceeds 20 MB');
 const form=new FormData();form.append('file',file);
 let response:Response;
 try{response=await send(endpoint,{method:'POST',body:form});}
 catch(error){throw new UploadError('UPLOAD_TRANSPORT_FAILED','UPLOAD_TRANSPORT','Could not send the workbook. Check that the app is running and the browser can read the selected file. If Excel or Windows has locked it, save a copy, close Excel and select that copy.',0,{cause:error});}
 let data;
 try{data=await response.json();}catch(error){throw new UploadError('SERVER_PROCESSING_FAILED','SERVER_RESPONSE',`The upload server returned an unreadable response (HTTP ${response.status}). Check the server terminal.`,response.status,{cause:error});}
 if(!response.ok)throw new UploadError(data.code||'SERVER_PROCESSING_FAILED',data.stage||'SERVER_RESPONSE',(data.error||`Upload failed (HTTP ${response.status})`)+(data.requestId?` (request ${data.requestId})`:''),response.status);
 return data as T;
}
export function uploadFailureMessage(error:unknown){return error instanceof UploadError?`${error.code} · ${error.stage}: ${error.message}`:'SERVER_PROCESSING_FAILED · CLIENT_RESPONSE: Could not finish the upload. Check the server terminal.';}

export function uploadWorkbookFile(file:File|undefined,send:typeof fetch=fetch){return sendUploadedFile<Batch>(file,'/api/batches',send);}
export function inspectUploadFile<T>(file:File|undefined){return sendUploadedFile<T>(file,'/api/uploads/inspect');}
