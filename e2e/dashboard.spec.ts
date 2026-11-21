import {test,expect,Page} from './fixtures';
import ExcelJS from 'exceljs';
async function count(page:Page,key:string,value:number){await expect(page.getByTestId(`progress-${key}`).locator('strong')).toHaveText(value.toLocaleString());}
async function fixture(page:Page){
 const stamp=Date.now(),group=`Dashboard A ${stamp}`,other=`Dashboard B ${stamp}`,filename=`dashboard-${stamp}.xlsx`;
 const w=new ExcelJS.Workbook(),sheet=w.addWorksheet('Source');sheet.addRow(['Name','Address1','Address2','Address3','Bank_Country','Group','Key']);
 sheet.addRow(['DASHBOARD PASS','100 EXAMPLE ROAD','','','US',group,'same']);sheet.addRow(['DASHBOARD FAIL','100 EXAMPLE ROAD','','','US',group,'same']);sheet.addRow(['DASHBOARD PENDING','100 EXAMPLE ROAD','','','US',group,'same']);sheet.addRow(['DASHBOARD AUTOMATIC','100 EXAMPLE ROAD','','BOSTON MA 02110','US',other,'same']);sheet.addRow(['DASHBOARD NAME ONLY','','','','',other,'same']);
 const response=await page.request.post('/api/batches',{multipart:{file:{name:filename,mimeType:'application/octet-stream',buffer:Buffer.from(await w.xlsx.writeBuffer())}}});expect(response.status()).toBe(200);const batch=await response.json();
 expect((await page.request.patch(`/api/records/${encodeURIComponent(batch.records[0].id)}`,{data:{action:'PASS',version:0}})).status()).toBe(200);
 expect((await page.request.patch(`/api/records/${encodeURIComponent(batch.records[1].id)}`,{data:{action:'FAIL',reason:'Address evidence missing',version:0}})).status()).toBe(200);
 return {batch,group,other};
}
test('Admin filters completed totals, drills into ready/failed records and exports the ready selection',async({page})=>{
 const {batch,group}=await fixture(page);await page.goto('/dashboard');await page.getByLabel('Dashboard batch',{exact:true}).selectOption(batch.id);await count(page,'total',5);await count(page,'passed',1);await count(page,'readyForExport',3);await count(page,'leftToReview',1);await count(page,'failed',1);await count(page,'leftToFix',2);
 await page.getByLabel('Dashboard Group',{exact:true}).selectOption(`value:${group}`);await count(page,'total',3);await count(page,'readyForExport',1);await count(page,'failed',1);
 await page.getByLabel('Dashboard Group',{exact:true}).selectOption('all');await count(page,'total',5);
 await page.getByRole('button',{name:`Open readyForExport records in batch ${batch.id.slice(0,8)}`,exact:true}).click();await expect(page.locator('.records-card tbody tr')).toHaveCount(3);await expect(page.getByLabel('Export scope',{exact:true})).toHaveValue('selected');
 for(const mode of ['full','source-hybrid']){await page.getByLabel('Export format',{exact:true}).selectOption(mode);const href=await page.getByRole('link',{name:'Export workbook',exact:true}).getAttribute('href');const response=await page.request.get(href!);expect(response.status()).toBe(200);const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(await response.body() as never);expect(workbook.getWorksheet('Results')!.rowCount).toBe(4);}
 await page.getByRole('button',{name:'Dashboard',exact:true}).click();await page.getByRole('button',{name:`Open failed records in batch ${batch.id.slice(0,8)}`,exact:true}).click();await expect(page.locator('.records-card tbody tr')).toHaveCount(1);await expect(page.locator('.records-card tbody')).toContainText('DASHBOARD FAIL');
 await page.getByRole('button',{name:'Dashboard',exact:true}).click();await page.getByRole('button',{name:`Open leftToReview records in batch ${batch.id.slice(0,8)}`,exact:true}).click();await page.getByText('DASHBOARD PENDING',{exact:true}).click();await page.getByRole('button',{name:'Pass',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await page.getByRole('button',{name:'Dashboard',exact:true}).click();await count(page,'passed',2);await count(page,'leftToReview',0);await count(page,'readyForExport',4);
 await page.screenshot({path:'/workspace/work/dashboard-admin-v1-12-3.png',fullPage:true});
});
test('User dashboard only exposes assigned-group totals/options and retains review-only permissions',async({page})=>{
 const {batch,group,other}=await fixture(page),username=`dash-user-${Date.now()}`,temporary='Dashboard-temporary-2026';
 expect((await page.request.post('/api/admin/groups',{data:{name:group}})).status()).toBe(201);
 expect((await page.request.post('/api/admin/users',{data:{username,password:temporary,role:'User',group,active:true}})).status()).toBe(201);
 await page.context().clearCookies();expect((await page.request.post('/api/auth/login',{data:{username,password:temporary}})).status()).toBe(200);
 expect((await page.request.post('/api/auth/password',{data:{currentPassword:temporary,password:'Dashboard-changed-password-2026'}})).status()).toBe(200);
 await page.goto('/dashboard');await count(page,'total',3);await count(page,'passed',1);await count(page,'readyForExport',1);await count(page,'leftToReview',1);await count(page,'failed',1);
 await expect(page.getByLabel('Dashboard Group',{exact:true}).locator('option')).toHaveCount(2);await expect(page.getByLabel('Dashboard Group',{exact:true})).not.toContainText(other);
 expect((await(await page.request.get('/api/dashboard?group='+encodeURIComponent(`value:${other}`))).json()).totals.total).toBe(0);
 await expect(page.getByRole('link',{name:'Export workbook',exact:true})).toHaveCount(0);expect((await page.request.get(`/api/batches/${batch.id}/export`)).status()).toBe(403);
 await page.getByRole('button',{name:'Dashboard',exact:true}).click();await page.getByRole('button',{name:`Open leftToReview records in batch ${batch.id.slice(0,8)}`,exact:true}).click();await expect(page.locator('.records-card tbody tr')).toHaveCount(1);
 await page.getByText('DASHBOARD PENDING',{exact:true}).click();await page.getByRole('button',{name:'Fail',exact:true}).click();await page.getByLabel('Reason',{exact:true}).fill('Cannot confirm the address');await page.getByRole('button',{name:'Confirm Fail',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await page.getByRole('button',{name:'Dashboard',exact:true}).click();await count(page,'failed',2);await count(page,'leftToReview',0);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/workspace/work/dashboard-user-mobile-v1-12-3.png',fullPage:true});
 const fits=await page.locator('.review-progress').evaluate(element=>element.getBoundingClientRect().right<=window.innerWidth);expect(fits).toBe(true);
});
test('dashboard handles server errors and retries with explicit refresh',async({page})=>{
 await page.route('**/api/dashboard?**',route=>route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Totals temporarily unavailable'})}));await page.goto('/dashboard');await expect(page.getByRole('alert').filter({hasText:'Totals temporarily unavailable'})).toBeVisible();await page.unroute('**/api/dashboard?**');await page.getByRole('button',{name:'Refresh totals',exact:true}).click();await expect(page.getByTestId('progress-total')).toBeVisible();
});
