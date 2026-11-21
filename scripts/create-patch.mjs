import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createPrivateKey, createPublicKey, sign} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import JSZip from 'jszip';
import {APP_NAME, managedPath, sha256, decodePatch} from './update.mjs';

export function targetSnapshot(app) {
  const output = new Map();
  function visit(directory, relative = '') {
    for (const item of fs.readdirSync(directory, {withFileTypes: true})) {
      const name = relative ? `${relative}/${item.name}` : item.name;
      if (item.isDirectory()) {
        // Protected trees are never walked, so backups, uploads and credentials cannot enter a release.
        if (['src','scripts','docs','tests','e2e','public','reference-data'].includes(name.split('/')[0]) && !['reference-data/sources'].includes(name) && !item.name.startsWith('.')) visit(path.join(directory, item.name), name);
      } else if (managedPath(name)) {
        if (item.isSymbolicLink()) throw Error(`Release files cannot be symbolic links: ${name}`);
        if (!item.isFile()) throw Error(`Release path is not a file: ${name}`);
        const bytes=fs.readFileSync(path.join(directory,item.name));if(/^-----BEGIN (?:[A-Z ]+)?PRIVATE KEY-----\r?$/m.test(bytes.toString('utf8')))throw Error('Private signing keys cannot be included in a patch');output.set(name,bytes);
      }
    }
  }
  visit(app); return output;
}
export async function createPatch({baseZip, target, privateKey, notes = ''}) {
  const archive = await JSZip.loadAsync(fs.readFileSync(baseZip));
  const before = new Map();
  for (const [name, item] of Object.entries(archive.files)) {
    if (item.dir || !name.startsWith('hybrid-address/')) continue;
    const relative = name.slice('hybrid-address/'.length);
    if (managedPath(relative)) before.set(relative, await item.async('nodebuffer'));
  }
  const after = targetSnapshot(target), oldPackage = JSON.parse(before.get('package.json')), newPackage = JSON.parse(after.get('package.json'));
  if (oldPackage.name !== APP_NAME || newPackage.name !== APP_NAME) throw Error('Wrong application snapshot');
  const files = [];
  for (const name of [...new Set([...before.keys(), ...after.keys()])].sort()) {
    const previous = before.get(name), current = after.get(name);
    const a = previous === undefined ? null : sha256(previous), b = current === undefined ? null : sha256(current);
    if (a !== b) files.push({path: name, before: a, after: b, content: current === undefined ? null : current.toString('base64'),...(name==='package.json'&&previous&&current?{basePackageContent:previous.toString('base64')}:{})});
  }
  const nodeEngine=newPackage.engines?.node||'>=24';const match=/^>=\s*(\d+)$/.exec(nodeEngine);if(!match)throw Error('Use a simple >= major Node engine requirement for patch releases');
  const patch = {minimumNodeMajor:Number(match[1]),format: 'mwtsi-patch-v1', application: APP_NAME, fromVersion: oldPackage.version, toVersion: newPackage.version, createdAt: new Date().toISOString(), databasePolicy: 'preserve-additive-only', notes, files};
  const key = createPrivateKey(privateKey);
  if (key.asymmetricKeyType !== 'ed25519') throw Error('Use an Ed25519 release signing key');
  const publicKey = createPublicKey(key).export({format:'pem',type:'spki'});
  const installedKey = after.get('scripts/update-key.pem');
  if (!installedKey || !createPublicKey(installedKey).export({format:'der',type:'spki'}).equals(createPublicKey(key).export({format:'der',type:'spki'}))) throw Error('Target updater trust key must match the release signing key');
  const payload = Buffer.from(JSON.stringify(patch));
  const result = gzipSync(Buffer.from(JSON.stringify({payload: payload.toString('base64'), signature: sign(null, payload, key).toString('base64')})));
  decodePatch(result, publicKey); return {bytes: result, patch};
}
async function main(){
  const options={};for(let i=2;i<process.argv.length;i+=2){const key=process.argv[i],value=process.argv[i+1];if(!['--base','--target','--out','--notes'].includes(key)||!value)throw Error('Use --base RELEASE.zip --target APP_FOLDER --out UPDATE.mwtpatch [--notes TEXT]');options[key.slice(2)]=value;}
  if(!options.base||!options.target||!options.out||!process.env.MWTSI_PATCH_SIGNING_KEY_FILE)throw Error('Set MWTSI_PATCH_SIGNING_KEY_FILE and provide --base, --target and --out');
  const {bytes,patch}=await createPatch({baseZip:options.base,target:options.target,privateKey:fs.readFileSync(process.env.MWTSI_PATCH_SIGNING_KEY_FILE),notes:options.notes||''});fs.writeFileSync(options.out,bytes,{mode:0o644});console.log(JSON.stringify({from:patch.fromVersion,to:patch.toVersion,files:patch.files.length,bytes:bytes.length,sha256:sha256(bytes)}));
}
if(process.argv[1]&&pathToFileURL(fs.realpathSync(process.argv[1])).href===import.meta.url)main().catch(error=>{console.error(error.message);process.exitCode=1;});
