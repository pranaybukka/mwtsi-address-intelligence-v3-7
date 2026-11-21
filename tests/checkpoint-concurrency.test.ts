import {it,expect,vi} from 'vitest';import Database from 'better-sqlite3';
import {ensureSeed} from '../src/db/seed';import {db} from '../src/db/connection';import {queueBatch,claimJob,processJobChunk,getJob} from '../src/db/jobs';
it('an import checkpoint reserves the writer before reading its cursor, avoiding a read-to-write upgrade failure',()=>{
 ensureSeed();const job=queueBatch('concurrent.xlsx',Array.from({length:2},()=>({Name:'FICTIONAL CUSTOMER',Address1:'100 EXAMPLE ROAD',Address2:'',Address3:'BOSTON MA 02110',Bank_Country:'US'})));claimJob('checkpoint-worker');
 const d=db(),other=new Database(process.env.ADDRESS_DB_PATH!,{timeout:0});const prepare=d.prepare.bind(d);let attempted=false,otherCommitted=false;
 const spy=vi.spyOn(d,'prepare').mockImplementation(((sql:string)=>{const statement=prepare(sql);if(sql.startsWith('SELECT cursor,total FROM jobs WHERE')){const get=statement.get.bind(statement);statement.get=((...args:unknown[])=>{const row=get(...args);attempted=true;try{other.prepare("INSERT OR REPLACE INTO metadata VALUES('concurrent-writer','1')").run();otherCommitted=true;}catch(error){if(!(error instanceof Error)||!('code' in error)||error.code!=='SQLITE_BUSY')throw error;}return row;}) as typeof statement.get;}return statement;}) as typeof d.prepare);
 try{expect(processJobChunk(job.id,'checkpoint-worker')).toBe(true);expect(attempted).toBe(true);expect(otherCommitted).toBe(false);expect(getJob(job.id)!.status).toBe('COMPLETED');expect(getJob(job.id)!.cursor).toBe(2);}finally{spy.mockRestore();other.close();}
});
