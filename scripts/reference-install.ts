import {registerRuntime} from './patch-runtime.mjs';
import fs from 'node:fs';import path from 'node:path';import {randomUUID,createHash} from 'node:crypto';import {Readable,Transform} from 'node:stream';import {pipeline} from 'node:stream/promises';import Database from 'better-sqlite3';
import {db} from '../src/db/connection';
import sources from '../reference-data/sources.json';import quality from '../reference-data/quality-policy.json';import {buildReference,ReferenceFile} from '../src/lib/reference/build';
async function main(){
 await registerRuntime(process.cwd(),'reference installer');
 const args=process.argv.slice(2);const refresh=args.includes('--refresh');const sourceArg=args.indexOf('--source-dir');const offline=args.includes('--offline');
 const output=process.env.ADDRESS_REFERENCE_DB_PATH||path.join(process.cwd(),'data','reference.sqlite');const dir=sourceArg>=0?args[sourceArg+1]:path.join(process.cwd(),'reference-data','sources');if(!dir)throw Error('Specify a source directory');
 const customerFile=process.env.ADDRESS_DB_PATH||path.join(process.cwd(),'data','address.db');const identity=(file:string)=>fs.existsSync(file)?fs.realpathSync(file):path.resolve(file);if(customerFile!==':memory:'&&identity(output)===identity(customerFile))throw Error('Reference and customer database paths must be different');
 const operational=db();const active=operational.prepare("SELECT value FROM metadata WHERE key='active-reference-version'").get() as {value:string}|undefined;
 if(active&&!refresh){console.log('Managed reference configured. Use Reference management for validation and updates.');return;}
 if(refresh){const immutable=operational.prepare("SELECT file_path FROM reference_versions WHERE snapshot_id<>'PENDING'").all() as {file_path:string}[];if(immutable.some(r=>path.resolve(r.file_path)===path.resolve(output)))throw Error('Managed snapshots cannot be overwritten. Stage and activate from Reference management.');const running=operational.prepare("SELECT 1 FROM jobs WHERE status NOT IN ('COMPLETED','CANCELLED') LIMIT 1").get();const pendingOutput=operational.prepare("SELECT 1 FROM reference_versions WHERE file_path=? AND snapshot_id='PENDING'").get(output);if(running&&!pendingOutput)throw Error('Resumable batches pin the reference. Use staged reference management.');}
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.mkdirSync(dir,{recursive:true});
 if(fs.existsSync(output)&&!refresh){const d=new Database(output,{readonly:true});try{const row=d.prepare("SELECT value FROM metadata WHERE key='manifest'").get() as {value:string}|undefined;if(row&&JSON.parse(row.value).schemaVersion===2&&JSON.parse(row.value).normalizationVersion===quality.normalizationVersion){console.log('GeoNames reference already installed. Use reference:refresh for a deliberate update.');return;}}finally{d.close();}}
 const lock=output+'.install.lock';let fd:number;try{fd=fs.openSync(lock,'wx');}catch{throw Error('Another reference installation is active. If a previous process crashed, confirm it stopped before removing '+lock);}
 const staging=output+'.'+randomUUID()+'.staging';
 try{
 const files:ReferenceFile[]=[];
 for(const source of sources.files){const target=path.join(dir,source.file);let retrievedAt=new Date().toISOString(),lastModified:string|undefined;
  if(!fs.existsSync(target)||refresh&&!offline){
   if(offline)throw Error(`Offline source missing: ${source.file}`);console.log(`Downloading public reference: ${source.url}`);const response=await fetch(source.url,{signal:AbortSignal.timeout(180000)});if(!response.ok)throw Error(`Download failed for ${source.file}: HTTP ${response.status}`);if(!response.body)throw Error('Empty source download');lastModified=response.headers.get('last-modified')||undefined;
   const temp=target+'.'+randomUUID()+'.download';let bytes=0;
   try{await pipeline(Readable.fromWeb(response.body as never),new Transform({transform(chunk,_,next){bytes+=chunk.length;next(bytes>150*1024*1024?Error('Reference source exceeds 150 MB'):null,chunk);}}),fs.createWriteStream(temp,{flags:'wx'}));fs.renameSync(temp,target);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
  }else retrievedAt=fs.statSync(target).mtime.toISOString();
  files.push({...source,sha256:createHash('sha256').update(fs.readFileSync(target)).digest('hex'),retrievedAt,lastModified});
 }
 // Postal files first so named administrative codes can normalize gazetteer region identifiers.
 const order=['countries','admin','postal','postal-full','places'];files.sort((a,b)=>order.indexOf(a.kind)-order.indexOf(b.kind));
 const manifest=await buildReference({output:staging,sourceDir:dir,files,attribution:sources.attribution,license:sources.license});
 fs.renameSync(staging,output);fs.writeFileSync(output+'.manifest.json',JSON.stringify(manifest,null,2));console.log(`Installed reference ${manifest.id}: ${manifest.stats.postalRelationships.toLocaleString()} postal relationships in ${manifest.stats.countries} countries; ${manifest.stats.places.toLocaleString()} localities. Attribution: https://www.geonames.org/`);
 }finally{if(fs.existsSync(staging))fs.unlinkSync(staging);fs.closeSync(fd);fs.unlinkSync(lock);}
}
main().catch(error=>{console.error('Reference installation failed:',error.message,'Stop the app before replacing an installed reference. Customer batches are not modified by this command.');process.exitCode=1;});
