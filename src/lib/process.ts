import { AddressInput, RecordResult, Intelligence, DEFAULT_POLICY,Policy } from './domain';
import {analysisInput} from './source';
import {combineBlocks} from './address-blocks';
import { enrich } from './enrichment/intelligence';
import { translate } from './hybrid/translate';
import { validate } from './hybrid/validate';
import { ReferenceRepository } from './reference/types';
import { candidate } from './enrichment/evidence';
export function finalize(source:AddressInput,intelligence:Intelligence,ref:ReferenceRepository,policy:Policy=DEFAULT_POLICY):Omit<RecordResult,'id'|'reviews'|'reviewState'|'version'> {
 const structuredAddressPresent=[intelligence.structured.primary,intelligence.structured.secondary,intelligence.structured.town,intelligence.structured.country,intelligence.structured.postal,intelligence.structured.subdivision].some(value=>value.trim());
 const nameOnly=!structuredAddressPresent&&!!intelligence.structured.name.trim()&&![...(intelligence.nameInterpretation?.addressLines||[source.Address1,source.Address2,source.Address3]),source.Bank_Country].some(x=>x?.trim());
 const hybrid=translate(intelligence.structured,nameOnly);
 const validation=validate(intelligence.structured,hybrid,intelligence.conflicts,ref.aliases(intelligence.structured.country),nameOnly,ref.countries().some(c=>c.code===intelligence.structured.country));
 const reasons=[...(intelligence.nameInterpretation?.reviewReasons||[]),...validation.issues,...intelligence.notes.filter(n=>/require review/i.test(n))];
 if(intelligence.country.confidence<policy.countryThreshold&&!nameOnly)reasons.push('Country confidence below automatic threshold');
 if(intelligence.town.confidence<policy.townThreshold&&!nameOnly)reasons.push('Town confidence below automatic threshold');
 const status=nameOnly&&!intelligence.nameInterpretation?.reviewReasons.length?'NAME_ONLY':reasons.length||validation.pmpg!=='PASS'||validation.duplication!=='PASS'||validation.length!=='PASS'?'PROPOSED_REVIEW_REQUIRED':'AUTO_TRANSLATED';
 return {source,intelligence,hybrid,validation,status,reasons};
}
function processSingleAddress(source:AddressInput,ref:ReferenceRepository,id:string,policy:Policy=DEFAULT_POLICY):RecordResult {
 try{const result=finalize(source,enrich(analysisInput(source),ref,policy),ref,policy);return {id,...result,reviewState:result.status==='PROPOSED_REVIEW_REQUIRED'?'PENDING':'NONE',reviews:[],version:0};}
 catch {const empty=candidate();const intelligence:Intelligence={processingSettings:{postalLookupEnabled:policy.postalLookupEnabled!==false},structured:{name:source.Name,primary:source.Address1,secondary:[source.Address2,source.Address3].filter(Boolean).join(' '),town:'',country:'',postal:'',subdivision:''},country:empty,town:empty,postal:empty,subdivision:empty,sanitized:[source.Address1,source.Address2,source.Address3],localityAudit:[],notes:[],conflicts:[]};const h=translate(intelligence.structured);return {id,source,intelligence,hybrid:h,validation:{pmpg:'FAIL',length:'FAIL',duplication:'FAIL',evidenceConflict:false,issues:['Unexpected processing failure; original source retained']},status:'ERROR',reasons:['Unexpected processing failure'],reviewState:'PENDING',reviews:[],version:0};}
}

/** One source row and identity, with independent address intelligence per block. */
export function processAddress(source:AddressInput,ref:ReferenceRepository,id:string,policy:Policy=DEFAULT_POLICY):RecordResult {
 const bnp=processSingleAddress(source,ref,id,policy);if(!source.orp)return bnp;
 const orp=processSingleAddress({...source.orp},ref,id,policy);
 for(const result of [bnp,orp])if(!Object.values(analysisInput(result.source)).some(v=>v?.trim())){result.status='PROPOSED_REVIEW_REQUIRED';result.reasons.push('Required address block is missing');}
 return combineBlocks(bnp,bnp,orp);
}
