import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash, createPublicKey, verify, randomUUID} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {acquireMaintenance, incompleteUpdate, processAlive, readJson, stateDirectory, writeJson} from './patch-runtime.mjs';

export const APP_NAME = 'hybrid-address-remediation';
const LIMIT = 64 * 1024 * 1024;
const roots = new Set(['src', 'scripts', 'docs', 'tests', 'e2e', 'public', 'reference-data']);
const files = new Set(['package.json', 'package-lock.json', 'README.md', 'AGENTS.md', '.gitignore', 'tsconfig.json', 'playwright.config.ts', 'vitest.config.mts']);
const forbidden = new Set(['data', 'node_modules', '.next', '.git', '.mwtsi', 'work', 'attachments', 'backups', 'test-results', 'playwright-report']);
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export function managedPath(value) {
  if (typeof value !== 'string' || !value || value.length > 230 || /[\\\x00-\x1f\x7f<>:"|?*]/.test(value)) return false;
  const parts = value.split('/');
  if (parts.some(p => !p || p === '.' || p === '..' || /[. ]$/.test(p) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p) || forbidden.has(p.toLowerCase()) || p.toLowerCase().startsWith('.env') || /\.(?:db|sqlite|sqlite3)(?:-wal|-shm|-journal)?$/i.test(p))) return false;
  if (parts[0] === 'reference-data' && (parts[1] === 'sources' || parts.length !== 2)) return false;
  return parts.length === 1 ? files.has(value) : roots.has(parts[0]);
}
function diskPath(app, name) {
  if (!managedPath(name)) throw Error(`Protected or invalid patch path: ${name}`);
  const parts = name.split('/'); let current = app;
  for (const part of parts) {
    current = path.join(current, part);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw Error(`Symbolic links are not patch targets: ${name}`);
  }
  return current;
}
function fileHash(file) { return fs.existsSync(file) ? sha256(fs.readFileSync(file)) : null; }
function stable(value) { return Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value; }
export function dependencyFingerprint(lock) {
  const copy = structuredClone(lock); delete copy.version;
  if (copy.packages?.['']) delete copy.packages[''].version;
  return sha256(JSON.stringify(stable(copy)));
}
function version(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d{0,4})\.(0|[1-9]\d{0,4})\.(0|[1-9]\d{0,4})$/.test(value)) throw Error('Invalid patch version');
  return value.split('.').map(Number);
}
export function decodePatch(bytes, publicKey) {
  if (bytes.length > 20 * 1024 * 1024) throw Error('Patch exceeds 20 MB');
  const envelope = JSON.parse(gunzipSync(bytes, {maxOutputLength: LIMIT}).toString('utf8'));
  if (typeof envelope.payload !== 'string' || typeof envelope.signature !== 'string') throw Error('Invalid patch envelope');
  const payload = Buffer.from(envelope.payload, 'base64'), key = createPublicKey(publicKey);
  if (key.asymmetricKeyType !== 'ed25519' || !verify(null, payload, key, Buffer.from(envelope.signature, 'base64'))) throw Error('Patch signature is invalid. No application files were changed.');
  const patch = JSON.parse(payload.toString('utf8'));
  if (patch.format !== 'mwtsi-patch-v1' || patch.application !== APP_NAME || patch.databasePolicy !== 'preserve-additive-only') throw Error('Unsupported patch format or database policy');
  if(!Number.isInteger(patch.minimumNodeMajor)||patch.minimumNodeMajor<24||patch.minimumNodeMajor>100)throw Error('Invalid patch Node requirement');
  const before = version(patch.fromVersion), after = version(patch.toVersion);
  if (after[0] * 1e10 + after[1] * 1e5 + after[2] <= before[0] * 1e10 + before[1] * 1e5 + before[2]) throw Error('Use rollback to return to an older version');
  if (!Array.isArray(patch.files) || !patch.files.length || patch.files.length > 4000) throw Error('Invalid patch file list');
  const seen = new Set(); let total = 0;
  for (const entry of patch.files) {
    if (!managedPath(entry.path) || seen.has(entry.path.normalize('NFC').toLowerCase())) throw Error(`Protected, duplicate or invalid patch path: ${entry.path}`);
    seen.add(entry.path.normalize('NFC').toLowerCase());
    for (const hash of [entry.before, entry.after]) if (hash !== null && (typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash))) throw Error('Invalid file checksum');
    if (entry.basePackageContent !== undefined) {
      if (entry.path !== 'package.json' || entry.before === null || entry.after === null || typeof entry.basePackageContent !== 'string') throw Error('Invalid package merge baseline');
      const base=Buffer.from(entry.basePackageContent,'base64');
      if(base.length>128*1024||sha256(base)!==entry.before)throw Error('Package merge baseline checksum failed');
      const value=JSON.parse(base.toString('utf8'));
      if(!value||Array.isArray(value)||value.name!==APP_NAME||value.version!==patch.fromVersion)throw Error('Package merge baseline does not match the starting release');
    }
    if (entry.before === null && entry.after === null) throw Error('Empty patch operation');
    if (entry.after !== null) {
      if (typeof entry.content !== 'string') throw Error('Missing patch content');
      const content = Buffer.from(entry.content, 'base64'); total += content.length;
      if (content.length > 16 * 1024 * 1024 || total > LIMIT || sha256(content) !== entry.after) throw Error(`Invalid file content checksum: ${entry.path}`);
    } else if (entry.content !== null) throw Error('Deleted files cannot contain replacement data');
  }
  return patch;
}
function installation(app) {
  const root = fs.realpathSync(app), packageFile = path.join(root, 'package.json');
  if (fs.lstatSync(packageFile).isSymbolicLink()) throw Error('package.json cannot be a symbolic link');
  const pkg = readJson(packageFile);
  if (pkg.name !== APP_NAME) throw Error('Select the existing MWTSI application folder containing package.json');
  version(pkg.version); return {root, pkg};
}
function hasPolicy(value) { return Object.hasOwn(value, 'allowScripts'); }
function validateLocalPolicy(value) {
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>1000||Object.entries(value).some(([key,allowed])=>!key||key.length>300||/[\x00-\x1f\x7f]/.test(key)||typeof allowed!=='boolean'))throw Error('Unsupported local allowScripts policy; keep the file and request a matching patch');
}
function withoutPolicy(value) { const result={...value};delete result.allowScripts;return result; }
function sameJson(a,b) { return JSON.stringify(stable(a))===JSON.stringify(stable(b)); }
function patchPlan(app, patch) {
  const result=[],conflicts=[];
  for(const entry of patch.files){
    const file=diskPath(app,entry.path),local=fs.existsSync(file)?fs.readFileSync(file):null,before=local===null?null:sha256(local);
    let content=entry.after===null?null:Buffer.from(entry.content,'base64'),preservedSettings=[];
    if(entry.path==='package.json'&&entry.basePackageContent!==undefined&&local!==null){
      const baseline=JSON.parse(Buffer.from(entry.basePackageContent,'base64').toString('utf8'));let current;
      try{current=JSON.parse(local.toString('utf8'));}catch{conflicts.push(entry.path);continue;}
      if(!sameJson(withoutPolicy(current),withoutPolicy(baseline))){conflicts.push(entry.path);continue;}
      const target=JSON.parse(content.toString('utf8'));
      if(hasPolicy(current)){validateLocalPolicy(current.allowScripts);target.allowScripts=current.allowScripts;content=Buffer.from(JSON.stringify(target,null,2)+'\n');preservedSettings=['package.json: allowScripts'];}
      else if(hasPolicy(baseline)){delete target.allowScripts;content=Buffer.from(JSON.stringify(target,null,2)+'\n');preservedSettings=['package.json: allowScripts (absent locally)'];}
    }else if(before!==entry.before){conflicts.push(entry.path);continue;}
    result.push({...entry,before,after:content===null?null:sha256(content),content:content===null?null:content.toString('base64'),signedBefore:entry.before,signedAfter:entry.after,preservedSettings});
  }
  if(conflicts.length)throw Error(`Locally changed files conflict with this patch: ${conflicts.slice(0,10).join(', ')}. Keep your changes; request a matching patch or merge them before updating.`);
  return result;
}
export function inspectPatch(app, patch) {
  const {root, pkg} = installation(app);
  if (pkg.version !== patch.fromVersion) throw Error(`This patch requires v${patch.fromVersion}; installed version is v${pkg.version}. Download the matching patch.`);
  const plan=patchPlan(root,patch);
  for (const name of ['package.json', 'package-lock.json']) {
    const entry = plan.find(entry => entry.path === name);
    const target = entry ? JSON.parse(Buffer.from(entry.content, 'base64').toString()) : readJson(path.join(root, name));
    if (target.version !== patch.toVersion || target.name !== APP_NAME) throw Error(`Target ${name} does not match the patch version`);
  }
  return root;
}
function settings(app, options) {
  const env = {...process.env};
  try {
    const require = createRequire(path.join(app, 'package.json'));
    const loaded = require('@next/env').loadEnvConfig(app, options.mode === 'dev', {info() {}, error() {}}, true);
    Object.assign(env, loaded.combinedEnv);
  } catch {
    if (!options.database && !env.ADDRESS_DB_PATH) for (const name of ['.env', '.env.local', '.env.production', '.env.production.local']) {
      const file = path.join(app, name);
      if (fs.existsSync(file) && /^\s*ADDRESS_DB_PATH\s*=/m.test(fs.readFileSync(file, 'utf8'))) throw Error('Specify --database with the operational database path; environment loading is unavailable');
    }
  }
  const configured = options.database || env.ADDRESS_DB_PATH || 'data/address.db';
  if (configured === ':memory:') throw Error('Patching requires a persistent operational database');
  const database = path.resolve(app, configured), port = Number(options.port || env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Specify a valid app port (1–65535)');
  return {database, port, env};
}
async function stopped(app, config) {
  for (const host of ['0.0.0.0','::']) await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', error => {if(host==='::'&&['EAFNOSUPPORT','EADDRNOTAVAIL'].includes(error.code))resolve();else reject(Error(`Port ${config.port} is in use or unavailable. Stop the app before patching; use --port for a custom app port.`));});
    probe.listen({port:config.port,host,exclusive:true,ipv6Only:host==='::'}, () => probe.close(resolve));
  });
  if (!fs.existsSync(config.database)) return;
  const require = createRequire(path.join(app, 'package.json'));
  let connection;
  try {
    const Database = require('better-sqlite3'); connection = new Database(config.database, {readonly: true, fileMustExist: true});
    const table = connection.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='metadata'").get();
    if (table) {
      const row = connection.prepare("SELECT value FROM metadata WHERE key='worker-health'").get();
      if (row && processAlive(JSON.parse(row.value).pid)) throw Error('Stop all workers before patching (the database reports an active worker PID)');
    }
  } finally { connection?.close(); }
}
function npmScript(app, env) {
  const directory = path.dirname(process.execPath), candidates = [env.npm_execpath, path.join(directory, 'node_modules/npm/bin/npm-cli.js'), path.join(directory, '../lib/node_modules/npm/bin/npm-cli.js')];
  const script = candidates.find(value => value && fs.existsSync(value) && path.basename(value) === 'npm-cli.js');
  if (!script) throw Error('npm CLI could not be found. Run through npm run update or install the supported Node.js 24 distribution.');
  return script;
}
export function runStep(step, app, config) {
  let args;
  if (step === 'dependencies') {
    const modules = path.join(app, 'node_modules');
    if (fs.existsSync(modules) && fs.lstatSync(modules).isSymbolicLink()) throw Error('Dependency installation requires an ordinary node_modules directory, not a symbolic link');
    args = [npmScript(app, config.env), 'ci', '--include=dev'];
  } else args = [path.join(app, 'node_modules/next/dist/bin/next'), 'build'];
  const owner=readJson(path.join(stateDirectory(app),'update.lock'));
  const result = spawnSync(process.execPath, ['--import',new URL('./maintenance-child.mjs',import.meta.url).href,...args], {cwd: app, env: {...config.env, NEXT_TELEMETRY_DISABLED: '1', MWTSI_MAINTENANCE_APP:app, MWTSI_MAINTENANCE_NONCE:owner.nonce}, stdio: 'inherit'});
  if (result.error || result.status !== 0) throw Error(`${step === 'dependencies' ? 'Dependency update' : 'Production build'} failed${result.error ? ': ' + result.error.message : ''}`);
}
function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const temporary = `${file}.${randomUUID()}.patch-tmp`, fd = fs.openSync(temporary, 'wx', 0o644);
  try { fs.writeFileSync(fd, content); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  try { fs.renameSync(temporary, file); } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
function backupRoot(app) {
  const directory = app + '.mwtsi-backups';
  if (fs.existsSync(directory) && fs.lstatSync(directory).isSymbolicLink()) throw Error('The backup directory cannot be a symbolic link');
  fs.mkdirSync(directory, {recursive: true, mode: 0o700}); return directory;
}
function backupDirectory(app, id) {
  if (typeof id !== 'string' || !/^[0-9T_Z-]+-[a-f0-9]{12}$/.test(id)) throw Error('Invalid backup ID');
  const result = path.join(backupRoot(app), id);
  if (fs.existsSync(result) && fs.lstatSync(result).isSymbolicLink()) throw Error('Backup cannot be a symbolic link');
  return result;
}
function journal(app, value) { writeJson(path.join(stateDirectory(app), 'update-state.json'), value); }
function history(app, event) {
  const file = path.join(stateDirectory(app), 'history.json'), previous = fs.existsSync(file) ? readJson(file) : [];
  writeJson(file, [...previous, event]);
}
function verifyBackup(app, backup, index) {
  if (index.application !== APP_NAME || index.app !== app || !Array.isArray(index.files)) throw Error('Backup belongs to another application folder');
  for (const entry of index.files) {
    diskPath(app, entry.path);
    if (entry.before !== null && fileHash(diskPath(path.join(backup, 'files'), entry.path)) !== entry.before) throw Error(`Backup checksum failed: ${entry.path}`);
  }
}
async function restore(app, backup, index, config, execute) {
  verifyBackup(app, backup, index);
  journal(app, {...index, phase: 'ROLLING_BACK'});
  for (const entry of index.files) {
    const target = diskPath(app, entry.path);
    if (entry.before === null) { if (fs.existsSync(target)) fs.unlinkSync(target); }
    else writeFile(target, fs.readFileSync(diskPath(path.join(backup, 'files'), entry.path)));
  }
  const build = path.join(app, '.next'), saved = path.join(backup, 'build');
  if (fs.existsSync(saved)) {
    if (fs.existsSync(build)) { if (fs.lstatSync(build).isSymbolicLink()) throw Error('Build directory cannot be a symbolic link'); fs.rmSync(build, {recursive: true}); }
    fs.renameSync(saved, build);
  } else if (!index.hadBuild) {
    if (fs.existsSync(build)) { if (fs.lstatSync(build).isSymbolicLink()) throw Error('Build directory cannot be a symbolic link'); fs.rmSync(build, {recursive: true}); }
  } else if (fileHash(path.join(build, 'BUILD_ID')) !== index.oldBuildId) throw Error('Original build backup is missing. Recovery must rebuild the previous release.');
  if (index.dependenciesTouched) await execute('dependencies', app, config);
  for (const entry of index.files) if (fileHash(diskPath(app, entry.path)) !== entry.before) throw Error(`Rollback verification failed: ${entry.path}`);
  const result = {...index, phase: 'ROLLED_BACK', finishedAt: new Date().toISOString()}; journal(app, result); history(app, result);
}
export async function applyPatch(options) {
  if (Number(process.versions.node.split('.')[0]) < 24) throw Error('Node.js 24 LTS or newer is required');
  const publicKey = options.publicKey || fs.readFileSync(new URL('./update-key.pem', import.meta.url));
  const patch = decodePatch(fs.readFileSync(options.patchFile), publicKey), app = inspectPatch(options.app, patch);
  if(Number(process.versions.node.split('.')[0])<patch.minimumNodeMajor)throw Error(`This patch requires Node.js ${patch.minimumNodeMajor} or newer. Update Node.js before applying it.`);
  if (options.check) return {from: patch.fromVersion, to: patch.toVersion, changedFiles: patch.files.length, valid: true,preservedSettings:patchPlan(app,patch).flatMap(entry=>entry.preservedSettings)};
  const state = stateDirectory(app);
  if (incompleteUpdate(state)) throw Error('An interrupted update needs --recover before another patch can be applied');
  const release = await acquireMaintenance(app); let index, backup, prepared = false;
  const execute = options.execute || runStep;
  try {
    const config = settings(app, options); await stopped(app, config); inspectPatch(app, patch);const plan=patchPlan(app,patch);
    const id = new Date().toISOString().replace(/[:.]/g, '_') + '-' + randomUUID().replace(/-/g, '').slice(0, 12);
    backup = backupDirectory(app, id); fs.mkdirSync(path.join(backup, 'files'), {recursive: true, mode: 0o700});
    for (const entry of plan) if (entry.before !== null) {
      const target = diskPath(path.join(backup, 'files'), entry.path); fs.mkdirSync(path.dirname(target), {recursive: true, mode: 0o700}); fs.copyFileSync(diskPath(app, entry.path), target); fs.chmodSync(target, 0o600);
    }
    let databaseBackup = null;
    if (fs.existsSync(config.database)) {
      const require = createRequire(path.join(app, 'package.json')), Database = require('better-sqlite3'), connection = new Database(config.database, {readonly: true, fileMustExist: true});
      try { databaseBackup = path.join(backup, 'database.sqlite'); await connection.backup(databaseBackup); fs.chmodSync(databaseBackup, 0o600); } finally { connection.close(); }
    }
    const lockEntry = patch.files.find(entry => entry.path === 'package-lock.json');
    const previousLock = readJson(path.join(app, 'package-lock.json')), nextLock = lockEntry ? JSON.parse(Buffer.from(lockEntry.content, 'base64').toString()) : previousLock;
    const build = path.join(app, '.next'); if (fs.existsSync(build) && fs.lstatSync(build).isSymbolicLink()) throw Error('Build directory cannot be a symbolic link');
    index = {application: APP_NAME, app, id, from: patch.fromVersion, to: patch.toVersion, at: new Date().toISOString(), database: config.database, databaseBackup, hadBuild: fs.existsSync(build), oldBuildId: fileHash(path.join(build, 'BUILD_ID')), dependenciesChanged: dependencyFingerprint(previousLock) !== dependencyFingerprint(nextLock), dependenciesTouched: false, files: plan.map(({path, before, after,signedBefore,signedAfter}) => ({path, before, after,signedBefore,signedAfter})),preservedSettings:plan.flatMap(entry=>entry.preservedSettings)};
    writeJson(path.join(backup, 'backup.json'), index); verifyBackup(app, backup, index);for(const entry of plan)if(fileHash(diskPath(app,entry.path))!==entry.before)throw Error(`Source changed during backup: ${entry.path}`); journal(app, {...index, phase: 'PREPARED'}); prepared = true;
    if (index.hadBuild) fs.renameSync(build, path.join(backup, 'build'));
    journal(app, {...index, phase: 'APPLYING'});
    for (const entry of plan) {
      const target = diskPath(app, entry.path);
      if (entry.after === null) fs.unlinkSync(target); else writeFile(target, Buffer.from(entry.content, 'base64'));
    }
    if (index.dependenciesChanged || !fs.existsSync(path.join(app, 'node_modules/next/dist/bin/next'))) {
      index.dependenciesTouched = true; writeJson(path.join(backup, 'backup.json'), index); journal(app, {...index, phase: 'DEPENDENCIES'});
      await execute('dependencies', app, config);
    }
    journal(app, {...index, phase: 'BUILDING'}); await execute('build', app, config);
    if (!fs.existsSync(path.join(build, 'BUILD_ID'))) throw Error('Production build did not produce BUILD_ID');
    for (const entry of plan) if (fileHash(diskPath(app, entry.path)) !== entry.after) throw Error(`Post-build checksum failed: ${entry.path}`);
    const result = {...index, phase: 'SUCCEEDED', finishedAt: new Date().toISOString()}; journal(app, result); history(app, result);
    return {version: patch.toVersion, changedFiles: patch.files.length, backup, databaseBackup, dependenciesUpdated: index.dependenciesTouched,preservedSettings:index.preservedSettings};
  } catch (error) {
    if (prepared) {
      try { await restore(app, backup, index, settings(app, options), execute); }
      catch (rollbackError) { journal(app, {...index, phase: 'NEEDS_RECOVERY'}); throw Error(`Patch failed: ${error.message}. Automatic rollback needs recovery: ${rollbackError.message}. Run the installer with --recover before starting the app.`); }
      throw Error(`Patch failed: ${error.message}. Previous application files/build restored; operational data was not replaced.`);
    }
    throw error;
  } finally { release(); }
}
export async function rollback(options) {
  const {root: app} = installation(options.app), state = stateDirectory(app), pending = incompleteUpdate(state);
  if (options.recover && !pending) throw Error('No interrupted patch needs recovery');
  const id = options.recover ? pending.id : options.rollback;
  const backup = backupDirectory(app, id), index = readJson(path.join(backup, 'backup.json'));
  verifyBackup(app, backup, index);
  if (!options.recover) {
    if (readJson(path.join(app, 'package.json')).version !== index.to) throw Error('Rollback must match the currently installed version');
    for (const entry of index.files) if (fileHash(diskPath(app, entry.path)) !== entry.after) throw Error(`Local changes prevent rollback: ${entry.path}`);
  }
  const release = await acquireMaintenance(app);
  try {
    const config = settings(app, {...options, database: options.database || index.database}); await stopped(app, config);
    await restore(app, backup, index, config, options.execute || runStep);
    return {version: index.from, databaseRestored: false, message: 'Code/build restored. Operational database and newer reviews were preserved.'};
  } catch (error) { journal(app, {...index, phase: 'NEEDS_RECOVERY'}); throw error; } finally { release(); }
}
export async function cli(args = process.argv.slice(2)) {
  const options = {app: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (['--app', '--database', '--port', '--rollback', '--mode'].includes(arg)) { const value = args[++i]; if (!value || value.startsWith('--')) throw Error(`Missing value for ${arg}`); options[arg.slice(2)] = value; }
    else if (['--check', '--status', '--recover'].includes(arg)) options[arg.slice(2)] = true;
    else if (!arg.startsWith('-') && !options.patchFile) options.patchFile = arg;
    else throw Error(`Unknown argument: ${arg}`);
  }
  if ([options.status, options.recover, options.rollback, options.check].filter(Boolean).length > 1 || options.patchFile && (options.status || options.recover || options.rollback)) throw Error('Choose one operation: patch, --check, --status, --rollback or --recover');
  if (options.mode && !['dev', 'production'].includes(options.mode)) throw Error('--mode must be dev or production');
  if (options.status) {
    const {root, pkg} = installation(options.app), file = path.join(root, '.mwtsi/history.json');
    return {installedVersion: pkg.version, history: fs.existsSync(file) ? readJson(file).slice(-10).map(({id, from, to, phase, at}) => ({id, from, to, phase, at})) : [], recoveryRequired: !!(fs.existsSync(path.join(root, '.mwtsi/update-state.json')) && incompleteUpdate(path.join(root, '.mwtsi')))};
  }
  if (options.recover || options.rollback) return rollback(options);
  if (!options.patchFile) {
    const {pkg} = installation(options.app), candidate = new URL(`./patches/${pkg.version}.mwtpatch`, import.meta.url);
    if (fs.existsSync(candidate)) options.patchFile = fileURLToPath(candidate);
    else throw Error('Provide a matching .mwtpatch file, or use --status, --rollback BACKUP_ID or --recover');
  }
  return applyPatch(options);
}
if (process.argv[1] && pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url) {
  cli().then(result => { console.log(JSON.stringify(result, null, 2)); if (result.version) console.log('Patch operation complete. Start the app using your normal startup command.'); }).catch(error => { console.error('MWTSI patch:', error.message); process.exitCode = 1; });
}
