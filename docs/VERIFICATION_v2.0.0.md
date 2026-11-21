# v2.0.0 concurrent operations verification

## Scope

v2 adds Group-scoped server-side record pages and counts, a reconstructible record index with incremental per-Group/per-status totals, expiring reviewer reservations, background streaming Excel exports and an isolated production concurrency runner. The workspace footer identifies v2.0.0. Existing Hybrid/name/ISO priorities, source preservation, permissions, review attribution, failed-record correction, deletion and readiness definitions remain in force. No dependency changed.

The derived index/totals are updated with record writes, backed by pure SQLite dirty markers for legacy writes/deletes and warmed before serving. Queries read a consistent scope/count/revision/page snapshot. Counts cover the full selection and retain multi-status OR deduplication. Natural Group sorting retains source-order ties. Reservations use hashed per-editor tokens, renewal/expiry, explicit audited Admin release and existing optimistic versions. Bulk Pass checks its confirmed revision and remains atomic.

Exports use a separate registered process and one read snapshot. Both workbook formats share a streaming writer. Private random partial files become downloadable only after completion. Authorization is checked on every export endpoint, with expiry/cancel/retry, role/deletion fencing and restart lease recovery. A real-process regression verifies that normal host shutdown requeues an interrupted export for restart rather than marking it failed. Source paths are not used to locate workbooks. Download files expire after 24 hours.

## Checks

435 unit/integration tests across 35 files passed. The 38 new scenarios cover status/summary/sort parity, Group scope, page bounds/clamping, cache invalidation, incremental totals and reconstruction, reservations/expiry/ownership/Admin release, version/revision/bulk fences, export formats/snapshots/cancellation/retries/lease recovery, role changes/deletion, expiry, missing files, invalid paths and storage failures. All prior regressions passed, including the supplied workbook, 18,000-row name corpus, expanded reference, fixed priorities, credentials/roles, recovery, deletion, dashboard and patching. Temporary unit databases are now closed and removed after each test file.

66 Linux Chromium production browser checks passed, including four new scaling scenarios: bounded page traffic/whole-scope counts, competing editors and explicit Admin takeover, continued review during export and prepared downloads after reload. Legacy status and workflow browser tests now inspect compact bulk responses and current export queries. Typecheck and production build passed. Desktop screenshots of reservations and prepared exports were inspected.

Native Windows/macOS execution remains unverified. Site preview infrastructure is unavailable in this session; static links/disclosures, release integrity and archive sizes are checked before native publication.

## Benchmark-driven fixes

An initial mixed-load smoke run exposed SQLITE_BUSY during an import checkpoint. A deterministic two-connection test reproduced the read-to-write upgrade race. Queue/claim/checkpoint mutations now reserve write access before reading mutable state, with address computation outside the short checkpoint transaction. Cursor/version/recovery checks remain.

The first 18,000-record mixed-load candidate completed all jobs without request errors but exceeded latency targets. Profiling an uncached synthetic page found about 66ms of 70ms spent on count/option queries. Incremental Group totals reduced the same isolated page query to about 1.7ms. The final production benchmark met every target at 5, 10, 25 and 50 active reviewers, with zero unexpected errors and all background jobs completed. At 50 reviewers, page p95 was 112.2ms and decision p95 was 144ms on a 2-CPU quota / 8 GiB Linux container; see CONCURRENCY_BENCHMARK.md/json. The earlier candidate measurements are explicitly retained in CONCURRENCY_BENCHMARK_BEFORE_COUNTS.json, not treated as a released version. Measurements are short synthetic tests, not production capacity certification.

## Delivery

The signed v2.0.0 patch directly supports 1.13.0, 1.13.1 and 1.13.2. Earlier supported releases first apply the retained universal 1.13.2 patch, then v2. Existing source baselines remain byte-for-byte intact. A real isolated 1.13.2 upgrade, additive startup/index warming and migrated pagination/reservation/export flow are verified separately before publication; the release JSON records the final results and unchanged fingerprints for records, reviews, accounts, groups, batches and local allowScripts. No dependency reinstall. Operational records are not recalculated or rewritten by the upgrade.

Archives exclude operational data, private export files, installed dependencies, builds, runtime state, credentials and private signing material. New preview images stay on the Site, outside patch-managed source. See V2_UPGRADE_AND_OPERATIONS.md and PATCHING.md.
