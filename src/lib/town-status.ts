import {normalize} from './parser/normalize';
/** The Unresolved state displayed by the workspace, independent of Hybrid serialization. */
export function isTownUnresolved(town:string){const value=normalize(town);return !value||value==='UNRESOLVED';}
