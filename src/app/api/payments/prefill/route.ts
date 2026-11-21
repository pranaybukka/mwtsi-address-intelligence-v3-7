import {requireRecordAccess} from '@/lib/access';
import {withEntitlement,AccessError} from '@/lib/auth';
import {getRecord} from '@/db/batches';
import {approvedPaymentParty} from '@/lib/payment-lab';
export const runtime='nodejs';
export const GET=withEntitlement(async(request:Request,_context,user)=>{const q=new URL(request.url).searchParams,id=q.get('recordId')||'',block=q.get('block')||'BNP',raw=q.get('version'),version=Number(raw);if(!id||id.length>100||!['BNP','ORP'].includes(block)||raw===null||!Number.isInteger(version)||version<0)throw new AccessError('A valid reviewed record, block and version are required.',400);const record=getRecord(id);if(!record)throw new AccessError('Record not found',404);requireRecordAccess(user,record);return Response.json(approvedPaymentParty(record,block as 'BNP'|'ORP',version));},'paymentMessageLab');
