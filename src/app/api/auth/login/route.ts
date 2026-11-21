import {login,cookieValue,authError,AccessError} from '@/lib/auth';
import {checkLocalMutation} from '@/lib/api';
export const runtime='nodejs';
export async function POST(request:Request){try{try{checkLocalMutation(request);}catch{throw new AccessError('Cross-origin request rejected');}const body=await request.json();const {user,token}=await login(body.username,body.password);return Response.json({user},{headers:{'Set-Cookie':cookieValue(token,request),'Cache-Control':'no-store'}});}catch(error){return authError(error);}}
