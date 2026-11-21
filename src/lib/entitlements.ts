import type {AuthUser} from './auth-types';
export const WORKSPACE_ENTITLEMENTS=[
 {key:'liveTranslate',label:'Live translate',description:'Translate one-off name and address input.'},
 {key:'compareBatches',label:'Compare batches',description:'Compare assigned-Group batches and reuse approved decisions.'},
 {key:'bulkCorrections',label:'Bulk corrections',description:'Preview and apply pending corrections within the assigned Group.'},
 {key:'uploadAddresses',label:'Upload addresses',description:'Upload rows belonging only to the assigned Group; manage own upload jobs.'},
 {key:'exportResults',label:'Export results',description:'Export only assigned-Group rows; manage own prepared exports.'},
 {key:'paymentMessageLab',label:'Payment message lab',description:'Create test payment XML and use assigned-Group approved addresses.'},
] as const;
export type WorkspaceEntitlement=typeof WORKSPACE_ENTITLEMENTS[number]['key'];
export type Entitlements=Record<WorkspaceEntitlement,boolean>;
export const NO_ENTITLEMENTS:Entitlements={liveTranslate:false,compareBatches:false,bulkCorrections:false,uploadAddresses:false,exportResults:false,paymentMessageLab:false};
export const LEGACY_USER_ENTITLEMENTS:Entitlements={...NO_ENTITLEMENTS,liveTranslate:true,compareBatches:true,bulkCorrections:true};
export const ALL_ENTITLEMENTS=Object.fromEntries(WORKSPACE_ENTITLEMENTS.map(e=>[e.key,true])) as Entitlements;
export function hasEntitlement(user:Pick<AuthUser,'role'|'entitlements'>,key:WorkspaceEntitlement){return user.role==='Admin'||(user.entitlements?.[key]??LEGACY_USER_ENTITLEMENTS[key]);}
export function validateEntitlements(value:unknown,base:Entitlements=LEGACY_USER_ENTITLEMENTS):Entitlements{
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.entries(value).some(([k,v])=>!WORKSPACE_ENTITLEMENTS.some(e=>e.key===k)||typeof v!=='boolean'))throw Error('Choose valid workspace entitlement checkboxes.');
 return {...base,...value};
}
export const VIEW_ENTITLEMENTS={live:'liveTranslate',compare:'compareBatches',bulk:'bulkCorrections',upload:'uploadAddresses',export:'exportResults',payments:'paymentMessageLab'} as const;
export function canOpenWorkspaceView(user:Pick<AuthUser,'role'|'entitlements'>,view:string){const key=VIEW_ENTITLEMENTS[view as keyof typeof VIEW_ENTITLEMENTS];return !key||hasEntitlement(user,key);}
