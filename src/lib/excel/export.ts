import {addressBlocks,blockRecord} from '../address-blocks';
import ExcelJS from 'exceljs';
import {reviewDecision,latestDecision,isFailed} from '../review-decision';
import {isAutoApproved} from '../acceptance-history';
import {Batch,RecordResult} from '../domain';
import {assessSelection} from '../hybrid/selection';
import {normalize} from '../parser/normalize';
import {length} from '../hybrid/truncate';
import {ExportMode,HYBRID_OUTPUT_COLUMNS} from '../export-options';
import {MAIN_COLUMNS} from '../source';
import {preservedValue} from './preserve';
import {summarize,hasUnresolvedFindings} from '../summary';
export function sourceOutputRow(r:RecordResult){return {Name:r.source.Name,Address1:r.source.Address1,Address2:r.source.Address2,Address3:r.source.Address3,Bank_Country:r.source.Bank_Country||'',Group:r.source.Group||'',...(r.orp?Object.fromEntries(MAIN_COLUMNS.map(k=>['ORP_'+k,r.orp!.source[k]||''])):{})};}
export function hybridOutputRow(r:RecordResult,dual=!!r.orp){return dual?Object.fromEntries((['BNP','ORP'] as const).flatMap(key=>HYBRID_OUTPUT_COLUMNS.map((column,i)=>[key+'_'+column,key==='ORP'&&!r.orp?'':blockRecord(r,key).hybrid.lines[i]||'']))):Object.fromEntries(HYBRID_OUTPUT_COLUMNS.map((column,i)=>[column,r.hybrid.lines[i]||'']));}
function singleExportRow(r:RecordResult){const i=r.intelligence,a=i.structured,h=r.hybrid,v=r.validation;const e=(x:unknown)=>JSON.stringify(x);const acceptance=[...r.reviews].reverse().find(x=>x.action==='ACCEPT'||x.action==='PASS');const decision=latestDecision(r);const selection=assessSelection(a,h,v.pmpg==='NOT_APPLICABLE');return {
 ...sourceOutputRow(r),Review_Decision:reviewDecision(r),Decision_User:decision?.actorUsername||'',Decision_User_ID:decision?.actorId||'',Decision_Initials:decision?.initials||'',Decision_At:decision?.at||'',Decision_Reason:decision?.reason||'',Output_Failed:isFailed(r),Auto_Approved:isAutoApproved(r),Acceptance_Origin:acceptance?.origin||'',Postal_Lookup_Enabled:i.processingSettings?.postalLookupEnabled??true,Record_ID:r.id,Source_Record_Key:r.source.recordKey||'',Source_Worksheet_Row:r.source.sourceRowNumber||'',Reference_Data_Snapshot:i.referenceData?e(i.referenceData):'STARTER_REFERENCE',Parsed_Name:a.name,Name_Source_Length:length(normalize(r.source.Name)),Name_Evaluated_Length:length(a.name),Name_Retained_Length:Math.min(length(a.name),66),Name_Record_Count:h.lines.filter(line=>line.startsWith('1/')).length,Name_Confidence:i.nameInterpretation?.candidate.confidence??'',Name_Source:i.nameInterpretation?.candidate.source||'LEGACY_SOURCE_NAME',Name_Interpretation_Check:i.nameInterpretation?(i.nameInterpretation.candidate.reviewRequired?'REVIEW_REQUIRED':'PASS'):'NOT_EVALUATED',Name_Evidence:e(i.nameInterpretation?.candidate.evidence||[]),Name_Interpretation_Audit:e(i.nameInterpretation?.audit||[]),Name_Review_Issues:e(i.nameInterpretation?.reviewReasons||[]),Name_Truncation_Audit:e(h.truncations.filter(entry=>entry.field==='Name')),Parsed_Primary_Address:a.primary,Parsed_Secondary_Address:a.secondary,Parsed_Town:a.town,Parsed_State_Province:a.subdivision,Parsed_Postal:a.postal,Parsed_Country:a.country,Parser_Country_Source:i.country.source,
 Enriched_Town_Candidate:i.town.value,Town_Probability:i.town.confidence,Town_Source:i.town.source,Town_Promoted:i.town.confidence>=.9,
 Enriched_Country_Candidate:i.country.value,Country_Probability:i.country.confidence,Country_Source:i.country.source,Country_Authority:i.country.authority,Country_Promoted:i.country.confidence>=.92,
 Enriched_Subdivision:i.subdivision.value,Enriched_Subdivision_Name:i.subdivision.displayName||i.subdivision.value,Subdivision_Source:i.subdivision.source,Enriched_Postal:i.postal.value,Postal_Source:i.postal.source,
 Sanitized_Address1:i.sanitized[0]||'',Sanitized_Address2:i.sanitized[1]||'',Sanitized_Address3:i.sanitized[2]||'',Locality_Removal_Audit:e(i.localityAudit),
 ...Object.fromEntries(['1a','1b','2a','2z','2c','2b','2d','3a'].map(k=>[`Candidate_${k}`,h.candidates[k as keyof typeof h.candidates]||''])),
 ...hybridOutputRow(r),Hybrid_Status:r.status,Hybrid_Review_Required:r.reviewState==='PENDING',Review_State:r.reviewState,Output_Accepted:['PASSED','ACCEPTED'].includes(r.reviewState),Accepted_With_Issues:['PASSED','ACCEPTED'].includes(r.reviewState)&&hasUnresolvedFindings(r),Accepted_By:acceptance?.reviewer||'',Accepted_At:acceptance?.at||'',Acceptance_Reason:acceptance?.reason||'',
 PMPG_Hybrid_Validation:v.pmpg,PMPG_Duplication_Check:v.duplication,PMPG_Validation_Issues:e(v.issues),Evidence_Conflict:e(i.conflicts),Hybrid_Data_Dropped:e(h.dropped),Hybrid_Truncation_Audit:e(h.truncations),Hybrid_Length_Validation:v.length,Hybrid_Priority_Validation:selection.status,Hybrid_Address_Slots:selection.addressCapacity,Selected_Candidate_IDs:e(selection.selectedKeys),Hybrid_Selection_Audit:e(selection),Postal_Selection_Status:selection.postalDisposition,Postal_Selection_Reason:selection.postalReason,Postal_In_2z:selection.postalDisposition==='RETAINED_2Z',Postal_Dropped_By_Priority:selection.postalDisposition==='DROPPED_BY_PRIORITY',Hybrid_Rule_Issues:e(selection.issues),
 Enrichment_Evidence:e({country:i.country,town:i.town,postal:i.postal,subdivision:i.subdivision}),Processing_Notes:e([...i.notes,...r.reasons]),Pass_Missing_Lines_Acknowledged:e(decision?.acknowledgedMissingLines||[]),Review_History:e(r.reviews)
 };}
export function exportRow(record:RecordResult,dual=!!record.orp){
 if(!dual)return singleExportRow(record);
 const shared=singleExportRow(record),keys=['Record_ID','Source_Record_Key','Source_Worksheet_Row','Group','Review_Decision','Review_State','Decision_User','Decision_User_ID','Decision_At','Decision_Reason','Output_Failed','Output_Accepted','Accepted_With_Issues','Review_History','Pass_Missing_Lines_Acknowledged'];
 return {...Object.fromEntries(keys.map(k=>[k,shared[k as keyof typeof shared]])),...Object.fromEntries(addressBlocks(record).flatMap(({key,result})=>Object.entries(singleExportRow(result)).filter(([k])=>!keys.includes(k)).map(([k,v])=>[key+'_'+k,v])))};
}
export async function exportWorkbook(batch:Batch,selection='All groups; source order',mode:ExportMode='full'){
 const {writeWorkbook}=await import('./workbook-writer');return await writeWorkbook(batch,()=>batch.records,selection,mode) as Buffer;
}
