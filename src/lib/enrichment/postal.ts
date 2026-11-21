import {ReferenceRepository} from '../reference/types';
import {normalize} from '../parser/normalize';
import {hasStreet,isLocalityLine} from '../parser/locality';
export interface PostalPatternMatch {value:string;line:string;accepted:boolean;reason:string;}
/** Do not treat a leading house number as postal evidence just because the numeric length matches. */
export function postalPatternMatches(lines:string[],country:string,ref:ReferenceRepository):PostalPatternMatch[]{
 const pattern=ref.postalPattern(country);if(!pattern)return [];
 const rx=new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`,'gu');const result:PostalPatternMatch[]=[];
 for(const source of lines){const line=normalize(source);for(const match of line.matchAll(rx)){
  const value=match[0];const streetContext=hasStreet(line);
  const numericHouseAtStart=match.index===0&&/^\d/.test(value)&&streetContext&&/^\s+\p{L}/u.test(line.slice(value.length));
  const localityOnly=numericHouseAtStart&&ref.postal(value,country).some(place=>isLocalityLine(line,place.name,ref.aliases(country),value,place.subdivision));
  const accepted=!numericHouseAtStart||!!localityOnly;
  result.push({value,line,accepted,reason:accepted?'Country postal pattern in non-house-number context':'Leading number on a street-address line is not promoted to Postal without separate locality evidence'});
 }}
 return result;
}
export function findPostals(lines:string[],country:string,ref:ReferenceRepository):string[]{return [...new Set(postalPatternMatches(lines,country,ref).filter(m=>m.accepted).map(m=>m.value))];}
