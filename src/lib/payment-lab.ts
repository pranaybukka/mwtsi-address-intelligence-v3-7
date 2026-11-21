import fs from 'node:fs/promises';
import path from 'node:path';
import assets from '@/payment-lab/asset-manifest.json';
import {AccessError} from './auth';
import {blockRecord} from './address-blocks';
import {isPassed} from './review-decision';
import {isIsoCountryCode} from './reference/iso-country';
import type {AddressBlockKey,RecordResult} from './domain';
export const PAYMENT_ASSET_ROOT=path.join(process.cwd(),'src/payment-lab/assets');
export function paymentAssetName(parts:string[]){const name=parts.join('/');if(!parts.length||parts.some(p=>!p||p==='.'||p==='..'||!/^[A-Za-z0-9_.-]+$/.test(p))||!Object.hasOwn(assets,name))throw new AccessError('Payment asset not found',404);return name as keyof typeof assets;}
export async function paymentAsset(parts:string[],head=false){const name=paymentAssetName(parts),root=await fs.realpath(PAYMENT_ASSET_ROOT),file=await fs.realpath(path.join(root,name));if(!file.startsWith(root+path.sep))throw new AccessError('Payment asset not found',404);const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.wasm':'application/wasm','.xsd':'application/xml; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};return new Response(head?null:new Uint8Array(await fs.readFile(file)),{headers:{'Content-Type':mime[path.extname(name)]||'application/octet-stream','Content-Length':String(assets[name].bytes),'X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"frame-ancestors 'self'"}});}
export function approvedPaymentParty(record:RecordResult,block:AddressBlockKey,version:number){
 if(record.version!==version)throw new AccessError('This record changed. Reload the reviewed record before loading it into a payment draft.',409);
 if(!isPassed(record))throw new AccessError('Pass the saved record before using its address in a payment draft.',409);
 if(block==='ORP'&&!record.orp)throw new AccessError('This record has no ORP address.',400);
 const a=blockRecord(record,block).intelligence.structured;
 const party={name:a.name,city:a.town,country:a.country,postal:a.postal,subdivision:a.subdivision,addressLine1:a.primary,addressLine2:a.secondary};
 const limits={name:140,city:35,country:2,postal:16,subdivision:35,addressLine1:70,addressLine2:70};
 for(const [key,max] of Object.entries(limits)){const value=party[key as keyof typeof party];if(typeof value!=='string'||Array.from(value).length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value))throw new AccessError(`Review ${key} before payment use; it must fit the ISO field without truncation.`,422);}
 if(!party.name.trim()||!party.city.trim()||!isIsoCountryCode(party.country))throw new AccessError('A reviewed name, town/city and ISO country are required for a payment party.',422);
 return {party,source:{recordId:record.id,key:record.source.recordKey||record.id,block,version:record.version},notice:'Copied approved address into a test draft only. Original record and approval are unchanged.'};
}
