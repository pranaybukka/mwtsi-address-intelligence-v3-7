import type Database from 'better-sqlite3';
import {summarize} from '../lib/summary';
import type {RecordSummary} from '../lib/page-types';
import {groupKey} from '../lib/source';
export interface IndexedInfo {group:string;summary:RecordSummary;statuses:Record<string,number>;legacy:boolean;}
export interface GroupTotals {all:RecordSummary;byStatus:Record<string,RecordSummary>;legacy:number;}
export const emptyGroupTotals=():GroupTotals=>({all:summarize([]),byStatus:{},legacy:0});
export function addSummary(target:RecordSummary,source:RecordSummary,sign=1){for(const key of Object.keys(target) as (keyof RecordSummary)[])target[key]=(target[key]||0)+sign*(source[key]||0);}
function apply(totals:GroupTotals,info:IndexedInfo,sign:number){addSummary(totals.all,info.summary,sign);totals.legacy+=Number(info.legacy)*sign;for(const [status,match] of Object.entries(info.statuses))if(match){const summary=totals.byStatus[status]??=summarize([]);addSummary(summary,info.summary,sign);if(!summary.total)delete totals.byStatus[status];}}
function store(d:Database.Database,batch:string,group:string,totals:GroupTotals){
 if(totals.all.total){const first=(d.prepare("SELECT min(source_order) n FROM record_index WHERE batch_id=? AND json_extract(info,'$.group')=?").get(batch,group) as {n:number}).n;d.prepare('INSERT OR REPLACE INTO record_group_totals VALUES(?,?,?,?,?)').run(batch,group,groupKey(group),first,JSON.stringify(totals));}
 else d.prepare('DELETE FROM record_group_totals WHERE batch_id=? AND group_name=?').run(batch,group);
 d.prepare('DELETE FROM record_totals_dirty WHERE batch_id=? AND group_name=?').run(batch,group);
}
export function repairGroupTotals(d:Database.Database,batch:string,group:string){
 const totals=emptyGroupTotals();for(const row of d.prepare("SELECT info FROM record_index WHERE batch_id=? AND json_extract(info,'$.group')=?").iterate(batch,group) as Iterable<{info:string}>)apply(totals,JSON.parse(row.info),1);store(d,batch,group,totals);
}
export function ensureGroupTotals(d:Database.Database,batch:string,group:string){if(d.prepare('SELECT 1 FROM record_totals_dirty WHERE batch_id=? AND group_name=?').get(batch,group))repairGroupTotals(d,batch,group);}
/** Apply a record delta inside the same transaction as its authoritative write and index update. */
export function changeGroupTotals(d:Database.Database,batch:string,group:string,changes:{info:IndexedInfo;sign:number}[]){
 const row=d.prepare('SELECT info FROM record_group_totals WHERE batch_id=? AND group_name=?').get(batch,group) as {info:string}|undefined;
 const totals=row?JSON.parse(row.info) as GroupTotals:emptyGroupTotals();for(const change of changes)apply(totals,change.info,change.sign);store(d,batch,group,totals);
}
