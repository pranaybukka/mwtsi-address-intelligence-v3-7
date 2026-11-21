import type {AuditEntry} from './domain';
/** Presentation only. Slash output and persisted analysis are never changed here. */
export function reviewLineLabels(lines:string[]){let names=0,addresses=0;return lines.map(line=>line.startsWith('1/')?++names===1?'Name':'Name continued':line.startsWith('2/')?++addresses===1?'Address':'Address continued':line.startsWith('3/')?'Country / town':'Output');}
export function reviewIssue(issue:string,admin:boolean){return !admin&&(/\b(?:1a|1b|2a|2b|2c|2d|2z|3a)\b/.test(issue)||/^Candidates do not match/.test(issue))?'The output needs a format review. An Admin can inspect the technical details.':issue;}
export function outputLoss(entry:AuditEntry){
 const fields:Record<string,string>={'1a':'Name','1b':'Name continuation','2a':'Primary address','2b':'Primary address continuation','2c':'Secondary address','2d':'Secondary address continuation','2z':'Postal / state','3a':'Country / town'};
 return {label:fields[entry.field]||entry.field,value:fields[entry.field]?entry.value.replace(/^[123]\//,''):entry.value,reason:entry.reason==='Dropped due to Hybrid line priority'?'Did not fit within the available output lines.':entry.reason};
}
