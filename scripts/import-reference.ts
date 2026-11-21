import fs from 'node:fs';
import readline from 'node:readline';
import {db} from '../src/db/connection';
import {ensureSeed} from '../src/db/seed';
import {key,postalKey} from '../src/lib/parser/normalize';
/** Usage: npm run db:import -- places|postal /absolute/file.txt
 * GeoNames allCountries place dump OR separate GeoNames postal dump, never interchanged.
 * Stream source and transact chunks; memory is bounded, primary-key upserts are restartable.
 */
async function main(){const [mode,file]=process.argv.slice(2);if(!['places','postal'].includes(mode)||!file)throw Error('Usage: db:import -- places|postal file');ensureSeed();const d=db();let count=0,skipped=0;let rows:string[][]=[];
 const place=d.prepare('INSERT INTO places VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET country=excluded.country,name=excluded.name,normalized_name=excluded.normalized_name,subdivision=excluded.subdivision,source=excluded.source');
 const alias=d.prepare('INSERT OR IGNORE INTO place_aliases VALUES (?,?)');
 const postal=d.prepare('INSERT OR IGNORE INTO postal_codes VALUES (?,?,?,?)');
 const flush=d.transaction(()=>{for(const r of rows){if(mode==='places'){if(r.length<19||r[6]!=='P'){skipped++;continue;}const id=`gn:${r[0]}`;place.run(id,r[8],r[1],key(r[1]),r[10],'GEONAMES');for(const n of [r[1],r[2],...r[3].split(',')].filter(Boolean))alias.run(key(n),id);}else{if(r.length<11){skipped++;continue;}const id=`gnpostal:${r[0]}:${postalKey(r[1])}:${key(r[2])}`;place.run(id,r[0],r[2],key(r[2]),r[4],'GEONAMES_POSTAL');alias.run(key(r[2]),id);postal.run(r[0],postalKey(r[1]),id,r[4]);}count++;}});
 for await(const line of readline.createInterface({input:fs.createReadStream(file),crlfDelay:Infinity})){if(!line||line.startsWith('#'))continue;rows.push(line.split('\t'));if(rows.length>=5000){flush();rows=[];}}flush();console.log({imported:count,skipped});}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
