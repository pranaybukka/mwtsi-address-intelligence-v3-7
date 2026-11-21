import {Candidate,Policy} from '../domain';
import {ReferenceRepository,Place} from '../reference/types';
import {isoCountryCode,isIsoCountryCode} from '../reference/iso-country';
import {key} from '../parser/normalize';
import {containsPhrase} from '../hybrid/validate';
import {hasStreet} from '../parser/locality';
export function chooseCountry(candidates:Candidate[],policy:Policy):Candidate {
 return [...candidates].sort((a,b)=>policy.authorityOrder.indexOf(a.authority)-policy.authorityOrder.indexOf(b.authority)||b.confidence-a.confidence)[0];
}
export {resolveCountry} from '../reference/country-catalog';
export function addressCountryMatches(tokens:string[],lines:string[],places:Place[],ref:ReferenceRepository){
 const last=lines.filter(line=>key(line)).at(-1);
 const hits=ref.countryMatches(tokens).filter(c=>isIsoCountryCode(c.country)&&lines.some(line=>{
  if(!containsPhrase(line,c.alias))return false;
  const isCode=isoCountryCode(c.alias)===c.country||/^[A-Z]{2,3}$/.test(c.alias);
  if(isCode){
   // Short codes can also be state abbreviations, street words or business suffixes.
   // Accept a dedicated final country line unless contradicted by a matched subdivision,
   // or a locality suffix corroborated by a town in the same ISO country.
   if(key(line)===c.alias&&line===last)return !places.some(p=>p.country!==c.country&&p.subdivision===c.alias&&lines.some(l=>containsPhrase(l,p.alias||p.name)));
   return !hasStreet(line)&&key(line).endsWith(' '+c.alias)&&places.some(p=>p.country===c.country&&containsPhrase(line,p.alias||p.name));
  }
  return c.alias.length>2&&(!hasStreet(line)||key(line)===c.alias||key(line).endsWith(' '+c.alias));
 }));
 // Prefer an explicitly qualified name over country words nested inside that name.
 return hits.filter(c=>!hits.some(other=>other.alias!==c.alias&&containsPhrase(other.alias,c.alias)));
}
