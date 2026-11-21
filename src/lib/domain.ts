export interface PreservedCell { value:string|number|boolean|null; kind:'value'|'date'|'error'|'formula'; numberFormat?:string; originalFormula?:string; originalHyperlink?:string; }
export interface AdditionalColumn { header:string; cell:PreservedCell; }
export interface AddressInput { orp?:AddressAnalysisInput; originalColumns?:AdditionalColumn[]; sourceRowNumber?:number; recordKey?:string; Name:string; Address1:string; Address2:string; Address3:string; Bank_Country?:string; Group?:string; additionalColumns?:AdditionalColumn[]; banking?:Record<string,string>; }
export type AddressAnalysisInput=Pick<AddressInput,'Name'|'Address1'|'Address2'|'Address3'|'Bank_Country'>;
export interface Evidence { type:string; value:string; weight:number; source:string; detail?:string; }
export interface Candidate { displayName?:string; value:string; confidence:number; source:string; authority:'BANK_IDENTIFIER'|'ADDRESS_INFERENCE'|'HUMAN_REVIEW'|'UNRESOLVED'; evidence:Evidence[]; alternatives:Candidate[]; reviewRequired:boolean; }
export interface StructuredAddress { name:string; primary:string; secondary:string; town:string; subdivision:string; postal:string; country:string; }
export interface AuditEntry { field:string; value:string; reason:string; }
export interface NameInterpretationAudit { field:'Name'|'Address1'; beforeAddress1?:string; afterAddress1?:string; action:'REMOVED_DUPLICATE'|'PROMOTED_CONTINUATION'|'RETAINED_AMBIGUOUS'|'MANUAL_NAME_EDIT'; nameText:string; sourceText:string; beforeName:string; afterName:string; reason:string; }
export interface NameInterpretation { originalName:string; candidate:Candidate; addressLines:string[]; audit:NameInterpretationAudit[]; reviewReasons:string[]; }
export interface ReferenceSnapshot {id:string;provider:string;createdAt:string;license:string;postalRelationships:number;lookupRelationships:number;countries:number;places:number;}
/** Retired auto-approval fields are retained only for reading historical audit data. */
export interface ProcessingSettings { autoApproveUnresolvedTown?:boolean; autoApproveNotProvidedCity?:boolean; postalLookupEnabled:boolean; }
export interface Intelligence { processingVersion?:string; referenceSignature?:string; processingSettings?:ProcessingSettings; referenceData?:ReferenceSnapshot; nameInterpretation?:NameInterpretation; structured:StructuredAddress; town:Candidate; country:Candidate; postal:Candidate; subdivision:Candidate; sanitized:string[]; localityAudit:AuditEntry[]; notes:string[]; conflicts:string[]; }
export type CandidateKey = '1a'|'1b'|'2a'|'2z'|'2c'|'2b'|'2d'|'3a';
export interface SelectionAudit { status:'PASS'|'FAIL'; nameRecords:number; addressCapacity:number; priorityOrder:CandidateKey[]; selectedKeys:CandidateKey[]; omittedKeys:CandidateKey[]; postalDisposition:'NOT_PROVIDED'|'RETAINED_2Z'|'RETAINED_IDENTICAL_LINE'|'MISSING_DESPITE_CAPACITY'|'DROPPED_BY_PRIORITY'; postalReason:string; decisions:{key:CandidateKey;rank:number|null;line:string;decision:'NOT_GENERATED'|'SELECTED'|'DROPPED';reason:string}[]; issues:string[]; }
export interface HybridOutput { selectionAudit?:SelectionAudit; lines:string[]; candidates:Partial<Record<CandidateKey,string>>; dropped:AuditEntry[]; truncations:AuditEntry[]; }
export interface Validation { priority?:'PASS'|'FAIL'; pmpg:'PASS'|'FAIL'|'NOT_APPLICABLE'; duplication:'PASS'|'FAIL'; length:'PASS'|'FAIL'; issues:string[]; evidenceConflict:boolean; }
export type Status = 'AUTO_TRANSLATED'|'PROPOSED_REVIEW_REQUIRED'|'NAME_ONLY'|'ERROR';
export interface ReviewOutputSnapshot {lines:string[];validation:Validation;status:Status;reasons:string[];}
export interface ReviewEvent { workflow?:{id:string;kind:'BULK_CORRECTION'|'REUSED_DECISION';baselineBatchId?:string;baselineRecordId?:string;baselineVersion?:number;baselineDecisionAt?:string;baselineReviewer?:string}; blocks?:Partial<Record<AddressBlockKey,{before:StructuredAddress;after:StructuredAddress;output:ReviewOutputSnapshot}>>; acknowledgedMissingLines?:MissingHybridLine[]; actorId?:string; actorUsername?:string; origin?:'AUTOMATIC_UNRESOLVED_TOWN'|'AUTOMATIC_NOTPROVIDED_CITY'; at:string; initials?:string; action:'PASS'|'FAIL'|'ACCEPT'|'APPROVE'|'EDIT'|'REJECT'; reviewer:string; reason:string; before:StructuredAddress; after:StructuredAddress; acceptedOutput?:ReviewOutputSnapshot; decisionOutput?:ReviewOutputSnapshot; }
export type AddressBlockKey="BNP"|"ORP";
export interface MissingHybridLine {block:AddressBlockKey;missing:("1/"|"3/")[];nameOnly:boolean;}
export type AddressBlockResult=Pick<RecordResult,"source"|"intelligence"|"hybrid"|"validation"|"status"|"reasons">;
export interface RecordResult { schemaVersion?:3; orp?:AddressBlockResult; bnpStatus?:Status; bnpValidation?:Validation; bnpReasons?:string[]; id:string; source:AddressInput; intelligence:Intelligence; hybrid:HybridOutput; validation:Validation; status:Status; reasons:string[]; reviewState:'PENDING'|'PASSED'|'FAILED'|'ACCEPTED'|'APPROVED'|'REJECTED'|'NONE'; reviews:ReviewEvent[]; version:number; }
export interface Batch { processingSettings?:ProcessingSettings; importMetadata?:ImportMetadata; id:string; filename:string; createdAt:string; records:RecordResult[]; }
export interface Policy { postalLookupEnabled?:boolean; countryThreshold:number; townThreshold:number; authorityOrder:Candidate['authority'][]; nameOnlyPolicy:'SLASH_33_66'; }
export const DEFAULT_POLICY:Policy = { postalLookupEnabled:true, countryThreshold:0.92, townThreshold:0.90, authorityOrder:['HUMAN_REVIEW','BANK_IDENTIFIER','ADDRESS_INFERENCE','UNRESOLVED'], nameOnlyPolicy:'SLASH_33_66' };

export interface ImportMetadata {profile?:"BNP_ONLY"|"BNP_ORP";worksheet:string;fields:Record<string,string|null>;keyColumn?:string|null;headers:string[];}
export interface ProcessingJob {id:string;filename:string;status:'QUEUED'|'RUNNING'|'PAUSED'|'FAILED'|'CANCELLED'|'COMPLETED';total:number;cursor:number;created_at:string;updated_at:string;error:string|null;reference_id:string;}
