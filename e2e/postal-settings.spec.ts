import {test,expect} from './fixtures';
import ExcelJS from 'exceljs';
test('postal lookup switch persists off, blocks automatic/manual town lookup, and restores on behavior',async({page})=>{
 test.setTimeout(60000);
 const w=new ExcelJS.Workbook();const source=w.addWorksheet('Source');source.addRow(['Name','Address1','Address2','Address3','Bank_Country']);source.addRow(['POSTAL SETTING CUSTOMER','100 EXAMPLE ROAD','','10001','US']);const bytes=Buffer.from(await w.xlsx.writeBuffer());
 await page.request.patch('/api/settings',{data:{postalLookupEnabled:true}});
 try{
  await page.goto('/upload');let toggle=page.getByRole('switch',{name:'Postal code lookup',exact:true});await expect(toggle).toBeEnabled();await expect(toggle).toBeChecked();const offSaved=page.waitForResponse(r=>r.url().endsWith('/api/settings')&&r.request().method()==='PATCH');await toggle.click();expect((await offSaved).ok()).toBeTruthy();await expect(toggle).not.toBeChecked();
  await page.reload();toggle=page.getByRole('switch',{name:'Postal code lookup',exact:true});await expect(toggle).toBeEnabled();await expect(toggle).not.toBeChecked();
  await page.getByLabel('Excel workbook').setInputFiles({name:'postal-setting-off.xlsx',mimeType:'application/octet-stream',buffer:bytes});await expect(page.getByRole('heading',{name:'Batch workspace',exact:true})).toBeVisible({timeout:15000});const oldBatch=await page.evaluate(()=>localStorage.getItem('atlas-batch'));
  await page.getByText('POSTAL SETTING CUSTOMER',{exact:true}).click();const dialog=page.getByRole('dialog');await expect(dialog.getByLabel('Town / City',{exact:true})).toHaveValue('');await expect(dialog.getByRole('button',{name:'Look up probable town',exact:true})).toBeDisabled();await expect(dialog.getByText('Postal code lookup is off.',{exact:false})).toBeVisible();expect(await(await page.request.get('/api/reference/postal?country=US&postal=10001')).json()).toMatchObject({status:'DISABLED',candidates:[]});
  await page.goto('/upload');toggle=page.getByRole('switch',{name:'Postal code lookup',exact:true});await expect(toggle).toBeEnabled();const onSaved=page.waitForResponse(r=>r.url().endsWith('/api/settings')&&r.request().method()==='PATCH');await toggle.click();expect((await onSaved).ok()).toBeTruthy();await page.getByLabel('Excel workbook').setInputFiles({name:'postal-setting-on.xlsx',mimeType:'application/octet-stream',buffer:bytes});await expect(page.getByRole('heading',{name:'Batch workspace',exact:true})).toBeVisible({timeout:15000});await expect(page.getByText('NEW YORK',{exact:true})).toBeVisible();const previous=await(await page.request.get(`/api/batches/${oldBatch}`)).json();expect(previous.processingSettings.postalLookupEnabled).toBe(false);expect(previous.records[0].intelligence.structured.town).toBe('');
 }finally{await page.request.patch('/api/settings',{data:{postalLookupEnabled:true}});}
});


