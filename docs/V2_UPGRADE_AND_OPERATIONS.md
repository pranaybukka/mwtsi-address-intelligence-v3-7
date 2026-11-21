# MWTSI Address Intelligence v2.0.0

v2 adds server-side record pagination, reviewer reservations, background Excel exports and a reproducible concurrency benchmark. Existing Hybrid priorities, ISO country rules, immutable sources, Group permissions, Pass/Fail attribution, failed-record recovery, dashboard definitions and review history remain in force. Existing installations upgrade with a signed patch, without a reinstall.

## Update an existing installation

The v2 patch bundle directly supports 1.13.0, 1.13.1 and 1.13.2. For versions 1.10.0 through 1.12.5, first apply the retained universal patch to 1.13.2, then apply v2. Both steps preserve the existing database. This keeps the download bundle small while retaining the signed older-version upgrade path. New installations can use the v2 full source archive.

Stop the host app and worker, including any export process. Extract mwtsi-patch-to-v2.zip beside the existing application directory. From the application directory run:

```bash
node "../mwtsi-patch-to-v2/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v2/apply-patch.mjs" --app "."
npm start
```

Use the actual extracted installer location. Retain your existing custom database, port, bind-host and environment configuration. If you previously supplied custom --database or --port arguments to the installer, supply those same values. Use Node.js 24 or newer. No dependency upgrade or npm ci is required for this patch. Refresh browsers after restarting. The workspace footer identifies v2.0.0. See PATCHING.md for backups, custom options and rollback.

On first startup, the app builds a compact derived record index in bounded chunks before starting the web server. It does not rerun address interpretation or rewrite saved proposals, decisions or source fields. An interrupted index build resumes from remaining dirty records. New tables, indexes and pure SQLite triggers are additive. The triggers mark legacy writes for reindexing, allowing older code to continue writing after code rollback. Code rollback does not undo operational decisions. Old versions do not run v2 export jobs; stop all runtimes before updating or rolling back.

## Server-side pages and totals

The workspace requests 15 records per page from GET /api/batches/{id}/records. The API supports page (zero-based), pageSize (1–100), Group, natural Group ordering, any selected statuses and literal Unicode-aware search. Group authorization is applied before records, counts or filter options are returned. User sees only the exact assigned Group. Admin can select all Groups, a named Group or no Group.

Counts and export readiness describe the entire matching selection, not just the visible page. Matching several statuses never duplicates a record; identical external keys still represent separate internal records. Group order retains source order for equal natural-sort names and places blank Groups last. Filter changes return to the first page; a page that becomes empty after decisions is clamped to the last available page. The table refreshes periodically and on focus. Closing/reloading does not discard committed reviews.

A derived compact index stores filter/search flags and numeric counts alongside the authoritative record store. Record writes update it atomically. Pure SQLite dirty markers catch legacy writes; revision-aware caches invalidate when records change. Search is literal, not a SQL wildcard. The legacy complete-batch endpoint remains available for integrations; the current workspace and processing-job result links use the paginated endpoint.

## Reviewer reservations

Opening an editable record claims a two-minute reservation for that review window. The browser renews it every 20 seconds. Other windows see who reserved the record and stay read-only. Reservations are separate from record decisions and do not change export readiness or source data. Ownership tokens are stored as hashes and scoped to the authenticated account and editor.

Closing the drawer releases its reservation on a best-effort basis. A crashed/disconnected browser releases it through expiry. If renewal fails, edits become unavailable; Reload and reserve fetches the current saved record and replaces unsaved edits. Server checks remain authoritative when a browser resumes after sleep. Saved record versions still prevent overwriting a newer decision.

Admin can explicitly choose Release reservation as Admin; this records a minimal administrative audit event and invalidates the earlier editor token. Admin does not silently bypass another reviewer while saving. Group Users cannot release another editor's reservation or access foreign records. Pass/Fail releases the current reservation after a successful save. Failed/rejected records remain editable once reserved.

Pass all pending remains an explicit confirmation under the signed-in account. It covers all pending records in the batch for Admin or the assigned Group for User, independently of current table filters. It checks the confirmed batch revision and fails atomically if the batch changed or a selected record is reserved. Reopen the confirmation after refreshing; no partial bulk decision is committed. Existing API clients may still save an unreserved record without a token, but cannot overwrite an active reservation.

## Background exports

Normal workspace export clicks queue a job. The host generates the workbook in a separate export process, so you can continue reviewing or return later. The newest requested workbook downloads automatically when ready in the requesting browser; prepared downloads remain listed after reload. If browser policy prevents an automatic download, use Download prepared workbook.

The Background exports panel shows the source filename, format, selection, requested account, progress, expiry and job ID. Both Full analysis and Source + Hybrid output preserve their existing columns and audit contracts. Selection covers every matching record across pages, with ANY status semantics and one row per internal record ID. Export is Admin-only, including queue/list/status/retry/cancel/download APIs.

Generation uses one consistent SQLite read snapshot taken when the export worker starts. Decisions made before that snapshot are included; later decisions are not mixed into the workbook. Retrying takes a new snapshot using the same criteria. Results are streamed to a private, randomly named partial file, then published atomically only after the workbook is complete. Full analysis streams Results, Summary and lossless Audit worksheets; Source + Hybrid output contains Results only. No access to a client's original workbook path is required.

Generated files expire 24 hours after the job is queued. The worker removes expired files and stale partial files. An operating-system file lock can delay physical removal; expired downloads remain blocked. Cancel stops publication; Failed/Cancelled/Expired jobs can be retried. Missing completed files are marked failed so Retry becomes available. Disk/write errors produce a failed job rather than a completed partial download. Partial workbooks are never downloadable. A host restart recovers an interrupted RUNNING job after its lease expires; a normal shutdown queues interrupted work for restart.

Files are stored in export-files beside the configured operational database (normally data/export-files). This directory is private and outside public/. Back up the database and reference snapshots with the existing procedures. Export files are derived and may be regenerated if not retained in a backup. Allow disk space for ready exports, temporary ZIP data and SQLite WAL growth during long read snapshots. The normal worker runs one export child alongside import processing; additional manually started workers can increase resource use.

Deleting a batch removes its reservations, derived index entries, export jobs and generated files as well as its existing dependent records/history. An in-flight export is fenced from publishing after deletion. Data already downloaded by an Admin cannot be withdrawn. The legacy synchronous export URL remains available for existing integrations and link compatibility.

## Benchmark your own host

Build production first, then run:

```bash
npm run build
npm run benchmark -- --users 5,10,25,50 --records 18000 --duration 30 --warmup 5 --think-ms 1000 --out "work/concurrency-benchmark"
```

Run during a quiet test window for meaningful measurements. The runner creates an isolated database and fictional accounts/records under the OS temporary directory, binds a separate production server to loopback on an available port, starts a worker and removes its temporary data afterward. It overrides the operational database path; it never benchmarks by modifying your installed data. It reads the configured reference snapshot without copying or changing it. The fixture helper refuses operational database locations. Credentials remain in private process pipes/memory and are omitted from reports.

Each level uses authenticated Group-scoped sessions with page reads, periodic dashboards, reservations and Pass/Fail decisions. One 1,000-row import and one full-analysis export of the original batch overlap that level. The configured think time is between reviewer cycles. Login hashing, browser rendering and WAN/TLS/proxy latency are excluded. The JSON and Markdown reports include p50/p95/p99, request counts/statuses, response sizes, error counts, job outcomes, hardware/container limits and the reference snapshot. Job polling/downloads after the timed window do not inflate request throughput.

The included benchmark is a short synthetic measurement, not a production capacity certification. Acceptance targets are page p95 ≤500ms, decision p95 ≤1,000ms, no unexpected request errors and completed import/export jobs. Results depend on hardware, storage, record size, Group distribution, activity and concurrent workloads. Repeat with realistic data/longer durations before setting an operational user limit. See CONCURRENCY_BENCHMARK.md and CONCURRENCY_BENCHMARK.json for this release's actual measurements.

## Concurrency defect found during verification

The first mixed-load smoke run exposed SQLITE_BUSY in an import checkpoint. A deterministic two-connection regression reproduced the read-to-write upgrade conflict. Queue/claim/checkpoint mutations now take SQLite write access before reading the state they will update, while keeping address processing outside the short commit transaction. The existing checkpoint cursor/version checks and recovery behavior remain. The regression checks that a competing writer cannot slip between cursor validation and checkpoint insertion.

Group summaries and per-status counts are maintained incrementally with record writes in the same transaction. Common single-status pages and dashboards read these compact totals; multi-status/search intersections retain the indexed unique-record query. Pure SQLite dirty markers allow rebuilding totals after legacy writes/deletes without changing authoritative records.
