// Build/install subprocesses remain visible to recovery if their updater parent is interrupted.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {readJson, stateDirectory} from './patch-runtime.mjs';
const app=process.env.MWTSI_MAINTENANCE_APP;
if(!app)throw Error('Missing maintenance application context');
const state=stateDirectory(app),owner=readJson(path.join(state,'update.lock'));
// Next.js forks build workers that inherit --import; descendants share the operation nonce.
if(owner.nonce!==process.env.MWTSI_MAINTENANCE_NONCE)throw Error('Invalid maintenance context');
const folder=path.join(state,'runtime');fs.mkdirSync(folder,{recursive:true,mode:0o700});
const file=path.join(folder,`${process.pid}-${randomUUID()}.json`);
fs.writeFileSync(file,JSON.stringify({pid:process.pid,role:'patch build/install subprocess',at:new Date().toISOString()}),{flag:'wx',mode:0o600});
process.once('exit',()=>{if(fs.existsSync(file))fs.unlinkSync(file);});
