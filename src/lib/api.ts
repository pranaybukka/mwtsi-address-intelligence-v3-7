import {MissingHybridLinesError} from './address-blocks';
/** Next.js can canonicalize request.url to localhost even when Host is 127.0.0.1.
 * Validate the actual HTTP authority, not that internal hostname. Never trust
 * X-Forwarded-Host here; reverse proxies must preserve the original Host.
 */
export function checkLocalMutation(request:Request){
 const origin=request.headers.get('origin');if(!origin)return;
 const internal=new URL(request.url);const authority=request.headers.get('host')||internal.host;
 let expected:string;
 try{const target=new URL(`${internal.protocol}//${authority}`);if(!/^(?:\[[0-9a-f:.]+\]|[a-z0-9._-]+)(?::[0-9]{1,5})?$/i.test(authority)||target.username||target.password||target.pathname!=='/'||target.search||target.hash)throw Error();expected=target.origin;}
 catch{throw Error('Cross-origin request rejected');}
 if(origin!==expected)throw Error('Cross-origin request rejected');
}
export function apiError(error:unknown,status=400){return Response.json({error:error instanceof Error?error.message:'Request failed',...(error instanceof MissingHybridLinesError?{code:error.code,warnings:error.warnings}:{})},{status:error instanceof Error&&'status' in error&&typeof error.status==='number'?error.status:status});}
