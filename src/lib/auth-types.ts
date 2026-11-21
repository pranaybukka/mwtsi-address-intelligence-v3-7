import type {Entitlements} from './entitlements';
export interface AuthUser {id:string;username:string;role:'Admin'|'User';group:string|null;mustChangePassword:boolean;active:boolean;entitlements?:Entitlements;}
