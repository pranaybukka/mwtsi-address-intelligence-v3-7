import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {createHash} from 'node:crypto';
import JSZip from 'jszip';
import quality from '../../../reference-data/quality-policy.json';
import {key,normalize,postalKey} from '../parser/normalize';
export interface ReferenceFile {file:string;url:string;kind:string;entry?:string;country?:string;sha256?:string;retrievedAt?:string;lastModified?:string;}
export interface ReferenceBuildOptions {output:string;sourceDir:string;files:ReferenceFile[];attribution:string;license:string;}
const schema=`CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);CREATE TABLE places(id TEXT PRIMARY KEY,country TEXT NOT NULL,name TEXT NOT NULL,subdivision TEXT NOT NULL,source TEXT NOT NULL) WITHOUT ROWID;CREATE TABLE gazetteer_places(place_id TEXT PRIMARY KEY) WITHOUT ROWID;CREATE TABLE place_aliases(alias TEXT NOT NULL,place_id TEXT NOT NULL,PRIMARY KEY(alias,place_id)) WITHOUT ROWID;CREATE TABLE postal_codes(country TEXT NOT NULL,postal TEXT NOT NULL,place_id TEXT NOT NULL,source TEXT NOT NULL,precision TEXT NOT NULL,PRIMARY KEY(country,postal,place_id)) WITHOUT ROWID;CREATE TABLE subdivisions(country TEXT NOT NULL,code TEXT NOT NULL,name TEXT NOT NULL,alias TEXT NOT NULL,PRIMARY KEY(country,alias,code)) WITHOUT ROWID;CREATE TABLE postal_patterns(country TEXT PRIMARY KEY,pattern TEXT NOT NULL);`;
/** Build only a new staging file. Callers publish it atomically after closing handles. */
export async function buildReference(options:ReferenceBuildOptions){
 if(fs.existsSync(options.output))throw Error('Reference staging file already exists');
 const d=new Database(options.output);const counts:Record<string,number>={};const skipped:Record<string,number>={};const countries=new Set<string>();const adminNames=new Map<string,string>();const stateCodes=new Map<string,string>();
 try{
 d.pragma('journal_mode = OFF');d.pragma('synchronous = OFF');d.pragma('cache_size = -32768');d.exec(schema);
 const place=d.prepare('INSERT OR IGNORE INTO places VALUES (?,?,?,?,?)'),alias=d.prepare('INSERT OR IGNORE INTO place_aliases VALUES (?,?)'),postal=d.prepare('INSERT OR IGNORE INTO postal_codes VALUES (?,?,?,?,?)'),sub=d.prepare('INSERT OR IGNORE INTO subdivisions VALUES (?,?,?,?)');
 const idFor=(country:string,town:string,region:string)=>'gn:'+createHash('sha256').update(`${country}|${key(town)}|${region}`).digest('hex').slice(0,32);
 const addPlace=(country:string,town:string,region:string,source:string,names:string[]=[])=>{const id=idFor(country,town,region);place.run(id,country,normalize(town),region,source);for(const name of new Set([town,...names].map(key).filter(n=>n.length>=3&&!/^\d+$/.test(n))))alias.run(name,id);return id;};
 const addSub=(country:string,code:string,name:string)=>{if(!code||!name)return;for(const a of new Set([code,name].map(key)))sub.run(country,code,normalize(name),a);};
 const manifestFiles:ReferenceFile[]=[];
 for(const file of options.files){
  const filename=path.join(options.sourceDir,file.file);const bytes=fs.readFileSync(filename);const hash=createHash('sha256').update(bytes).digest('hex');if(file.sha256&&hash!==file.sha256)throw Error(`Checksum mismatch for ${file.file}`);
  let input:NodeJS.ReadableStream;
  if(file.entry){const zip=await JSZip.loadAsync(bytes);const entry=zip.file(file.entry);if(!entry)throw Error(`Required entry ${file.entry} missing in ${file.file}`);input=entry.nodeStream();}else input=fs.createReadStream(filename);
  let rows:string[][]=[];counts[file.file]=0;skipped[file.file]=0;
  const flush=d.transaction(()=>{for(const r of rows){
   if(file.kind==='countries'){
    if(r.length<19||!r[0].match(/^[A-Z]{2}$/)||r[0]==='XK'){skipped[file.file]++;continue;}countries.add(r[0]);
    const pattern=(r[14]||'').trim().replace(/^\^/,'').replace(/\$$/,'');if(pattern&&pattern.length<512){try{new RegExp(pattern,'u');d.prepare('INSERT OR REPLACE INTO postal_patterns VALUES (?,?)').run(r[0],pattern);}catch{/* Unsupported source expression is not promoted. */}}
   }else if(file.kind==='admin'){
    if(r.length<4||!r[0].includes('.')){skipped[file.file]++;continue;}adminNames.set(r[0],r[1]);
   }else if(file.kind==='places'){
    if(r.length!==19||r[6]!=='P'||!countries.has(r[8])||!r[1]){skipped[file.file]++;continue;}
    const country=r[8],raw=r[10],name=adminNames.get(`${country}.${raw}`)||raw;const region=stateCodes.get(`${country}|${key(name)}`)||raw;
    addSub(country,region,name);const placeId=addPlace(country,r[1],region,'GEONAMES_CITIES500',[r[2],...r[3].split(',')]);d.prepare('INSERT OR IGNORE INTO gazetteer_places VALUES (?)').run(placeId);
   }else{
    if(r.length!==12||!countries.has(r[0])||!r[1]||!r[2]||r[1].length>32||/^0+$/.test(postalKey(r[1]))||(file.country&&r[0]!==file.country)){skipped[file.file]++;continue;}
    // These countries have dedicated full-code files. Never label area-only prefixes as full postal codes.
    if(file.kind==='postal'&&['CA','GB','NL'].includes(r[0])){skipped[file.file]++;continue;}
    const country=r[0],region=r[4];if(r[3]&&region)stateCodes.set(`${country}|${key(r[3])}`,region);addSub(country,region,r[3]);
    const source=`GEONAMES_${file.country||'GLOBAL'}_POSTAL`;const id=addPlace(country,r[2],region,source);
    const precision=quality.nonPostalProofCountries.includes(country)?'NON_POSTAL_PROOF':quality.areaOnlyCountries.includes(country)?'AREA_ONLY':quality.majorCodeCountries.includes(country)?'MAJOR_CODE':'FULL_CODE';
    postal.run(country,postalKey(r[1]),id,source,precision);
   }
   counts[file.file]++;
  }});
  for await(const line of readline.createInterface({input:input as NodeJS.ReadableStream,crlfDelay:Infinity})){if(!line||line.startsWith('#'))continue;if(line.length>200000){skipped[file.file]++;continue;}rows.push(line.replace(/\r$/,'').split('\t'));if(rows.length>=5000){flush();rows=[];}}
  if(rows.length)flush();if(!counts[file.file])throw Error(`No valid rows in ${file.file}`);
  manifestFiles.push({...file,sha256:hash});console.log(`${file.file}: ${counts[file.file].toLocaleString()} rows; ${skipped[file.file].toLocaleString()} skipped`);
 }
 d.exec('CREATE INDEX places_country ON places(country);CREATE INDEX postal_lookup ON postal_codes(postal,country);');
 const scalar=(sql:string)=>Number((d.prepare(sql).get() as {n:number}).n);
 const coverage=d.prepare("SELECT country,COUNT(*) AS relationships,COUNT(DISTINCT postal) AS postalCodes,SUM(precision IN ('FULL_CODE','MAJOR_CODE')) AS lookupRelationships FROM postal_codes GROUP BY country ORDER BY country").all();
 const stats={gazetteerPlaces:scalar('SELECT COUNT(*) AS n FROM gazetteer_places'),lookupCountries:(coverage as {lookupRelationships:number}[]).filter(c=>c.lookupRelationships>0).length,places:scalar('SELECT COUNT(*) AS n FROM places'),aliases:scalar('SELECT COUNT(*) AS n FROM place_aliases'),postalRelationships:scalar('SELECT COUNT(*) AS n FROM postal_codes'),exactLookupRelationships:scalar("SELECT COUNT(*) AS n FROM postal_codes WHERE precision IN ('FULL_CODE','MAJOR_CODE')"),countries:coverage.length,postalCodes:scalar('SELECT COUNT(*) AS n FROM (SELECT country,postal FROM postal_codes GROUP BY country,postal)'),coverage,counts,skipped};
 const createdAt=new Date().toISOString();const id=createHash('sha256').update(`normalization-v${quality.normalizationVersion}|`+JSON.stringify(manifestFiles.map(f=>[f.file,f.sha256]))).digest('hex').slice(0,20);
 const manifest={schemaVersion:2,normalizationVersion:quality.normalizationVersion,id,provider:'GeoNames',license:options.license,attribution:options.attribution,createdAt,files:manifestFiles,stats};
 d.prepare('INSERT INTO metadata VALUES (?,?)').run('manifest',JSON.stringify(manifest));d.pragma('optimize');
 const integrity=d.pragma('quick_check',{simple:true});if(integrity!=='ok')throw Error('Reference integrity check failed');
 return manifest;
 }finally{d.close();}
}
