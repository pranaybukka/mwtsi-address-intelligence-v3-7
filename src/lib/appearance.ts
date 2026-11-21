/** Shared allowlist: preferences never contain CSS, arbitrary colors or another user's ID. */
export const COLOR_SCHEMES=[
 {id:'aurora',name:'Aurora',description:'Fresh teal · the MWTSI original',hue:190,dark:'#72e2bc',light:'#116747'},
 {id:'ocean',name:'Ocean',description:'Clear blue · focused and calm',hue:216,dark:'#8dc9ff',light:'#175eb5'},
 {id:'amethyst',name:'Amethyst',description:'Soft violet · a creative edge',hue:258,dark:'#c8b1ff',light:'#7040b0'},
 {id:'ember',name:'Ember',description:'Warm copper · quietly bold',hue:25,dark:'#ffbe91',light:'#974513'},
 {id:'rose',name:'Rose',description:'Dusty rose · refined and warm',hue:337,dark:'#f5b1d0',light:'#a02e62'},
 {id:'graphite',name:'Graphite',description:'Cool slate · understated clarity',hue:215,dark:'#c4d2e3',light:'#435873'},
] as const;
export type ColorScheme=typeof COLOR_SCHEMES[number]['id'];
export type Appearance={scheme:ColorScheme;mode:'dark'|'light'};
export const DEFAULT_APPEARANCE:Appearance={scheme:'aurora',mode:'dark'};
export function isAppearance(value:unknown):value is Appearance {
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return Object.keys(v).length===2&&Object.keys(v).every(k=>k==='scheme'||k==='mode')&&COLOR_SCHEMES.some(s=>s.id===v.scheme)&&(v.mode==='dark'||v.mode==='light');
}
