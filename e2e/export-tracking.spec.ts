import {test,expect,Page} from './fixtures';import ExcelJS from 'exceljs';
async function fixture(page:Page){const workbook=new ExcelJS.Workbook(),sheet=workbook.addWorksheet('Source');sheet.addRow(['Name','Address1','Address2','Address3','Bank_Country','Group','Key Field']);for(let i=0;i<12;i++)sheet.addRow([`EXPORT COVERAGE CUSTOMER ${i}`,'100 EXAMPLE ROAD','','','US',i%2?'Coverage B':'Coverage A','REPEATED SOURCE KEY']);const response=await page.request.post('/api/batches',{multipart:{file:{name:'Export tracking test.xlsx',mimeType:'application/octet-stream',buffer:Buffer.from(await workbook.xlsx.writeBuffer())}}});expect(response.status()).toBe(200);return await response.json();}
async function open(page:Page,id:string){await page.goto('/results');await page.evaluate(id=>localStorage.setItem('atlas-batch',id),id);await page.reload();await expect(page.getByTestId('export-coverage-all').locator('strong')).toHaveText('12');}
async function run(page:Page,id:string,query:string){const response=await page.request.post(`/api/batches/${id}/exports`,{data:{query}});expect(response.status()).toBe(202);const job=await response.json();await expect.poll(async()=>{const result=await page.request.get(`/api/exports/${job.id}`);return (await result.json()).status;}).toBe('COMPLETED');return job;}
test('batch export totals deduplicate repeated exports and Group/status/export-state filters govern records and remaining exports',async({page})=>{
 const batch=await fixture(page);await open(page,batch.id);
 await page.getByLabel('Filter by Group',{exact:true}).selectOption('value:Coverage A');
 await expect(page.getByTestId('export-coverage-all').locator('strong')).toHaveText('6');
 const download=page.waitForEvent('download');await page.getByRole('link',{name:'Export workbook',exact:true}).click();await download;
 await expect(page.getByTestId('export-coverage-exported').locator('strong')).toHaveText('6');await expect(page.getByTestId('export-coverage-remaining').locator('strong')).toHaveText('0');
 await run(page,batch.id,'mode=source-hybrid&group=Coverage%20A');await page.reload();
 await expect(page.getByTestId('export-coverage-exported').locator('strong')).toHaveText('6');
 await expect(page.getByTestId('export-coverage-remaining').locator('strong')).toHaveText('6');
 await page.getByRole('button',{name:/Remaining to export/}).click();
 await expect(page.locator('.records-card tbody tr')).toHaveCount(6);await expect(page.locator('.records-card tbody')).not.toContainText('2 completed export(s)');
 await page.getByLabel('Filter by Group',{exact:true}).selectOption('value:Coverage B');await page.getByLabel('Export scope',{exact:true}).selectOption('selected');
 await page.getByLabel('Select statuses',{exact:true}).click();await page.getByRole('checkbox',{name:'Pending review',exact:true}).check();await page.getByRole('checkbox',{name:'Hybrid fail',exact:true}).check();await page.getByLabel('Select statuses',{exact:true}).click();
 const remainingDownload=page.waitForEvent('download');await page.getByRole('link',{name:'Export workbook',exact:true}).click();const file=await remainingDownload;
 const workbook=new ExcelJS.Workbook();await workbook.xlsx.readFile((await file.path())!);expect(workbook.getWorksheet('Results')!.rowCount).toBe(7);
 await expect(page.getByTestId('export-coverage-remaining').locator('strong')).toHaveText('0');await expect(page.getByTestId('export-coverage-exported').locator('strong')).toHaveText('6');
 await page.getByLabel('Filter by Group',{exact:true}).selectOption('all');await page.getByLabel('Filter by export tracking',{exact:true}).selectOption('all');
 await expect(page.getByTestId('export-coverage-exported').locator('strong')).toHaveText('12');
 await expect(page.locator('.records-card tbody tr')).toHaveCount(12);await page.screenshot({path:'/workspace/work/export-coverage-v2-1.png'});
});
test('Group users see only their export totals and keep upload/export restrictions',async({page,browser,baseURL})=>{
 const batch=await fixture(page);await run(page,batch.id,'group=Coverage%20B');
 const username=`coverage-user-${Date.now()}`,password='Coverage-user-password-2026';const created=await page.request.post('/api/admin/users',{data:{username,password,role:'User',group:'Coverage A',active:true}});expect(created.status()).toBe(201);
 const context=await browser.newContext({baseURL});try{
  expect((await context.request.post('/api/auth/login',{data:{username,password}})).status()).toBe(200);
  expect((await context.request.post('/api/auth/password',{data:{currentPassword:password,password:'Coverage-new-password-2026'}})).status()).toBe(200);
  const other=await context.newPage();await other.goto('/results');await other.evaluate(id=>localStorage.setItem('atlas-batch',id),batch.id);await other.reload();
  await expect(other.getByTestId('export-coverage-all').locator('strong')).toHaveText('6');await expect(other.getByTestId('export-coverage-exported').locator('strong')).toHaveText('0');
  await expect(other.getByLabel('Filter by Group',{exact:true}).locator('option').filter({hasText:'Coverage B'})).toHaveCount(0);
  await expect(other.getByRole('link',{name:'Export workbook',exact:true})).toHaveCount(0);
  const denied=await context.request.post(`/api/batches/${batch.id}/exports`,{data:{query:''}});expect(denied.status()).toBe(403);
  await other.getByLabel('Filter by export tracking',{exact:true}).selectOption('exported');await expect(other.locator('.records-card tbody tr')).toHaveCount(0);
 }finally{await context.close();}
});
