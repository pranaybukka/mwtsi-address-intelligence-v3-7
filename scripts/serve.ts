import {spawn} from 'node:child_process';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {warmRecordIndex} from '../src/db/record-index';
import {registerRuntime} from './patch-runtime.mjs';

async function main(){
 await registerRuntime(process.cwd(),'supervisor');
 warmRecordIndex();
 const mode=process.argv[2]==='dev'?'dev':'start';
 let stopping=false;let worker:ReturnType<typeof spawn>;let restart:ReturnType<typeof setTimeout>|undefined;
 function startWorker(){
  worker=spawn(process.execPath,['--import','tsx',path.join(process.cwd(),'scripts/worker.ts')],{stdio:'inherit',env:process.env});
  worker.on('exit',()=>{if(!stopping)restart=setTimeout(startWorker,2000);});
 }
 startWorker();
 const server=spawn(process.execPath,['--import',pathToFileURL(path.join(process.cwd(),'scripts/next-runtime.mjs')).href,path.join(process.cwd(),'node_modules/next/dist/bin/next'),mode,'--hostname',process.env.ADDRESS_BIND_HOST||'127.0.0.1',...process.argv.slice(3)],{stdio:'inherit',env:process.env});
 function end(){if(stopping)return;stopping=true;if(restart)clearTimeout(restart);worker?.kill('SIGTERM');server.kill('SIGTERM');}
 for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,end);
 server.on('error',error=>{console.error('Web server could not start:',error.message);end();process.exitCode=1;});
 server.on('exit',code=>{end();process.exitCode=code||0;});
}
main().catch(error=>{console.error('MWTSI startup:',error.message);process.exitCode=1;});
