import { CandidateKey } from '../domain';
/** Internal priorities v1.0, not the PMPG MX-to-MT postal-in-3/ profile. */
export const ADDRESS_PRIORITY:CandidateKey[]=['2a','2z','2c','2b','2d'];
export const MAX_LINES=4;
export const MAX_ADDRESS_LINES=2;
export const shouldCombine=(al1:string,al2:string)=>!!al1&&!!al2&&Array.from(al1).length+Array.from(al2).length<33;
