'use client';
import {useEffect,useRef,useState} from 'react';
export interface DeleteBatchTarget {id:string;filename:string;records:number;total?:number;}
export default function DeleteBatchDialog({batch,busy,error,onCancel,onConfirm}:{batch:DeleteBatchTarget;busy:boolean;error:string;onCancel:()=>void;onConfirm:()=>Promise<void>}){
 const dialog=useRef<HTMLDialogElement>(null),[confirmation,setConfirmation]=useState('');
 useEffect(()=>{const element=dialog.current!,previous=document.activeElement as HTMLElement|null;if(!element.open)element.showModal();return()=>{if(element.open)element.close();previous?.focus();};},[]);
 return <dialog ref={dialog} className="decision-dialog delete-batch-dialog" aria-labelledby="delete-batch-title" aria-describedby="delete-batch-description" onCancel={event=>{event.preventDefault();if(!busy)onCancel();}}><form onSubmit={event=>{event.preventDefault();if(confirmation==='DELETE'&&!busy)void onConfirm();}}>
  <h2 id="delete-batch-title">Delete uploaded batch?</h2><p id="delete-batch-description">Permanently delete <strong>{batch.filename}</strong> and its entire batch, across every Group. Current filters do not limit deletion.</p>
  <p className="delete-batch-id">Batch ID: {batch.id}</p><p>{batch.records.toLocaleString()} processed records{batch.total!==undefined?` / ${batch.total.toLocaleString()} source rows`:''}. This removes all records, review history, saved source rows, mapping and processing settings for this batch.</p>
  <p>This cannot be undone in the app. Other batches, users and groups remain available.</p>
  <label>Type DELETE to confirm<input aria-label="Type DELETE to confirm" autoFocus autoComplete="off" spellCheck={false} value={confirmation} disabled={busy} onChange={event=>setConfirmation(event.target.value)}/></label>
  {error&&<p className="error" role="alert">{error}</p>}<div className="decision-dialog-actions"><button className="button secondary" type="button" disabled={busy} onClick={onCancel}>Cancel</button><button className="button danger" type="submit" disabled={busy||confirmation!=='DELETE'}>{busy?'Deleting…':'Delete permanently'}</button></div>
 </form></dialog>;
}
