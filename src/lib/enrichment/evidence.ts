import { Candidate,Evidence } from '../domain';
export const evidence=(type:string,value:string,weight:number,source:string,detail?:string):Evidence=>({type,value,weight,source,detail});
export function candidate(value='',confidence=0,source='UNRESOLVED',items:Evidence[]=[],authority:Candidate['authority']='ADDRESS_INFERENCE'):Candidate {return {value,confidence,source,authority:value?authority:'UNRESOLVED',evidence:items,alternatives:[],reviewRequired:confidence<0.9};}
