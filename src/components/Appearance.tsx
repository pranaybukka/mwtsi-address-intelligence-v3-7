'use client';
import {createContext,useContext,useEffect,useRef,useState,type CSSProperties} from 'react';
import {Check,CheckCircle2,Moon,Palette,Sun,X} from 'lucide-react';
import {COLOR_SCHEMES,DEFAULT_APPEARANCE,type Appearance} from '@/lib/appearance';

const Context=createContext({available:false,open:()=>{}});
function apply(value:Appearance){document.documentElement.dataset.scheme=value.scheme;document.documentElement.dataset.mode=value.mode;}
export function AppearanceProvider({children,initial,userId}:{children:React.ReactNode;initial:Appearance;userId:string|null}){
 const [saved,setSaved]=useState(initial),[draft,setDraft]=useState(initial),[opened,setOpened]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{apply(opened?draft:saved);},[opened,draft,saved]);
 useEffect(()=>{const el=dialog.current;if(opened&&el&&!el.open)el.showModal();else if(el?.open)el.close();},[opened]);
 function open(){setDraft(saved);setError('');setMessage('');setOpened(true);}
 function cancel(){if(busy)return;apply(saved);setOpened(false);}
 async function save(){
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/account/appearance',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});
   if(!response.ok)throw Error(response.status===401?'Your session expired. Sign in again to save your appearance.':'Appearance could not be saved. Please try again.');
   setSaved(draft);setOpened(false);setMessage('Appearance saved to your account.');
  }catch(e){setError(e instanceof Error?e.message:'Appearance could not be saved. Please try again.');}finally{setBusy(false);}
 }
 return <Context.Provider value={{available:!!userId,open}}>{children}<span className="sr-only" aria-live="polite" aria-atomic="true">{message}</span>{userId&&<dialog ref={dialog} className="appearance-dialog" aria-labelledby="appearance-title" aria-describedby="appearance-description" onCancel={event=>{event.preventDefault();cancel();}}>
  <form onSubmit={event=>{event.preventDefault();void save();}}>
   <header className="appearance-heading"><div><span className="eyebrow">MAKE YOURSELF AT HOME</span><h2 id="appearance-title">Your workspace, your style</h2></div><button type="button" className="close-review" aria-label="Close appearance" disabled={busy} onClick={cancel}><X size={19}/></button></header>
   <div className="appearance-content"><p id="appearance-description">Preview a new look. Save it to your account and it follows you when you sign in on another device.</p>
   <fieldset className="appearance-mode" disabled={busy}><legend>Display mode</legend>{(['dark','light'] as const).map(mode=><label key={mode} className="appearance-mode-option"><input type="radio" name="appearance-mode" value={mode} checked={draft.mode===mode} onChange={()=>setDraft({...draft,mode})}/>{mode==='dark'?<Moon size={18}/>:<Sun size={18}/>}<span>{mode==='dark'?'Dark':'Light'}</span><Check size={16} className="appearance-selected"/></label>)}</fieldset>
   <fieldset className="appearance-schemes" disabled={busy}><legend>Color scheme</legend><div className="appearance-scheme-grid">{COLOR_SCHEMES.map(scheme=><label key={scheme.id} className="appearance-scheme" style={{'--swatch':draft.mode==='dark'?scheme.dark:scheme.light,'--swatch-hue':scheme.hue} as CSSProperties}><input type="radio" name="appearance-scheme" value={scheme.id} checked={draft.scheme===scheme.id} onChange={()=>setDraft({...draft,scheme:scheme.id})}/><span className="appearance-mini" aria-hidden="true"><i/><span><b/><b/><b/></span><CheckCircle2 className="appearance-selected" size={21}/></span><strong>{scheme.name}</strong><small>{scheme.description}</small></label>)}</div></fieldset>
   <p className="appearance-note">Status colors stay consistent: green for Pass, amber for review and red for Fail.</p>
   {error&&<p className="error" role="alert">{error}</p>}
   </div><footer className="appearance-actions"><button type="button" className="text-button" disabled={busy} onClick={()=>setDraft({...DEFAULT_APPEARANCE})}>Reset to default</button><div><button className="button secondary" type="button" disabled={busy} onClick={cancel}>Cancel</button><button className="button primary" type="submit" disabled={busy}>{busy?'Saving…':'Save appearance'}</button></div></footer>
  </form>
 </dialog>}</Context.Provider>;
}
export function AppearanceButton(){const {available,open}=useContext(Context);return available?<button type="button" className="appearance-button" onClick={open}><Palette size={16}/><span>Appearance</span></button>:null;}
