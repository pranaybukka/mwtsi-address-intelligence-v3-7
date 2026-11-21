import {scopedBatch} from '@/lib/access';
import {approvedChanges} from '@/lib/batch-workflows';
import type {AuthUser} from '@/lib/auth-types';
import {trackDirectExport,recordExportHistory} from '@/db/export-tracking';
import {db} from '@/db/connection';
import {isExportState} from '@/lib/export-tracking-types';
import {withEntitlement} from '@/lib/auth';
import {getJob} from '@/db/jobs';
import {getBatch} from '@/db/batches';
import {exportWorkbook} from '@/lib/excel/export';
import {isExportMode} from '@/lib/export-options';
import {apiError} from '@/lib/api';
import {filterAndSortGroups,GroupSort} from '@/lib/source';
import {isStatusFilter,StatusFilter,STATUS_OPTIONS,selectRecords,matchesStatus} from '@/lib/record-selection';
export const runtime='nodejs';
async function GETHandler(request:Request,{params}:{params:Promise<{id:string}>},user:AuthUser){
 const id=(await params).id;const original=getBatch(id);const batch=original?scopedBatch(user,original):undefined;if(!batch)return Response.json({error:'Batch not found'},{status:404});const job=getJob(id);if(job&&job.status!=='COMPLETED')return Response.json({error:'Batch processing is not complete'},{status:409});
 const query=new URL(request.url).searchParams,mode=query.get('mode')||'full';if(!isExportMode(mode))return Response.json({error:'Choose full, source-hybrid or changes export mode'},{status:400});const sort=query.get('groupSort')||'original';
 if(!['original','asc','desc'].includes(sort)||query.has('group')&&query.get('groupMissing')==='1')return Response.json({error:'Invalid Group selection or sort order'},{status:400});
 const scope=query.get('scope')||'all',chosen=query.getAll('status'),search=query.get('search')||'';
 if(!['all','selected'].includes(scope)||chosen.length>100||chosen.some(value=>!isStatusFilter(value))||search.length>1000)return Response.json({error:'Invalid export scope, status selection or search'},{status:400});
 const filter=query.get('groupMissing')==='1'?'blank':query.has('group')?`value:${query.get('group')}`:'all';
 const statuses=[...new Set(chosen)] as StatusFilter[];
 const focus=query.get('focusStatus');if(focus&&!isStatusFilter(focus))return Response.json({error:'Invalid report focus'},{status:400});
 const exportState=query.get('exportState')||'all';if(!isExportState(exportState))return Response.json({error:'Invalid export tracking filter'},{status:400});
 let records=selectRecords(filterAndSortGroups(batch.records,filter,sort as GroupSort),scope==='selected'?statuses:[],scope==='selected'?search:'');
 if(scope==='selected'&&focus)records=records.filter(record=>matchesStatus(record,focus as StatusFilter));
 if(exportState!=='all'){const histories=recordExportHistory(db(),id,records.map(record=>record.id));records=records.filter(record=>exportState==='exported'?!!histories[record.id]:!histories[record.id]);}
 if(mode==='changes')records=records.filter(record=>approvedChanges(record).length>0);
 if(!records.length)return Response.json({error:scope==='selected'?'No records match the selected filters':'No records match the selected Group'},{status:400});
 const group=filter==='all'?'All groups':filter==='blank'?'No group':filter.slice(6);
 const labels=statuses.map(value=>STATUS_OPTIONS.find(option=>option.value===value)!.label);
 const selection=`Group: ${group}; sort: ${sort}; scope: ${scope==='selected'?'Selected filters':'All records in Group'}${scope==='selected'?`; statuses (ANY): ${labels.join(', ')||'All'}; focus (AND): ${focus||'None'}; search: ${search.trim()||'None'}`:''}; export tracking: ${exportState}; unique records: ${records.length}`;
 try{const bytes=await exportWorkbook({...batch,records},selection,mode);const response=new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="${mode==='full'?'hybrid-address-results.xlsx':mode==='changes'?'hybrid-address-changes.xlsx':'hybrid-address-source-hybrid.xlsx'}"`,'Cache-Control':'no-store'}});trackDirectExport(user,id,mode,records);return response;}catch(error){return apiError(error);}
}

export const GET=withEntitlement(GETHandler,'exportResults');
