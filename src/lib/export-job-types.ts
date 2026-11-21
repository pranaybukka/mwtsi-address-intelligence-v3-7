import type {ExportMode} from './export-options';
export interface ExportJob {id:string;batchId:string;filename:string;requestedBy:string;status:'QUEUED'|'RUNNING'|'COMPLETED'|'FAILED'|'CANCELLED'|'EXPIRED';total:number;progress:number;mode:ExportMode;selection:string;createdAt:number;updatedAt:number;expiresAt:number;error:string|null;}
