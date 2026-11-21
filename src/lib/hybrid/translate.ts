import { StructuredAddress, HybridOutput } from '../domain';
import { generateCandidates } from './candidates';
import {assessSelection} from './selection';
import { ADDRESS_PRIORITY, MAX_LINES,MAX_ADDRESS_LINES } from './priorities';
/** Pure deterministic engine. Receives components; performs no enrichment or inference. */
export function translate(a:StructuredAddress,nameOnly=false):HybridOutput {
 const out=generateCandidates(a,nameOnly);
 const names=[out.candidates['1a'],out.candidates['1b']].filter((v):v is string=>!!v);
 if(nameOnly){out.lines=names;out.selectionAudit=assessSelection(a,out,true);return out;}
 const capacity=Math.min(MAX_ADDRESS_LINES,Math.max(0,MAX_LINES-names.length-1));
 const choices=ADDRESS_PRIORITY.filter(k=>out.candidates[k]);
 out.lines=[...names,...choices.slice(0,capacity).map(k=>out.candidates[k]!),out.candidates['3a']!];
 for(const k of choices.slice(capacity))out.dropped.push({field:k,value:out.candidates[k]!,reason:'Dropped due to Hybrid line priority'});
 out.selectionAudit=assessSelection(a,out);
 return out;
}
