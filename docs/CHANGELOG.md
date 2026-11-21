# v3.5.1 — Saved preview cancellation

- Changing correction inputs while a stored preview loads cancels loading, keeps Preview usable and ignores the stale response. No data changes are applied by cancellation.
- Direct final patch from3.4.0 or3.5.0; all v3.5 workflows retained, no additional dependency/startup/schema/rule changes.

# v3.5.0 — Compare batches, preview corrections, export approved changes

- Compare completed batches by exact source Key+Group, independently across BNP/ORP; explicit missing/duplicate keys, processing/context changes, metadata differences, additions/removals and bounded filtered pages.
- Optional prior human Pass reuse with a preview, reproducibility and provenance checks, current-user attribution and the existing missing-line acknowledgement; source and earlier decisions stay intact.
- Stored, account-scoped correction previews with literal/exact operations, before/after output, skipped-record reasons,1,000-selection cap, expiry, atomic stale/reservation guards and idempotent receipts. Edits save pending with unverified evidence.
- Admin Changes-only export reports net approved structured-field corrections with Key, Group, block, versions, reviewer and full chunked values. Successful actual distinct record membership updates existing any-format coverage without duplication.
- Additive workflow schema/local reference revision cache invalidation; newly processed provenance is not retrostamped onto old batches. No dependency/startup/parser/Hybrid-priority change. See BATCH_WORKFLOWS_v3.5.md.

# v3.4.0 — Live ISO postal address XML

- Structured PstlAdr with granular PostalAddress24 fields and no AdrLine; hybrid PstlAdr with town/country, optional postal/state and two 70-character address lines.
- Separate copy-ready XML and local element corrections alongside unchanged 1/2/3 output; pre-slash components preserve postal data beyond slash capacity.
- Explicit required-field, placeholder, invalid-country, XML-character, unmapped-source, overflow and potential-repeat findings; no invented address for Name-only input.
- ISO corrections retain same-analysis sidebar sessions, reset on input/analysis changes, and do not trigger server requests or batch writes; stale/error/HTTP clipboard behavior covered.
- Signed direct v3.3.0 patch; no dependencies, schema, startup, parser/Hybrid rules, permissions or Excel changes. See ISO_POSTAL_LIVE_v3.4.md.

# v3.3.0 — Compare, correct, decide

- Wider source/output comparison with a sticky desktop source panel, exact slash lines and responsive stacked mobile cards.
- Editor directly below the proposal, related-source highlighting, quick focus/return controls and saved/unsaved indicators.
- Human-readable shortened/omitted values, output labels and decision history for Users; no rendered technical candidate IDs, selection panels or raw dumps.
- Admin-only expandable selected-rule explanation, priority/postal table and full technical audit; Live Translate follows role presentation.
- Both BNP/ORP tabs reflect current unsaved draft checks; authenticated joint decisions, warnings, reservations, navigation and Group access retained.
- Signed direct v3.2.0 upgrade; no dependencies, schema, startup, processing or export changes. See RECORD_REVIEW_v3.3.md.

# v3.2.0 — Explainable address choices and review refinement

- Avoid a redundant 2z when the complete literal postal/state payload is already retained in 2a, preserving space for the next candidate without changing priority order.
- Bound long Key/BNP/ORP headings independently of decision controls and preserve usable review content.
- Display edited-preview validation badges/issues instead of saved checks.
- Add numbered candidate cards, reserved/available capacity and semantic postal-outcome callouts across light/dark palettes.
- Add independent priority-boundary, duplicate/partial/punctuation and production rendering regressions.
- Signed direct v3.1.0 upgrade; no dependencies/schema/startup changes or silent saved-result rewrite.

# v3.1.0 — Your workspace, your style

- Six professional palettes, each with Dark and Light mode, available to both roles.
- Immediate preview, explicit save, cancel and reset; native radio keyboard controls and mobile dialog.
- Personal account preferences stored server-side and rendered before hydration, including across devices.
- Shared color tokens for forms, tables, review, dialogs, Live Translate and the animated globe; semantic status colors retained.
- Additive preference storage and authenticated self-service API; no dependency, address-rule, export or Group-permission changes.
- Signed in-place upgrade from v3.0.0. See APPEARANCE_v3.1.md.

# v3.0.0 — independent BNP/ORP blocks and explicit missing-line acceptance

Add dual-profile mapping/template, independent reuse of the existing address engine, per-block results and aggregate record readiness. Keep one record identity, Group, reservation, versioned joint decision and distinct export membership. Review tabs retain both drafts, evidence and original/source comparison. Block findings/validation filters, ORP search and scoped dashboard block totals accompany existing unique record/export counts. Both export formats retain both Hybrid outputs on one source row; full analysis prefixes each block and retains joint audit snapshots. Legacy records, queued jobs and unprefixed BNP output remain compatible.

Before explicit Pass, check final proposed output in all enabled blocks for 1/ and 3/. A warning identifies missing blocks/lines and offers Return to review or Pass anyway; Name-only omission of3/ is explained and still requires acknowledgement. Bulk preview lists affected counts/examples and requires an acknowledgement checkbox. Server-side409/structured warning protection, optimistic versions, row reservations and atomic bulk save prevent silent bypass/partial updates. Acceptance is signed and records the warning without erasing findings; automatic next-record behavior is retained. Add dual workload option to concurrency benchmark. Signed direct patch from 2.3.2, additive derived-index rebuild, no dependency/startup/Hybrid-priority changes.

# v2.3.2 — prevent street numbers and names becoming postal/town evidence

Reproduced the 12345 SAMUEL LINCOLN DRIVE / 01588 example against the installed worldwide reference: postal remained 01588, but a LINCOLN gazetteer alias proposed MANDAN because DRIVE was missing from street recognition. The same omission accepted 12345 as a postal candidate. Expand the shared detector to recognize common missing road types and use it consistently for locality eligibility, postal house-number exclusion and sanitizing. The example now proposes WHITINSVILLE from 01588, retaining the street; Off and missing-postal cases stay unresolved. Shared live, direct-upload and worker behavior; preserve explicit town conflicts, postal-first localities, source, decisions and export history. No dependency/schema/startup or Hybrid priority change. Signed direct patch from 2.3.1; saved batches require explicit reanalysis/correction.

# v2.3.1 — advance after a review decision

- Successful Pass and reason-confirmed Fail automatically open the next record in the same authorized filtered report, across server pages.
- Resolve the successor by stable source/Group sort position even if a decision or correction removes the saved row from the selected status, focus or search filters. No duplicate, skipped immediate successor or wraparound.
- At the end, close review with an explicit tail/empty-report confirmation. Failed saves and cancelled/missing reasons stay on the current record.
- Stop the completed reservation heartbeat, preserve the signed decision and make navigation retries read-only GETs. Reserved neighbors remain visible read-only.
- Signed direct patch from v2.3.0. No dependency, startup-script, address-rule or operational-schema change.

# v2.3.0 — live address entry and copy-ready output

- New Live translate screen and authenticated same-origin POST /api/translate for both Admin and User.
- Debounced automatic interpretation using the existing parser, ISO resolution, current postal toggle and Hybrid rules; shared Record Review line/candidate display.
- Separate copy-ready Name, Address and full Hybrid fields reflecting selected/truncated output, with secure clipboard and HTTP/keyboard fallback.
- Cancel/ignore stale responses, disable stale copy controls, clear/retry support, retained in-page drafts and protection from background batch navigation.
- No batch/review/export writes or processing-rule/dependency/schema/startup changes. Signed in-place update from v2.2.0.

# v2.2.0 — clearer dashboard and record review

- Dedicated role-scoped landing Dashboard with Batch/Group/multi-status filters, readiness, failed/rejected, ready-and-unexported, unique export coverage, batch actions and overlapping findings.
- Scoped count drill-downs retain ANY statuses and add an explicit AND focus. Matching-filter exports preserve that focus; all-status exports clear it.
- Previous/Next report navigation, position/bounds, cross-page order, authorized neighbor reads, awaited reservation release and read-only reserved records.
- Unsaved-edit confirmation for navigation and in-app close/Escape/backdrop; visible keyboard focus and labelled mobile navigation.
- MWTSI wordmark and animated routing globe, browser-local pause/reduced-motion/hidden-tab handling; remove character artwork and fixed backdrop.
- Full engineering UI assessment and operating/update guide. No processing-rule, dependency, startup-script or operational-schema change. Signed direct patch from v2.1.0.

# v1.10.0 — Pass/Fail pop-ups and review header

Replace bottom review controls with top Pass/Fail buttons. Pass requires initials only; Fail requires initials and a reason. Show Key and Name in the heading and place review reasons directly below. Save explicit versioned PASSED/FAILED decisions, current proposal snapshots and audit initials; add decision export fields and Passed/Failed status filters. Align batch pass with the initials-only flow and retain historical actions/API compatibility. See [review guide](PASS_FAIL_REVIEW.md).

# v1.9.1 — remove automatic town approval; compare source and output side by side

Remove the Unresolved-town approval switch, settings API option and processing action, including old captured On policies for remaining job rows. Preserve historical decisions/audits and expose their read-only classification. Move Original source beside the live Proposed Hybrid output at the top of a wider review drawer, stacking on narrow screens. Preserve manual acceptance, postal lookup and selected-status exports. See [review/update guide](RECORD_REVIEW_COMPARISON.md).

# v1.9.0 — multi-select statuses and filtered export

Replace the single status filter with independent multi-select processing, decision and finding choices, using ANY matching and record-ID uniqueness. Share selection logic between UI and export API. Add an explicit scope for all records in the selected Group or matching status/search filters across all pages, for both workbook formats. Show unique counts and zero-match guidance; retain selections across workspace views and expose the Pending review selection. See [filter/export guide](STATUS_FILTERS_AND_EXPORT.md).

# v1.8.3 — correct automatic approval to Unresolved town

Use the structured town's Unresolved state (blank or explicit Unresolved) for new automatic approvals. Update the toggle, export field, audit origin and documentation. Preserve saved On/Off choices and captured historical policies/decisions. Keep Hybrid placeholder formatting intact. See [corrected rule guide](AUTO_APPROVE_UNRESOLVED_TOWN.md).

# v1.8.2 — automatic acceptance for NOTPROVIDED city

Add an independent persistent toggle, On by default, to accept output with city exactly NOTPROVIDED. Preserve findings/confidence and identify system decisions in the UI, summary, export and atomic audit events. Capture the policy per batch for consistent resumed processing; retain prior manual behavior for legacy jobs. Off leaves new matching records pending. See [rule guide](AUTO_APPROVE_NOTPROVIDED_CITY.md).

# v1.8.1 — configurable postal lookup

Add a persistent Postal code lookup switch, On by default. Off blocks both automatic postal-derived town proposals and manual lookup API/UI candidates. Capture the value per batch for consistent checkpoint/recovery behavior, and export it in Full analysis. Existing saved results remain intact. See [configuration guide](POSTAL_LOOKUP_CONFIGURATION.md).

# v1.8.0 — mapping, durable jobs and reference administration

Add worksheet previews, explicit main-field/Group mapping and an optional reconciliation key while retaining every original column. Introduce resumable checkpointed background jobs, pause/resume/cancel, worker health/supervision, idempotent submission and completion checks. Pin each job to its reference snapshot and block incomplete exports. Add source coverage/freshness, online/offline candidate staging, integrity validation, controlled activation/rollback and administrator/reason audit, with optional mutation token. Preserve existing batches/reviews through additive tables. Full analysis adds record/source keys, worksheet row and mapping audit. See [workflow guide](WORKFLOW_MANAGEMENT_v1.8.md).

# v1.7.0 — expanded, versioned reference data

Install a separately stored, indexed GeoNames postal/locality snapshot with full-code Canadian, British and Dutch sources, cities500 gazetteer, source checksums, attribution and coverage catalog. Add automatic first-start/offline installation, atomic refresh, read-only runtime access and per-record snapshot evidence. Keep area-only and postal-delivery names out of inappropriate full-code/city inference, preserve longer names and supplied Name duplicates, and disambiguate same-name cities using postal evidence. See [expanded reference guide](EXPANDED_REFERENCE_DATA.md).

# v1.6.0 — postal code to probable town/city

Add local, country-scoped lookup of recognized postal references for missing cities, with conservative confidence and mandatory review. Add manual lookup in the review drawer, exact and US base-ZIP match evidence, ambiguity handling and additive major-city sample reference expansion. Preserve explicit city conflicts, original source, fixed Hybrid priorities and acceptance behavior. See [POSTAL_TOWN_LOOKUP.md](POSTAL_TOWN_LOOKUP.md).

# v1.5.2 — dependency security maintenance

Resolve all five reported npm audit findings through Vitest 4.1.12 and tested, scoped ExcelJS dependency overrides. Full and production audits report zero vulnerabilities. Remove six deprecated dependency chains; retain the documented prebuild-install helper warning to preserve the SQLite 12 installation path. Add Excel/CSV/archive compatibility coverage and load ExcelJS as a Node server external package. See [SECURITY_DEPENDENCY_FIX.md](SECURITY_DEPENDENCY_FIX.md).

# v1.5.1 — cross-platform upload correction

Fix the same-origin guard using validated HTTP Host rather than Next.js internal URL authority. Reproduced localhost success / 127.0.0.1 failure before the fix; both now succeed. Preserve byte-based Excel import with no MIME gate or client-path reads. Add staged UI/server errors, safe diagnostics and platform-metadata/browser regression tests. See [WINDOWS_UPLOAD_FIX.md](WINDOWS_UPLOAD_FIX.md) for evidence and pending native browser matrix.

# v1.5.0 — priority enforcement and postal trace

Independent priority/loss validation, candidate decision explanations in review and full export, house-number postal filtering, standalone postal/state sanitation, and review-added name-only address handling. The documented 2a > 2z > 2c > 2b > 2d policy is unchanged.

# v1.4.0 — Evaluate Name and Address1 before Hybrid transformation

- Add evidence/audit-based Name interpretation before locality/address parsing.
- Remove known duplicate Name fragments from Address1; propose explicit joint/labeled continuations.
- Preserve and flag ambiguous name/street/building/locality overlaps rather than silently guessing.
- Apply existing 33/66 limits and Name-first priorities to the evaluated Name; audit lost tails.
- Show evaluated Name, both 1/ records, classification evidence and truncation in review.
- Permit Name edits through the live preview and versioned review API.
- Add Name-specific Full analysis fields; keep concise source-plus-Hybrid export unchanged.
- Keep accept-as-is and whole-batch acceptance available without corrections.
- Provide full Name corpus regression and a before/after comparison workbook.
- Keep historical batches/decisions unchanged; reupload to apply new interpretation.

# v1.3.0 — Export options

- Add Full analysis and Source + Hybrid output selectors on results, review and export pages.
- Keep Full analysis as the default with Results, Summary and Audit worksheets.
- Offer a concise, single-sheet source/Group/extra-column export plus the four stored Hybrid lines.
- Honor Group filtering/sorting in both formats and preserve typed source data and header-collision handling.
- Keep unresolved and unaccepted proposals exportable; no required corrections.
- Expose mode=full and mode=source-hybrid through the existing export endpoint.

# v1.2.0 — Additional source columns and Group

- Preserve extra input columns in Results and source audit, including typed values and number formats.
- Analyze only Name, Address1, Address2, Address3 and Bank_Country using an explicit projection.
- Add Group as an immutable standard source field with exact filtering and natural ascending/descending sorting.
- Export the selected Group in the selected order; retain whole-batch acceptance behavior with explicit UI wording.
- Keep source values on header collisions by namespacing computed field headers; report mappings in Summary.
- Treat extra formulas as cached values or inert text; preserve original formula/hyperlink metadata in audit.
- Update input template, demonstration Groups and sample workbooks.
- Existing files and saved databases remain supported without migration. Reupload files if an earlier app version discarded their extra columns.

# v1.1.0 — Acceptance without required corrections

- Accept individual proposed output as-is, or optionally edit and accept.
- Accept every pending output in a batch with one reviewer note.
- Acceptance clears pending review, while retaining validation failures, fallbacks, conflicts, confidence, source data and processing status.
- Record the accepted lines and validation snapshot with reviewer, reason and timestamp.
- Show Accepted and Accepted with issues in results; include acceptance metadata and counts in Excel.
- Keep stale batch decisions atomic: no partial update when a selected record changed.
- Retain legacy verified approvals for backward compatibility.

## Update an existing local installation

Stop the app with Ctrl+C. Back up your existing data folder. Copy the updated source files into your application folder while keeping the existing data folder (and any configured external SQLite database). Run npm install, then npm run dev. The source ZIP excludes operational databases; no schema migration is needed.
