import {CandidateKey,HybridOutput,SelectionAudit,StructuredAddress} from '../domain';
import {generateCandidates,postalPayload,containsPostalPayload} from './candidates';
import {ADDRESS_PRIORITY,MAX_LINES,MAX_ADDRESS_LINES} from './priorities';
/** Re-check the stored result against structured input, rather than trusting a stored decision trace. */
export function assessSelection(a:StructuredAddress,h:HybridOutput,nameOnly=false):SelectionAudit {
 const expected=generateCandidates(a,nameOnly);const names=(['1a','1b'] as CandidateKey[]).filter(key=>expected.candidates[key]);
 const capacity=nameOnly?0:Math.min(MAX_ADDRESS_LINES,Math.max(0,MAX_LINES-names.length-1));
 const available=ADDRESS_PRIORITY.filter(key=>expected.candidates[key]);const chosen=nameOnly?[]:available.slice(0,capacity);const omitted=nameOnly?[]:available.slice(capacity);
 const selected:CandidateKey[]=[...names,...chosen,...(!nameOnly?['3a' as CandidateKey]:[])];const expectedLines=selected.map(key=>expected.candidates[key]!);const issues:string[]=[];
 const same=(x:unknown,y:unknown)=>JSON.stringify(x)===JSON.stringify(y);
 const sameEntry=(x:{field:string;value:string;reason:string},y:{field:string;value:string;reason:string})=>x.field===y.field&&x.value===y.value&&x.reason===y.reason;
 if((['1a','1b','2a','2z','2c','2b','2d','3a'] as CandidateKey[]).some(key=>h.candidates[key]!==expected.candidates[key])||Object.keys(h.candidates).some(key=>!['1a','1b','2a','2z','2c','2b','2d','3a'].includes(key)))issues.push('Candidates do not match the required 33/66 segmentation, combination, Postal/Subdivision or Country/Town rules');
 if(!same(h.lines,expectedLines))issues.push('Hybrid lines do not follow mandatory Name/Country reservation and 2a > 2z > 2c > 2b > 2d priority');
 const auditContains=(field:string,value:string,reason:string)=>h.dropped.some(entry=>entry.field===field&&entry.value===value&&entry.reason===reason);
 for(const entry of expected.truncations){if(!h.truncations.some(t=>sameEntry(t,entry))||!auditContains(entry.field,entry.value,entry.reason))issues.push(`Missing truncation/dropped-data audit for ${entry.field}`);}
 for(const entry of h.truncations)if(!expected.truncations.some(t=>sameEntry(t,entry)))issues.push(`Unexpected truncation audit for ${entry.field}`);
 for(const key of omitted)if(!auditContains(key,expected.candidates[key]!,'Dropped due to Hybrid line priority'))issues.push(`Missing priority-drop audit for ${key}`);
 for(const entry of h.dropped.filter(e=>e.reason==='Dropped due to Hybrid line priority'))if(!omitted.some(key=>key===entry.field&&expected.candidates[key]===entry.value))issues.push(`Incorrect priority-drop audit for ${entry.field}`);
 const requiredPostal=!!a.postal&&chosen.includes('2z');const payload=postalPayload(a);const actualPostal2z=!!payload&&h.lines.filter(line=>line.startsWith('2/')).some(line=>line===`2/${payload}`||containsPostalPayload(line,payload));
 if(requiredPostal&&!actualPostal2z)issues.push('Postal/Subdivision 2z omitted despite available priority capacity');
 const postalDisposition=!a.postal?'NOT_PROVIDED':actualPostal2z?(chosen.includes('2z')?'RETAINED_2Z':'RETAINED_IDENTICAL_LINE'):requiredPostal?'MISSING_DESPITE_CAPACITY':'DROPPED_BY_PRIORITY';
 const postalReason=!a.postal?'No structured Postal value was supplied by enrichment or review; a state-only 2z is not a postal code.':postalDisposition==='RETAINED_2Z'?'Postal is retained in 2z ahead of 2c, 2b and 2d.':postalDisposition==='RETAINED_IDENTICAL_LINE'?'The complete Postal/Subdivision payload is already retained in primary 2a; a separate 2z would duplicate it.':postalDisposition==='MISSING_DESPITE_CAPACITY'?'Rule violation: 2z must be retained in the available slot.':`Postal was recognized but 2z did not fit: ${names.length} Name record(s) and one Country/Town record leave ${capacity} address slot(s); 2a outranks 2z.`;
 const order:CandidateKey[]=['1a','1b','2a','2z','2c','2b','2d','3a'];
 const decisions=order.map(key=>{const line=expected.candidates[key]||'';const mandatory=key==='1a'||key==='1b'||key==='3a';const present=!!line;const retained=selected.includes(key);
  return {key,rank:mandatory?null:ADDRESS_PRIORITY.indexOf(key)+1,line,decision:!present?'NOT_GENERATED' as const:retained?'SELECTED' as const:'DROPPED' as const,reason:!present?(key==='2z'&&payload&&containsPostalPayload(expected.candidates['2a']||'',payload)?'Already retained in primary 2a; no duplicate postal/state record is needed':nameOnly&&key==='3a'?'Country/Town is intentionally omitted by the Name-only policy':'No component for this candidate'):retained?(mandatory?'Mandatory Name/Country-Town reservation':`Selected by address priority ${ADDRESS_PRIORITY.indexOf(key)+1}`):`Dropped due to Hybrid line priority; higher-priority records consume the ${capacity} available address slot(s)`};});
 return {status:issues.length?'FAIL':'PASS',nameRecords:names.length,addressCapacity:capacity,priorityOrder:[...ADDRESS_PRIORITY],selectedKeys:selected,omittedKeys:omitted,postalDisposition,postalReason,decisions,issues};
}
