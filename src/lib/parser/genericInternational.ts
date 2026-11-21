import {Place,ReferenceRepository} from '../reference/types';
import {isLocalityLine} from './locality';
import {containsPhrase} from '../hybrid/validate';
import {findPostals} from '../enrichment/postal';
/** Splits a recognized locality tail regardless of which source container holds it.
 * Never assumes Address3 is locality; untouched text is retained verbatim after normalization.
 */
export function splitLocalityTails(source:string[],places:Place[],ref:ReferenceRepository){return source.flatMap((line,index)=>{
 // Already-complete locality lines must not be split again at a shorter city/state alias.
 if(places.some(p=>{const alias=p.alias||p.name;return containsPhrase(line,alias)&&line.startsWith(alias)&&isLocalityLine(line,alias,ref.aliases(p.country),findPostals([line],p.country,ref)[0]||'',p.subdivision);}))return [{text:line,sourceIndex:index}];
 for(const p of [...places].sort((a,b)=>(b.alias||b.name).length-(a.alias||a.name).length)){const alias=p.alias||p.name;const escaped=alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const rx=new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,'gu');
 for(const match of line.matchAll(rx)){const start=match.index!;if(start===0)continue;const prefix=line.slice(0,start).replace(/[,;\s]+$/,'');const tail=line.slice(start);const corroborated=findPostals([tail],p.country,ref).length>0||ref.aliases(p.country).some(a=>a!==alias&&containsPhrase(tail,a))||!!p.subdivision&&containsPhrase(tail,p.subdivision);if(prefix&&corroborated&&isLocalityLine(tail,alias,ref.aliases(p.country),findPostals([tail],p.country,ref)[0]||'',p.subdivision))return [{text:prefix,sourceIndex:index},{text:tail,sourceIndex:index}];}}
 return [{text:line,sourceIndex:index}];});}
