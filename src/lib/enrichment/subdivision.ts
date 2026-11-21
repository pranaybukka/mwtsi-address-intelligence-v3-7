import { containsPhrase } from '../hybrid/validate';
import { ReferenceRepository } from '../reference/types';
import {key} from '../parser/normalize';
export function findSubdivision(text:string,country:string,ref:ReferenceRepository,expectedCode?:string,town?:string){return ref.subdivisions(country).filter(s=>containsPhrase(text,s.alias)&&!(town&&key(s.alias)===key(town))).sort((a,b)=>Number(b.alias===b.code)-Number(a.alias===a.code)||Number(b.code===expectedCode)-Number(a.code===expectedCode)||b.alias.length-a.alias.length)[0];}
