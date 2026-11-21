import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import fs from 'node:fs';
import {NextRequest} from 'next/server';
import {POST} from '../src/app/api/batches/route';
import {GET} from '../src/app/api/template/route';
import {checkLocalMutation} from '../src/lib/api';
import {uploadWorkbookFile,uploadFailureMessage} from '../src/lib/upload-client';
import * as batches from '../src/db/batches';
let logs:ReturnType<typeof vi.spyOn>;
beforeEach(()=>{logs=vi.spyOn(console,'error').mockImplementation(()=>{});});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
async function request(bytes:Uint8Array|ArrayBuffer|string,name='input.xlsx',type=''){
 const form=new FormData();form.append('file',new File([bytes as BlobPart],name,{type}));
 return POST(new NextRequest('http://localhost/api/batches',{method:'POST',body:form}));
}
it.each([
 ['http://127.0.0.1:3000','127.0.0.1:3000'],['http://localhost:3000','localhost:3000'],['http://[::1]:3000','[::1]:3000'],['http://localhost','localhost:80']
])('accepts exact authority %s with canonical internal URL',(origin,host)=>{
 expect(()=>checkLocalMutation(new Request('http://localhost:3000/api/batches',{headers:{origin,host}}))).not.toThrow();
});
it.each(['http://evil.test','http://localhost:3001','http://127.0.0.1:3000','null','https://localhost:3000'])('still rejects cross-origin %s',(origin)=>{
 expect(()=>checkLocalMutation(new Request('http://localhost:3000/api/batches',{headers:{origin,host:'localhost:3000','x-forwarded-host':'evil.test'}}))).toThrow('Cross-origin');
});
it.each(['evil.test/path','user@evil.test','localhost:3000?x=1','localhost:3000\\evil.test'])('rejects malformed Host metadata %s',(host)=>{
 expect(()=>checkLocalMutation(new Request('http://localhost:3000/api/batches',{headers:{origin:'http://localhost:3000',host}}))).toThrow('Cross-origin');
});
it('reports rejected origin before workbook parsing',async()=>{
 const response=await POST(new NextRequest('http://localhost/api/batches',{method:'POST',headers:{origin:'http://elsewhere'},body:new FormData()}));
 expect(response.status).toBe(403);expect(await response.json()).toMatchObject({code:'SERVER_PROCESSING_FAILED',stage:'ORIGIN_VALIDATION',error:'Cross-origin request rejected'});
});
it('reports missing selected File distinctly',async()=>{
 const form=new FormData();form.set('file','C:\\fakepath\\input.xlsx');const response=await POST(new NextRequest('http://localhost/api/batches',{method:'POST',body:form}));
 expect(await response.json()).toMatchObject({code:'FILE_NOT_SELECTED',stage:'FILE_SELECTION'});
});
it('rejects unsupported extension independent of MIME',async()=>{const response=await request(await(await GET()).arrayBuffer(),'input.xls','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');expect(await response.json()).toMatchObject({code:'UNSUPPORTED_EXTENSION'});});
it('rejects non-workbook content despite .xlsx extension and expected MIME',async()=>{const response=await request('not an Excel file','input.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');expect(await response.json()).toMatchObject({code:'INVALID_EXCEL_FILE',stage:'ARCHIVE_VALIDATION'});});
it('reports parsing failure for a ZIP without valid Excel content',async()=>{const zip=new JSZip();zip.file('xl/workbook.xml','not XML');const response=await request(await zip.generateAsync({type:'uint8array'}));expect(await response.json()).toMatchObject({code:'EXCEL_PARSE_FAILED',stage:'EXCEL_PARSE'});});
it('reports required columns independently of parsing',async()=>{const w=new ExcelJS.Workbook();w.addWorksheet('Source').addRow(['Wrong header']);const response=await request(Buffer.from(await w.xlsx.writeBuffer()));expect(await response.json()).toMatchObject({code:'REQUIRED_COLUMNS_MISSING',stage:'WORKSHEET_VALIDATION'});});
it('reports corrupt multipart transport',async()=>{const response=await POST(new NextRequest('http://localhost/api/batches',{method:'POST',headers:{'content-type':'multipart/form-data'},body:'bad multipart'}));expect(await response.json()).toMatchObject({code:'UPLOAD_TRANSPORT_FAILED',stage:'UPLOAD_TRANSPORT'});});
it('reads only the supplied File bytes and never accesses original path metadata',async()=>{
 const file=new File([await(await GET()).arrayBuffer()],'C:\\Users\\Manny\\Downloads\\input.xlsx');
 Object.defineProperty(file,'path',{get(){throw Error('Original filesystem path accessed');}});
 const read=vi.spyOn(file,'arrayBuffer');const fsRead=vi.spyOn(fs,'readFileSync');
 const req=new NextRequest('http://localhost/api/batches',{method:'POST',body:new FormData()});vi.spyOn(req,'formData').mockResolvedValue({get:()=>file} as unknown as FormData);
 const response=await POST(req);expect(response.status).toBe(200);expect(read).toHaveBeenCalledOnce();
 expect(fsRead.mock.calls.some(args=>String(args[0]).includes('fakepath')||String(args[0]).includes('C:\\'))).toBe(false);
 expect((await response.json()).filename).toBe('input.xlsx');
});
it('reports File reading failure without exposing original path or contents',async()=>{
 const file=new File(['x'],'input.xlsx');vi.spyOn(file,'arrayBuffer').mockRejectedValue(new Error('C:\\Users\\Manny\\private-data'));
 const req=new NextRequest('http://localhost/api/batches',{method:'POST',body:new FormData()});vi.spyOn(req,'formData').mockResolvedValue({get:()=>file} as unknown as FormData);
 const response=await POST(req);const data=await response.json();expect(data).toMatchObject({code:'UPLOAD_TRANSPORT_FAILED',stage:'FILE_READ'});expect(data.error).toContain('locked');expect(JSON.stringify(data)).not.toContain('private-data');
});
it('reports server processing failures with safe production logs',async()=>{
 vi.stubEnv('NODE_ENV','production');vi.spyOn(batches,'createBatch').mockImplementation(()=>{throw Error('Sensitive workbook content');});
 const response=await request(await(await GET()).arrayBuffer());expect(response.status).toBe(500);expect(await response.json()).toMatchObject({code:'SERVER_PROCESSING_FAILED',stage:'SERVER_PROCESSING'});
 const output=JSON.stringify(logs.mock.calls);expect(output).not.toContain('Sensitive');expect(output).not.toContain('input.xlsx');expect(output).not.toContain('frames');expect(output).toContain('requestId');
});
it('browser sends the selected File in FormData without overriding Content-Type',async()=>{
 const file=new File(['bytes'],"Manny's Test.xlsx",{type:'text/plain'});const send=vi.fn().mockResolvedValue(Response.json({id:'batch'}));await uploadWorkbookFile(file,send);
 const [url,init]=send.mock.calls[0];expect(url).toBe('/api/batches');expect(init.headers).toBeUndefined();expect(init.body).toBeInstanceOf(FormData);expect(await init.body.get('file').text()).toBe('bytes');expect(init.body.get('file').name).toBe(file.name);
});
it('browser reports no selection without network work',async()=>{const send=vi.fn();await expect(uploadWorkbookFile(undefined,send)).rejects.toMatchObject({code:'FILE_NOT_SELECTED'});expect(send).not.toHaveBeenCalled();});
it('browser reports possible file locks or connection failures clearly',async()=>{const send=vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));await expect(uploadWorkbookFile(new File(['x'],'input.xlsx'),send)).rejects.toMatchObject({code:'UPLOAD_TRANSPORT_FAILED',stage:'UPLOAD_TRANSPORT',message:expect.stringContaining('locked')});});
it('browser reports server failure stage and request ID',async()=>{try{await uploadWorkbookFile(new File(['x'],'input.xlsx'),vi.fn().mockResolvedValue(Response.json({code:'EXCEL_PARSE_FAILED',stage:'EXCEL_PARSE',error:'Cannot parse',requestId:'r-123'},{status:400})));throw Error('Should fail');}catch(error){expect(uploadFailureMessage(error)).toContain('EXCEL_PARSE_FAILED · EXCEL_PARSE');expect(uploadFailureMessage(error)).toContain('r-123');}});
it('browser reports HTML or non-JSON error responses',async()=>{await expect(uploadWorkbookFile(new File(['x'],'input.xlsx'),vi.fn().mockResolvedValue(new Response('<html>Gateway error</html>',{status:502})))).rejects.toMatchObject({code:'SERVER_PROCESSING_FAILED',stage:'SERVER_RESPONSE'});});
