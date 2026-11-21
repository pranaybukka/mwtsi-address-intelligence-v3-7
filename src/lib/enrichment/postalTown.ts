import {ReferenceRepository} from '../reference/types';
import {key,normalize,postalKey} from '../parser/normalize';
export interface PostalTownOption {town:string;subdivision:string;country:string;sources:string[];confidence:number;}
export interface PostalTownLookup {status:'DISABLED'|'FOUND'|'AMBIGUOUS'|'NOT_FOUND'|'COUNTRY_REQUIRED'|'INVALID_COUNTRY'|'INVALID_POSTAL';country:string;postal:string;matchedPostal:string;matchType:'EXACT'|'US_BASE_ZIP'|'NONE';candidates:PostalTownOption[];totalCandidates:number;message:string;}
/** Local exact reference lookup, never a postal-prefix or country guess. */
export function lookupPostalTown(postal:string,country:string,ref:ReferenceRepository,enabled=true):PostalTownLookup {
 const code=normalize(country),value=normalize(postal);const result:PostalTownLookup={status:'NOT_FOUND',country:code,postal:value,matchedPostal:'',matchType:'NONE',candidates:[],totalCandidates:0,message:''};
 if(!enabled)return {...result,status:'DISABLED',message:'Postal code lookup is off. Enter the town/city manually or turn lookup on in Processing settings.'};
 if(!code)return {...result,status:'COUNTRY_REQUIRED',message:'Enter the country (ISO-2) to look up this postal code.'};
 if(!ref.countries().some(c=>c.code===code))return {...result,status:'INVALID_COUNTRY',message:'Choose a valid ISO-2 country code.'};
 if(!value||value.length>32||!/^[\p{L}\p{N}\s-]+$/u.test(value))return {...result,status:'INVALID_POSTAL',message:'Enter a postal code using letters, numbers, spaces or hyphens.'};
 let matches=ref.postal(value,code);let matchType:PostalTownLookup['matchType']='EXACT';let matchedPostal=value;
 if(!matches.length&&code==='US'&&/^\d{5}-\d{4}$/.test(value)){matchedPostal=value.slice(0,5);matches=ref.postal(matchedPostal,code);matchType='US_BASE_ZIP';}
 const unique=new Map<string,PostalTownOption>();
 for(const m of matches){const id=`${key(m.name)}|${key(m.subdivision)}`;const prior=unique.get(id);if(prior){if(!prior.sources.includes(m.source))prior.sources.push(m.source);}else unique.set(id,{town:normalize(m.name),subdivision:m.subdivision,country:code,sources:[m.source],confidence:matchType==='EXACT'?0.85:0.80});}
 const options=[...unique.values()].sort((a,b)=>a.town.localeCompare(b.town)||a.subdivision.localeCompare(b.subdivision));
 if(!options.length)return {...result,message:'No match in the local postal reference. This does not mean the postal code is invalid.'};
 const ambiguous=options.length>1;
 return {...result,status:ambiguous?'AMBIGUOUS':'FOUND',matchedPostal:postalKey(matchedPostal),matchType,candidates:options.slice(0,20).map(p=>({...p,confidence:ambiguous?0.65:p.confidence})),totalCandidates:options.length,message:ambiguous?`${options.length} possible localities. Select one only after checking the source address.`:`Probable town/city from ${matchType==='EXACT'?'an exact postal reference':'the five-digit US ZIP reference'}. Verify before treating it as confirmed.`};
}
