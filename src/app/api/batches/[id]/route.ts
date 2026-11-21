import {AccessError,withAuth} from '@/lib/auth';
import {deleteBatch} from '@/db/delete-batch';
import {visibleBatch} from '@/lib/access';
import {getJob} from '@/db/jobs';
export const runtime='nodejs';
export const GET=withAuth(async(_request:Request,{params}:{params:Promise<{id:string}>},user)=>{const id=(await params).id;const b=visibleBatch(user,id);if(!b)return Response.json({error:'Batch not found'},{status:404});const job=getJob(id);if(job&&job.status!=='COMPLETED')return Response.json({error:'Batch processing is not complete',...(user.role==='Admin'?{job}:{})},{status:409});return Response.json(b);});

export const DELETE=withAuth(async(request:Request,{params}:{params:Promise<{id:string}>},user)=>{
 const id=(await params).id;let body:unknown;
 try{body=await request.json();}catch{throw new AccessError('Confirm batch deletion before continuing',400);}
 if(!body||typeof body!=='object'||Array.isArray(body)||!('confirmation' in body)||body.confirmation!==id)throw new AccessError('Confirm batch deletion for this batch',400);
 return Response.json(deleteBatch(user,id));
},true);
