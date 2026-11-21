# MWTSI Address Intelligence · Global Hybrid Address Remediation

A working local Next.js/React TypeScript application for Excel address remediation, explainable enrichment, deterministic slash Hybrid transformation, exception review and audited Excel export.

## Existing installation: use patches

The latest **v3.5.1** patch directly upgrades **v3.4.0 or v3.5.0**. It adds exact Key+Group batch comparison, optional audited decision reuse, previewed bulk corrections saved pending review, and Admin changes-only export with accurate distinct export coverage. See [workflows, limits and exact patch commands](docs/BATCH_WORKFLOWS_v3.5.1.md). Earlier versions first reach v3.4.0 using retained patches. The existing Live Translate structured/hybrid PstlAdr workflow remains available.

For a new installation from the download page, use the retained v3.4 full source, install its dependencies, then apply the v3.5.1 patch. Existing installations use only the patch.

The v2.0.0 patch bundle directly supports v1.13.0, v1.13.1 and v1.13.2. Earlier supported installations (v1.10.0 through v1.12.5) first apply the retained universal v1.13.2 patch, then v2. Stop the host app and worker, check/apply the extracted installer against the existing folder and restart. Records, accounts, Group assignments and review history are preserved. Dependencies are reused when unchanged. See [the v2 upgrade and operations guide](docs/V2_UPGRADE_AND_OPERATIONS.md) and [patching/recovery](docs/PATCHING.md). The retained full source ZIP plus current patches is for new installations.


## Run

Requires Node.js 24 LTS and npm.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. On the first start for an existing or new database, sign in as **admin** with the temporary password **123456**. You must change it before opening data. Then use **Users and groups** to create accounts, assign roles/groups, create groups or import a Group list from CSV/XLSX. Read [credentials, roles and groups](docs/AUTH_ROLES_AND_GROUPS.md). Admins can upload/export and administer the workspace; Users can review/edit/pass/fail only their assigned Group.

Live translate provides real-time one-off entry and copy-ready output. The landing Dashboard summarizes review readiness and unique export coverage within your authorized data. Use Batch workspace or Review records to inspect a selected batch, or Upload addresses to start a new one.

Upload a standard template or map a selected worksheet to Name and Address1 plus optional Address2, Address3, Bank_Country and Group. Choose a reconciliation key and retain all original columns. The supervisor runs both the web server and durable worker; keep it running while processing. First startup installs the configured public reference; data remains local by default.

## Verify

```bash
npm test
npm run typecheck
npm run build
REGRESSION_WORKBOOK=/path/to/supplied.xlsx npm test
npm run regression -- /path/to/supplied.xlsx work/regression
npm run samples
```

For browser tests: stop other local app processes, run `npx playwright install chromium`, then `npm run test:e2e`. The default test server uses port 3101 and a separate `work/browser-tests.db`; browser fixtures create test accounts/data and change the test Admin password. An explicit BASE_URL must point to a dedicated test server/database. See docs/TEST_STRATEGY.md for the managed-session browser verification limit.

## Workflow

1. Upload XLSX, maximum20MB/50,000 rows. Choose a worksheet/column mapping if needed, then follow saved job progress. Pause/resume and browser reload preserve committed checkpoints. Headers are required; analyzed cells should contain text/values.
2. Inspect automatic/review/name-only/error counts, validation and heuristic confidence. Filter results and inspect any row.
3. Inspect originals, evidence, alternatives, live Hybrid output and audits. Use the top Pass/Fail buttons: Pass immediately records the signed-in account, without a popup. Fail opens a reason-only popup and records the signed-in account when confirmed. Both save the current proposal, with corrections optional, then automatically open the next record in the current filtered report. At the end of that report, review closes with a confirmation. Pass all pending retains a confirmation showing the account and affected count, with no initials entry. Findings, confidence and source audit remain intact; no reupload is needed.
4. Export Results, Summary and lossless Audit worksheets. Unresolved/rejected proposals are included and labeled; export is not a payment-release instruction.

## Structure

- src/lib/hybrid: pure fixed rules, priorities, truncation and separate validation.
- src/lib/parser + enrichment: global reference-assisted intelligence and evidence.
- src/lib/reference: replaceable repository abstraction, indexed SQLite adapter.
- src/db: schema, seed and persistent batch/review repositories.
- src/lib/excel: validated import, OOXML compatibility and export.
- src/app: Next.js pages and local APIs; src/components: operational workflow.
- scripts: seed, streaming GeoNames import, workbook regression, samples, benchmark.
- tests and e2e: automated verification.

## Scope and limitations

Implements the requested internal four-line slash profile; PMPG checks do not certify a full ISO20022 payment message. Source differences are explicit in docs/OPEN_QUESTIONS.md. Confidence is heuristic. The expanded GeoNames snapshot provides an open reference baseline with country-dependent coverage; it does not establish worldwide completeness or deliverability. Unknowns route to review. Local credentials authenticate the account; review events store that account separately from self-entered decision initials. Enterprise SSO/MFA is not included. See docs/DEPLOYMENT.md before operational exposure.

Uploaded source files are not part of the application archive or source control. No paid API, external provider, public deployment or message sending is enabled.

## Documentation

Architecture, requirements summary, implementation plan, open questions, Hybrid rules, enrichment, reference data, tests and deployment are under docs/. Samples can be recreated with `npm run samples`. Verification results from this delivery are in docs/VERIFICATION.md.

## Additional columns and Group (v1.2)

Only Name, Address1, Address2, Address3 and Bank_Country are analyzed. Group is a standard optional per-record source column, kept unchanged and used for exact filtering and natural A–Z/Z–A sorting. Other columns such as reference IDs, cost centers, amounts and notes pass through to Excel Results and the source audit; they cannot influence parsing, confidence, country, validation or processing status.

Use Filter by Group and Sort by Group on summary, review and export pages; clicking the Group column header also toggles sort. Missing Group values appear as (No group); older workbooks and saved batches remain supported. Excel export uses the selected Group and sort, including on the export page. For Admins, dashboard metrics and Pass all pending refer to the whole batch. For Users they refer only to the records in their assigned Group. Export scope can include all records in the selected Group or the unique records matching selected statuses and search across all pages.

Extra columns retain their original headers and text/number/boolean/date values and number formats. A computed field that collides with a source header gains a Remediation. prefix, recorded in Summary; input data is never overwritten by computed data. Main and Group header names are recognized case-insensitively with surrounding spaces ignored; extra header text is retained. Duplicate headers or data under an unnamed column require a header correction so values cannot be silently lost.

Additional-column formulas are never executed: export their cached values when present, otherwise the formula as inert text, and retain original formula text in the source audit. Hyperlinks carry their display text; the original URL is retained in source audit metadata. Formula cells remain unsupported in analyzed address fields and Group. No schema migration is required; keep the existing data folder when updating. Newly uploaded files are required to capture extra columns that older app versions did not retain.

## Export options (v1.3)

Choose Export format on the results, review or export page:

- **Full analysis** (default): Results with source fields, extra columns, parsed/enriched components, evidence, validation, decisions and Hybrid lines, plus Summary and Audit worksheets.
- **Source + Hybrid output**: one Results worksheet containing only the standard source fields, Group, every additional source column and Hybrid_Line1 through Hybrid_Line4. No generated analysis/status/confidence columns, Summary or Audit worksheets are included. It uses the stored transformed output; it does not rerun processing or require fixes/acceptance.

Both formats follow the selected Group filter and sort order and retain source values and types. Source headers that already use a Hybrid_Line name stay unchanged; the transformed field gains a Remediation. prefix and a header note explaining the collision. Full analysis remains the place for validation and acceptance details. Extra formulas remain inert/cached values in either mode; their full original metadata is retained in the database and Full analysis audit.

The export API accepts mode=full or mode=source-hybrid (omitting mode preserves Full analysis). The concise filename is hybrid-address-source-hybrid.xlsx. Compact export retains source text up to Excel's 32,767-character cell limit; values exceeding that limit require Full analysis, which retains complete source data in chunked Audit rows.

## Name interpretation (v1.4)

Name is now evaluated with Address1 before address parsing. Exact multi-token Name duplicates/known fragments can be removed from Address1 with an audit. Explicit AND/& joint continuations and labeled Name/Name Continued/NAME2 text can be proposed as Name information; new cross-field values require review. Numbered street tails and delimiter-separated address content are retained. Unmarked, locality-overlapping or building/street-ambiguous text remains in place with review findings where warranted. This is evidence-based classification, not a universal personal-name recognizer. Extra columns such as Name2 remain pass-through metadata; NAME2: inside Address1 is an explicit source label.

The deterministic engine still keeps the first66 evaluated Name code points, splits at33 into 1a/1b, audits the remainder, and reserves both Name lines ahead of optional address lines and the single mandatory country/town line. The second 1/ contains Name continuation only. Review now exposes evaluated Name, both segments, confidence/evidence, source interpretation audit and truncation tail; Beneficiary name is editable and reruns the same rules. Full analysis adds Name-specific fields; concise output remains source plus four Hybrid lines. Acceptance without corrections is unchanged.

Existing stored batches are not automatically recalculated, so existing decisions stay intact. Reupload original workbooks to apply new Name interpretation; legacy records show a notice. For the full Name-case regression:

```bash
NAME_REGRESSION_WORKBOOK=/path/long-names.xlsx npm test
npm run regression:names -- /path/long-names.xlsx work/name-regression
```

The runner checks Name segmentation, truncation, line capacity and labeled Address1 placement cases through actual processing, and writes a comparison workbook. Synthetic scenario metadata is used only by the test runner, never by the application parser.

See [v1.5 priority and postal review](docs/PRIORITY_REVIEW_v1.5.md) for selection enforcement and export fields.

## Upload troubleshooting (v1.5.1)

The confirmed “Cross-origin request rejected” defect is fixed for browser URLs whose HTTP Host differs from Next.js’s internal hostname. See [Windows upload investigation](docs/WINDOWS_UPLOAD_FIX.md) for the root cause, failure codes and test coverage. Uploads read selected File bytes in memory; no client filesystem paths are opened and MIME differences do not reject valid .xlsx files.

## Dependency maintenance (v1.5.2)

Use Node.js 24 LTS and the shipped lockfile. Run `npm ci`, then `npm run security:audit`. The verified full dependency tree reports zero vulnerabilities. One upstream `prebuild-install` deprecation warning remains in SQLite’s installation helper; see [dependency security maintenance](docs/SECURITY_DEPENDENCY_FIX.md) for the exact changes and verification. Do not copy node_modules between operating systems. Back up and retain your data folder when updating.

## Postal code lookup (v1.6.0)

Missing cities can now be proposed from postal code + country using the local reference. Open a record and click **Look up probable town** to review suggestions and apply a town to the preview. All automatic postal-derived towns require review; unknown/ambiguous matches are not treated as confirmed locations. Bundled coverage: 253 code relationships across 102 towns in 44 countries/territories; a starter reference, not worldwide postal coverage. See [postal lookup guide](docs/POSTAL_TOWN_LOOKUP.md).

## Expanded reference (v1.7)

The app now installs an indexed GeoNames reference on first start (about 60 MB download, about 1 GB database; allow several minutes and at least 4 GB free disk). Use Node.js 24 LTS, run `npm ci`, then `npm run reference:install` and `npm run dev`. Offline source packs and `--offline` installation are supported. Verified snapshot: 5,011,160 reference relationships across 123 countries/territories, of which 4,812,170 are lookup-eligible across 116 countries, with separate full-code CA/GB/NL sources. Partial-code limitations and attribution are documented in [expanded reference guide](docs/EXPANDED_REFERENCE_DATA.md). Source data are CC BY 4.0 with the upstream UK Royal Mail notice; lookup is not postal-operator certification. User-supplied oversized CSV/Numbers attachments are not part of this snapshot.

## Mapping, recovery and reference administration (v1.8)

Enable **Review worksheet and column mapping before processing** to review a standard file; nonstandard layouts open the mapper automatically. Name and Address1 mappings are required; Group/key/extra fields stay metadata. Both exports retain original columns. Full analysis adds internal/source keys, worksheet row and mapping audit. Processing jobs save checkpoints independently of the browser and pin the reference snapshot. Reference management provides source coverage/freshness, offline/online staging, validation, activation, retained rollback versions and actor/reason audit.

Read [the workflow and administration guide](docs/WORKFLOW_MANAGEMENT_v1.8.md) for operation, upgrade/backup, worker recovery, reference-switch restrictions and optional MWTSI_ADMIN_TOKEN. Use the staged interface instead of overwriting managed references with the old refresh command.

## Postal lookup option (v1.8.1)

**Processing settings → Postal code lookup** is On by default and saves locally. Switch it Off to stop postal-code-based town/city suggestions and manual postal lookup. Missing towns remain unresolved. New batches capture the setting; running/resumed/saved batches retain their original value. Full analysis records the effective value. See [the configuration guide](docs/POSTAL_LOOKUP_CONFIGURATION.md).

## Record Review and manual town decisions (v1.9.1)

Original source and Proposed Hybrid output now appear side by side at the top of Record Review, with a live output preview and a stacked layout on narrow screens. Automatic approval for Unresolved towns has been removed, including for remaining rows of older resumed jobs. Existing historical decisions remain intact. Postal lookup remains configurable. See [the review/update guide](docs/RECORD_REVIEW_COMPARISON.md).

## Multi-select status filters and selected export (v1.9)

Choose any combination under **Statuses**; records matching any selected status appear once. Group and search narrow those matches. **Export scope** offers All records in selected Group (default) or Matching selected filters, with a unique count across every page. Both Full analysis and Source + Hybrid are supported. See [filter/export guide](docs/STATUS_FILTERS_AND_EXPORT.md).

## Pass / Fail review (v1.10)

Record Review has top Pass/Fail buttons, Key and Name in the heading, and review reasons directly below. Pass opens an initials-only pop-up; Fail requires initials and a reason. Confirm saves the current proposal and decision, retaining source and validation evidence. Batch Pass all pending uses initials only. Passed/Failed filters and Full analysis expose the decision details. See [the Pass/Fail review guide](docs/PASS_FAIL_REVIEW.md).

## Credentials, roles and groups (v1.11)

All application data APIs require a session. Admins manage users, roles, group assignments, active status and temporary password resets. Users see only rows whose source Group exactly matches their one assigned group, across loaded datasets; unassigned Users see no rows. Upload, export, processing/reference administration and user/group management are enforced as Admin-only on the server. The Admin group catalog registers loaded dataset groups and supports creating names before data arrives and CSV/XLSX imports with a Group header. Password changes/resets, account edits and deletion revoke sessions. Review history retains the authenticated account ID and username after deletion. See [the access and upgrade guide](docs/AUTH_ROLES_AND_GROUPS.md).

## Signed-in review decisions (v1.11.1)

Pass now saves immediately as the current signed-in account; Fail opens a required-reason popup and saves as that same account. No initials or reviewer name entry is needed. Identity comes from the verified server session, and client-supplied identity cannot override it. Review history displays the recorded user and time; Full analysis adds Decision_User and Decision_User_ID, preserving Decision_Initials for historical records. Bulk Pass keeps its confirmation without identity entry. Existing decisions remain unchanged. See [current Pass/Fail review](docs/PASS_FAIL_REVIEW.md).

## Local installation policy fix (v1.12.1)

A local package.json allowScripts map is preserved during signed updates. The updater verifies the signed starting package and all remaining settings; installation permissions and formatting differences no longer cause a false conflict. Other source/package/dependency changes still block overwrite. Existing policy values and exact original file bytes are backed up for rollback. Use the replacement first-patch installer from mwtsi-patch-to-v1-12-1.zip; see [the policy fix guide](docs/PACKAGE_POLICY_FIX.md).

## MWTSI avatar logo (v1.12.2)

The supplied avatar now identifies MWTSI on sign-in/password change, workspace navigation, administration and browser icons. A transparent local PNG and shared responsive Brand component keep it consistent. This update is delivered as a signed patch, retaining the local allowScripts compatibility fix. See [branding update](docs/BRANDING.md).

## Review progress dashboard (v1.12.3)

The Processing overview now tracks passed, failed/rejected, ready-for-export, left-to-review and left-to-fix records across completed batches. Admin can filter all totals by batch and Group. Users see only their assigned group, enforced on the server. Open a batch count to inspect records; use Ready for export and Matching selected filters to export that selection. Existing diagnostic exports remain available to Admin. See [dashboard definitions and integration review](docs/DASHBOARD.md).

## Correct failed/rejected output (v1.12.4)

Admins and assigned-group Users can open a failed or legacy rejected record, correct the Structured proposal and choose Pass. The new decision saves the current account and edited output while retaining the original failure/reason in history. Dashboard/readiness totals and exports follow the new current state. See [recovery instructions](docs/DASHBOARD.md#correcting-failures--v1124).

## Admin batch deletion (v1.12.5)

Admin can delete an open batch or a paused/failed/cancelled/completed processing batch after typing DELETE in a confirmation dialog. The entire batch and its records/history/checkpoints are removed atomically, independent of table filters. A minimal deletion audit remains; other batches, users and groups are retained. Users cannot delete via the UI or API. See [batch deletion instructions](docs/BATCH_DELETION.md).

## Dark workspace (v1.13.0)

A refreshed charcoal/mint interface, stationary transparent MWTSI logo backdrop and collapsible sections make the dashboard and record review easier to scan. Primary controls stay prominent; optional evidence and diagnostics expand when needed. The structured editor sits directly below the source/Hybrid comparison. Existing data, roles and processing rules are preserved. See [dark workspace and patch instructions](docs/DARK_INTERFACE.md).

## Logo motion — v1.13.1

The workspace avatar and fixed backdrop briefly become a spinning globe every 20 seconds, then return to the original logo. Pause/resume beside Change password is saved in this browser. Reduced-motion preferences and hidden tabs stop the animation automatically. See [logo animation and patch instructions](docs/LOGO_ANIMATION.md).

## ISO country assignment — v1.13.2

Recognized country-field values normalize to assigned ISO alpha-2 codes. Hong Kong remains HK and China CN; qualified territory names are preserved and ambiguous country names require review. Preview and saved country edits share the resolver. Existing proposals/decisions are not rewritten. See [country rules and update guide](docs/ISO_COUNTRY_CODES.md).

## v2.0.0 — concurrent operations

The workspace loads server-side pages with Group-scoped counts and filters. Editable records use expiring reviewer reservations, renewed while the drawer stays open; Admin can explicitly release a reservation. Background exports stream a consistent snapshot in a separate worker process and remain downloadable for 24 hours. Both formats retain their existing source/audit contracts. `npm run benchmark` measures isolated synthetic concurrent review with overlapping imports/exports. See [v2 operations](docs/V2_UPGRADE_AND_OPERATIONS.md) and [the measured benchmark](docs/CONCURRENCY_BENCHMARK.md).

## v2.0.1 — selected Hybrid rule candidates

Record Review now labels Hybrid output lines with candidate IDs, shows their selected sequence and provides a readable priority/retention decision table. Live edits refresh the labels; saved sources and processing rules remain unchanged. The incremental patch upgrades v2.0.0. See [the candidate review and patch guide](docs/HYBRID_CANDIDATE_REVIEW_v2.0.1.md).

## v2.1.0 — unique batch export coverage

Batch export coverage counts each record once across completed exports in either format. Group/status/search filters apply to totals, with exported/remaining record filters and remaining-only export. Failed jobs do not count; expiry/retries do not erase earlier successful coverage. Pre-upgrade history is explicitly marked incomplete. See [export tracking operations](docs/EXPORT_TRACKING_v2.1.md).
