'use client';
import {useMemo,useRef,useState} from 'react';
import {Code2,Copy,RotateCcw} from 'lucide-react';
import type {RecordResult} from '@/lib/domain';
import {ISO_POSTAL_FIELDS,isoPostalOutputs,proposeIsoPostal,type IsoPostalElements,type IsoPostalKey} from '@/lib/iso-postal';
import Accordion from './Accordion';

/** Kept in LiveTranslate so switching screens or refreshing the same analysis preserves corrections. */
export function useIsoPostalDraft(record:RecordResult|undefined,identity:string){
 const proposal=useMemo(()=>record?proposeIsoPostal(record):null,[record]);
 const base=proposal?identity+JSON.stringify(proposal):'';
 const [draft,setDraft]=useState<{base:string;elements:Partial<IsoPostalElements>;hybridAddress?:string}>({base:'',elements:{}});
 const current=proposal?{...proposal,elements:{...proposal.elements,...(draft.base===base?draft.elements:{})},hybridAddress:draft.base===base?draft.hybridAddress??proposal.hybridAddress:proposal.hybridAddress}:null;
 const output=current?isoPostalOutputs(current):null;
 const update=(key:IsoPostalKey,value:string)=>setDraft(previous=>({base,elements:{...(previous.base===base?previous.elements:{}),[key]:value},...(previous.base===base&&previous.hybridAddress!==undefined?{hybridAddress:previous.hybridAddress}:{})}));
 const updateAddress=(hybridAddress:string)=>setDraft(previous=>({base,elements:previous.base===base?previous.elements:{},hybridAddress}));
 return {current,output,update,updateAddress,reset:()=>setDraft({base,elements:{}}),changed:draft.base===base&&(Object.keys(draft.elements).length>0||draft.hybridAddress!==undefined)};
}
export default function IsoPostalOutput({model}:{model:ReturnType<typeof useIsoPostalDraft>}){
 const {current,output}=model,refs=useRef<Record<string,HTMLTextAreaElement|null>>({}),latest=useRef('');
 const [notice,setNotice]=useState<{key:string;text:string}|null>(null);
 const key=JSON.stringify(output);latest.current=key;
 async function copy(kind:'structured'|'hybrid'){
  const text=output?.[kind].xml,field=refs.current[kind],snapshot=key;if(!text||!field)return;let copied=false;
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);copied=true;}}catch{/* Offer HTTP/keyboard fallback. */}
  if(latest.current!==snapshot)return;
  if(!copied){field.focus();field.select();field.setSelectionRange(0,text.length);try{copied=document.execCommand('copy');}catch{/* Keep text selected. */}}
  setNotice({key:snapshot,text:copied?`${kind==='structured'?'Structured':'Hybrid'} PstlAdr copied.`:'XML selected. Press Ctrl+C or Command+C to copy.'});
 }
 return <section className="card iso-postal-section" aria-labelledby="iso-postal-heading"><div className="card-heading"><div><span className="eyebrow">ISO 20022 · READY TO COPY</span><h2 id="iso-postal-heading">Postal address XML</h2><p>Two postal-address fragments from the interpreted address, before the slash format’s shorter limits. Name belongs in the party’s Nm element, outside PstlAdr.</p></div><Code2 size={22}/></div>
  <div className="iso-output-grid">{(['structured','hybrid'] as const).map(kind=>{const value=output?.[kind];return <section className="iso-output-card" key={kind} aria-labelledby={`iso-${kind}-heading`}><div className="iso-output-heading"><h3 id={`iso-${kind}-heading`}>{kind==='structured'?'Structured PstlAdr':'Hybrid PstlAdr'}</h3><span className={`badge ${value?.issues.length?'proposed_review_required':'auto_translated'}`}>{!value?'Waiting':value.issues.length?'Needs review':'Format checks passed'}</span></div><p>{kind==='structured'?'Individual address elements. No AdrLine.':'Town, country, optional postal/state and up to two 70-character AdrLine elements.'}</p><label htmlFor={`iso-${kind}`}>{kind==='structured'?'Structured postal address XML':'Hybrid postal address XML'}</label><textarea id={`iso-${kind}`} ref={node=>{refs.current[kind]=node;}} value={value?.xml||''} readOnly disabled={!current} rows={12} spellCheck={false} placeholder="Enter an address to generate XML"/><button className="button secondary small" disabled={!value?.xml} onClick={()=>void copy(kind)}><Copy size={15}/>Copy {kind==='structured'?'structured':'hybrid'} PstlAdr</button>{value&&value.issues.length>0&&<details className="iso-issues" open><summary>{value.issues.length} item{value.issues.length===1?'':'s'} to review</summary><ul>{value.issues.map((issue,index)=><li key={index}>{issue.message}{issue.omitted&&<span className="iso-omitted">{issue.omitted}</span>}</li>)}</ul></details>}</section>;})}</div>
  <p className="iso-copy-notice" role="status" aria-live="polite">{notice?.key===key?notice.text:''}</p>
  <Accordion title="Review ISO elements" description="Confirm street, building and locality fields or correct the hybrid lines"><p className="fineprint">Street and unit proposals are conservative. Unassigned text is shown above; confirm the interpretation before use. These corrections affect only the XML drafts. They do not change the 1/2/3 output or saved records. Changing the original input or interpreted address resets them.</p><div className="iso-element-grid">{ISO_POSTAL_FIELDS.map(field=><div key={field.key}><label htmlFor={`iso-edit-${field.key}`}>{field.label} <code>{field.key}</code></label><input id={`iso-edit-${field.key}`} value={current?.elements[field.key]||''} disabled={!current} maxLength={1000} onChange={event=>model.update(field.key,event.target.value)} aria-describedby={`iso-limit-${field.key}`}/><small id={`iso-limit-${field.key}`}>{field.max} characters in XML{['TwnNm','Ctry'].includes(field.key)?' · Required':''}</small></div>)}</div><div className="iso-hybrid-editor"><label htmlFor="iso-edit-lines">Hybrid address lines</label><textarea id="iso-edit-lines" rows={3} value={current?.hybridAddress||''} disabled={!current} maxLength={4000} onChange={event=>model.updateAddress(event.target.value)} aria-describedby="iso-lines-hint"/><small id="iso-lines-hint">Two lines of up to 70 characters. Keep town, country and any structured postal/state values out of these lines. Long text is wrapped and any overflow is shown.</small></div><button className="button secondary small" disabled={!current||!model.changed} onClick={model.reset}><RotateCcw size={15}/>Reset ISO corrections</button></Accordion>
  <p className="fineprint iso-profile-note">PostalAddress24-style fragments inherit the namespace of your chosen ISO message. Format checks cover these elements and limits; they do not certify a complete payment message or address deliverability. Review the receiving bank’s usage guidelines and the findings above before use.</p>
 </section>;
}
