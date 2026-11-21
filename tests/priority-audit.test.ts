import {beforeAll,describe,it,expect} from 'vitest';
import {translate} from '../src/lib/hybrid/translate';
import {validate} from '../src/lib/hybrid/validate';
import {StructuredAddress} from '../src/lib/domain';
import {ensureSeed} from '../src/db/seed';
import {reference} from '../src/lib/reference/sqlite';
import {reviewRecord} from '../src/lib/review';
import {processAddress} from '../src/lib/process';
const base:StructuredAddress={name:'TEST CUSTOMER',primary:'A'.repeat(40),secondary:'B'.repeat(40),postal:'02110',subdivision:'MA',town:'BOSTON',country:'US'};
beforeAll(()=>ensureSeed());
describe('independent priority enforcement',()=>{
 it('checks combinations against literal priority sequence',()=>{for(const n of [0,1,33,34,66,67])for(const p of [0,16,17,32,33,34,66,67])for(const s of [0,16,17,33,34,67])for(const z of ['', '02110']){const a={...base,name:'N'.repeat(n),primary:'A'.repeat(p),secondary:'B'.repeat(s),postal:z,subdivision:''};const h=translate(a);const names=['1a','1b'].filter(k=>h.candidates[k as '1a']);const keys=(['2a','2z','2c','2b','2d'] as const).filter(k=>h.candidates[k]).slice(0,Math.min(2,4-names.length-1));expect(h.lines.filter(l=>l.startsWith('2/'))).toEqual(keys.map(k=>h.candidates[k]));expect(h.selectionAudit?.status).toBe('PASS');expect(h.lines.length).toBeLessThanOrEqual(4);expect(h.lines.filter(l=>l.startsWith('3/'))).toHaveLength(1);}});
 it('retains postal before secondary and continuations',()=>{const h=translate(base);expect(h.selectionAudit?.selectedKeys).toEqual(['1a','2a','2z','3a']);expect(h.selectionAudit?.postalDisposition).toBe('RETAINED_2Z');});
 it('explains postal displaced by mandatory second Name and primary',()=>{const h=translate({...base,name:'N'.repeat(34)});expect(h.selectionAudit?.selectedKeys).toEqual(['1a','1b','2a','3a']);expect(h.selectionAudit?.postalDisposition).toBe('DROPPED_BY_PRIORITY');expect(h.dropped.some(e=>e.field==='2z')).toBe(true);});
 it('retains postal in the one slot if primary is absent',()=>{const h=translate({...base,name:'N'.repeat(34),primary:''});expect(h.selectionAudit?.selectedKeys).toEqual(['1a','1b','2z','3a']);});
 it('rejects lower priority substituted for postal even with forged trace',()=>{const h=translate(base);h.lines[2]=h.candidates['2c']!;expect(validate(base,h).priority).toBe('FAIL');expect(validate(base,h).pmpg).toBe('FAIL');});
 it('rejects altered candidate and line together',()=>{const h=translate(base);h.candidates['2z']='2/WRONG';h.lines[2]='2/WRONG';expect(validate(base,h).priority).toBe('FAIL');});
 it('requires complete truncation and priority-drop audits',()=>{const a={...base,name:'N'.repeat(70)};const h=translate(a);h.dropped=[];h.truncations=[];expect(validate(a,h).priority).toBe('FAIL');});
 it.each([['AU','1234 EXAMPLE ROAD','SYDNEY NSW 2000 AUSTRALIA','2000'],['BE','1234 EXAMPLE ROAD','BRUSSELS 1000 BELGIUM','1000'],['DE','12345 EXAMPLE ROAD','BERLIN 10117 GERMANY','10117']])('does not promote %s house number to postal',(country,street,locality,postal)=>{const r=processAddress({Name:'TEST CUSTOMER',Address1:street,Address2:'',Address3:locality,Bank_Country:country},reference,'p');expect(r.intelligence.structured.postal).toBe(postal);expect(r.hybrid.selectionAudit?.status).toBe('PASS');});
 it('does not invent postal from an AU house number',()=>{const r=processAddress({Name:'TEST CUSTOMER',Address1:'1234 EXAMPLE ROAD',Address2:'',Address3:'SYDNEY AUSTRALIA',Bank_Country:'AU'},reference,'p');expect(r.intelligence.structured.postal).toBe('');});
 it('moves a standalone postal/state line into 2z despite missing Town',()=>{const r=processAddress({Name:'TEST CUSTOMER',Address1:'100 EXAMPLE ROAD',Address2:'',Address3:'99999 MA',Bank_Country:'US'},reference,'p');expect(r.intelligence.structured.postal).toBe('99999');expect(r.intelligence.sanitized[2]).toBe('');expect(r.hybrid.candidates['2z']).toBe('2/99999 MA');});
});

it('retains postal supplied by review of a name-only source',()=>{const original=processAddress({Name:'TEST CUSTOMER',Address1:'',Address2:'',Address3:''},reference,'n');expect(original.status).toBe('NAME_ONLY');const edited=reviewRecord(original,'EDIT','Operator','Added evidence',{postal:'02110',town:'BOSTON',country:'US'},reference);expect(edited.hybrid.lines).toContain('2/02110');expect(edited.hybrid.lines).toContain('3/US/BOSTON');expect(edited.hybrid.selectionAudit?.status).toBe('PASS');});
