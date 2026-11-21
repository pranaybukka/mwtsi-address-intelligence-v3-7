'use client';
import {useMemo} from 'react';
import {RecordResult} from '@/lib/domain';
import {STATUS_OPTIONS,StatusFilter,matchesStatus} from '@/lib/record-selection';
export default function StatusMultiSelect({records,value,onChange,serverCounts,label='Select statuses',showCounts=true}:{showCounts?:boolean;label?:string;serverCounts?:Record<string,number>;records:RecordResult[];value:StatusFilter[];onChange:(value:StatusFilter[])=>void}){
 const localCounts=useMemo(()=>Object.fromEntries(STATUS_OPTIONS.map(option=>[option.value,records.filter(record=>matchesStatus(record,option.value)).length])),[records]);
 const counts=serverCounts||localCounts;
 function toggle(status:StatusFilter){onChange(value.includes(status)?value.filter(v=>v!==status):[...value,status]);}
 return <details className="status-select"><summary aria-label={label}>Statuses · {value.length?`${value.length} selected`:'All statuses'}</summary><div className="status-options"><div className="status-options-heading"><strong>Match any selected status</strong><button className="text-button" type="button" onClick={()=>onChange([])}>Clear statuses</button></div><p>Records matching several statuses appear once. No selection means all statuses.</p>{['Address blocks','Review progress','Processing status','Review decision','Validation and findings'].map(group=><fieldset key={group}><legend>{group}</legend>{STATUS_OPTIONS.filter(option=>option.group===group).map(option=><label key={option.value}><input type="checkbox" aria-label={option.label} checked={value.includes(option.value)} onChange={()=>toggle(option.value)}/><span>{option.label}</span>{showCounts&&<small>{counts[option.value]}</small>}</label>)}</fieldset>)}</div></details>;
}
