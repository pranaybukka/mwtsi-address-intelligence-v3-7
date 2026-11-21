import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
const testRoot=mkdtempSync(path.join(tmpdir(),'atlas-test-'));
process.env.ADDRESS_DB_PATH=path.join(testRoot,'test.db');

// Baseline fixtures stay deterministic; expanded-reference integration tests use explicit databases.
process.env.ADDRESS_REFERENCE_DB_PATH=path.join(tmpdir(),'mwtsi-no-expanded-reference-'+process.pid+'.sqlite');

// Legacy API regression tests run as a real authenticated Admin against each isolated DB.
// Authentication tests override this cookie store to exercise anonymous and User sessions.
import {vi,beforeAll,afterAll} from 'vitest';
import {cookies} from 'next/headers';
vi.mock('next/headers',()=>({cookies:vi.fn()}));
beforeAll(async()=>{
 const {initializeAuth,issueSession}=await import('../src/lib/auth');const {db}=await import('../src/db/connection');initializeAuth();
 const admin=db().prepare("SELECT id FROM auth_users WHERE username='admin'").get() as {id:string};
 db().prepare('UPDATE auth_users SET must_change=0 WHERE id=?').run(admin.id);
 const token=issueSession(admin.id);vi.mocked(cookies).mockResolvedValue({get:(name:string)=>name==='mwtsi-session'?{value:token}:undefined} as never);
});

afterAll(async()=>{const {closeExpandedReference}=await import('../src/lib/reference/expanded');const {db}=await import('../src/db/connection');closeExpandedReference();db().close();rmSync(testRoot,{recursive:true,force:true});});
