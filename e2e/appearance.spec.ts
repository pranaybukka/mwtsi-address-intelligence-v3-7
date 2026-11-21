import {test,expect,ADMIN_PASSWORD} from './fixtures';
import {COLOR_SCHEMES} from '../src/lib/appearance';
test.beforeEach(async({page})=>{expect((await page.request.patch('/api/account/appearance',{data:{scheme:'aurora',mode:'dark'}})).status()).toBe(200);});
test.afterEach(async({page})=>{await page.request.patch('/api/account/appearance',{data:{scheme:'aurora',mode:'dark'}});});
test('previews palettes, cancels without saving and supports radio keyboard selection',async({page})=>{
 await page.goto('/dashboard');const trigger=page.getByRole('button',{name:'Appearance',exact:true});await trigger.click();const dialog=page.getByRole('dialog',{name:'Your workspace, your style'});
 await dialog.getByRole('radio',{name:/Ocean/}).check();await dialog.getByRole('radio',{name:'Light',exact:true}).check();await expect(page.locator('html')).toHaveAttribute('data-scheme','ocean');await expect(page.locator('html')).toHaveAttribute('data-mode','light');
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();await expect(page.locator('html')).toHaveAttribute('data-scheme','aurora');await expect(page.locator('html')).toHaveAttribute('data-mode','dark');
 await trigger.click();await dialog.getByRole('radio',{name:/Aurora/}).focus();await page.keyboard.press('ArrowRight');await expect(dialog.getByRole('radio',{name:/Ocean/})).toBeChecked();await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
 expect(await(await page.request.get('/api/account/appearance')).json()).toEqual({scheme:'aurora',mode:'dark'});
});
test('saved account preferences are rendered before hydration and follow a second device and account pages',async({page,browser,baseURL})=>{
 await page.goto('/dashboard');await page.getByRole('button',{name:'Appearance',exact:true}).click();await page.getByRole('radio',{name:/Amethyst/}).check();await page.getByRole('radio',{name:'Light',exact:true}).check();await page.getByRole('button',{name:'Save appearance',exact:true}).click();await expect(page.getByRole('dialog',{name:'Your workspace, your style'})).not.toBeVisible();
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-scheme','amethyst');await expect(page.locator('html')).toHaveAttribute('data-mode','light');
 const response=await page.request.get('/dashboard');expect(await response.text()).toContain('data-scheme="amethyst" data-mode="light"');
 await page.goto('/users');await expect(page.getByRole('button',{name:'Appearance',exact:true})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-mode','light');
 const other=await browser.newContext({baseURL,javaScriptEnabled:false});try{expect((await other.request.post('/api/auth/login',{data:{username:'admin',password:ADMIN_PASSWORD}})).status()).toBe(200);const p=await other.newPage();await p.goto('/dashboard');await expect(p.locator('html')).toHaveAttribute('data-scheme','amethyst');await expect(p.locator('html')).toHaveAttribute('data-mode','light');}finally{await other.close();}
});
test('failed save explains the error, preserves the preview for retry and allows restoring defaults',async({page})=>{
 await page.goto('/dashboard');await page.getByRole('button',{name:'Appearance',exact:true}).click();await page.getByRole('radio',{name:/Ember/}).check();
 await page.route('**/api/account/appearance',r=>r.request().method()==='PATCH'?r.fulfill({status:500,json:{error:'private detail'}}):r.continue());await page.getByRole('button',{name:'Save appearance',exact:true}).click();await expect(page.getByRole('dialog',{name:'Your workspace, your style'}).getByRole('alert')).toContainText('could not be saved');await expect(page.locator('html')).toHaveAttribute('data-scheme','ember');
 await page.unroute('**/api/account/appearance');await page.getByRole('button',{name:'Reset to default',exact:true}).click();await expect(page.getByRole('radio',{name:/Aurora/})).toBeChecked();await page.getByRole('button',{name:'Save appearance',exact:true}).click();await expect(page.getByRole('dialog',{name:'Your workspace, your style'})).not.toBeVisible();
});
test('mobile appearance selector fits the viewport and keeps actions reachable in reduced motion',async({page})=>{
 await page.setViewportSize({width:320,height:740});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/dashboard');await page.getByRole('button',{name:'Appearance',exact:true}).click();const d=page.getByRole('dialog',{name:'Your workspace, your style'});await d.getByRole('radio',{name:/Rose/}).check();await d.getByRole('radio',{name:'Light',exact:true}).check();await expect(d.getByRole('button',{name:'Save appearance',exact:true})).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect((await d.boundingBox())!.width).toBeLessThanOrEqual(320);await page.screenshot({path:'/workspace/work/v3-1/appearance-mobile.png'});await d.getByRole('button',{name:'Save appearance',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-mode','light');
});
for(const mode of ['dark','light'] as const)for(const scheme of COLOR_SCHEMES)test(`${scheme.name} ${mode} maintains readable text, controls and semantic status contrast`,async({page})=>{
 await page.request.patch('/api/account/appearance',{data:{scheme:scheme.id,mode}});await page.goto('/live');
 const ratios=await page.evaluate(()=>{
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d')!;function rgb(color:string){ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3).map(v=>{const x=v/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});}
  const lum=(c:string)=>{const r=rgb(c);return r[0]*.2126+r[1]*.7152+r[2]*.0722;};const probe=document.createElement('span');document.body.append(probe);const color=(token:string)=>{probe.style.color=`var(${token})`;return getComputedStyle(probe).color;};
  const pairs=[['--ink','--paper'],['--muted','--surface'],['--accent','--surface'],['--on-accent','--accent'],['--success','--success-soft'],['--warning','--warning-soft'],['--danger','--danger-soft']];const result=pairs.map(([fg,bg])=>{const a=lum(color(fg)),b=lum(color(bg));return {pair:fg+'/'+bg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});probe.remove();return result;
 });for(const r of ratios)expect(r.ratio,r.pair).toBeGreaterThanOrEqual(4.5);
 await expect(page.locator('html')).toHaveAttribute('data-mode',mode);await expect(page.locator('body')).toHaveCSS('color-scheme',mode);
 await page.getByRole('button',{name:'Appearance',exact:true}).click();await expect(page.getByRole('radio',{name:new RegExp(scheme.name)})).toBeChecked();await page.getByRole('button',{name:'Cancel',exact:true}).click();
 if(scheme.id==='ocean'&&mode==='light')await page.screenshot({path:'/workspace/work/v3-1/ocean-light-live.png',fullPage:true});
 if(scheme.id==='aurora'&&mode==='dark'){await page.getByRole('button',{name:'Appearance',exact:true}).click();await page.screenshot({path:'/workspace/work/v3-1/appearance-desktop.png'});}
});
test('User appearance stays separate from Admin and does not unlock upload or export',async({page,browser,baseURL})=>{
 const username='appearance-'+Date.now();const created=await(await page.request.post('/api/admin/users',{data:{username,password:'Appearance-test-2026',role:'User',group:null,active:true}})).json();
 const other=await browser.newContext({baseURL});try{
  await other.request.post('/api/auth/login',{data:{username,password:'Appearance-test-2026'}});expect((await other.request.post('/api/auth/password',{data:{currentPassword:'Appearance-test-2026',password:'Appearance-changed-2026'}})).status()).toBe(200);
  const p=await other.newPage();await p.goto('/review');await p.getByRole('button',{name:'Appearance',exact:true}).click();await p.getByRole('radio',{name:/Graphite/}).check();await p.getByRole('radio',{name:'Light',exact:true}).check();await p.getByRole('button',{name:'Save appearance',exact:true}).click();await expect(p.getByRole('dialog',{name:'Your workspace, your style'})).not.toBeVisible();await p.reload();await expect(p.locator('html')).toHaveAttribute('data-scheme','graphite');
  expect(await(await page.request.get('/api/account/appearance')).json()).toEqual({scheme:'aurora',mode:'dark'});expect((await other.request.post('/api/batches')).status()).toBe(403);expect((await other.request.get('/api/exports')).status()).toBe(403);
 }finally{await other.close();await page.request.delete('/api/admin/users/'+created.id);}
});
