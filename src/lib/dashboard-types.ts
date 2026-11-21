import type {ProgressTotals} from './readiness';
import type {StatusFilter} from './record-selection';
import type {ExportStateFilter} from './export-tracking-types';
export interface DashboardSelection {group:string;statuses:StatusFilter[];exportState?:ExportStateFilter;focusStatus?:StatusFilter;}
export interface DashboardExportTotals {exported:number;remaining:number;readyRemaining:number;historicalCoverageIncomplete:boolean;}
export interface DashboardBatch {id:string;filename:string;createdAt:string;totals:ProgressTotals;exports:DashboardExportTotals;}
export interface DashboardData {
 blocks?:{bnpBlocks:number;orpBlocks:number;bnpFindings:number;orpFindings:number;bothFindings:number;missingHybridLines:number};
 totals:ProgressTotals;
 exports:DashboardExportTotals&{trackingStartedAt:number};
 insights:{unresolvedTown:number;conflicts:number;truncation:number};
 activity?:{importsRunning:number;importsFailed:number;exportsRunning:number;exportsReady:number;exportsFailed:number};
 statusCounts:Record<string,number>;
 batches:DashboardBatch[];
 options:{batches:{id:string;filename:string;createdAt:string}[];groups:{key:string;label:string}[]};
 filters:{batchId:string;group:string;statuses:StatusFilter[]};
 updatedAt:string;
}
