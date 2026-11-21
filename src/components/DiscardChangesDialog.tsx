'use client';
import {useEffect,useRef} from 'react';
export default function DiscardChangesDialog({busy,onCancel,onDiscard}:{busy:boolean;onCancel:()=>void;onDiscard:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
 return <dialog ref={dialog} className="decision-dialog" aria-labelledby="discard-title" onCancel={event=>{event.preventDefault();if(!busy)onCancel();}}><h2 id="discard-title">Unsaved changes</h2><p>Your edits have not been recorded. Keep editing, or discard them to continue.</p><div className="decision-dialog-actions"><button className="button secondary" autoFocus disabled={busy} onClick={onCancel}>Keep editing</button><button className="button danger" disabled={busy} onClick={onDiscard}>{busy?'Opening record…':'Discard changes and continue'}</button></div></dialog>;
}
