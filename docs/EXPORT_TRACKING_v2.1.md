# Batch export tracking — v2.1.0

Batch export coverage tracks how many distinct source records have appeared in a successfully generated workbook and how many have no tracked export. Export the same record repeatedly, use both formats, or combine overlapping status selections: the unique exported total counts that internal record once. Different source rows remain distinct even when their external Key values match.

For example, export 60 records from a 100-record batch, then 50 with 20 already present in the first export. Unique exported is 90; remaining is 10. Downloading either workbook again changes neither total.

## Use the batch view

Open a completed batch in Processing overview, Review exceptions or Export results. **Batch export coverage** shows Matching records, Exported — unique and Remaining to export. These totals use the current **Group**, **ANY selected statuses** and **search** filters, across all pages. Clicking a card or choosing **Export tracking** filters the table to all, exported or remaining records. The three coverage totals describe the Group/status/search scope before the export-tracking filter; they continue to reconcile while the table is restricted to remaining/exported rows.

The record table shows whether a record has tracked export history and how many successful workbook generations included it. A Group User sees counts and histories only for their exact assigned Group; Users still cannot upload/export/delete. Admin sees authorized batch data and can filter all Groups, a named Group or no Group.

The export-tracking filter applies to **both** export scopes. **Matching selected filters** exports the intersection of Group, status, search and export tracking. **All statuses in selected Group** ignores the status/search selection, retaining Group and export tracking. The displayed export scope count states how many records the request currently matches. Both formats use the same record selection, and overlapping statuses never duplicate a record.

Filters use each record's **current** Group and status. The unique exported flag means **ever included in a tracked completed workbook**, across versions; editing a record does not reset it. Re-export edited output when needed. Each completion stores the exported record version for audit. Historical manifests do not rewrite sources, address proposals, saved decisions or review versions.

## What counts as exported

A record counts when workbook generation completes successfully on the host. A queued, running, cancelled or failed attempt counts zero. Background completion and its exact membership commit atomically after the complete file is published; a lost worker lease, deleted batch, revoked requester or failed commit cannot publish a tracking event. Membership is taken from the same read snapshot as the workbook, including remaining-only exports.

The legacy direct export endpoint also records successful generation. Download requests are distinct from generation: the server cannot prove that a browser saved the bytes to disk. File expiry, a lost generated file, repeat downloads, retries and server restarts do not erase completed history. A retry generating another successful workbook adds a completion event but does not double the unique record total. Two concurrent remaining-only exports can contain overlapping snapshot selections; the unique totals still count the overlap once.

The normal batch view refreshes every 15 seconds and when focused. The requesting browser refreshes after its prepared workbook becomes ready. Pending/cancelled/failed jobs never increase coverage.

## Existing batches and historical limits

Earlier releases did not retain exact record-membership manifests for every export. On first startup, this release records a tracking start time and marks pre-existing batches as having incomplete earlier history. It does not replay today's filters against old jobs or guess what those old workbooks contained.

For an older batch with untracked records, the interface explicitly says **Remaining means no tracked export since [start time]**. Those records may have appeared in an older, untracked export. A fresh batch created after the upgrade has complete tracking for exports generated through this release. Exporting every record of an older batch establishes tracked coverage for all of them, without changing their proposals or decisions. Do not interpret an unknown old export as either a confirmed export or confirmed non-export.

Code rollback preserves the additive tracking tables, but older code does not record new export membership. Exports performed while running older code create a history gap. Back up the operational database with the normal procedures; the export-run/membership tables are durable business history, not derived cache. Do not delete them when clearing generated files. Deleting a batch as Admin deletes that batch's tracking rows and generated files with its other dependent data.

## Apply the signed patch

The v2.1 bundle directly supports **v2.0.0** and **v2.0.1**. Older supported versions first follow the retained v2 major-upgrade instructions. Stop the host app and workers. Extract mwtsi-patch-to-v2-1.zip beside the existing application directory. From that application directory run:

```bash
node "../mwtsi-patch-to-v2-1/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v2-1/apply-patch.mjs" --app "."
npm start
```

Use your existing database/environment/port options and actual installer location. Node.js 24+ is required. The patch adds compatible SQLite tables/indexes/triggers, preserves operational data and supported local package permissions, and reuses unchanged dependencies. scripts/serve.ts is unchanged from v2.0. No force/conflict bypass is added; an earlier major-upgrade startup-file conflict still requires a matching merge. Refresh connected browsers after restart. See PATCHING.md for backups/recovery/rollback.

## API and operational details

GET /api/batches/{id}/records accepts **exportState=all|exported|remaining**, together with existing Group/status/search/paging parameters. It returns **exportCoverage** (total, exported, remaining, trackingStartedAt, historicalCoverageIncomplete) and a **recordExports** map for the authorized visible page (count, firstExportedAt, lastExportedAt, highestExportedVersion). No complete-batch payload is required. Export queue/direct URLs accept the same exportState filter. Existing job options without it retain All behavior.

Completed workbooks have export_runs entries and per-record export_run_records manifests. Record IDs, exported versions, batch/run IDs and minimal actor/completion metadata are retained, without copying full names/addresses into tracking tables. Coverage uses EXISTS against an indexed record membership, so overlapping exports and status filters cannot inflate it. Completion bumps the batch revision, invalidating cached pages/counts. New tables and pure SQLite cleanup triggers remain usable by older code after rollback.

See VERIFICATION.md and the downloadable release JSON for completed checks. The included 20,000-record SQLite stress report uses simulated completion events to check the counter path; it is not an end-to-end Excel or concurrent-user capacity benchmark. Native Windows/macOS execution remains a separate manual verification step.
