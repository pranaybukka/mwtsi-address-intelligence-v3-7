export type ExportMode='full'|'source-hybrid'|'changes';
export const HYBRID_OUTPUT_COLUMNS=['Hybrid_Line1','Hybrid_Line2','Hybrid_Line3','Hybrid_Line4'] as const;
export function isExportMode(value:string):value is ExportMode{return value==='full'||value==='source-hybrid'||value==='changes';}
