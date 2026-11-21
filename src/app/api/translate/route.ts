import {withEntitlement,AccessError} from '@/lib/auth';
import {ensureSeed} from '@/db/seed';
import {processingSettings} from '@/db/settings';
import {SqliteReferenceRepository} from '@/lib/reference/sqlite';
import {processAddress} from '@/lib/process';
import {DEFAULT_POLICY} from '@/lib/domain';
import {LIVE_LIMITS,liveSource,type LiveInput} from '@/lib/live-translation';
export const runtime='nodejs';
async function inputFrom(request:Request):Promise<LiveInput>{
 if((request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()!=='application/json')throw new AccessError('Send name and address as JSON.',415);
 if(Number(request.headers.get('content-length'))>LIVE_LIMITS.bodyBytes)throw new AccessError('The entered text is too large.',413);
 const reader=request.body?.getReader();if(!reader)throw new AccessError('Enter a name or address.',400);
 const chunks:Uint8Array[]=[];let total=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;if(total>LIVE_LIMITS.bodyBytes){await reader.cancel();throw new AccessError('The entered text is too large.',413);}chunks.push(value);}}finally{reader.releaseLock();}
 let raw:unknown;try{raw=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new AccessError('The entered text could not be read. Try again.',400);}
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(key=>!['name','address','country'].includes(key)))throw new AccessError('Use only name, address and country fields.',400);
 const result:LiveInput={name:'',address:'',country:''};for(const key of ['name','address','country'] as const){const value=Object.hasOwn(raw,key)?(raw as Record<string,unknown>)[key]:'';if(typeof value!=='string'||value.length>LIVE_LIMITS[key])throw new AccessError(`${key==='name'?'Name':key==='address'?'Address':'Country'} must be text up to ${LIVE_LIMITS[key].toLocaleString()} characters.`,400);result[key]=value;}
 if(!Object.values(result).some(value=>value.trim()))throw new AccessError('Enter a name or address.',400);return result;
}
export const POST=withEntitlement(async(request:Request)=>{
 const input=await inputFrom(request);ensureSeed();const settings=processingSettings();
 const record=processAddress(liveSource(input),new SqliteReferenceRepository(),'live-preview',{...DEFAULT_POLICY,...settings});
 if(record.status==='ERROR'){console.error('Live translation failed',{code:'TRANSLATION_FAILED'});throw new AccessError('Translation is unavailable. Try again in a moment.',500);}
 return Response.json({record,postalLookupEnabled:settings.postalLookupEnabled});
},'liveTranslate');
