import {beforeAll,describe,expect,it} from 'vitest';
import {ensureSeed} from '../src/db/seed';
import {reference} from '../src/lib/reference/sqlite';
import {processAddress} from '../src/lib/process';
import {reviewRecord} from '../src/lib/review';
import {validate} from '../src/lib/hybrid/validate';
import {translate} from '../src/lib/hybrid/translate';
beforeAll(()=>ensureSeed());
const run=(address:string,bank='')=>processAddress({Name:'FICTIONAL CUSTOMER',Address1:'100 EXAMPLE ROAD',Address2:'',Address3:address,Bank_Country:bank},reference,'iso');
describe('ISO country assignment regressions',()=>{
 it.each([['UK','GB'],['U.S.A.','US'],['840','US'],['Hong Kong SAR, China','HK'],['Macao SAR, China','MO'],['Deutschland','DE']])('resolves Bank_Country %s to %s',(input,code)=>{const r=run('UNLISTED LOCALITY',input);expect(r.intelligence.country.value).toBe(code);expect(r.intelligence.country.source).toBe('BANK_COUNTRY');expect(r.intelligence.conflicts).not.toContain('Invalid Bank_Country supplied');expect(r.source.Bank_Country).toBe(input);});
 it.each([['CENTRAL HONG KONG SAR CHINA','HK'],['MACAO SAR CHINA','MO']])('uses the specific ISO territory for %s',(address,code)=>{const r=run(address);expect(r.intelligence.country.value).toBe(code);expect(r.intelligence.conflicts).not.toContain('Multiple explicit countries in address');});
 it('does not choose an arbitrary country for ambiguous Congo',()=>{const r=run('KINSHASA CONGO');expect(r.intelligence.country.value).toBe('');expect(r.status).toBe('PROPOSED_REVIEW_REQUIRED');expect(r.intelligence.country.alternatives.map(c=>c.value).sort()).toEqual(['CD','CG']);});
 it('normalizes a recognized country edit before saving the decision and Hybrid output',()=>{const r=run('UNLISTED LOCALITY');const edited=reviewRecord(r,'PASS','QA','',{town:'CENTRAL',country:'Hong Kong SAR, China'},reference);expect(edited.intelligence.structured.country).toBe('HK');expect(edited.hybrid.lines).toContain('3/HK/CENTRAL');expect(edited.reviews.at(-1)?.after.country).toBe('HK');});
 it('rejects a two-letter string that is not an assigned ISO code even in pure validation',()=>{const a={name:'TEST',primary:'EXAMPLE ROAD',secondary:'',town:'TEST TOWN',country:'AA',postal:'',subdivision:''};expect(validate(a,translate(a)).issues).toContain('Country unresolved or invalid');});
});

import countries from 'i18n-iso-countries';
import {resolveCountry} from '../src/lib/reference/country-catalog';
import {isIsoCountryCode} from '../src/lib/reference/iso-country';
import {db} from '../src/db/connection';
import {createBatch} from '../src/db/batches';
it('round-trips alpha-2, alpha-3 and three-digit numeric codes for every assigned ISO entry',()=>{
 const all=reference.countries();expect(all).toHaveLength(249);
 for(const country of all){for(const input of [country.code,country.alpha3,countries.alpha2ToNumeric(country.code)!])expect(resolveCountry(input).code,input).toBe(country.code);}
});
it.each([['Hong Kong','HK'],['China','CN'],['Macao','MO'],['Taiwan, Province of China','TW'],['Côte d’Ivoire','CI'],['U.A.E.','AE'],['Türkiye','TR'],['日本','JP'],['United Kingdom','GB']])('recognizes %s without collapsing its ISO entry',(input,code)=>{expect(resolveCountry(input).code).toBe(code);});
it.each(['Congo','Korea'])('requires a specific country for ambiguous %s',name=>{expect(resolveCountry(name).ambiguous).toBe(true);expect(resolveCountry(name).code).toBeUndefined();const r=run('UNLISTED LOCALITY',name);expect(r.intelligence.conflicts).toContain('Ambiguous Bank_Country supplied; use an explicit ISO country code');expect(r.status).toBe('PROPOSED_REVIEW_REQUIRED');});
it.each(['XK','XKK','983','ZZ','AA','SU','YU','AN','CS','NOTPROVIDED','CHINA MAINLAND EXTRA'])('does not invent an ISO assignment for %s',input=>{expect(resolveCountry(input).code).toBeUndefined();expect(isIsoCountryCode(input)).toBe(false);});
it.each([['BERLIN 10117 DEU','DE'],['LONDON, GB','GB'],['CENTRAL, HKG','HK'],['HKG','HK'],['BOSTON MA US','US']])('recognizes corroborated country-code context in %s',(address,code)=>{expect(run(address).intelligence.country.value).toBe(code);});
it('does not mistake a state or prose fragment for a country code',()=>{for(const address of ['Attn Commercial Claims AD','ARRIVE IN MAY','WE CAN HELP'])expect(run(address).intelligence.country.value,address).toBe('');const r=processAddress({Name:'TEST',Address1:'100 EXAMPLE ROAD',Address2:'SAN FRANCISCO',Address3:'CA'},reference,'state');expect(r.intelligence.country.value).toBe('US');});
it('keeps authoritative Bank_Country precedence and conflicts visible',()=>{const r=run('CENTRAL HONG KONG','CHN');expect(r.intelligence.country.value).toBe('CN');expect(r.intelligence.conflicts).toContain('Bank country disagrees with explicit address country');expect(r.status).toBe('PROPOSED_REVIEW_REQUIRED');});
it('does not choose one of two independent explicit countries without bank authority',()=>{const r=run('FRANCE GERMANY');expect(r.intelligence.country.value).toBe('');expect(r.intelligence.country.alternatives.map(c=>c.value).sort()).toEqual(['DE','FR']);});
it('upgrades country aliases idempotently without modifying saved operational data',()=>{const d=db();createBatch('preserved.xlsx',[{Name:'FICTIONAL CUSTOMER',Address1:'100 EXAMPLE ROAD',Address2:'',Address3:'CENTRAL HONG KONG'}]);d.prepare("UPDATE metadata SET value='4' WHERE key='seed-version'").run();d.prepare("DELETE FROM country_aliases WHERE alias='HONG KONG SAR CHINA'").run();const before=d.prepare('SELECT * FROM records').all();expect(before.length).toBeGreaterThan(0);ensureSeed();ensureSeed();reference.invalidate();expect(d.prepare("SELECT country FROM country_aliases WHERE alias='HONG KONG SAR CHINA'").all()).toEqual([{country:'HK'}]);expect(d.prepare('SELECT * FROM records').all()).toEqual(before);});
