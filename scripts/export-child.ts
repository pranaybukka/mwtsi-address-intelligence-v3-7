import {registerRuntime} from './patch-runtime.mjs';
import {getExportRow} from '../src/db/exports';
import {runExport} from '../src/lib/background-export';
async function main(){await registerRuntime(process.cwd(),'worker');const [id,owner]=process.argv.slice(2);const job=getExportRow(id);if(!job||job.lease_owner!==owner||job.status!=='RUNNING')return;await runExport(job,owner);}
main().catch(()=>{console.error('Export worker stopped; an interrupted export can be retried.');process.exitCode=1;});
