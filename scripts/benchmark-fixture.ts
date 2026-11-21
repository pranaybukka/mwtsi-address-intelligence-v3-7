import path from 'node:path';
import os from 'node:os';
// Called only by benchmark.ts, with a newly created isolated database.
async function main(){
 const root=process.env.MWTSI_BENCHMARK_ROOT||'';if(process.env.MWTSI_BENCHMARK_FIXTURE!=='isolated'||!path.basename(root).startsWith('mwtsi-concurrency-')||path.dirname(path.resolve(root))!==path.resolve(os.tmpdir())||path.resolve(process.env.ADDRESS_DB_PATH||'.')!==path.join(path.resolve(root),'benchmark.sqlite'))throw Error('Use npm run benchmark; never seed an operational database');
 const {createBatch}=await import('../src/db/batches'),{db}=await import('../src/db/connection'),auth=await import('../src/lib/auth');
 const total=Number(process.argv[2]),users=Number(process.argv[3]),groups=Math.min(users,10);
 const batch=createBatch(`Synthetic benchmark ${total}.xlsx`,Array.from({length:total},(_,i)=>({Name:`FICTIONAL BENCHMARK CUSTOMER ${String(i+1).padStart(6,'0')}`,Address1:`${100+i%900} EXAMPLE ROAD`,Address2:'SUITE 10',Address3:'UNLISTED LOCALITY',Bank_Country:'US',Group:`Benchmark Group ${i%groups}`,recordKey:String(i+1).padStart(8,'0'),...(process.env.MWTSI_BENCHMARK_DUAL==='1'?{orp:{Name:`FICTIONAL ORP CUSTOMER ${i+1}`,Address1:`${100+i%900} EXAMPLE ROAD`,Address2:'',Address3:'UNLISTED LOCALITY',Bank_Country:'DE'}}:{}),additionalColumns:[{header:'Group Details',cell:{kind:'value' as const,value:'Synthetic concurrency fixture'}},{header:'Amount',cell:{kind:'value' as const,value:i+0.25}}]})));
 auth.initializeAuth();db().prepare("UPDATE auth_users SET must_change=0 WHERE username='admin'").run();const admin=db().prepare("SELECT id,password_hash FROM auth_users WHERE username='admin'").get() as {id:string;password_hash:string};
 const {reference}=await import('../src/lib/reference/sqlite');const referenceSnapshot=reference.snapshot()?.id||'STARTER_REFERENCE';
 const sessions=[];for(let i=0;i<users;i++){const id=`benchmark-user-${i}`;db().prepare("INSERT INTO auth_users(id,username,password_hash,role,group_name,must_change,active,created_at) VALUES(?,?,?,'User',?,0,1,?)").run(id,id,admin.password_hash,`Benchmark Group ${i%groups}`,new Date().toISOString());sessions.push(auth.issueSession(id));}
 // Credentials are consumed from the private child pipe by benchmark.ts, never printed to a terminal/report.
 process.stdout.write(JSON.stringify({batchId:batch.id,adminToken:auth.issueSession(admin.id),sessions,referenceSnapshot}));
}
main().catch(()=>{process.stderr.write('Isolated benchmark fixture failed.\n');process.exitCode=1;});
