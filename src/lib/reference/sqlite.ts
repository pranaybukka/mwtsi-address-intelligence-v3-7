import {createHash} from 'node:crypto';
import type Database from 'better-sqlite3';
import { db } from '../../db/connection';
import { ReferenceRepository,Country,Place,PostalMatch } from './types';
import quality from '../../../reference-data/quality-policy.json';
import {expandedReference,referenceSnapshot,activeReferenceKey} from './expanded';
import {key} from '../parser/normalize';
import { postalKey } from '../parser/normalize';
export class SqliteReferenceRepository implements ReferenceRepository {
 private cache=new Map<string,unknown>();
 private epoch='';
 private contextDb?:Database.Database;private revisionStatement?:Database.Statement;private contextKey='';private contextSignature='';
 context(){const d=db();if(this.contextDb!==d){this.contextDb=d;this.revisionStatement=d.prepare("SELECT value FROM metadata WHERE key='reference-data-revision'");}const key=JSON.stringify([activeReferenceKey(),(this.revisionStatement!.get() as {value:string}|undefined)?.value||'0']);if(key!==this.contextKey){this.contextKey=key;this.contextSignature=createHash('sha256').update(key).digest('hex');}return this.contextSignature;}

 snapshot(){return this.memo('snapshot',()=>referenceSnapshot());}
 private canonical(p:Place):Place{const map=this.memo('canonical',()=>{const aliases=db().prepare('SELECT p.*,a.alias FROM places p JOIN place_aliases a ON a.place_id=p.id').all() as Place[];const entries=new Map<string,Place[]>();for(const item of aliases){const id=`${item.country}|${key(item.alias||item.name)}`;entries.set(id,[...(entries.get(id)||[]),item]);}return entries;});const matches=map.get(`${p.country}|${key(p.name)}`)||[];const match=matches.find(m=>m.subdivision===p.subdivision)||matches.find(m=>!m.subdivision)||(!['US','CA','AU'].includes(p.country)&&new Set(matches.map(m=>m.id)).size===1?matches[0]:undefined);return match?{...p,id:match.id,name:match.name,subdivision:match.subdivision||p.subdivision}:p;}
 invalidate(){this.cache.clear();}
 private memo<T>(key:string,fn:()=>T):T{const epoch=this.context();if(epoch!==this.epoch){this.cache.clear();this.epoch=epoch;}if(this.cache.has(key))return this.cache.get(key) as T;const result=fn();if(this.cache.size>20000)this.cache.clear();this.cache.set(key,result);return result;}
 countries(){return this.memo('countries',()=>db().prepare('SELECT * FROM countries').all() as Country[]);}
 countryMatches(tokens:string[]){return this.lookup<{alias:string;country:string}>('SELECT * FROM country_aliases WHERE alias IN',tokens);}
 aliases(country:string){return this.memo(`alias:${country}`,()=> (db().prepare('SELECT alias FROM country_aliases WHERE country=?').all(country) as {alias:string}[]).map(x=>x.alias));}
 private lookup<T>(sql:string,tokens:string[],suffix='',args:string[]=[]):T[]{const out:T[]=[];for(let i=0;i<tokens.length;i+=400){const chunk=tokens.slice(i,i+400);if(chunk.length)out.push(...db().prepare(`${sql} (${chunk.map(()=>'?').join(',')}) ${suffix}`).all(...chunk,...args) as T[]);}return out;}
 places(tokens:string[],country?:string){return this.memo(`p:${country}:${tokens.join('|')}`,()=>{
 const local=this.lookup<Place>('SELECT p.*,a.alias FROM place_aliases a JOIN places p ON p.id=a.place_id WHERE a.alias IN',tokens,country?'AND p.country=?':'',country?[country]:[]);
 const expanded=expandedReference();if(!expanded)return local;const additional:Place[]=[];
 const allowed=new Set(this.countries().map(c=>c.code));
 for(let i=0;i<tokens.length;i+=400){const chunk=tokens.slice(i,i+400).filter(t=>t.length>=3);if(chunk.length)additional.push(...expanded.prepare(`SELECT p.id,p.country,p.name,p.subdivision,'GEONAMES_CITIES500' AS source,a.alias FROM place_aliases a JOIN places p ON p.id=a.place_id JOIN gazetteer_places g ON g.place_id=p.id WHERE a.alias IN (${chunk.map(()=>'?').join(',')}) ${country?'AND p.country=?':''}`).all(...chunk,...(country?[country]:[])) as Place[]);}
 const result=new Map<string,Place>();for(const p of [...local,...additional.filter(p=>allowed.has(p.country)).map(p=>this.canonical(p)).filter(p=>key(p.alias||p.name)===key(p.name)||!this.aliases(p.country).some(a=>key(a)===key(p.alias||p.name)))]){const id=`${p.id}|${p.alias||p.name}`;if(!result.has(id))result.set(id,p);}return [...result.values()];
 });}

 postal(value:string,country?:string){return this.memo(`z:${country}:${value}`,()=>{
 const expanded=expandedReference();const matches=expanded?.prepare(`SELECT p.id,p.country,p.name,p.subdivision,z.source,z.postal FROM postal_codes z JOIN places p ON p.id=z.place_id WHERE z.postal=? AND z.precision IN ('FULL_CODE','MAJOR_CODE') ${country?'AND z.country=?':''}`).all(postalKey(value),...(country?[country]:[])) as PostalMatch[]|undefined;
 if(!matches?.length&&expanded?.prepare(`SELECT 1 FROM postal_codes WHERE postal=? AND precision IN ('AREA_ONLY','NON_POSTAL_PROOF') ${country?'AND country=?':''} LIMIT 1`).get(postalKey(value),...(country?[country]:[])))return [];
 if(matches?.length)return matches.map(p=>({...this.canonical(p.country==='SG'?{...p,name:'SINGAPORE'}:p),postal:p.postal}));
 return db().prepare(`SELECT p.*,z.postal FROM postal_codes z JOIN places p ON p.id=z.place_id WHERE z.postal=? ${country?'AND z.country=?':''}`).all(...[postalKey(value),...(country?[country]:[])]) as PostalMatch[];
 });}

 subdivisions(country:string){return this.memo(`s:${country}`,()=>{
 const local=db().prepare('SELECT s.code,s.name,a.alias FROM subdivisions s JOIN subdivision_aliases a ON a.country=s.country AND a.code=s.code WHERE s.country=?').all(country) as {code:string;name:string;alias:string}[];
 const broad=(expandedReference()?.prepare('SELECT code,name,alias FROM subdivisions WHERE country=?').all(country)||[]) as typeof local;const unique=new Map<string,typeof local[number]>();for(const s of [...local,...broad]){const id=`${s.code}|${s.alias}`;if(!unique.has(id))unique.set(id,s);}return [...unique.values()];
 });}
 postalPattern(country:string){return this.memo(`pattern:${country}`,()=>{
 const local=(db().prepare('SELECT pattern FROM postal_patterns WHERE country=?').get(country) as {pattern:string}|undefined)?.pattern;
 const broad=(expandedReference()?.prepare('SELECT pattern FROM postal_patterns WHERE country=?').get(country) as {pattern:string}|undefined)?.pattern;return local||(quality.nonPostalProofCountries.includes(country)?undefined:broad);
 });}

}
export const reference=new SqliteReferenceRepository();
