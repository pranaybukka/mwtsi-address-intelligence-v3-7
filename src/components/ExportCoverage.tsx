import type {ExportCoverage as Coverage,ExportStateFilter} from '@/lib/export-tracking-types';
export default function ExportCoverage({coverage,loading,value,onChange}:{coverage:Coverage|undefined;loading:boolean;value:ExportStateFilter;onChange:(value:ExportStateFilter)=>void}){
 return <section className="card export-coverage" aria-labelledby="export-coverage-heading" aria-busy={loading}>
  <div><h2 id="export-coverage-heading">Batch export coverage</h2><p>Unique records across completed exports. Group, status and search filters apply to these totals.</p></div>
  {loading||!coverage?<p role="status">Loading export totals…</p>:<>
   <div className="export-coverage-metrics">{([
    ['all','Matching records',coverage.total,'Current Group, status and search'],
    ['exported','Exported — unique',coverage.exported,'Repeated exports count once'],
    ['remaining','Remaining to export',coverage.remaining,'No tracked completed export'],
   ] as const).map(([key,label,count,detail])=><button key={key} className={`card metric ${key===value?'export-coverage-active':''}`} aria-pressed={key===value} onClick={()=>onChange(key)} data-testid={`export-coverage-${key}`}><div>{label}</div><strong>{count.toLocaleString()}</strong><small>{detail}</small></button>)}</div>
   <progress aria-label="Unique records exported" value={coverage.exported} max={coverage.total||1}/>
   <p className="fineprint">{coverage.total.toLocaleString()} matching = {coverage.exported.toLocaleString()} exported + {coverage.remaining.toLocaleString()} remaining. Counts reflect successful workbook generation in either format. File expiry and repeat downloads do not reset or inflate totals.</p>
   {coverage.historicalCoverageIncomplete&&coverage.remaining>0&&<p className="notice" role="status">Earlier export history is incomplete. Remaining means no tracked export since {new Date(coverage.trackingStartedAt).toLocaleString('en-US',{timeZone:'America/New_York'})} ET; earlier exports are not assumed.</p>}
  </>}
 </section>;
}
