import {withEntitlement} from '@/lib/auth';
import {paymentAsset} from '@/lib/payment-lab';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const handler=withEntitlement(async(request:Request,{params}:{params:Promise<{asset:string[]}>})=>paymentAsset((await params).asset,request.method==='HEAD'),'paymentMessageLab');
export const GET=handler;
export const HEAD=handler;
