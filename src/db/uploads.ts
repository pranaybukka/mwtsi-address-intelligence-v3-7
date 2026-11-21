import type {AuthUser} from '@/lib/auth-types';
import {ownResource,requireResource,requireUploadGroup} from './workspace-resources';
import {randomUUID} from 'node:crypto';import {db} from './connection';
export function saveDraft(filename:string,bytes:Buffer,user?:AuthUser){if(user)requireUploadGroup(user);db().prepare('DELETE FROM upload_drafts WHERE created_at<?').run(new Date(Date.now()-86400000).toISOString());const id=randomUUID();db().prepare('INSERT INTO upload_drafts VALUES (?,?,?,?)').run(id,filename,bytes,new Date().toISOString());if(user)ownResource('draft',id,user);return id;}
export function draft(id:string,user?:AuthUser){if(user)requireResource('draft',id,user);const r=db().prepare('SELECT filename,bytes,created_at FROM upload_drafts WHERE id=?').get(id) as {filename:string;bytes:Buffer;created_at:string}|undefined;if(!r||Date.parse(r.created_at)<Date.now()-86400000)throw Error('Upload preview expired; choose the workbook again');return r;}
