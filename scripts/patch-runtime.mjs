import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

export function processAlive(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try { process.kill(pid, 0); return true; } catch (error) { return error.code !== 'ESRCH'; }
}
export function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true, mode: 0o700});
  const temporary = `${file}.${randomUUID()}.tmp`;
  const fd = fs.openSync(temporary, 'wx', 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(value, null, 2)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  try { fs.renameSync(temporary, file); } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
export function stateDirectory(app) {
  const folder = path.join(app, '.mwtsi');
  if (fs.existsSync(folder) && fs.lstatSync(folder).isSymbolicLink()) throw Error('The maintenance directory cannot be a symbolic link');
  fs.mkdirSync(folder, {recursive: true, mode: 0o700});
  return folder;
}
export async function fileLock(file) {
  const owner = {pid: process.pid, nonce: randomUUID()};
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const fd = fs.openSync(file, 'wx', 0o600);
      try { fs.writeFileSync(fd, JSON.stringify(owner)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      return () => { if (fs.existsSync(file) && readJson(file).nonce === owner.nonce) fs.unlinkSync(file); };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let previous;
      try { previous = readJson(file); } catch { await new Promise(resolve => setTimeout(resolve, 25)); continue; }
      if (!processAlive(previous.pid)) {
        // Serialize stale-lock reclamation; a second cleaner must not unlink a new owner's lock.
        const claim=file+'.reclaim';let fd;
        try {fd=fs.openSync(claim,'wx',0o600);fs.writeFileSync(fd,JSON.stringify(owner));}
        catch(e){if(e.code==='EEXIST')throw Error('A maintenance lock is being recovered. If recovery was interrupted, stop all app/patch processes before repairing the .reclaim lock.');throw e;}
        try {if(fs.existsSync(file)&&!processAlive(readJson(file).pid))fs.unlinkSync(file);}
        finally {fs.closeSync(fd);fs.unlinkSync(claim);}
      }
      else if (attempt > 4) throw Error('Another startup or patch operation is active');
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  }
  throw Error('Maintenance lock cannot be read. Check that no maintenance process is active before repairing it.');
}
export function incompleteUpdate(state) {
  const file = path.join(state, 'update-state.json');
  if (!fs.existsSync(file)) return null;
  const value = readJson(file);
  return ['SUCCEEDED', 'ROLLED_BACK'].includes(value.phase) ? null : value;
}
export async function registerRuntime(app, role) {
  const state = stateDirectory(app), releaseGate = await fileLock(path.join(state, 'gate.lock'));
  let file;
  try {
    const updateLock = path.join(state, 'update.lock');
    if (fs.existsSync(updateLock) && processAlive(readJson(updateLock).pid)) throw Error('A patch is being applied. Start the app after it completes.');
    if (incompleteUpdate(state)) throw Error('An interrupted patch needs recovery. Run the patch installer with --recover before starting the app.');
    const directory = path.join(state, 'runtime');
    fs.mkdirSync(directory, {recursive: true, mode: 0o700});
    file = path.join(directory, `${process.pid}-${randomUUID()}.json`);
    writeJson(file, {pid: process.pid, role, at: new Date().toISOString()});
  } finally { releaseGate(); }
  const release = () => { if (fs.existsSync(file)) fs.unlinkSync(file); };
  process.once('exit', release);
  return release;
}
export async function acquireMaintenance(app) {
  const state = stateDirectory(app), releaseGate = await fileLock(path.join(state, 'gate.lock'));
  try {
    const directory = path.join(state, 'runtime');
    if (fs.existsSync(directory)) for (const name of fs.readdirSync(directory)) {
      const file = path.join(directory, name), lease = readJson(file);
      if (processAlive(lease.pid)) throw Error(`Stop the app and all workers before patching (active ${lease.role}, PID ${lease.pid})`);
      fs.unlinkSync(file);
    }
    return await fileLock(path.join(state, 'update.lock'));
  } finally { releaseGate(); }
}
