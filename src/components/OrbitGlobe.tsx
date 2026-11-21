'use client';
import {createContext,useContext,useEffect,useId,useState} from 'react';
import {usePathname} from 'next/navigation';
import {Globe2,Pause,Play} from 'lucide-react';
const Motion=createContext({enabled:false,paused:false,reduced:true,ready:false,toggle:()=>{}});
export function GlobeMotionProvider({children}:{children:React.ReactNode}){
 const pathname=usePathname(),workspace=['/','/dashboard','/upload','/results','/review','/export','/live'].includes(pathname||'');
 const [paused,setPaused]=useState(false),[reduced,setReduced]=useState(true),[visible,setVisible]=useState(true),[ready,setReady]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)'),motion=()=>setReduced(media.matches),visibility=()=>setVisible(document.visibilityState==='visible');try{setPaused((localStorage.getItem('mwtsi-globe-motion')??localStorage.getItem('mwtsi-logo-animation'))==='off');}catch{}motion();visibility();setReady(true);media.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);return()=>{media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);};},[]);
 function toggle(){const next=!paused;setPaused(next);try{localStorage.setItem('mwtsi-globe-motion',next?'off':'on');}catch{}}
 return <Motion.Provider value={{enabled:workspace&&ready&&!paused&&!reduced&&visible,paused,reduced,ready,toggle}}>{children}</Motion.Provider>;
}
/** Decorative routing motif. No customer address/location data is plotted. */
export function OrbitGlobe({animated=true,hero=false}:{animated?:boolean;hero?:boolean}){
 const {enabled}=useContext(Motion),id=useId().replace(/[^a-zA-Z0-9]/g,''),clip=id+'clip',ocean=id+'ocean';
 const land='M10 58L25 37 48 31 63 42 70 65 59 78 43 82 39 101 23 90Z M57 112L78 117 89 137 79 157 65 173 60 152 63 134Z M99 47L117 35 137 39 150 30 172 44 187 61 175 76 157 70 145 89 128 77 111 79 104 66Z M112 87L135 92 145 116 130 142 115 130 106 107Z M164 135L184 129 198 143 186 158 166 153Z';
 return <span className={`orbit-globe ${hero?'orbit-globe--hero':''}`} data-globe-motion={animated&&enabled?'running':'paused'} aria-hidden="true"><svg viewBox="0 0 220 220" focusable="false">
  <defs><clipPath id={clip}><circle cx="110" cy="110" r="74"/></clipPath><radialGradient id={ocean} cx="32%" cy="27%" r="77%"><stop stopColor="var(--globe-ocean-light)"/><stop offset="1" stopColor="var(--globe-ocean-dark)"/></radialGradient></defs>
  <ellipse className="orbit-globe__orbit" cx="110" cy="110" rx="103" ry="38" transform="rotate(-28 110 110)"/>
  <circle cx="110" cy="110" r="74" fill={`url(#${ocean})`} stroke="var(--accent)" strokeOpacity=".65"/>
  <g clipPath={`url(#${clip})`}><g className="orbit-globe__land"><path d={land}/><path d={land} transform="translate(220 0)"/></g><g className="orbit-globe__grid"><ellipse cx="110" cy="110" rx="27" ry="74"/><ellipse cx="110" cy="110" rx="54" ry="74"/><ellipse cx="110" cy="84" rx="70" ry="16"/><ellipse cx="110" cy="136" rx="70" ry="16"/><path d="M36 110H184M110 36V184"/></g><g className="orbit-globe__routes"><path d="M47 108Q108 30 171 110"/><path d="M64 151Q105 63 156 63"/><path d="M47 108Q130 165 156 63"/></g></g>
  <g className="orbit-globe__points"><circle cx="47" cy="108" r="3"/><circle cx="171" cy="110" r="3"/><circle cx="64" cy="151" r="3"/><circle cx="156" cy="63" r="3"/></g><circle className="orbit-globe__satellite" cx="28" cy="155" r="4"/>
 </svg></span>;
}
export function GlobeMotionToggle(){const {paused,reduced,ready,toggle}=useContext(Motion);return <button className="globe-motion-toggle" onClick={toggle} disabled={!ready||reduced} aria-label={reduced?'Globe animation disabled by reduced motion':paused?'Resume globe animation':'Pause globe animation'} title={reduced?'Reduced motion enabled':paused?'Resume globe animation':'Pause globe animation'} aria-pressed={paused||reduced}><Globe2 size={15}/>{paused||reduced?<Play size={12}/>:<Pause size={12}/>}</button>;}
