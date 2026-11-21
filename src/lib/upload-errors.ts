/** Shared browser/server failure contract. No uploaded contents belong in diagnostics. */
export type UploadCode='FILE_NOT_SELECTED'|'UNSUPPORTED_EXTENSION'|'UPLOAD_TRANSPORT_FAILED'|'INVALID_EXCEL_FILE'|'EXCEL_PARSE_FAILED'|'REQUIRED_COLUMNS_MISSING'|'SERVER_PROCESSING_FAILED';
export class UploadError extends Error {
 constructor(public code:UploadCode,public stage:string,message:string,public status=400,options?:ErrorOptions){super(message,options);this.name='UploadError';}
}
export const UPLOAD_LIMIT=20*1024*1024;
/** Metadata only: neither this name nor any client path is opened on the server. */
export function uploadName(name:string){return name.split(/[\\/]/u).pop()||'';}
export function checkWorkbookName(name:string){if(!/\.xlsx$/iu.test(uploadName(name)))throw new UploadError('UNSUPPORTED_EXTENSION','FILE_VALIDATION','Upload a .xlsx workbook; macros and legacy files are unsupported');}
