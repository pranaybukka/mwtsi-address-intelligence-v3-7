import {expect,Page} from '@playwright/test';
export async function passRecord(page:Page){
 const response=page.waitForResponse(response=>response.request().method()==='PATCH'&&response.url().includes('/api/records/')&&!response.url().endsWith('/reservation'));
 await page.getByRole('button',{name:'Pass',exact:true}).click();await expect(page.getByRole('dialog',{name:'Pass record',exact:true})).toHaveCount(0);return await(await response).json();
}
