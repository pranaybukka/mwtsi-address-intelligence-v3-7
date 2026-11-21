import {beforeEach,it,expect,vi} from 'vitest';
import {cookies} from 'next/headers';
import {db} from '../src/db/connection';
import {issueSession} from '../src/lib/auth';
import {COLOR_SCHEMES,DEFAULT_APPEARANCE} from '../src/lib/appearance';
import {userAppearance,saveUserAppearance} from '../src/db/appearance';
import {GET,PATCH} from '../src/app/api/account/appearance/route';
let adminId:string,userId:string,adminToken:string,userToken:string;
function cookie(token?:string){vi.mocked(cookies).mockResolvedValue({get:()=>token?{value:token}:undefined} as never);}
const request=(value:unknown,origin='http://localhost')=>new Request('http://localhost/api/account/appearance',{method:'PATCH',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(value)});
beforeEach(()=>{
 db().exec("DELETE FROM user_appearance;DELETE FROM auth_users WHERE username='appearance-user';");
 adminId=(db().prepare("SELECT id FROM auth_users WHERE username='admin'").get() as {id:string}).id;
 db().prepare('UPDATE auth_users SET must_change=0,active=1 WHERE id=?').run(adminId);
 userId='appearance-test-user';db().prepare("INSERT INTO auth_users(id,username,password_hash,role,group_name,must_change,active,created_at) VALUES(?,'appearance-user','unused','User','Group A',0,1,'now')").run(userId);
 adminToken=issueSession(adminId);userToken=issueSession(userId);cookie(adminToken);
});
it('defaults to Aurora dark for existing and new accounts without modifying their rows',async()=>{
 expect(userAppearance(adminId)).toEqual(DEFAULT_APPEARANCE);expect(userAppearance(userId)).toEqual(DEFAULT_APPEARANCE);
 expect(await(await GET()).json()).toEqual(DEFAULT_APPEARANCE);expect(db().prepare('SELECT * FROM user_appearance').all()).toHaveLength(0);
});
it.each(COLOR_SCHEMES.flatMap(s=>(['dark','light'] as const).map(mode=>({scheme:s.id,mode}))))('persists and returns allowed appearance $scheme/$mode',async value=>{
 const response=await PATCH(request(value));expect(response.status).toBe(200);expect(await response.json()).toEqual(value);expect(userAppearance(adminId)).toEqual(value);
 expect(response.headers.get('Cache-Control')).toBe('private, no-store');expect(response.headers.get('Vary')).toBe('Cookie');
});
it('lets Users change only their own preferences without altering records or processing settings',async()=>{
 saveUserAppearance(adminId,{scheme:'ocean',mode:'dark'});cookie(userToken);
 const before=db().prepare('SELECT * FROM metadata').all(),users=db().prepare('SELECT * FROM auth_users ORDER BY id').all();
 expect((await PATCH(request({scheme:'rose',mode:'light'}))).status).toBe(200);
 expect(userAppearance(adminId)).toEqual({scheme:'ocean',mode:'dark'});expect(await(await GET()).json()).toEqual({scheme:'rose',mode:'light'});
 expect(db().prepare('SELECT * FROM metadata').all()).toEqual(before);expect(db().prepare('SELECT * FROM auth_users ORDER BY id').all()).toEqual(users);
});
it.each([null,[],{},'dark',{scheme:'bad',mode:'dark'},{scheme:'aurora',mode:'auto'},{scheme:'url(evil)',mode:'dark'},{scheme:'rose',mode:'light',userId:'someone-else'},{scheme:'rose',mode:'light',css:'body{}'}])('rejects invalid or identity-bearing input %#',async value=>{
 expect((await PATCH(request(value))).status).toBe(400);expect(userAppearance(adminId)).toEqual(DEFAULT_APPEARANCE);
});
it('rejects malformed JSON, oversize input and cross-origin changes without writes',async()=>{
 for(const body of ['{','x'.repeat(1025)])expect((await PATCH(new Request('http://localhost/api/account/appearance',{method:'PATCH',body}))).status).toBe(400);
 expect((await PATCH(request({scheme:'rose',mode:'light'},'http://untrusted.example'))).status).toBe(403);
 expect(db().prepare('SELECT * FROM user_appearance').all()).toHaveLength(0);
});
it('requires an active, fully enrolled session for reading and saving preferences',async()=>{
 cookie();expect((await GET()).status).toBe(401);expect((await PATCH(request(DEFAULT_APPEARANCE))).status).toBe(401);
 cookie(userToken);db().prepare('UPDATE auth_users SET must_change=1 WHERE id=?').run(userId);expect((await PATCH(request(DEFAULT_APPEARANCE))).status).toBe(403);
 db().prepare('UPDATE auth_users SET active=0,must_change=0 WHERE id=?').run(userId);expect((await GET()).status).toBe(401);
});
it('removes deleted-account preferences and tolerates unknown stored values',()=>{
 saveUserAppearance(userId,{scheme:'amethyst',mode:'light'});db().prepare('DELETE FROM auth_users WHERE id=?').run(userId);expect(db().prepare('SELECT * FROM user_appearance WHERE user_id=?').get(userId)).toBeUndefined();
 db().exec('PRAGMA ignore_check_constraints=ON');try{db().prepare('INSERT INTO user_appearance VALUES(?,?,?)').run(adminId,'future-theme','light');expect(userAppearance(adminId)).toEqual(DEFAULT_APPEARANCE);}finally{db().exec('PRAGMA ignore_check_constraints=OFF');}
});
