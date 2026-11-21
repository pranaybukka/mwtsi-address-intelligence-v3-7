import type {CandidateKey,SelectionAudit} from '@/lib/domain';

export const candidateLabels:Record<CandidateKey,string>={
 '1a':'Name', '1b':'Name continuation', '2a':'Primary address',
 '2z':'Postal / state', '2c':'Secondary address',
 '2b':'Primary continuation', '2d':'Secondary continuation', '3a':'Country / town',
};

export function SelectedHybridCandidates({selection,changed}:{selection:SelectionAudit;changed:boolean}){
 const valid=selection.status==='PASS';
 return <section className="hybrid-selection-summary" aria-label="Selected Hybrid rule candidates" aria-live="polite">
  <h4>{valid?'Selected Hybrid rule candidates':'Expected Hybrid rule candidates'}{changed&&<span className="subtle-tag">UNSAVED PREVIEW</span>}</h4>
  <p className="candidate-sequence">{selection.selectedKeys.length?selection.selectedKeys.join(' → '):'None — no Hybrid lines generated'}</p>
  <ol className="candidate-route" aria-label="Output line choices">{selection.selectedKeys.map((key,index)=><li key={key} data-kind={key[0]}><small>{String(index+1).padStart(2,'0')}</small><span><b>{key}</b>{candidateLabels[key]}</span></li>)}</ol>
  <div className="candidate-capacity"><span>{selection.nameRecords} Name + {selection.selectedKeys.includes('3a')?'1 Country/town':'0 Country/town'} reserved</span><strong>{selection.addressCapacity} address slot{selection.addressCapacity===1?'':'s'}</strong></div>
  <p className={`postal-outcome postal-outcome--${selection.postalDisposition.toLowerCase()}`}><strong>{selection.postalDisposition==='RETAINED_2Z'?'Postal retained · 2z':selection.postalDisposition==='RETAINED_IDENTICAL_LINE'?'Postal retained · primary address':selection.postalDisposition==='DROPPED_BY_PRIORITY'?'Postal omitted by line priority':selection.postalDisposition==='MISSING_DESPITE_CAPACITY'?'Postal selection needs attention':'No structured postal code'}</strong><span>{selection.postalReason}</span></p>
  {!valid&&<p className="candidate-warning">The output does not match the current priority rules. These are the expected candidates; inspect Address priority &amp; postal retention before deciding.</p>}
 </section>;
}

export function HybridSelectionTable({selection}:{selection:SelectionAudit}){
 return <div className="candidate-table-scroll"><table className="candidate-table" aria-label="Hybrid candidate selection decisions">
  <thead><tr><th scope="col">Rule candidate</th><th scope="col">Decision</th><th scope="col">Hybrid line and reason</th></tr></thead>
  <tbody>{selection.decisions.map(item=><tr key={item.key} data-candidate={item.key} data-decision={item.decision}>
   <th scope="row"><code>{item.key}</code><span>{candidateLabels[item.key]}</span><small>{item.rank===null?'Mandatory when generated':`Address priority ${item.rank}`}</small></th>
   <td><span className={`candidate-decision candidate-decision--${item.decision.toLowerCase()}`}>{item.decision==='NOT_GENERATED'?'Not generated':item.decision==='SELECTED'?'Selected':'Dropped'}</span></td>
   <td>{item.line&&<code>{item.line}</code>}<p>{item.reason}</p></td>
  </tr>)}</tbody>
 </table></div>;
}
