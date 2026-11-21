import {beforeAll,it,expect} from 'vitest';
import type {RecordResult,StructuredAddress} from '../src/lib/domain';
import {ISO_POSTAL_FIELDS,isoPostalOutputs,proposeIsoPostal,type IsoPostalProposal} from '../src/lib/iso-postal';
import {ensureSeed} from '../src/db/seed';
import {processAddress} from '../src/lib/process';
import {reference} from '../src/lib/reference/sqlite';
const address:StructuredAddress={name:'NAME IS NOT A POSTAL ELEMENT',primary:'125 CEDAR VALE AVENUE',secondary:'SUITE 8',town:'BOSTON',postal:'02110',subdivision:'MA',country:'US'};
const proposal=(values:Partial<StructuredAddress>={})=>proposeIsoPostal({intelligence:{structured:{...address,...values}}} as RecordResult);
beforeAll(()=>ensureSeed());
it('generates literal ordered structured and hybrid fragments with separate postal/state and no party name',()=>{
 const output=isoPostalOutputs(proposal());
 expect(output.structured.xml).toBe('<PstlAdr>\n  <StrtNm>CEDAR VALE AVENUE</StrtNm>\n  <BldgNb>125</BldgNb>\n  <Room>SUITE 8</Room>\n  <PstCd>02110</PstCd>\n  <TwnNm>BOSTON</TwnNm>\n  <CtrySubDvsn>MA</CtrySubDvsn>\n  <Ctry>US</Ctry>\n</PstlAdr>');
 expect(output.hybrid.xml).toBe('<PstlAdr>\n  <PstCd>02110</PstCd>\n  <TwnNm>BOSTON</TwnNm>\n  <CtrySubDvsn>MA</CtrySubDvsn>\n  <Ctry>US</Ctry>\n  <AdrLine>125 CEDAR VALE AVENUE</AdrLine>\n  <AdrLine>SUITE 8</AdrLine>\n</PstlAdr>');
 expect(output.structured.issues).toEqual([]);expect(output.hybrid.issues).toEqual([]);expect(JSON.stringify(output)).not.toContain(address.name);
});
it('uses all PostalAddress24 fields in schema sequence rather than alphabetic or editing order',()=>{
 const p=proposal();for(const field of ISO_POSTAL_FIELDS)p.elements[field.key]=field.key==='Ctry'?'DE':field.key;
 expect(isoPostalOutputs(p).structured.xml.match(/  <[A-Za-z]+>/g)).toEqual(['  <Dept>','  <SubDept>','  <StrtNm>','  <BldgNb>','  <BldgNm>','  <Flr>','  <PstBx>','  <Room>','  <PstCd>','  <TwnNm>','  <TwnLctnNm>','  <DstrctNm>','  <CtrySubDvsn>','  <Ctry>']);
});
it('uses pre-slash values, preserving postal and 35-character ISO towns independent of long Name priority',()=>{
 const r=processAddress({Name:'WILLOWMERE INTERNATIONAL PROCUREMENT AND DISTRIBUTION SERVICES HOLDINGS LIMITED',Address1:'125 CEDAR VALE AVENUE',Address2:'SUITE 8',Address3:'BOSTON MA 02110',Bank_Country:'US'},reference,'iso');
 expect(r.hybrid.lines.join('\n')).not.toContain('02110');expect(isoPostalOutputs(proposeIsoPostal(r)).hybrid.xml).toContain('<PstCd>02110</PstCd>');
 const town='A'.repeat(35);expect(isoPostalOutputs(proposal({town})).structured.xml).toContain(`<TwnNm>${town}</TwnNm>`);
});
it('keeps five-digit house numbers separate from postal lookup and respects postal lookup Off',()=>{
 for(const enabled of [true,false]){const r=processAddress({Name:'ISO TEST',Address1:'12345 SAMUEL LINCOLN DRIVE',Address2:'10001',Address3:'',Bank_Country:'US'},reference,'iso',{countryThreshold:.92,townThreshold:.9,authorityOrder:['HUMAN_REVIEW','BANK_IDENTIFIER','ADDRESS_INFERENCE','UNRESOLVED'],nameOnlyPolicy:'SLASH_33_66',postalLookupEnabled:enabled});const p=proposeIsoPostal(r);expect(p.elements.BldgNb).toBe('12345');expect(p.elements.PstCd).toBe('10001');expect(p.elements.TwnNm).toBe(enabled?'NEW YORK':'');expect(isoPostalOutputs(p).hybrid.xml).not.toContain('NOTPROVIDED');}
});
it('keeps Hong Kong HK distinct from China CN and rejects unassigned or placeholder country codes',()=>{
 expect(isoPostalOutputs(proposal({country:'HK',town:'HONG KONG'})).structured.xml).toContain('<Ctry>HK</Ctry>');
 for(const country of ['CN','gb'])expect(isoPostalOutputs(proposal({country})).structured.xml).toContain(`<Ctry>${country.toUpperCase()}</Ctry>`);
 for(const country of ['ZZ','XK','UK','CHINA','USA']){const o=isoPostalOutputs(proposal({country}));expect(o.structured.xml).not.toContain('<Ctry>');expect(o.hybrid.issues.some(i=>i.field==='Ctry')).toBe(true);}
});
it.each(['NOTPROVIDED','Not provided','Unresolved','UNKNOWN','N/A','NULL'])('does not emit a fake required town: %s',town=>{
 const o=isoPostalOutputs(proposal({town}));for(const kind of ['structured','hybrid'] as const){expect(o[kind].xml).not.toContain('<TwnNm>');expect(o[kind].issues.some(i=>i.field==='TwnNm')).toBe(true);}
});
it('does not invent a postal address or empty XML tags for Name-only data',()=>{
 const o=isoPostalOutputs(proposal({primary:'',secondary:'',country:'',town:'',postal:'',subdivision:''}));expect(o.structured.xml).toBe('');expect(o.hybrid.xml).toBe('');expect(o.hybrid.issues.map(i=>i.field)).toEqual(['TwnNm','Ctry']);
});
it('preserves unresolved source instead of disguising arbitrary text as a street or building',()=>{
 const p=proposal({primary:'ATTENTION FICTIONAL CUSTOMER',secondary:'UNMARKED CAMPUS'});expect(p.elements.StrtNm).toBe('');expect(p.elements.BldgNm).toBe('');expect(p.unmapped).toEqual(['ATTENTION FICTIONAL CUSTOMER','UNMARKED CAMPUS']);const o=isoPostalOutputs(p);expect(o.structured.issues.filter(i=>i.field==='Unmapped source')).toHaveLength(2);expect(o.hybrid.xml).toContain('<AdrLine>ATTENTION FICTIONAL CUSTOMER</AdrLine>');
 p.elements.BldgNm='UNMARKED CAMPUS';expect(isoPostalOutputs(p).structured.issues.filter(i=>i.field==='Unmapped source')).toHaveLength(1);
});
it('proposes explicitly labelled departments, post box, floor, building and suite while preserving duplicate unassigned units',()=>{
 const p=proposal({primary:'PO BOX 123',secondary:'SUB-DEPT OPERATIONS, DEPARTMENT PAYMENTS, BUILDING CEDAR TOWER, 6TH FLOOR, SUITE 8, ROOM 9'});expect(p.elements).toMatchObject({PstBx:'123',SubDept:'OPERATIONS',Dept:'PAYMENTS',BldgNm:'CEDAR TOWER',Flr:'6TH',Room:'SUITE 8'});expect(p.unmapped).toEqual(['ROOM 9']);
});
it('does not treat highway numbers as trailing building numbers and supports selected number-after-street conventions',()=>{
 expect(proposal({primary:'HIGHWAY 66',secondary:'',country:'US'}).unmapped).toEqual(['HIGHWAY 66']);expect(proposal({primary:'HOOGSTRAAT 6',country:'BE'}).elements).toMatchObject({StrtNm:'HOOGSTRAAT',BldgNb:'6'});
});
it('escapes XML injection, ampersands, apostrophes and quotes in both representations',()=>{
 const p=proposal();p.elements.StrtNm='A&B <Road> "Main" \'North\'';p.hybridAddress='1 A&B <Road> "Main" \'North\'';const o=isoPostalOutputs(p);for(const kind of ['structured','hybrid'] as const){expect(o[kind].xml).toContain('A&amp;B &lt;Road&gt; &quot;Main&quot; &apos;North&apos;');expect(o[kind].xml).not.toContain('<Road>');}
});
it('removes illegal XML characters with explicit findings without stripping valid non-ASCII characters',()=>{
 const p=proposal();p.elements.StrtNm='SÃO\u0000 PAULO \ud800\ufffe ROAD 東京';p.hybridAddress='SÃO\u0000 PAULO \ud800\ufffe ROAD 東京';const o=isoPostalOutputs(p);expect(o.structured.xml).toContain('SÃO PAULO ROAD 東京');expect(o.structured.issues.some(i=>/XML characters/.test(i.message))).toBe(true);expect(o.hybrid.issues.some(i=>/XML characters/.test(i.message))).toBe(true);
});
it('enforces independent ISO field lengths and retains every overflow tail as a finding',()=>{
 const p=proposal();p.elements.BldgNb='12345678901234567';p.elements.StrtNm='😀'.repeat(71);p.elements.TwnNm='T'.repeat(36);p.elements.PstCd='P'.repeat(17);const o=isoPostalOutputs(p);expect(o.structured.xml).toContain(`<StrtNm>${'😀'.repeat(70)}</StrtNm>`);expect(o.structured.xml).toContain('<BldgNb>1234567890123456</BldgNb>');expect(o.structured.issues.filter(i=>i.omitted).map(i=>i.omitted)).toEqual(['😀','7','P','T']);expect(o.structured.xml).not.toContain('\ufffd');
});
it('enforces two 70-code-point hybrid lines with explicit overflow and no slash-format prefixes',()=>{
 const p=proposal();p.hybridAddress='😀'.repeat(141);const o=isoPostalOutputs(p).hybrid;expect(o.xml.match(/<AdrLine>/g)).toHaveLength(2);expect(o.xml).toContain(`<AdrLine>${'😀'.repeat(70)}</AdrLine>`);expect(o.issues.find(i=>i.field==='AdrLine')?.omitted).toBe('😀');expect(o.xml).not.toMatch(/>[123]\//);
});
it('wraps multiple input lines to available hybrid capacity and preserves the text order',()=>{
 const p=proposal();p.hybridAddress='ONE\nTWO\nTHREE';const o=isoPostalOutputs(p).hybrid;expect(o.xml).toContain('<AdrLine>ONE TWO THREE</AdrLine>');expect(o.issues.some(i=>i.field==='AdrLine')).toBe(false);
});
it('flags potential structured/AdrLine repeats without deleting genuine same-named streets or house numbers',()=>{
 const p=proposal({primary:'02110 BOSTON ROAD',secondary:''});const o=isoPostalOutputs(p).hybrid;expect(o.xml).toContain('<AdrLine>02110 BOSTON ROAD</AdrLine>');expect(o.issues.filter(i=>['TwnNm','PstCd'].includes(i.field))).toHaveLength(2);
});
it('does not mutate interpreted data or the proposal during either serialization',()=>{
 const p=proposal();const before=JSON.stringify(p);isoPostalOutputs(p);expect(JSON.stringify(p)).toBe(before);const a=Object.freeze({...address});expect(()=>proposeIsoPostal({intelligence:{structured:a}} as RecordResult)).not.toThrow();
});
