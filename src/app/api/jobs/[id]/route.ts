import type {AuthUser} from '@/lib/auth-types';
import {requireResource} from '@/db/workspace-resources';
import {withEntitlement} from '@/lib/auth';
import {getJob,changeJob} from '@/db/jobs';import {checkLocalMutation,apiError} from '@/lib/api';export const runtime='nodejs';
async function GETHandler(_:Request,{params}:{params:Promise<{id:string}>},user:AuthUser){requireResource('job',(await params).id,user);const j=getJob((await params).id);return j?Response.json(j,{headers:{'Cache-Control':'no-store'}}):Response.json({error:'Job not found'},{status:404});}
async function PATCHHandler(req:Request,{params}:{params:Promise<{id:string}>},user:AuthUser){try{requireResource('job',(await params).id,user);checkLocalMutation(req);const {action}=await req.json();if(!['pause','resume','cancel'].includes(action))throw Error('Invalid job action');return Response.json(changeJob((await params).id,action));}catch(e){return apiError(e,409);}}

export const GET=withEntitlement(GETHandler,'uploadAddresses');

export const PATCH=withEntitlement(PATCHHandler,'uploadAddresses');
