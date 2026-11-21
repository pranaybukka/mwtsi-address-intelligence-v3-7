import { describe,it,expect } from 'vitest';
import { StructuredAddress } from '../src/lib/domain';
import { translate } from '../src/lib/hybrid/translate';
import { validate } from '../src/lib/hybrid/validate';
import { shouldCombine } from '../src/lib/hybrid/priorities';
const base:StructuredAddress={name:'JOHN',primary:'MAIN',secondary:'',town:'BOSTON',country:'US',postal:'',subdivision:''};
describe('deterministic internal rules',()=>{
 it('combines raw32 but not33',()=>{expect(shouldCombine('a'.repeat(16),'b'.repeat(16))).toBe(true);expect(shouldCombine('a'.repeat(17),'b'.repeat(16))).toBe(false);expect(translate({...base,primary:'a'.repeat(16),secondary:'b'.repeat(16)}).candidates['2a']).toHaveLength(35);});
 it('splits name35 at33',()=>{const h=translate({...base,name:'N'.repeat(35)});expect(h.lines.slice(0,2)).toEqual(['1/'+'N'.repeat(33),'1/NN']);});
 it('audits name and both address sources beyond66',()=>{const h=translate({...base,name:'N'.repeat(70),primary:'A'.repeat(70),secondary:'B'.repeat(70)});expect(h.truncations).toHaveLength(3);expect(h.truncations.map(x=>x.value)).toEqual(['NNNN','AAAA','BBBB']);expect(h.candidates['2b']).toBe('2/'+'A'.repeat(33));expect(h.candidates['2d']).toBe('2/'+'B'.repeat(33));});
 it('2z outranks2b and2c outranks2b',()=>{expect(translate({...base,primary:'A'.repeat(40),postal:'02110'}).lines).toContain('2/02110');const h=translate({...base,primary:'A'.repeat(40),secondary:'SECOND'});expect(h.lines).toEqual(['1/JOHN','2/'+'A'.repeat(33),'2/SECOND','3/US/BOSTON']);expect(h.dropped[0].reason).toBe('Dropped due to Hybrid line priority');});
 it('reserves names and3 ahead of optional lines',()=>{const h=translate({...base,name:'N'.repeat(35),primary:'A'.repeat(40),postal:'02110'});expect(h.lines).toHaveLength(4);expect(h.lines[3]).toBe('3/US/BOSTON');expect(h.dropped.some(x=>x.field==='2z')).toBe(true);});
 it('town30 audit',()=>{const h=translate({...base,town:'T'.repeat(35)});expect(h.candidates['3a']).toBe('3/US/'+'T'.repeat(30));expect(h.truncations[0].value).toBe('TTTTT');});
 it('postal survives subdivision truncation incl international',()=>{const h=translate({...base,postal:'M5H 1J9',subdivision:'S'.repeat(40)});expect(h.candidates['2z']).toHaveLength(35);expect(h.candidates['2z']).toMatch(/^2\/M5H 1J9 /);expect(h.truncations[0].field).toBe('Subdivision');});
 it('postal longer than33 audits remainder',()=>{const h=translate({...base,postal:'P'.repeat(35),subdivision:'ON'});expect(h.candidates['2z']).toBe('2/'+'P'.repeat(33));expect(h.truncations).toHaveLength(2);});
 it('detects duplicate locality and fallback',()=>{const a={...base,primary:'MAIN BOSTON'};expect(validate(a,translate(a)).duplication).toBe('FAIL');const b={...base,country:'ZZ',town:'NOTPROVIDED'};expect(validate(b,translate(b)).pmpg).toBe('FAIL');});
 it('Unicode segmentation never splits a code point',()=>{const h=translate({...base,name:'😀'.repeat(35)});expect(Array.from(h.lines[0].slice(2))).toHaveLength(33);});
 it('no randomized combination exceeds capacity or payload',()=>{for(let i=0;i<150;i++){const h=translate({...base,name:'N'.repeat(i),primary:'A'.repeat(i),secondary:'B'.repeat(150-i),town:'T'.repeat(i),postal:'P'.repeat(i%40),subdivision:'S'.repeat(40)});expect(h.lines.length).toBeLessThanOrEqual(4);expect(h.lines.filter(x=>x.startsWith('3/'))).toHaveLength(1);h.lines.forEach(l=>expect(Array.from(l.slice(2)).length).toBeLessThanOrEqual(33));}});
});
