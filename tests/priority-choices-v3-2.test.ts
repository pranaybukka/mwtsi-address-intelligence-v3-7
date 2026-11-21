import {it,expect} from 'vitest';
import {translate} from '../src/lib/hybrid/translate';
import {validate} from '../src/lib/hybrid/validate';
import type {StructuredAddress} from '../src/lib/domain';
const base:StructuredAddress={name:'TEST CUSTOMER',primary:'',secondary:'',postal:'02110',subdivision:'MA',town:'BOSTON',country:'US'};
it('does not claim a larger building number cut at character 33 as postal coverage',()=>{const h=translate({...base,primary:'R'.repeat(27)+' 021100 HOUSE',postal:'02110',subdivision:''});expect(h.candidates['2a']).toBe('2/'+'R'.repeat(27)+' 02110');expect(h.lines).toContain('2/02110');expect(h.selectionAudit?.postalDisposition).toBe('RETAINED_2Z');});
it('keeps punctuation differences distinct when checking complete postal coverage',()=>{const h=translate({...base,primary:'AB 12 EXAMPLE ROAD',postal:'AB-12',subdivision:''});expect(h.lines).toContain('2/AB-12');expect(h.selectionAudit?.postalDisposition).toBe('RETAINED_2Z');});
it('separates emitted malformed postal content from line-priority validation',()=>{const a={...base,primary:'125 EXAMPLE ROAD',postal:'---',subdivision:''},h=translate(a);expect(h.lines).toContain('2/---');expect(h.selectionAudit?.status).toBe('PASS');});
// Literal oracle intentionally imports no production candidate, priority, selection or truncation helpers.
it('checks 3,456 boundary combinations against an independent output oracle',()=>{
 let cases=0;
 for(const n of [0,1,33,34,66,67])for(const p of [0,1,16,17,32,33,34,66])for(const s of [0,1,16,17,33,34])for(const z of ['', '02110'])for(const st of ['', 'S'.repeat(40)])for(const t of ['', 'T'.repeat(30),'T'.repeat(31)]){
  const a={...base,name:'N'.repeat(n),primary:'A'.repeat(p),secondary:'B'.repeat(s),postal:z,subdivision:st,town:t};const part=(x:string,start:number,end:number)=>Array.from(x).slice(start,end).join('');
  const names=Array.from(a.name).length>33?['1/'+part(a.name,0,33),'1/'+part(a.name,33,66)]:a.name?['1/'+a.name]:[];
  let primary=a.primary,secondary=a.secondary;if(primary&&secondary&&p+s<33){primary+=' '+secondary;secondary='';}
  const postal=part(z,0,33),state=part(st,0,Math.max(0,33-Array.from(postal).length-(postal&&st?1:0))),payload=[postal,state].filter(Boolean).join(' ');
  const choices=[primary?'2/'+part(primary,0,33):'',payload?'2/'+payload:'',secondary?'2/'+part(secondary,0,33):'',Array.from(primary).length>33?'2/'+part(primary,33,66):'',Array.from(secondary).length>33?'2/'+part(secondary,33,66):''].filter(Boolean);
  const expected=[...names,...choices.slice(0,Math.min(2,4-names.length-1)),'3/US/'+part(t||'NOTPROVIDED',0,30)];expect(translate(a).lines).toEqual(expected);cases++;
 }
 expect(cases).toBe(3456);
});
it.each(['02110 MA','125 ROAD 02110 MA','02110 MA ROAD'])('does not duplicate postal/state already retained in primary: %s',primary=>{
 const a={...base,primary,secondary:'SECONDARY BUILDING INFORMATION LONGER THAN 33'},h=translate(a);expect(h.candidates['2z']).toBeUndefined();expect(h.selectionAudit?.selectedKeys).toEqual(['1a','2a','2c','3a']);expect(h.lines[2]).toBe('2/SECONDARY BUILDING INFORMATION LO');expect(h.selectionAudit?.postalDisposition).toBe('RETAINED_IDENTICAL_LINE');expect(validate(a,h).priority).toBe('PASS');
});
it('retains the postal carried by combined primary/secondary without allocating a duplicate slot',()=>{const h=translate({...base,primary:'02110 MA',secondary:'SUITE 4'});expect(h.lines).toEqual(['1/TEST CUSTOMER','2/02110 MA SUITE 4','3/US/BOSTON']);expect(h.selectionAudit?.postalDisposition).toBe('RETAINED_IDENTICAL_LINE');});
it.each(['102110 MA','021100 MA','02110 MAIN STREET','HOUSE 02110','A'.repeat(33)+'02110 MA'])('does not treat partial or omitted text as retained postal/state: %s',primary=>{const h=translate({...base,primary});expect(h.lines).toContain('2/02110 MA');expect(h.selectionAudit?.postalDisposition).toBe('RETAINED_2Z');});
it('does not drop postal because the matching secondary is lower priority and will not fit',()=>{const h=translate({...base,name:'N'.repeat(34),primary:'125 EXAMPLE ROAD WITH A LONG STREET',secondary:'02110 MA'});expect(h.selectionAudit?.selectedKeys).toEqual(['1a','1b','2a','3a']);expect(h.selectionAudit?.postalDisposition).toBe('DROPPED_BY_PRIORITY');});
it('preserves Unicode Name boundaries, the strict combine boundary and Name-only policy',()=>{
 const a={...base,name:'😀'.repeat(67),primary:'A'.repeat(17),secondary:'B'.repeat(16)};const h=translate(a);expect(h.lines[0]).toBe('1/'+'😀'.repeat(33));expect(h.lines[1]).toBe('1/'+'😀'.repeat(33));expect(h.candidates['2c']).toBe('2/'+'B'.repeat(16));expect(h.truncations).toContainEqual({field:'Name',value:'😀',reason:'Truncated after 66 characters'});
 const only=translate({...base,primary:'',postal:'',subdivision:'',town:'',country:''},true);expect(only.lines).toEqual(['1/TEST CUSTOMER']);expect(only.selectionAudit?.decisions.find(d=>d.key==='3a')?.reason).toContain('Name-only policy');
});
