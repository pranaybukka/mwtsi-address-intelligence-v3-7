import type {ExportCoverage,RecordExportHistory} from './export-tracking-types';
import type {Batch} from './domain';
import type {summarize} from './summary';
export type RecordSummary=ReturnType<typeof summarize>;
export interface BatchPage extends Batch {page:number;pageSize:number;revision:number;summary:RecordSummary;batchSummary:RecordSummary;groupSummary:RecordSummary;groups:{key:string;label:string}[];statusCounts:Record<string,number>;legacy:boolean;exportCoverage:ExportCoverage;recordExports:Record<string,RecordExportHistory>;}
