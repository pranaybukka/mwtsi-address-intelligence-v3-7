import { AuditEntry } from '../domain';
export const chars=(s:string)=>Array.from(s);
export const length=(s:string)=>chars(s).length;
export const slice=(s:string,a:number,b?:number)=>chars(s).slice(a,b).join('');
export function truncate(value:string,max:number,field:string,audit:AuditEntry[]):string {
 if(length(value)>max) audit.push({field,value:slice(value,max),reason:`Truncated after ${max} characters`});
 return slice(value,0,max);
}
