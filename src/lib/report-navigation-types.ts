import type {RecordResult} from './domain';
export interface ReportNavigation {record:RecordResult|null;position:number;total:number;page:number;hasPrevious:boolean;hasNext:boolean;}

export type ReportDirection='current'|'previous'|'next'|'after';
