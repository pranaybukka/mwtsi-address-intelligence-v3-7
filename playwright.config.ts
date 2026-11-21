import {defineConfig} from '@playwright/test';
import path from 'node:path';
export default defineConfig({globalSetup:'./e2e/setup-auth.ts',workers:1,testDir:'./e2e',use:{launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH},baseURL:process.env.BASE_URL||'http://localhost:3101'},webServer:process.env.BASE_URL?undefined:{command:'npm run dev',url:'http://localhost:3101',reuseExistingServer:false,env:{PORT:'3101',ADDRESS_DB_PATH:path.join(process.cwd(),'work','browser-tests.db')}},reporter:'list'});
