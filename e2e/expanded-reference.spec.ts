import {test,expect} from './fixtures';
test('shows the installed reference and looks up a full Canadian postal code',async({page})=>{
 await page.goto('/upload');await expect(page.getByText(/GeoNames reference: [\d,]+ reference relationships/)).toBeVisible();
 const status=await page.request.get('/api/reference/status');expect(status.ok()).toBeTruthy();expect((await status.json()).snapshot.countries).toBeGreaterThan(100);
 await page.getByRole('button',{name:'Try demonstration data'}).click();await page.getByRole('button',{name:'Review records',exact:true}).last().click();await page.getByText('UNRESOLVED BENEFICIARY',{exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.getByLabel('Country (ISO-2)').fill('CA');await dialog.getByLabel('Postal code',{exact:true}).fill('H3A 0G4');await dialog.getByRole('button',{name:'Look up probable town',exact:true}).click();
 await expect(dialog.getByRole('button',{name:'Use MONTREAL as proposed town',exact:true})).toBeVisible();await expect(dialog.getByText(/GEONAMES_CA_POSTAL/)).toBeVisible();
});


