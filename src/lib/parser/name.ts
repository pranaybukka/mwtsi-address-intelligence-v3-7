import {AddressAnalysisInput,Candidate,Evidence,NameInterpretation,NameInterpretationAudit} from '../domain';
import {normalize,key} from './normalize';
import {candidate,evidence} from '../enrichment/evidence';
const addressTerms=/\b(?:STREET|ST\.?|ROAD|RD\.?|AVENUE|AVE?\.?|LANE|LN\.?|BOULEVARD|BLVD|HIGHWAY|HWY|DRIVE|DR\.?|CALLE|CARRER|RUE|VIA|RUA|JALAN|DUONG|ULICA|STRASSE|STRAẞE|WAY|COURT|CT|PLAZA|SQUARE|MALL|CENTER|CENTRE|BUILDING|BLDG|TOWER|HOUSE|SUITE|UNIT|FLOOR|FL\d*|ROOM|APT|APARTMENT|MAILSTOP|PO\s*BOX|P\.?O\.?\s*BOX)\b/iu;
const routing=/\b(?:ATTN|ATTENTION|C\/O|CARE OF|RECEIVING|GENERAL DELIVERY|POSTE RESTANTE)\b/iu;
const words=(s:string)=>key(s).split(' ').filter(Boolean);
function suppliedFragment(name:string,part:string){const n=key(name),p=key(part);return words(part).length>=2&&!!p&&(` ${n} `).includes(` ${p} `);}
function nameShaped(s:string){return /^[\p{L}\p{M}\s&.'’()\-]+$/u.test(s)&&words(s).length>=2&&!addressTerms.test(s)&&!routing.test(s);}
function appendName(name:string,part:string){return normalize([name,part].filter(Boolean).join(' '));}
/** Interprets only Name and Address1. No name list or arbitrary alphabetic promotion,
 * truncation or Hybrid priority decisions. An optional locality guard is supplied by enrichment. Every removal/promotion is separately audited. */
export function interpretName(input:AddressAnalysisInput,options:{isKnownLocality?:(value:string)=>boolean}={}):NameInterpretation {
 const originalName=normalize(input.Name);let value=originalName;
 const addressLines=[input.Address1,input.Address2,input.Address3].map(normalize);
 const audit:NameInterpretationAudit[]=[],reviewReasons:string[]=[],items:Evidence[]=[];const alternatives:Candidate[]=[];
 if(originalName)items.push(evidence('Dedicated Name field',originalName,1,'SOURCE_NAME','Supplied value; this is not identity verification'));
 // Keep line breaks while identifying fragments; normalize only after span removal.
 const raw=input.Address1.normalize('NFKC').toUpperCase().replace(/[^\S\r\n]+/g,' ').trim();
 const parts:{text:string;start:number;end:number}[]=[];let start=0;
 for(const match of raw.matchAll(/\r?\n|[;,]|\s+\/\s+/g)){parts.push({text:raw.slice(start,match.index),start,end:match.index!});start=match.index!+match[0].length;}
 parts.push({text:raw.slice(start),start,end:raw.length});
 const removals:{start:number;end:number}[]=[];
 function record(part:string,action:NameInterpretationAudit['action'],reason:string,span:{start:number;end:number},promote=false){
  const before=value;if(promote)value=appendName(value,part);
  removals.push(span);audit.push({field:'Address1',action,nameText:part,sourceText:raw.slice(span.start,span.end),beforeName:before,afterName:value,reason});
  items.push(evidence(action,part,promote ? .93 : .99,'ADDRESS1_NAME_INTERPRETATION',reason));
 }
 for(const chunk of parts){
  const leading=chunk.text.length-chunk.text.trimStart().length;const text=chunk.text.trim();if(!text)continue;const offset=chunk.start+leading;
  // A digit marks a possible street/locality tail only when the prefix is independently name evidence.
  const digit=text.search(/(?<![\p{L}\p{N}])\d/u);const prefix=digit>0?text.slice(0,digit).replace(/[\s/,:-]+$/,'').trim():text;
  const span={start:offset,end:offset+prefix.length};
  const label=prefix.match(/^(?:BENEFICIARY\s+NAME|NAME(?:\s+(?:CONTINUED|CONTINUATION|CONT))?|NAME\s*2)\s*:\s*(.+)$/u);
  const labeled=label?.[1]?.trim();
  const proposal=labeled||prefix;
  // Name + unnumbered building content: require an exact known Name prefix and a
  // building marker; a person-named street remains address content.
  if(digit<0&&!routing.test(text)&&value&&/\b(?:BUILDING|BLDG|TOWER|FLOOR|UNIT|SUITE|ROOM)\b/u.test(text)){const tokens=[...text.matchAll(/[\p{L}\p{M}]+(?:['’.-][\p{L}\p{M}]+)*/gu)];
   let removed=false;
   for(let n=Math.min(tokens.length-1,64);n>=2;n--){const end=tokens[n-1].index!+tokens[n-1][0].length;const head=text.slice(0,end);const tail=text.slice(end).trim();if(!suppliedFragment(value,head))continue;
    if(/^(?:ROAD|STREET|AVENUE|LANE|DRIVE|WAY|COURT|BOULEVARD|RD|ST|AVE)\b/u.test(tail))break;
    if(/\b(?:BUILDING|BLDG|TOWER|FLOOR|UNIT|SUITE|ROOM)\b/u.test(tail)&&!addressTerms.test(head)){reviewReasons.push('Name overlaps unseparated building/address content and requires review');audit.push({field:'Address1',action:'RETAINED_AMBIGUOUS',nameText:head,sourceText:text,beforeName:value,afterName:value,reason:'Could be a legitimate building name; unseparated content retained'});removed=true;}break;
   }
   if(removed)continue;
  }
  // Street names, unit/routing data and numeric content are not inferred to be name continuations.
  if(addressTerms.test(proposal)||routing.test(proposal)||/\d/u.test(proposal)){if(labeled||suppliedFragment(value,proposal)){reviewReasons.push('Name/address overlap in Address1 is ambiguous and requires review');audit.push({field:'Address1',action:'RETAINED_AMBIGUOUS',nameText:labeled||prefix,sourceText:prefix,beforeName:value,afterName:value,reason:'Known Name fragment has address/routing indicators; original content retained'});}continue;}
  if(suppliedFragment(value,proposal)&&options.isKnownLocality?.(proposal)){reviewReasons.push('Known Name fragment also matches locality/country text and requires review');audit.push({field:'Address1',action:'RETAINED_AMBIGUOUS',nameText:proposal,sourceText:prefix,beforeName:value,afterName:value,reason:'Preserved possible geographic evidence rather than removing it as Name'});continue;}
  if(suppliedFragment(value,proposal)){
   record(proposal,'REMOVED_DUPLICATE','Exact multi-token fragment already present in evaluated Name; removed from Address1 only',span);continue;
  }
  if(labeled&&labeled.length){
   if(!nameShaped(labeled)){reviewReasons.push('Labeled Name information in Address1 is ambiguous and requires review');audit.push({field:'Address1',action:'RETAINED_AMBIGUOUS',nameText:labeled,sourceText:prefix,beforeName:value,afterName:value,reason:'Label present but content is not safely classified; original Address1 retained'});continue;}
   record(labeled,'PROMOTED_CONTINUATION','Explicit Name label in Address1; proposed as name information',span,true);reviewReasons.push('Name information recovered from Address1 requires review');continue;
  }
  const joint=prefix.match(/^(?:AND|&)\s+(.+)$/u);
  if(joint&&value&&nameShaped(joint[1])){
   record(prefix,'PROMOTED_CONTINUATION','Explicit joint-name continuation marker with an existing Name',span,true);reviewReasons.push('New joint-name continuation recovered from Address1 requires review');continue;
  }
  if(!options.isKnownLocality?.(prefix)&&words(prefix).length===1&&words(value).length>1&&words(value).includes(key(prefix))){reviewReasons.push('Single-token Address1 content may be a Name fragment and requires review');audit.push({field:'Address1',action:'RETAINED_AMBIGUOUS',nameText:prefix,sourceText:prefix,beforeName:value,afterName:value,reason:'A single matching token is insufficient to distinguish a name from locality/address text'});}
  const unmarkedAlphabetic=/^[\p{L}\p{M}\s&.'’()\-]+$/u.test(prefix)&&words(prefix).length>=1;
  if(unmarkedAlphabetic&&!options.isKnownLocality?.(prefix)&&words(prefix).length<=8&&!removals.some(r=>r.start===span.start)){
   // A bare alphabetic line could be a person, organization, building or locality. Keep it
   // visible and never invent a second person merely to fill a Name continuation slot.
   reviewReasons.push('Unclassified alphabetic Address1 content may contain name information and requires review');
   alternatives.push(candidate(appendName(value,prefix),.5,'AMBIGUOUS_NAME_FRAGMENT',[evidence('Unclassified Address1 fragment',prefix,.5,'ADDRESS_TEXT','Retained in address until reviewer chooses Name/Address fields')]));
   audit.push({field:'Address1',action:'RETAINED_AMBIGUOUS',nameText:prefix,sourceText:prefix,beforeName:value,afterName:value,reason:'Insufficient evidence to move this unmarked content automatically'});
  }
 }
 if(removals.length){let remaining=raw;for(const span of removals.sort((a,b)=>b.start-a.start))remaining=remaining.slice(0,span.start)+remaining.slice(span.end);
  remaining=remaining.replace(/^[\s,;/]+|[\s,;/]+$/g,'').replace(/([,;/])(?:\s*[,;/])+/g,'$1');addressLines[0]=normalize(remaining);
 }
 for(const entry of audit){entry.beforeAddress1=normalize(input.Address1);entry.afterAddress1=addressLines[0];}
 const changed=value!==originalName;const nameCandidate=candidate(value,value?(changed ? .93 : 1):0,changed?'CROSS_FIELD_NAME':'SOURCE_NAME',items);nameCandidate.alternatives=alternatives;nameCandidate.reviewRequired=reviewReasons.length>0||!value;
 return {originalName,candidate:nameCandidate,addressLines,audit,reviewReasons:[...new Set(reviewReasons)]};
}
