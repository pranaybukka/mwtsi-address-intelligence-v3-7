'use client';
import {useEffect,useRef,useState} from 'react';
import type {RecordResult} from '@/lib/domain';
import {canDecide} from '@/lib/review-decision';
export function useRecordReservation(initial:RecordResult){
 const [record,setRecord]=useState(initial),[state,setState]=useState<'loading'|'owned'|'error'|'readonly'>('loading'),[message,setMessage]=useState('Reserving this record…'),[retry,setRetry]=useState(0);
 const token=useRef(''),generation=useRef(0),heartbeat=useRef<ReturnType<typeof setInterval>|undefined>(undefined);
 useEffect(()=>{
  const current=++generation.current;let alive=true;let timer:ReturnType<typeof setInterval>|undefined;
  if(!canDecide(initial)){setState('readonly');setMessage('This record has a passed decision.');return;}
  if(!token.current)token.current=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
  const claimToken=token.current,url=`/api/records/${encodeURIComponent(initial.id)}/reservation`;
  const release=()=>{void fetch(url,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:claimToken}),keepalive:true}).catch(()=>{});};
  async function claim(){setState('loading');setMessage('Reserving this record…');try{
   const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:claimToken})});const data=await response.json();if(!alive){if(response.ok)release();return;}if(!response.ok)throw Error(data.error||'Could not reserve this record');
   setRecord(data.record);setState('owned');setMessage('Reserved for you while this review window is open.');
   timer=heartbeat.current=setInterval(async()=>{try{const r=await fetch(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:claimToken})});const data=await r.json();if(!r.ok)throw Error(data.error||'Reservation could not be renewed');}catch(error){if(alive&&token.current===claimToken){setState('error');setMessage((error as Error).message);if(timer)clearInterval(timer);}}},20000);
  }catch(error){if(alive&&token.current===claimToken){setState('error');setMessage((error as Error).message);try{const r=await fetch(`/api/records/${encodeURIComponent(initial.id)}`);if(r.ok&&alive)setRecord(await r.json());}catch{/* Keep the visible proposal for inspection. */}}}}
  void claim();return()=>{alive=false;if(timer)clearInterval(timer);queueMicrotask(()=>{if(generation.current===current)release();});};
 },[initial.id,retry]);
 async function forceRelease(){const response=await fetch(`/api/records/${encodeURIComponent(initial.id)}/reservation`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({force:true})});if(!response.ok){setMessage((await response.json()).error||'Could not release reservation');return;}setRetry(value=>value+1);}
 async function release(){if(!token.current||!canDecide(initial))return;const response=await fetch(`/api/records/${encodeURIComponent(initial.id)}/reservation`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:token.current})});if(!response.ok&&response.status!==409&&response.status!==404)throw Error('Could not release this review. Try again before changing records.');}
 function complete(saved:RecordResult){if(heartbeat.current)clearInterval(heartbeat.current);token.current='';setRecord(saved);setState('readonly');setMessage('Decision saved.');}
 return {record,complete,token:token.current,editable:state==='owned'&&canDecide(record),state,message,release,reload:()=>setRetry(value=>value+1),forceRelease,lose:(reason:string)=>{setState('error');setMessage(reason);}};
}
