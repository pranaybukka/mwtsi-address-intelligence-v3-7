export const normalize=(s:string)=>s.normalize('NFKC').toUpperCase().replace(/\s+/g,' ').trim();
export const key=(s:string)=>normalize(s).normalize('NFD').replace(/\p{M}/gu,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export const postalKey=(s:string)=>key(s).replace(/ /g,'');
export function phrases(s:string,max=8):string[]{const words=key(s).split(' ');const out=new Set<string>();for(let i=0;i<words.length;i++)for(let n=1;n<=Math.min(max,words.length-i);n++)out.add(words.slice(i,i+n).join(' '));return [...out];}
