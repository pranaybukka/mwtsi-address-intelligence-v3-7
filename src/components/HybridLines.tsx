import type {CandidateKey} from '@/lib/domain';
import {candidateLabels} from './HybridSelection';
/** Shared by Record Review and live entry so displayed lines/candidate labels stay identical. */
export default function HybridLines({lines,candidates,labels}:{lines:string[];candidates?:CandidateKey[];labels?:string[]}){return <div className="hybrid-lines">{lines.map((line,index)=><div key={index}><span>{String(index+1).padStart(2,'0')}</span><div className="hybrid-line-content">{candidates?.[index]?<small className="hybrid-line-candidate">{candidates[index]} · {candidateLabels[candidates[index]]}</small>:labels?.[index]&&<small className="hybrid-line-label">{labels[index]}</small>}<code>{line}</code></div></div>)}</div>;}
