import {test as base,expect} from '@playwright/test';
export type {Page} from '@playwright/test';
export const ADMIN_PASSWORD=process.env.E2E_ADMIN_PASSWORD||'Test-admin-password-2026';
export const test=base.extend({page:async({page},use)=>{const response=await page.request.post('/api/auth/login',{data:{username:'admin',password:ADMIN_PASSWORD}});expect(response.status()).toBe(200);await use(page);}});
export {expect};
