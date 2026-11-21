import {passRecord} from './helpers/review';
import {test,expect} from './fixtures';
import ExcelJS from 'exceljs';
test('postal-only locality gets a probable city and review lookup can update the preview',async({page})=>{
 const w=new ExcelJS.Workbook();const s=w.addWorksheet('Source');s.addRow(['Name','Address1','Address2','Address3','Bank_Country']);s.addRow(['POSTAL LOOKUP CUSTOMER','100 EXAMPLE ROAD','','10001','US']);
 await page.goto('/upload');await page.getByLabel('Excel workbook').setInputFiles({name:'postal-lookup.xlsx',mimeType:'application/octet-stream',buffer:Buffer.from(await w.xlsx.writeBuffer())});
 await expect(page.getByRole('heading',{name:'Batch workspace',exact:true})).toBeVisible();await page.getByText('POSTAL LOOKUP CUSTOMER',{exact:true}).click();
 const dialog=page.getByRole('dialog');await expect(dialog.getByLabel('Town / City',{exact:true})).toHaveValue('NEW YORK');await dialog.locator('summary').filter({hasText:'Evidence & candidates'}).click();await expect(dialog.getByText('POSTAL_TOWN_LOOKUP',{exact:false})).toBeVisible();
 await dialog.getByLabel('Postal code',{exact:true}).fill('90012');await dialog.getByRole('button',{name:'Look up probable town',exact:true}).click();
 await expect(dialog.getByRole('status')).toContainText('Probable town/city');await dialog.getByRole('button',{name:'Use LOS ANGELES as proposed town',exact:true}).click();await expect(dialog.getByLabel('Town / City',{exact:true})).toHaveValue('LOS ANGELES');await expect(dialog.getByTestId('review-hybrid-panel').getByText('3/US/LOS ANGELES',{exact:true})).toBeVisible();
 const saved=await passRecord(page);expect(saved.reviewState).toBe('PASSED');expect(saved.source.Address3).toBe('10001');expect(saved.intelligence.structured.town).toBe('LOS ANGELES');expect(saved.intelligence.town.confidence).toBe(0);
});
test('lookup offers no city for codes outside local reference',async({page})=>{
 await page.goto('/upload');await page.getByRole('button',{name:'Try demonstration data'}).click();await page.getByRole('button',{name:'Review records',exact:true}).last().click();await page.getByText('UNRESOLVED BENEFICIARY',{exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.getByLabel('Country (ISO-2)').fill('US');await dialog.getByLabel('Postal code',{exact:true}).fill('99999');await dialog.getByRole('button',{name:'Look up probable town',exact:true}).click();await expect(dialog.getByRole('status')).toContainText('No match in the local postal reference');await expect(dialog.getByRole('button',{name:/as proposed town/})).toHaveCount(0);
});


