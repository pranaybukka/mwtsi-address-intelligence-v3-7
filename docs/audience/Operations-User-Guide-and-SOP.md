> **Current release v3.4.0:** Live Translate provides structured and hybrid ISO PstlAdr XML beside the slash output, with copy buttons, local ISO corrections and explicit findings. No batch/schema/permission/export changes. Read [ISO workflow, limits and signed patch instructions](../ISO_POSTAL_LIVE_v3.4.md). The compact documentation pack supplies text guides; historical PDF/Word guides and screenshots are retained in the full source ZIP under hybrid-address/docs.

> **Earlier release v3.3.0:** Record Review compares preserved source with exact transformed output, keeps the source visible during desktop edits and explains omitted/shortened values. Users see readable output and history; Admins retain expandable technical rule analysis. Joint BNP/ORP decisions, missing-line warnings, automatic next and Group permissions remain. Read [workflow, role differences, verification and patch commands](../RECORD_REVIEW_v3.3.md). Historical guides below retain their original release context.

> **Earlier release v3.0.0:** Analyze BNP and ORP independently in one source record; review/edit both tabs and record one joint decision. Pass warns for missing 1/ or 3/ lines and permits explicitly acknowledged acceptance; bulk Pass includes a warning checkbox. Distinguish block findings from unique record/export counts. Existing batches stay BNP-only. Read [the v3 workflow, compatibility and upgrade guide](../V3_DUAL_ADDRESS_AND_PASS_WARNINGS.md).

> **v2.3.2:** Shared street-context correction prevents building-number/postal and street-name/town confusion in Live translate and batches. Existing saved results are retained; re-upload affected source for full reanalysis. Read [root cause, behavior and in-place patch commands](../POSTAL_STREET_CONTEXT_FIX_v2.3.2.md).

> **v2.3.1:** Successful Pass/Fail decisions now open the next record automatically in the same filtered report. Failed saves stay open; at the end, review closes with confirmation. See [behavior and in-place update commands](../REVIEW_AUTO_ADVANCE_v2.3.1.md).

> **v2.3.0:** [Live translate](../LIVE_TRANSLATION_v2.3.md) lets both roles enter their own Name/address and copy selected Hybrid output in real time. It creates no batch or decision and does not relax User batch upload/export permissions. Read the guide for clipboard fallback, processing settings and in-place update commands.

> **Earlier UI release v2.2.0:** Start with the [UI/update guide](../UI_REFRESH_v2.2.md) and [UI assessment](../UI_ASSESSMENT_v2.2.md). Dashboard is the landing page; readiness and unique export coverage are separate. Users remain restricted to their assigned Group. Record Review has Previous/Next with unsaved-edit protection. MWTSI retains an animated globe and removes the character artwork. Earlier release notes and the baseline manual below are historical; current guides take precedence.

# MWTSI Address Intelligence

> v1.11.1 review update: Pass immediately records the signed-in user; Fail opens a reason-only popup and records that user on confirmation. New reviews do not require initials. See ../PASS_FAIL_REVIEW.md for current behavior and export fields.

> v1.11 update: local credentials, mandatory first-login password change, Admin/User roles, authenticated review actors, Group record isolation and Admin user/group creation/import are now implemented. Read ../AUTH_ROLES_AND_GROUPS.md for current access/upgrade behavior. Earlier single-user/unenforced-role descriptions below are historical; enterprise SSO/MFA is still separate.

**v1.10:** Record Review uses top Pass/Fail buttons and pop-ups: initials for Pass; initials and reason for Fail. The heading shows Key and Name, with reasons below. See [current decision guide](../PASS_FAIL_REVIEW.md).

**v1.9.1:** Automatic town approval has been removed. Record Review compares preserved source and live Hybrid output side by side on desktop. Historical decisions remain intact; remaining rows of old jobs require manual decisions. See [current review/update guide](../RECORD_REVIEW_COMPARISON.md).

**v1.9:** Statuses now supports multiple ANY-match selections, unique record counts and an export scope for matching status/Group/search filters. Both formats export each internal record once across all pages. See [filter/export guide](../STATUS_FILTERS_AND_EXPORT.md).

**v1.8.3 correction:** The option is Auto-approve Unresolved town, default On, and uses a blank/Unresolved town state. See [current configuration and audit guide](../AUTO_APPROVE_UNRESOLVED_TOWN.md). Saved choices and historical decisions are preserved.

**v1.8.2:** Auto-approve NOTPROVIDED city is On by default for new batches. System acceptances retain findings and are identified in the UI/export/audit. Off leaves matching records pending. See [configuration and audit guide](../AUTO_APPROVE_NOTPROVIDED_CITY.md).

**v1.8.1:** Postal code lookup now has a persistent On/Off switch, default On. Off prevents postal-based suggestions for a missing town in newly processed batches and disables manual lookup. See [configuration guide](../POSTAL_LOOKUP_CONFIGURATION.md).

**v1.8 update:** See [Column mapping, recoverable processing and reference management](../WORKFLOW_MANAGEMENT_v1.8.md) for the current workflow, worker/backup runbook and staged reference administration. This supplements the baseline guide below.
## Operations user guide, SOP and data dictionary

**Application baseline:** v1.4.0  
**Documentation revision:** 1.1 — 7 November 2026  
**Audience:** Operators, team leads, data stewards and process owners  
**Status:** Initial operating guidance. Proposed ownership and reconciliation practices should be adapted by the process owner; they do not introduce new software approval gates.

## 1. Quick start

1. Start the installed application with npm run dev in its application folder, or use the internally provided service address. For a local installation, open http://localhost:3000 and keep the command window open.
2. Download the input template or use an existing .xlsx file with Name, Address1, Address2 and Address3 headers. Add Bank_Country and Group where available. Keep identifiers such as Key Field as text when leading zeros matter.
3. Select Upload addresses, choose the workbook and wait for Processing overview.
4. Check record counts, source filename, validation results and any data that was dropped because of line priorities. Use Group controls to inspect a subset or change ordering.
5. Open Review exceptions if you want to record decisions. You may accept a proposal as-is, optionally edit it, or reject it. Corrections are not mandatory.
6. Choose Full analysis or Source + Hybrid output under Export format and download the workbook. The Group selection and ordering apply to export.
7. Reconcile the output to the intended source records using Key Field where supplied. Retain the source and evidence according to your team’s approved handling policy.

If this is a new installation, IT’s guide covers Node.js and Windows setup. The app and documentation are downloads; the private download page is not the operational app itself.

## 2. Preparing source workbooks

The primary worksheet may be named anything. If a sheet named Raw Test Data exists, the importer uses that sheet; otherwise it uses the first worksheet. Put the column headers in row 1 and data underneath.

| Column | Input requirement | How it is used |
|---|---|---|
| Name | Header required; missing values become findings | Beneficiary name, normalized and segmented for Hybrid output |
| Address1 | Header required; row values may be blank | Free-form address container, not necessarily a street |
| Address2 | Header required; row values may be blank | Free-form address container, not necessarily a unit/floor |
| Address3 | Header required; row values may be blank | Free-form address container, not necessarily town/postal |
| Bank_Country | Optional header | Bank-country evidence; use valid ISO two-letter codes such as US, CA, GB or DE |
| Group | Optional standard header | Preserved source classification used for filtering and sorting |
| Group Details | Optional extra column | Group description; preserved, not analyzed |
| Key Field | Optional extra column | Your business identifier; preserved, not analyzed |
| Any other named column | Optional extra column | Preserved in output without address interpretation |

The application does not enforce uniqueness of Key Field or consistency between Group and Group Details. Those properties were checked when generating the supplied synthetic dataset, not added as general upload validation rules. If unique keys are important to reconciliation, perform the agreed input check before processing.

Header matching for the standard fields is case-insensitive and ignores surrounding spaces. Original extra-column header text is retained. Duplicate header names, including differences only in case/outer spaces, are rejected to avoid ambiguity. Data beneath a blank header is rejected rather than discarded.

Only Name, Address1, Address2, Address3 and Bank_Country contribute to analysis. Country names or postal-looking values in Group, Group Details, Key Field or Notes do not change the address proposal.

## 3. Input limits and spreadsheet handling

Use .xlsx files, maximum 20 MB and 50,000 source rows. Macro-enabled/legacy formats and workbook external-link packages are unsupported. Name, address and Group cells should contain text/values; formulas in those fields are rejected. Text-formatted postal values preserve leading zeros.

Additional columns retain text, numbers, booleans, dates and number formats. Extra formulas are not executed: cached results are exported when present; an uncached formula is carried as inert text. Cached results may be stale, so use pasted values when the current numerical result matters. Original formula text and hyperlink targets remain in Full analysis source audit metadata; hyperlink display text is carried in Results.

A fully blank row is skipped. A row containing Group or extra data is retained even if the main fields are blank, and may produce missing-name/address findings. Extra columns added only on later records are also included in export.

## 4. Understanding the processing overview

The four system processing statuses describe the calculation, independently of your review decision.

| Processing status | Meaning |
|---|---|
| AUTO_TRANSLATED | Automatic confidence and validation gates passed |
| PROPOSED_REVIEW_REQUIRED | A proposal exists, but one or more system conditions were not satisfied |
| NAME_ONLY | A name is present without address or bank-country information; address validation is not applicable |
| ERROR | An unexpected processing failure occurred; the source and error finding are retained |

A row with empty Address1–Address3 but a populated Bank_Country is not necessarily NAME_ONLY; it can retain a proposal with unresolved town and review findings. Dataset scenario labels are not guaranteed application status predictions.

Country and Town confidence values are heuristic scores. Defaults for automatic processing are Country at least 0.92 and Town at least 0.90, together with the other gates. A high country score alone does not establish that the party address is correct or that automation is allowed.

Bank_Country selects a higher-authority country candidate as requested by the application rules. A bank can be located in a different country from the beneficiary. Explicit address-country disagreement is retained as a conflict and blocks automatic processing. Accepting the result does not eliminate that conflict.

Validation PASS refers to the implemented internal Hybrid slash profile. It does not prove address deliverability, sanctions clearance or acceptance of a complete payment message by a bank.

## 5. Group filtering, sorting and scope

Use Filter by Group to select an exact label, All groups, or (No group). Sort by Group offers original source order, Group A–Z and Group Z–A; the Group table header also toggles sorting. Natural sorting places Group 2 before Group 10. Blank/whitespace-only groups appear in the missing-group option and sort last. Labels are not rewritten in the source data.

The same Group selection and ordering apply to Excel export. Search and other table status/confidence filters apply on screen only. Dashboard summary counts describe the whole batch, not just the current table selection.

**Accept all pending as-is applies to every pending record in the batch, including records outside the current Group or table filter.** The interface states this scope before the batch action. It is not a selected-Group acceptance action. A stale version causes the whole pending selection to fail so no partial decision is committed; reload and reassess.

Group is not a security partition. It does not restrict a user’s access to other groups or batches.

## 6. Reviewing a record and recording a decision

Select a record to inspect original data, Group, extra fields, evaluated Name, parsed components, evidence, alternatives, sanitized source lines, proposed Hybrid lines, validation issues and audits. Name evaluation shows the complete evaluated value, first33 segment, second33 segment and truncated tail. Beneficiary name is editable; Name edits rerun the normalized preview and server rules.

| Action | What happens | What it does not mean |
|---|---|---|
| Accept as-is | Records reviewer, note and time; retains the exact proposal and findings; removes it from pending review | It does not convert failed validation into PASS or verify inferred values |
| Accept edited output | Applies your edits, reruns fixed rules/validation and records acceptance | It does not assert that a newly supplied locality is independently verified |
| Save edits | Saves a revised proposal and leaves the record pending | It does not complete the acceptance decision |
| Reject | Records the decision and keeps the row labeled rejected in Full analysis | It does not delete the source row or prevent its inclusion in export |
| Accept all pending as-is | Accepts the entire explicitly versioned pending selection atomically | It does not operate only on the visible page or current Group |

Reviewer and acceptance/review note are required. The current reviewer text is self-entered, not authenticated identity. Write a note that explains the operational decision, for example “Accept proposed remediation for downstream comparison; unresolved town remains.” Do not describe unverified values as independently verified.

Accepted outputs display Accepted or Accepted with issues. The review state can be ACCEPTED while the processing status remains PROPOSED_REVIEW_REQUIRED or ERROR. This is intentional: the operator decision and the system findings are different facts.

The API retains a legacy verified APPROVE action for compatibility. Current UI acceptance does not require that legacy path or mandatory corrections.

## 7. Hybrid transformation and data-loss awareness

The internal profile allows at most four output lines. Name and one Country/Town line take priority for address-bearing proposals. Name continuations contain only name data.

| Rule | Current internal behavior |
|---|---|
| Name | Retain first 66 normalized Unicode code points; split into two 33-character payloads if needed |
| Logical address lines | Each source logical line is limited to 66; split into 33-character candidate payloads |
| Combining addresses | Combine AL1 and AL2 only when their raw length sum is strictly less than 33, then add one space |
| Postal/subdivision | Candidate 2z holds postal first, then subdivision, maximum 33; subdivision is truncated first |
| Town | Maximum 30 characters; removed suffix audited |
| Country/Town | One 3/<ISO2>/<Town> line; ZZ and NOTPROVIDED can appear as unresolved proposals |
| Optional 2/ priority | 2a, then 2z, then 2c, then 2b, then 2d, after reserving mandatory capacity |

Source data is not overwritten. Locality removal from free-form content is separately audited with before/after information. Candidate loss due to the four-line limit is reported even when no individual field exceeded its source length. A syntactic PASS can coexist with deliberately dropped lower-priority content; inspect Full analysis when content retention matters.

These are internal slash-format requirements. The PMPG document describes broader ISO 20022 fields and different mapping examples; this app does not serialize or certify a complete ISO 20022 message.

## 8. Choosing an export

| Option | Contents | Appropriate use |
|---|---|---|
| Full analysis | Results with source fields, extras, parsed/enriched values, confidence, candidates, Hybrid lines, statuses and findings; Summary; Audit | Investigation, review evidence, reconciliation and governance reporting |
| Source + Hybrid output | One Results sheet with standard source fields, Group, all extras and Hybrid_Line1–Hybrid_Line4 | Concise downstream comparison or file exchange that needs source plus transformed lines |

Source + Hybrid output deliberately omits generated review/validation fields, confidence, Summary and Audit. It uses the stored proposal and does not rerun analysis. It may contain pending, rejected, unresolved or accepted-with-issues records. If those distinctions matter downstream, provide Full analysis or an agreed companion control record; do not assume the concise file proves validation or acceptance.

Both options are available without requiring corrections or acceptance first. Original source columns named like generated fields are preserved; the transformed/computed field receives a Remediation. prefix as needed. Full analysis discloses mappings in Summary, and renamed header cells have explanatory notes.

Full analysis abbreviates very long displayed strings and retains complete source JSON in chunked Audit rows. Concise output retains source strings up to Excel’s 32,767-character cell limit. An over-limit source value requires Full analysis rather than silent truncation in the concise file.

## 9. Proposed SOP: batch intake to handoff

The following control steps are recommended operating practices, not extra mandatory application gates.

1. **Intake:** Identify file owner, intended Group scope and purpose. Preserve an unmodified source copy in the approved location. Confirm whether a unique business key exists.
2. **Precheck:** Confirm required headers, named extras, expected row count and identifier text formatting. Where required by the process, check Key Field uniqueness outside the app.
3. **Process:** Upload, record the batch identifier/source filename and compare the processed count to the intended source population. Investigate structural rejection instead of repeatedly resubmitting unchanged input.
4. **Inspect:** Review system statuses, conflicts, dropped data and representative records. Use Group to organize work. Reference gaps are findings, not reasons to invent a locality.
5. **Decide:** Accept as-is, edit if useful, or reject. For a batch decision, acknowledge that all pending groups are included and provide a reason describing the intended usage.
6. **Export:** Select the correct Group/order and export format. Full analysis is the evidence-bearing option; concise output has no generated decision/validation columns.
7. **Reconcile:** Compare intended source keys/counts against exported keys/counts, investigate duplicates or omissions, and verify source extra columns and transformed lines are present.
8. **Handoff:** Provide file version, scope, export type and any unresolved findings relevant to the recipient. Follow existing payment authorization procedures separately; the app does not release payments.
9. **Retain:** Store inputs, decisions and outputs according to an approved policy. Escalate data retention/deletion requests to the owner; no automated retention workflow is implemented.

## 10. Proposed roles and escalation

| Role to assign | Suggested responsibility |
|---|---|
| Operator | Intake, processing, review notes, export selection and reconciliation |
| Team lead/process owner | Define acceptance purposes, sampling approach, escalation and handoff expectations |
| Data steward | Resolve reference/locality issues and govern Group/key definitions |
| IT support | Installation, availability, database backup/restore and technical defects |
| Risk/compliance owner | Assess usage boundaries and downstream obligations; approve applicable policy outside the app |

These are proposed responsibilities, not enforced application roles. An unresolved town, conflicting banking evidence, unexpected content loss, duplicate business key or downstream rejection should be routed to the relevant owner under the team’s existing policy. The software still permits an explicit acceptance decision without corrections.

For a suspected defect, provide the app version, batch/record ID or Key Field, expected versus actual result, relevant finding and a synthetic reproduction if possible. Avoid distributing complete customer address workbooks through unapproved support channels.

## 11. Dataset and training notes

The supplied test workbooks include 18,000 fictional records, 18 Groups with 1,000 rows each, consistent Group Details, 18,000 unique Key Field values, Bank_Country on every row and 60% intentionally incomplete addresses. It spans 47 country/territory codes but uses a small demonstration locality reference set.

The long-name workbook was processed in full by v1.4 for Name-focused checks: zero processing/Name-check failures, all7,200 labeled Address1 Name cases identified, and1,800 over66 Name tails audited. The prior Group/key dataset had separate import/key checks and72 sampled export roundtrips. Neither exercise certifies global address accuracy or enterprise performance.

Use the test workbook to train Group selection, acceptance with findings, key reconciliation and the difference between export formats. Do not treat synthetic data results as proof of operational address accuracy or real customer coverage.

## 12. Evaluating Name information in Address1

A dedicated Name value remains the anchor. A known multi-token Name fragment in Address1 can be removed as a duplicate. An explicit AND/& joint continuation or Name/Name Continued/NAME2: label can be proposed as additional Name information; new promotions are flagged for review. A Name source line break does not override the fixed character33 split. Names beyond66 are preserved in source and the discarded output tail is audited.

Unmarked different person-looking text, a person-named street, a building name or geographic overlap cannot always be classified safely. It remains visible with review findings where warranted. Review the Name evidence, alternatives and Name interpretation audit; edit Beneficiary name and primary/secondary address if useful, or accept as-is. The second1/ line is reserved for Name continuation, never address overflow.

Source Name length counts the normalized dedicated field; evaluated Name length includes interpreted continuation. Classification confidence is not identity verification. A Name-only proposal recovered from Address1 can remain pending even when address validation is not applicable. New Full analysis fields document the interpretation separately from standard validation.

Existing saved batches display their original results and decisions. Reupload the original workbook to recalculate using v1.4; a notice identifies legacy stored batches.

## 13. Source and output data dictionary

Standard source fields and extra-column behavior are defined in section 2. The generated output field reference follows. Exact headers can receive Remediation. prefixes when an input column already uses the same name. Probability-named fields contain heuristic scores, not calibrated probabilities.

| Generated field | Export format | Meaning |
|---|---|---|
| Parsed_Name | Full analysis | Evaluated, untruncated Name after supported Address1 interpretation or review edits. |
| Name_Source_Length | Full analysis | Length of normalized original dedicated Name field before cross-field interpretation. |
| Name_Evaluated_Length | Full analysis | Length of assembled/current evaluated Name before the66-character output cap. |
| Name_Retained_Length | Full analysis | Evaluated Name length capped at66 for Hybrid output. |
| Name_Record_Count | Full analysis | Number of stored1/ records (normally one or two when Name is present). |
| Name_Confidence | Full analysis | Heuristic placement/classification confidence; not identity verification. |
| Name_Source | Full analysis | SOURCE_NAME, CROSS_FIELD_NAME, human review/edit source or legacy marker. |
| Name_Interpretation_Check | Full analysis | PASS or REVIEW_REQUIRED for current Name classification; NOT_EVALUATED for legacy data. |
| Name_Evidence | Full analysis | JSON Name evidence and interpretation details. |
| Name_Interpretation_Audit | Full analysis | JSON Name actions, source fragments and before/after Name/Address1 values. |
| Name_Review_Issues | Full analysis | JSON list of unresolved Name interpretation findings. |
| Name_Truncation_Audit | Full analysis | JSON audit of evaluated Name content removed after character66. |
| Parsed_Primary_Address | Full analysis | Normalized logical primary address proposed after locality removal. |
| Parsed_Secondary_Address | Full analysis | Normalized logical secondary address; surviving overflow lines may be merged. |
| Parsed_Town | Full analysis | Current structured town candidate before output-length truncation. |
| Parsed_State_Province | Full analysis | Current structured subdivision code/value. |
| Parsed_Postal | Full analysis | Recognized postal text, retaining country-specific zeros/spaces/hyphens. |
| Parsed_Country | Full analysis | Selected structured country candidate; output may use ZZ if unresolved. |
| Parser_Country_Source | Full analysis | Legacy-named field recording the selected country source. |
| Enriched_Town_Candidate | Full analysis | Current town candidate value. |
| Town_Probability | Full analysis | Heuristic town confidence from 0 to 1; not calibrated probability. |
| Town_Source | Full analysis | Evidence/source label for the current town candidate. |
| Town_Promoted | Full analysis | Boolean: town score meets the initial 0.90 threshold; not automatic-resolution proof. |
| Enriched_Country_Candidate | Full analysis | Current country candidate value. |
| Country_Probability | Full analysis | Heuristic country confidence from 0 to 1; not calibrated probability. |
| Country_Source | Full analysis | Evidence/source label for the current country candidate. |
| Country_Authority | Full analysis | BANK_IDENTIFIER, ADDRESS_INFERENCE, HUMAN_REVIEW or UNRESOLVED. |
| Country_Promoted | Full analysis | Boolean: country score meets the initial 0.92 threshold; other gates still apply. |
| Enriched_Subdivision | Full analysis | Current inferred/recognized subdivision value. |
| Enriched_Subdivision_Name | Full analysis | Subdivision display name where available; otherwise value/code. |
| Subdivision_Source | Full analysis | Evidence/source label for subdivision. |
| Enriched_Postal | Full analysis | Current recognized postal candidate value. |
| Postal_Source | Full analysis | Postal source, such as exact reference match, pattern or human edit. |
| Sanitized_Address1 | Full analysis | Normalized surviving content from the corresponding source address container after audited locality removal. |
| Sanitized_Address2 | Full analysis | Normalized surviving content from the corresponding source address container after audited locality removal. |
| Sanitized_Address3 | Full analysis | Normalized surviving content from the corresponding source address container after audited locality removal. |
| Locality_Removal_Audit | Full analysis | JSON entries showing structured locality removal, source field, before/after and reason. |
| Candidate_1a | Full analysis | Prefixed candidate 1a before four-line priority selection; may not appear in final output. |
| Candidate_1b | Full analysis | Prefixed candidate 1b before four-line priority selection; may not appear in final output. |
| Candidate_2a | Full analysis | Prefixed candidate 2a before four-line priority selection; may not appear in final output. |
| Candidate_2z | Full analysis | Prefixed candidate 2z before four-line priority selection; may not appear in final output. |
| Candidate_2c | Full analysis | Prefixed candidate 2c before four-line priority selection; may not appear in final output. |
| Candidate_2b | Full analysis | Prefixed candidate 2b before four-line priority selection; may not appear in final output. |
| Candidate_2d | Full analysis | Prefixed candidate 2d before four-line priority selection; may not appear in final output. |
| Candidate_3a | Full analysis | Prefixed candidate 3a before four-line priority selection; may not appear in final output. |
| Hybrid_Line1 | Both | Stored final transformed Hybrid line 1; blank when fewer output lines exist. |
| Hybrid_Line2 | Both | Stored final transformed Hybrid line 2; blank when fewer output lines exist. |
| Hybrid_Line3 | Both | Stored final transformed Hybrid line 3; blank when fewer output lines exist. |
| Hybrid_Line4 | Both | Stored final transformed Hybrid line 4; blank when fewer output lines exist. |
| Hybrid_Status | Full analysis | System processing status; acceptance does not replace this status. |
| Hybrid_Review_Required | Full analysis | Boolean: reviewState is PENDING; accepted-with-issues rows can be false. |
| Review_State | Full analysis | PENDING, ACCEPTED, APPROVED (legacy), REJECTED or NONE. |
| Output_Accepted | Full analysis | Boolean: reviewState is ACCEPTED. |
| Accepted_With_Issues | Full analysis | Boolean: accepted decision with retained unresolved/system findings. |
| Accepted_By | Full analysis | Reviewer from the latest ACCEPT event; self-entered identity in current release. |
| Accepted_At | Full analysis | Timestamp of the latest ACCEPT event. |
| Acceptance_Reason | Full analysis | Reason/note supplied with the latest ACCEPT event. |
| PMPG_Hybrid_Validation | Full analysis | PASS, FAIL or NOT_APPLICABLE for the implemented internal profile. |
| PMPG_Duplication_Check | Full analysis | PASS or FAIL for structured town/country duplication checks. |
| PMPG_Validation_Issues | Full analysis | JSON list of validation messages and retained conflicts. |
| Evidence_Conflict | Full analysis | JSON list of evidence-conflict messages; not a simple boolean in Results. |
| Hybrid_Data_Dropped | Full analysis | JSON audit of truncation/priority loss with field, value and reason. |
| Hybrid_Truncation_Audit | Full analysis | JSON audit of source-length truncation. |
| Hybrid_Length_Validation | Full analysis | PASS or FAIL for output-length checks. |
| Enrichment_Evidence | Full analysis | JSON country/town/postal/subdivision candidates, evidence and alternatives. |
| Processing_Notes | Full analysis | JSON combination of transformation notes and system review reasons. |
| Review_History | Full analysis | JSON review events; acceptance events include exact output/validation snapshots. |

Audit worksheet rows contain Record_ID, Type, Chunk and JSON_Value. Multiple chunks of one record/type must be concatenated in chunk order to reconstruct the complete JSON. The Results display abbreviation is not the full source; use Audit for long values. The Summary worksheet describes the exported selection, while the on-screen dashboard counts describe the whole batch.

This reference was checked against the v1.4 export field list. Extra source headers are user-defined and therefore are not exhaustively listed; Group Details and Key Field are examples, not additional analyzed components.

## Review progress dashboard — v1.12.3

Open Processing overview for completed-batch totals. Admin can filter all groups and batches. Users see only their exact assigned group, including when it occurs in several datasets. Dashboard filters operate separately from the current batch table. Click a count in the batch breakdown to inspect the corresponding selection.

Ready for export includes human-passed/accepted output (even with retained findings), automatic translations needing no review and name-only results needing no review. Left to review contains records awaiting a decision. Failed/rejected records are separate; Left to fix combines them with Left to review. Total equals Ready for export + Left to review + Failed/rejected. Failed/rejected records can be opened, corrected and passed by Admin or assigned-group Users; original failure reasons remain in the audit history.

Admin can export a batch's ready selection by selecting Ready for export and Matching selected filters in either format. All-record diagnostic exports remain available. Users can review/edit/pass/fail within their assigned group and cannot export. Totals refresh after local changes, every 30 seconds while visible, on returning to the tab, or with Refresh totals. Incomplete processing jobs are excluded. See [definitions and integration review](../DASHBOARD.md).

## Correct failed or rejected records — v1.12.4

Filter for Failed or Rejected (or open the failed count on the dashboard), select a record, correct the Structured proposal while checking the live Hybrid preview, and click Pass at the top. The current user is recorded automatically; there is no Pass reason popup. A new Fail still requires a reason. Prior failure decisions and reasons stay in Review history. Dashboard and export readiness use the latest state. Group Users can recover only records in their assigned group. Changes are saved by Pass/Fail; closing the drawer cancels unsaved edits. See [dashboard and recovery instructions](../DASHBOARD.md).

## Delete a batch — Admin only, v1.12.5

Open a batch and choose Delete batch, or choose Delete batch in Processing jobs after pausing/cancelling active processing. Check the filename and full batch ID, type DELETE and confirm. Current Group/status/search filters do not limit deletion: every record, saved source row and review decision in that batch is removed. Cancel/Escape leaves the batch intact. Other batches, users and groups remain. There is no app undo. Users do not have deletion controls or API permission. See [deletion and recovery details](../BATCH_DELETION.md).

## Dark workspace and disclosures — v1.13.0

The app uses a dark interface with a faint fixed MWTSI backdrop. Batch breakdown, Processing diagnostics, processing/reference tools and detailed record evidence can expand/collapse. Primary filters, the source/Hybrid comparison and top Pass/Fail actions remain available. The Structured proposal editor now sits directly below the comparison. Expand Name evaluation, Evidence & candidates, Address priority or Validation & audit for their detailed findings. Folding a section retains its state; closing a record without Pass/Fail still discards unsaved input. Enter/Space toggles a focused summary. See [the interface guide](../DARK_INTERFACE.md).

## Logo animation — v1.13.1

The workspace logo and faint fixed backdrop share a repeating 16-second quiet interval and four-second spinning-globe transition. Pause/resume beside Change password is remembered in this browser; reduced-motion preferences disable it automatically. Hidden tabs stop cycling. Sign-in and administration remain static. No processing or review behavior changes. See [motion controls](../LOGO_ANIMATION.md).

## ISO country assignment — v1.13.2

Country output uses assigned ISO alpha-2 codes (Hong Kong HK, China CN, Macao MO, Taiwan TW). Bank_Country accepts recognized codes/names/aliases; short numbers in free-form addresses are not country proof. Specific territory names beat shorter embedded parent-country words. Congo/Korea or multiple explicit countries need a specific code and review. Country edits normalize recognized values in both preview and save. Existing saved decisions remain unchanged; reupload a source to apply the new parser. See [ISO country assignment](../ISO_COUNTRY_CODES.md).

## v2.0.0 — concurrent operations

The workspace now retrieves records by page while keeping totals for the whole filtered selection. Opening a pending/failed record reserves it for that review window; another reviewer sees the owner and read-only fields. Reservations renew while open and expire after disconnect. Admin can explicitly release a reservation; Reload and reserve replaces unsaved edits with the current saved record. Pass/Fail still records your current account. Bulk Pass checks the confirmed batch revision and refuses any reserved/stale selection atomically. Export clicks queue a workbook while you continue working; prepared files, progress, criteria, retry/cancel and 24-hour expiry appear in Background exports. Reloading does not lose queued exports. See [v2 guide](../V2_UPGRADE_AND_OPERATIONS.md).

## Selected Hybrid rule candidates — v2.0.1

Record Review labels each output line with its selected rule ID, such as 2a Primary address or 2z Postal/state, and shows the full candidate sequence beside the Hybrid output. Expand Address priority & postal retention for all candidates, their decisions and reasons. Labels update with structured edits and show UNSAVED PREVIEW until saved. See [candidate review guide](../HYBRID_CANDIDATE_REVIEW_v2.0.1.md).

## Batch export coverage — v2.1.0

Use the Group/status/search controls and Export tracking selector to view unique exported and remaining records across all completed workbooks. Repeated/cross-format exports count once; the table shows each record’s completion count. Remaining-only export respects Group and export scope. Older batches explicitly show incomplete earlier history. See [export tracking guide](../EXPORT_TRACKING_v2.1.md).


## v3.1 personal appearance

Use Appearance in the workspace header to preview and save one of six color schemes in Dark or Light mode. Each signed-in Admin or User has an independent server-stored preference, loaded on their next full page load across devices. Cancel discards a preview; Reset to default previews Aurora dark. Status indicators keep their semantic colors. Processing rules, Group authorization and Excel outputs are unchanged. IT: the additive user_appearance table needs no manual migration; existing accounts default to Aurora dark. Apply the signed v3.0.0 to v3.1.0 patch in place. See ../APPEARANCE_v3.1.md for instructions and support details.


## v3.2 address choices and review usability

The release corrects redundant postal/state candidates already retained in primary, bounds long dual record identities independently of decisions, and shows validation for edited previews. Numbered candidate cards and capacity/postal callouts explain output choices. Existing accounts, appearance, source and decisions are preserved; reimport an old source file to analyze it under the corrected generation rule. Apply the signed patch directly from v3.1.0. See ../REGRESSION_UI_v3.2.md for root causes, limits, regression evidence and commands.


## v3.5 batch workflows

Compare completed batches by exact source Key+Group, preview recurring corrections and export approved field changes. Bulk edits stay pending until an explicit Pass. See [the full workflow and limits](../BATCH_WORKFLOWS_v3.5.md).
