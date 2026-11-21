import {test,expect,ADMIN_PASSWORD} from './fixtures';
const names=['test.xlsx','Address Test.xlsx','Address_Test_(1).xlsx',"Manny's Test.xlsx",'2026 Hybrid Address Test.xlsx','São Paulo Addresses.xlsx','C:\\fakepath\\input.xlsx','C:\\Users\\Manny\\Downloads\\input.xlsx'];
for(const name of names)test(`file input processes ${name} with unexpected MIME`,async({page})=>{
 await page.goto('/upload');const bytes=await(await page.request.get('/api/template')).body();
 await page.getByLabel('Excel workbook').setInputFiles({name,mimeType:'application/octet-stream',buffer:bytes});
 await expect(page.getByRole('heading',{name:'Batch workspace',exact:true})).toBeVisible();await expect(page.getByText('EXAMPLE BENEFICIARY',{exact:true})).toBeVisible();
});
test('same upload succeeds through localhost and 127.0.0.1 HTTP authorities',async({page,baseURL})=>{
 const original=new URL(baseURL!);
 for(const hostname of ['localhost','127.0.0.1']){
  const url=new URL(original);url.hostname=hostname;url.pathname='/upload';expect((await page.request.post(new URL('/api/auth/login',url).href,{data:{username:'admin',password:ADMIN_PASSWORD}})).status()).toBe(200);await page.goto(url.href);
  const bytes=await(await page.request.get(new URL('/api/template',url).href)).body();
  const response=page.waitForResponse(r=>r.url().endsWith('/api/batches')&&r.request().method()==='POST');
  await page.getByLabel('Excel workbook').setInputFiles({name:'input.xlsx',mimeType:'',buffer:bytes});
  expect((await response).status()).toBe(202);await expect(page.getByRole('heading',{name:'Batch workspace',exact:true})).toBeVisible();
 }
});
test('drag and drop processes bytes through the same upload function',async({page})=>{
 await page.goto('/upload');const bytes=await(await page.request.get('/api/template')).body();
 const transfer=await page.evaluateHandle((values)=>{const dt=new DataTransfer();dt.items.add(new File([new Uint8Array(values)],"Manny's Test.xlsx",{type:'application/zip'}));return dt;},Array.from(bytes));
 await page.locator('.dropzone').dispatchEvent('drop',{dataTransfer:transfer});
 await expect(page.getByRole('heading',{name:'Batch workspace',exact:true})).toBeVisible();await transfer.dispose();
});
test('UI displays server stage when parsing fails',async({page})=>{
 await page.goto('/upload');await page.getByLabel('Excel workbook').setInputFiles({name:'bad.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from('invalid content')});
 await expect(page.getByRole('alert').filter({has:page.getByRole('button',{name:'Dismiss error'})})).toContainText('INVALID_EXCEL_FILE · ARCHIVE_VALIDATION');
});
test('UI distinguishes upload transport failure',async({page})=>{
 await page.goto('/upload');const bytes=await(await page.request.get('/api/template')).body();await page.route('**/api/batches',route=>route.request().method()==='POST'?route.abort('failed'):route.continue());
 await page.getByLabel('Excel workbook').setInputFiles({name:'input.xlsx',mimeType:'',buffer:bytes});
 await expect(page.getByRole('alert').filter({has:page.getByRole('button',{name:'Dismiss error'})})).toContainText('UPLOAD_TRANSPORT_FAILED');await expect(page.getByRole('alert').filter({has:page.getByRole('button',{name:'Dismiss error'})})).toContainText('locked');
});
