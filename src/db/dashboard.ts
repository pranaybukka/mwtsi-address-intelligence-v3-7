import {indexed} from './record-index';
import type {AuthUser} from '../lib/auth-types';
import type {DashboardData,DashboardBatch,DashboardExportTotals} from '../lib/dashboard-types';
import {emptyProgress} from '../lib/readiness';
import {AccessError} from '../lib/auth';
import {recordWhere,defaultQuery} from './record-query';
import {wasExportedSql} from './export-tracking';
import {STATUS_OPTIONS,isStatusFilter,type StatusFilter} from '../lib/record-selection';
import type {GroupTotals} from './group-totals';
const emptyExports=():DashboardExportTotals=>({exported:0,remaining:0,readyRemaining:0,historicalCoverageIncomplete:false});
export function dashboard(user:AuthUser,batchId='',group='all',statuses:StatusFilter[]=[]):DashboardData {
 if(statuses.length>100||statuses.some(status=>!isStatusFilter(status)))throw new AccessError('Invalid dashboard status filters',400);
 statuses=[...new Set(statuses)];
 return indexed(d=>{
  const authorized=user.role==='Admin'?'':user.group?.trim()?" AND json_extract(r.info,'$.group')=?":" AND 0";
  const parameters=user.role!=='Admin'&&user.group?.trim()?[user.group]:[];
  const completed="NOT EXISTS (SELECT 1 FROM jobs j WHERE j.id=b.id AND j.status<>'COMPLETED')";
  const available=d.prepare(`SELECT b.id,b.filename,b.created_at FROM batches b WHERE ${completed}${user.role==='Admin'?'':` AND EXISTS (SELECT 1 FROM record_index r WHERE r.batch_id=b.id${authorized})`} ORDER BY b.created_at DESC,b.id`).all(...parameters) as {id:string;filename:string;created_at:string}[];
  if(batchId&&!available.some(batch=>batch.id===batchId))throw new AccessError('Batch not found',404);
  const blocks={bnpBlocks:0,orpBlocks:0,bnpFindings:0,orpFindings:0,bothFindings:0,missingHybridLines:0};
  const totals=emptyProgress(),byBatch=new Map<string,DashboardBatch>(),groups=new Map<string,string>(),exports=emptyExports(),insights={unresolvedTown:0,conflicts:0,truncation:0};
  for(const batch of available)if(!batchId||batchId===batch.id)byBatch.set(batch.id,{id:batch.id,filename:batch.filename,createdAt:batch.created_at,totals:emptyProgress(),exports:emptyExports()});
  const groupScope=user.role==='Admin'?'':user.group?.trim()?' AND r.group_name=?':' AND 0';
  const statusCounts=Object.fromEntries(STATUS_OPTIONS.map(option=>[option.value,0]));
  for(const row of d.prepare(`SELECT r.batch_id,r.group_name,r.info FROM record_group_totals r JOIN batches b ON b.id=r.batch_id WHERE ${completed}${groupScope}`).iterate(...parameters) as Iterable<{batch_id:string;group_name:string;info:string}>){
   const key=row.group_name.trim()?`value:${row.group_name}`:'blank';groups.set(key,key==='blank'?'(No group)':row.group_name);
   if(batchId&&row.batch_id!==batchId||group!=='all'&&key!==group)continue;
   const stats=JSON.parse(row.info) as GroupTotals;for(const option of STATUS_OPTIONS)statusCounts[option.value]+=stats.byStatus[option.value]?.total||0;
  }
  const selection=recordWhere('',user,{...defaultQuery(),group,statuses});selection.sql=selection.sql.replace('i.batch_id=?','i.batch_id IN (SELECT value FROM json_each(?))');selection.args[0]=JSON.stringify([...byBatch.keys()]);
  const sums=Object.keys(totals).map(key=>`coalesce(sum(json_extract(i.info,'$.summary.${key}')),0) AS "${key}"`);
  for(const key of Object.keys(blocks))sums.push(`coalesce(sum(json_extract(i.info,'$.summary.${key}')),0) AS "${key}"`);
  for(const key of Object.keys(insights))sums.push(`coalesce(sum(json_extract(i.info,'$.statuses.${key}')),0) AS "${key}"`);
  sums.push(`sum(CASE WHEN ${wasExportedSql} THEN 1 ELSE 0 END) exported`,`sum(CASE WHEN NOT ${wasExportedSql} AND json_extract(i.info,'$.statuses.readyForExport')=1 THEN 1 ELSE 0 END) readyRemaining`,'max(CASE WHEN l.batch_id IS NULL THEN 0 ELSE 1 END) legacy');
  type Row=typeof blocks&typeof totals&typeof insights&{batch_id:string;exported:number;readyRemaining:number;legacy:number};
  for(const row of d.prepare(`SELECT i.batch_id,${sums.join(',')} FROM record_index i LEFT JOIN export_tracking_legacy_batches l ON l.batch_id=i.batch_id WHERE ${selection.sql} GROUP BY i.batch_id`).iterate(...selection.args) as Iterable<Row>){
   const batch=byBatch.get(row.batch_id)!;for(const key of Object.keys(blocks) as (keyof typeof blocks)[])blocks[key]+=row[key];
   for(const key of Object.keys(totals) as (keyof typeof totals)[]){totals[key]+=row[key];batch.totals[key]=row[key];}
   for(const key of Object.keys(insights) as (keyof typeof insights)[])insights[key]+=row[key];
   batch.exports={exported:row.exported,remaining:row.total-row.exported,readyRemaining:row.readyRemaining,historicalCoverageIncomplete:!!row.legacy};
   exports.exported+=row.exported;exports.remaining+=batch.exports.remaining;exports.readyRemaining+=row.readyRemaining;exports.historicalCoverageIncomplete||=!!row.legacy;
  }
  let activity:DashboardData['activity'];
  if(user.role==='Admin'){
   const imports=d.prepare("SELECT sum(CASE WHEN status IN ('QUEUED','RUNNING') THEN 1 ELSE 0 END) running,sum(CASE WHEN status='FAILED' THEN 1 ELSE 0 END) failed FROM jobs").get() as {running:number|null;failed:number|null};
   const jobs=d.prepare("SELECT sum(CASE WHEN status IN ('QUEUED','RUNNING') AND expires_at>? THEN 1 ELSE 0 END) running,sum(CASE WHEN status='COMPLETED' AND expires_at>? THEN 1 ELSE 0 END) ready,sum(CASE WHEN status='FAILED' THEN 1 ELSE 0 END) failed FROM export_jobs").get(Date.now(),Date.now()) as {running:number|null;ready:number|null;failed:number|null};
   activity={importsRunning:imports.running||0,importsFailed:imports.failed||0,exportsRunning:jobs.running||0,exportsReady:jobs.ready||0,exportsFailed:jobs.failed||0};
  }
  const started=d.prepare("SELECT value FROM metadata WHERE key='export-tracking-started-at'").get() as {value:string};
  return {blocks,totals,exports:{...exports,trackingStartedAt:Number(started.value)},insights,activity,statusCounts,batches:[...byBatch.values()].filter(batch=>batch.totals.total>0||group==='all'&&!statuses.length),options:{batches:available.map(batch=>({id:batch.id,filename:batch.filename,createdAt:batch.created_at})),groups:[...groups].map(([key,label])=>({key,label})).sort((a,b)=>a.label.localeCompare(b.label,undefined,{numeric:true}))},filters:{batchId,group,statuses},updatedAt:new Date().toISOString()};
 });
}
