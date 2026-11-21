import {indexed} from './record-index';
import {batchMetadata,recordWhere,selectedRows,groupBuckets,compareReportGroups,type RecordQuery} from './record-query';
import {AccessError} from '../lib/auth';
import type {AuthUser} from '../lib/auth-types';
import type {ReportNavigation,ReportDirection} from '../lib/report-navigation-types';
/** Locate only the anchor and its neighbor in the authorized report, without loading the whole batch. */
export function navigateReport(user:AuthUser,batchId:string,q:RecordQuery,recordId:string,direction:ReportDirection='current',pageSize=15):ReportNavigation{
 if(!recordId||recordId.length>500||!['current','previous','next','after'].includes(direction)||!Number.isInteger(pageSize)||pageSize<1||pageSize>100)throw new AccessError('Invalid report navigation request',400);
 return indexed(d=>{
  batchMetadata(d,batchId,user);const w=recordWhere(batchId,user,q);
  const anchorScope=direction==='after'?recordWhere(batchId,user,{...q,statuses:[],search:'',focusStatus:undefined,exportState:'all'}):w;
  const anchor=d.prepare(`SELECT i.source_order,json_extract(i.info,'$.group') group_name FROM record_index i WHERE ${anchorScope.sql} AND i.record_id=?`).get(...anchorScope.args,recordId) as {source_order:number;group_name:string}|undefined;
  if(!anchor)throw new AccessError('This record is no longer in the selected report. Close review and refresh the report.',404);
  let before=0,total=0;
  if(q.groupSort==='original'){
   const count=d.prepare(`SELECT count(*) total,coalesce(sum(CASE WHEN i.source_order<? THEN 1 ELSE 0 END),0) before_count FROM record_index i WHERE ${w.sql}`).get(anchor.source_order,...w.args) as {total:number;before_count:number};before=count.before_count;total=count.total;
  }else{
   const buckets=groupBuckets(d,batchId,user,q);total=buckets.reduce((n,b)=>n+b.count,0);
   for(const bucket of buckets){const comparison=compareReportGroups(bucket.names[0],anchor.group_name,q.groupSort);if(comparison<0){before+=bucket.count;continue;}if(comparison>0)break;const within=d.prepare(`SELECT count(*) n FROM record_index i WHERE ${w.sql} AND json_extract(i.info,'$.group') IN (SELECT value FROM json_each(?)) AND i.source_order<?`).get(...w.args,JSON.stringify(bucket.names),anchor.source_order) as {n:number};before+=within.n;break;}
  }
  // A saved decision may remove the anchor from status/search/export filters.
  // Count current matches before its stable sort position; never advance by a stale row number.
  const anchorMatches=direction==='after'?!!d.prepare(`SELECT 1 FROM record_index i WHERE ${w.sql} AND i.record_id=?`).get(...w.args,recordId):true;
  const offset=before+(direction==='after'?(anchorMatches?1:0):direction==='next'?1:direction==='previous'?-1:0);
  if(direction==='after'&&(offset<0||offset>=total))return {record:null,position:Math.min(before,total),total,page:Math.max(0,Math.ceil(total/pageSize)-1),hasPrevious:before>0,hasNext:false};
  if(offset<0||offset>=total)return {record:null,position:before+1,total,page:Math.floor(before/pageSize),hasPrevious:before>0,hasNext:before+1<total};
  const record=selectedRows(d,batchId,user,q,1,offset)[0]||null;
  return {record,position:offset+1,total,page:Math.floor(offset/pageSize),hasPrevious:offset>0,hasNext:offset+1<total};
 });
}
