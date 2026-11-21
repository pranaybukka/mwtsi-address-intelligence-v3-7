import type Database from 'better-sqlite3';
import {indexed} from './record-index';
import {batchMetadata,parseRecordQuery,iterateSelectedRows,type RecordQuery} from './record-query';
import type {AuthUser} from '../lib/auth-types';
import {AccessError,assertEntitlement} from '../lib/auth';
import {approvedChanges} from '../lib/batch-workflows';
export function changeMembership(d:Database.Database,id:string,user:AuthUser,query:RecordQuery){const identities:{id:string;version:number}[]=[];let selectedRecords=0,changedFields=0;for(const record of iterateSelectedRows(d,id,user,query)){selectedRecords++;const changes=approvedChanges(record);if(changes.length){identities.push({id:record.id,version:record.version});changedFields+=changes.length;}}return {identities,selectedRecords,changedRecords:identities.length,changedFields};}
export function changesSummary(user:AuthUser,id:string,params:URLSearchParams){assertEntitlement(user,'exportResults');const scope=params.get('scope')||'all';if(!['all','selected'].includes(scope))throw new AccessError('Invalid export scope',400);const query=parseRecordQuery(params);if(scope==='all'){query.statuses=[];query.search='';delete query.focusStatus;}return indexed(d=>{batchMetadata(d,id,user);const {identities,...summary}=changeMembership(d,id,user,query);return summary;});}
