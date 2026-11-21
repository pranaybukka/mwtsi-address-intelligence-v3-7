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
## Executive briefing, readiness roadmap and pilot scorecard

**Application baseline:** v1.4.0  
**Documentation revision:** 1.1 — 7 November 2026  
**Audience:** Executive Leadership Team and business sponsors  
**Status:** Initial decision-support material. Ownership, policy, targets, funding and dates below are proposals for discussion, not approved commitments.

## 1. Executive briefing

MWTSI Address Intelligence provides a local workflow for converting inconsistent beneficiary address text into proposed Hybrid address output. It keeps original source data, shows evidence and confidence, applies fixed transformation priorities, supports human acceptance without mandatory corrections, and exports either detailed analysis or a concise source-plus-Hybrid file.

The business opportunity is to reduce repeated spreadsheet manipulation, make transformations consistent and make decisions easier to explain. Those benefits are hypotheses to measure in a pilot. No validated operational savings, return on investment, production accuracy or risk-reduction figure is available yet.

The application is a working local implementation, not an enterprise-approved payment platform. The current release has automated engine/workflow verification and reproducible synthetic data. It still needs governed reference data, independent operational evaluation and enterprise deployment controls before broader reliance.

## 2. What is available now

| Capability | Current scope |
|---|---|
| Excel intake | Required source headers, up to 20 MB/50,000 rows; no assumption that Address1–3 have fixed street/city roles |
| Global architecture | Country aliases, postal formats, subdivisions and replaceable reference repository; limited seed locality coverage |
| Explainable proposals | Candidate values, heuristic confidence, evidence sources, alternatives and conflicts |
| Name interpretation | Known Name duplicates and explicit Address1 continuations considered before fixed rules; ambiguous content retained for review |
| Fixed Hybrid output | Independent deterministic engine, four-line profile, priority selection and loss/truncation audits |
| Operational decisions | Accept as-is, optional edits, rejection and whole-pending-batch acceptance |
| Source context | Group filtering/sorting, Group Details, Key Field and arbitrary extra columns preserved without address analysis |
| Export choices | Full analysis with evidence/history or one-sheet Source + Hybrid output |
| Test data | New 18,000-record synthetic set with 18 groups, unique keys, bank-country data and incomplete addresses |

The supplied country seed includes 249 ISO country entries but only 76 demonstration places. A globally extensible design is not the same as comprehensive global reference coverage or validated accuracy in every market.

## 3. Acceptance, validation and payment decisions

Acceptance records that an operator chooses to use or retain the proposed output. It does not change a failed check into PASS, increase confidence or independently verify the beneficiary’s location. A record can be accepted with unresolved town/country, conflicting evidence or a processing error, while those findings remain recorded.

This flexibility is an explicit business requirement. The process owner should define which purposes permit accepted-with-issues output, how the decision is documented and what downstream recipients need to know. The software does not require address corrections or a separate manager approval before acceptance/export.

Full analysis exposes the findings and review history. Source + Hybrid output intentionally omits generated validation and decision fields, so its presence does not prove a record was accepted or compliant. Downstream usage must be agreed separately.

PMPG/internal-profile PASS is not certification of a complete ISO 20022 message, postal deliverability, sanctions clearance or payment release authorization. Bank_Country may differ from the beneficiary’s country; selecting a bank-country candidate is not independent proof of party location.

## 4. Evidence and material limits

| Evidence | What it supports | What it does not establish |
|---|---|---|
| 95 automated tests passed; TypeScript/build passed | Documented engine boundaries, workflows, source preservation and export behavior in the tested environment | Complete defect absence, browser compatibility or enterprise security |
| Supplied 200-row workbook, 45% non-US | Regression coverage against known examples and documented rules | Representative operational accuracy; all expectations matching exactly |
| Workbook results: 199 profile PASS, one NAME_ONLY; all duplicate/length checks PASS | Internal structural/semantic checks on that input | Deliverability, bank acceptance or live payment outcomes |
| Zero unexplained regression failures; 119 classified interpretation/policy differences | Differences are disclosed rather than hidden | Exact reproduction of every interpretation worksheet field |
| Earlier pre-v1.4 engine run: 10,000 rows in 8.77 seconds | Initial indication for a repeated-locality engine workload | Excel/HTTP performance, concurrent users or full-gazetteer scale |
| Complete18,000-row Name corpus:7,200 placement cases identified; zero Name-focused failures | Evaluated Name segmentation, truncation audit, Name priority reservation and labeled Address1 cases | Independent global address accuracy or universal name recognition |

Browser/visual tests and Windows installation were not run in this session. Confidence scores are heuristic and require calibration on independent operational data. The current user/reviewer identity is not authenticated enterprise SSO.

## 5. Proposed risk register

Ratings below are proposed discussion priorities, not the results of a formal enterprise risk assessment.

| Risk and proposed priority | Current exposure | Proposed owner and response |
|---|---|---|
| Reference coverage — High | Unknown places or ambiguous matches can require review; seed is small | Data steward: acquire, license and validate priority-market reference data |
| Unverified confidence — High | Scores are explainable heuristics, not calibrated error probabilities | Model/process owner: compare to independently labeled operational samples |
| Accepted exceptions — High | Acceptance can close review while system findings remain | Operations/risk owner: define permitted uses and track accepted-with-issues separately |
| Access and identity — High | Local single-user app, typed reviewer name, no role enforcement | IT/security: design SSO, authorization, batch access and authenticated audit identity |
| Concise-file misuse — High | Source + Hybrid output omits review/validation fields | Business owner: agree downstream acceptance criteria and evidence handoff |
| Banking-country mismatch — High | Bank location can differ from beneficiary location | Data/risk owner: review authority policy and unresolved/conflict treatment |
| Information loss — Medium/High | Four-line priorities may drop lower-priority content | Operations/integration owner: monitor dropped/truncated data and validate receiving-system needs |
| Availability and recovery — Medium | Local SQLite and operational support arrangements | IT: durable storage, monitored service, backups, restore/rollback exercises |
| Scale and portability — Medium | Synchronous processing, complete-batch UI payloads, native dependency | IT: verify Windows/browser behavior and realistic file/load/concurrency scenarios |

There is no implemented Group-based access restriction, automated retention/deletion policy, encryption/key-management system, payment control or sanctions engine. Existing organizational controls should not be assumed to be present inside this app.

## 6. Proposed rollout roadmap

No dates, budgets or implementation commitments are assigned in this document. Move between phases based on evidence and accountable owner decisions.

| Phase | Proposed work | Suggested exit evidence |
|---|---|---|
| 1. Scope and ownership | Select business purpose, countries, data classifications, sponsors and support owners | Written use-case boundaries and named owners |
| 2. Controlled evaluation | Run synthetic scenarios and a permissioned, independently labeled operational sample | Reconciled keys/counts, defect log, correctness results and observed reviewer effort |
| 3. Data and policy | Govern reference sources; calibrate thresholds; define acceptance and downstream use policy | Approved reference provenance and documented decision policy, including accepted exceptions |
| 4. Enterprise hardening | Add identity/access, retention, secure hosting, logging controls and recovery; verify browser/Windows/load behavior | Security, support, restore and UAT evidence for the intended operating model |
| 5. Limited production pilot | Restrict scope, monitor outcomes, review exceptions and downstream rejections | Stable metrics and documented business/risk decision on expansion |
| 6. Scale decision | Assess queueing, pagination, database migration and broader markets | Capacity evidence and a funded support/data roadmap |

The current software remains available for local evaluation. This roadmap describes a proposed enterprise transition, not additional gates that block acceptance inside the app.

## 7. Proposed pilot scorecard

Establish baseline, denominator, sampling method and target before using the scorecard for a rollout decision. No targets are invented here. Use Full analysis and controlled external reconciliation; the app does not calculate every measure below automatically.

| Measure | Suggested definition and evidence |
|---|---|
| Throughput | Time from upload start to export availability for a stated row count, file size and environment |
| Automatic processing rate | AUTO_TRANSLATED rows divided by address-bearing source rows; report NAME_ONLY and ERROR separately |
| Independently verified correctness | Country/town correctness on a labeled sample, stratified by country, input scenario and automation status |
| Pending review rate | Pending review-state rows divided by total selected rows at a stated point in time |
| Accepted-with-issues rate | ACCEPTED rows retaining system findings divided by all accepted rows; also report as a share of total rows |
| Reviewer effort | Observed active review minutes per 100 records and per exception; measure externally |
| Evidence conflicts | Rows with banking/address or other evidence conflicts, by Group and market |
| Data loss | Rows with priority-dropped or truncated content, with root causes and downstream impact |
| Source preservation | Reconciled business keys, original values and extra-column retention in each export option |
| Downstream rework | Receiving-system rejection/repair rate linked to Key Field; payment outcomes are not produced by this app |
| Reliability | Processing errors, incidents, restore results and stale-decision conflicts in the intended environment |

Do not count accepted-with-issues rows as validation passes or automatic translations. Keep raw system status, review decision and independently verified correctness as separate dimensions. Group can support operational reporting but is not a security or authorization measure.

## 8. Business case and decisions requested

A business case can compare observed baseline handling time and rework with pilot results. Calculate net benefit only after including reviewer effort, reference-data acquisition/maintenance, hosting/support, security hardening, training and integration costs. A free external enrichment API is not required, but reference and operating costs still need assessment.

Suggested leadership decisions are: appoint the business and technical owners; approve a controlled evaluation scope and data boundary; identify the owner of acceptance policy and downstream obligations; authorize measurement of an independent sample; and determine what production-readiness evidence is required. Funding, schedule and rollout decisions should follow that evidence rather than the synthetic demonstration alone.

For implementation detail, use the IT guide. For operator instructions, acceptance scope and the field dictionary, use the Operations guide. This briefing summarizes current evidence and proposed next steps; it is not a compliance opinion or production approval.

## 9. Name-handling improvement and remaining boundary

The long-name dataset exposed a pre-transformation gap: the fixed Name limits worked on the Name field, while misplaced Name information in Address1 was treated as address content. v1.4 adds evidence/audit-based interpretation before those same fixed priorities. In the Name corpus,6,480 known duplicate cases and720 new continuation cases were identified.15,078 rows produced two Name records after interpretation;1,800 over66 Names had truncation audited.

New continuations and ambiguous content retain review findings; acceptance remains an operational decision. This is a targeted improvement supported by synthetic cases, not a claim that every global personal, organizational, street or building name can be automatically distinguished. Previously stored decisions are not recalculated without a new upload.

## Review progress reporting — v1.12.3

The dashboard now reports completed workload across batches: total records, passed decisions, failed/rejected decisions, ready for export and work remaining. Admin can filter by dataset and group; reviewer totals are restricted to assigned data. Ready output includes accepted exceptions and automatic/name-only results that require no review, so it is an operational disposition rather than certification of address quality. Readiness and original validation findings remain distinct. Counts reconcile without double-counting, and batch links lead to the underlying records. See [the definitions](../DASHBOARD.md).

## Controlled batch removal — v1.12.5

Admin can remove an entire imported batch after an explicit confirmation, with an accountability entry recording the deletion. Review-only Users cannot delete. Batch totals and readiness exclude removed records, while other datasets, accounts and groups remain. Deletion removes the batch's review history and processing checkpoints and requires backup recovery if a later restoration is needed. This is a batch-management capability, not an automatic retention schedule.

## Modern dark workspace — v1.13.0

The refreshed UI emphasizes review progress and the next operational action, with dark surfaces, a fixed translucent MWTSI identity and collapsible diagnostics. The editor now sits immediately below the original/Hybrid comparison; evidence and audit details remain available on demand. This improves scanning and navigation while retaining existing Group access, decision accountability and processing policies. Existing installations receive an in-place signed patch.

## v2.0.0 — concurrent operations

v2 improves team operations through server-side record pages, reviewer reservations and background exports. People can continue reviewing while files are prepared, and reservations reduce duplicated review effort while retaining the existing audit and access controls. The release includes measured concurrency results under a defined 18,000-record synthetic workload. Those results support rollout planning; they do not certify sustained production capacity or replace a realistic pilot. Existing installations receive an in-place signed patch. See [release/operations](../V2_UPGRADE_AND_OPERATIONS.md) and [capacity evidence](../CONCURRENCY_BENCHMARK.md).

## Export coverage without double counting — v2.1.0

Batch coverage now distinguishes unique records included in completed exports from records with no tracked export. Group/status filters support operational reconciliation, without inflating totals when teams export overlapping selections. Older untracked history is disclosed. Completion means a workbook was generated, not independently verified receipt or deliverability. See [coverage definitions](../EXPORT_TRACKING_v2.1.md).


## v3.1 personal appearance

Use Appearance in the workspace header to preview and save one of six color schemes in Dark or Light mode. Each signed-in Admin or User has an independent server-stored preference, loaded on their next full page load across devices. Cancel discards a preview; Reset to default previews Aurora dark. Status indicators keep their semantic colors. Processing rules, Group authorization and Excel outputs are unchanged. IT: the additive user_appearance table needs no manual migration; existing accounts default to Aurora dark. Apply the signed v3.0.0 to v3.1.0 patch in place. See ../APPEARANCE_v3.1.md for instructions and support details.


## v3.2 address choices and review usability

The release corrects redundant postal/state candidates already retained in primary, bounds long dual record identities independently of decisions, and shows validation for edited previews. Numbered candidate cards and capacity/postal callouts explain output choices. Existing accounts, appearance, source and decisions are preserved; reimport an old source file to analyze it under the corrected generation rule. Apply the signed patch directly from v3.1.0. See ../REGRESSION_UI_v3.2.md for root causes, limits, regression evidence and commands.


## v3.5 review efficiency

Batch comparison targets repeat work; bulk previews keep corrections reviewable; changes-only export delivers an approved correction feed. Source/history and distinct export coverage remain auditable. See [scope and outcomes](../BATCH_WORKFLOWS_v3.5.md).
