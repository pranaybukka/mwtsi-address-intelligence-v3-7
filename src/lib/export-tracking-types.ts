export type ExportStateFilter='all'|'exported'|'remaining';
export const isExportState=(value:string):value is ExportStateFilter=>['all','exported','remaining'].includes(value);
export interface RecordExportHistory {count:number;firstExportedAt:number;lastExportedAt:number;highestExportedVersion:number;}
export interface ExportCoverage {total:number;exported:number;remaining:number;trackingStartedAt:number;historicalCoverageIncomplete:boolean;}
