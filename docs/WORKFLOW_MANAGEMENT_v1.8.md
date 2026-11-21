# Column mapping, recoverable processing and reference management — v1.8

**v1.8.1:** Postal code lookup is configurable under Processing settings and defaults to On. Off disables automatic postal-derived town lookup and manual lookup; batches retain their starting setting. See [configuration guide](POSTAL_LOOKUP_CONFIGURATION.md).

## Operations: map a workbook

Choose an .xlsx file or drop it on the upload area. Enable **Review worksheet and column mapping before processing** before selecting a file to review even a standard template. Nonstandard headers open the mapper automatically. A standard Name/Address1/Address2/Address3 worksheet can proceed with suggested mappings.

Choose the worksheet, inspect the first three data rows, and select source columns for Name, Address1, Address2, Address3, Bank_Country and Group. Name and Address1 must be mapped; their individual row values may still be blank and follow the existing remediation rules. Address2/3 and the other fields are optional. Each analyzed target takes one source column; combining columns is not supported. Reusing a column for multiple analyzed targets is rejected. Duplicate headers and data under an unnamed header require correction in the source workbook.

Choose an optional **Record key** column to reconcile results. The key is metadata, not address evidence. Duplicate or blank keys are retained; a separate internal Record_ID identifies each result. Only the five address/name/bank-country fields enter analysis. Group, keys and unmapped columns do not influence parsing, confidence or Hybrid priorities. Map Bank_Country only to authoritative bank-country information.

Every original column retains its header, order, supported value type and number format. Mapping does not rename the source workbook. Source + Hybrid output contains these original columns plus Hybrid_Line1–4. Full analysis also contains canonical mapped fields, Record_ID, Source_Record_Key, Source_Worksheet_Row, the mapping in Summary, and complete mapping/source audit chunks. Source_Worksheet_Row is the original Excel row number. Computed header collisions gain a Remediation. prefix. Formula restrictions and inert extra-column formula preservation still apply.

The first row must contain headers. Limits remain 20 MB and 50,000 data rows on the selected worksheet. Upload processing reads browser-supplied bytes; client filesystem paths and MIME variations do not control workbook access. Preview drafts expire after 24 hours; expired bytes are purged on the next upload. A queued draft is deleted after its rows are saved. Canceling the mapping screen leaves an expiring draft, not a processing job.

## Operations: process and recover

**Start mapped processing** saves the source rows and queues a durable job. Processing jobs shows status, committed-row progress, the job ID and reference pin. The browser can close or reload while the local Node application remains running. Reopen the app to see saved jobs; completed jobs have **Open results**. All unfinished jobs and the ten most recent terminal jobs appear in the panel. Older completed batches remain in batch history.

- QUEUED / RUNNING: waiting or processing. Pause stops new commits after the current transaction; uncommitted work may be repeated.
- PAUSED: checkpoints and pending source rows remain saved. Resume continues from the committed cursor.
- FAILED: committed rows remain saved. Resolve the reported condition and Resume to retry the remainder.
- COMPLETED: row totals reconcile before results become available for review/export.
- CANCELLED: terminal; cannot resume. Upload again to start a new job. Cancellation retains already committed rows and source metadata internally; it is not a deletion/retention feature.

Results, review and exports are blocked for incomplete/cancelled jobs so a partial workbook cannot appear complete. A row with an address finding or an ERROR result still counts as a processed row; existing acceptance without changes remains available once the batch completes. A job failure is a processing interruption, distinct from a row's remediation status.

Checkpoints are atomic groups of ten rows, with deterministic record IDs. Repeating a submission of the same draft/mapping returns its existing job. A crashed worker can reclaim expired work after its 30-second lease. The supervisor restarts a crashed worker after about two seconds; a stopped computer/server must be restarted before processing can continue. Reopen the browser independently of worker recovery. Do not start duplicate application instances against the same data directory unnecessarily.

Each job pins its initial reference snapshot. Reference drift stops processing before another chunk is committed. Restore the pinned snapshot through Roll back, then Resume; alternatively cancel and submit a new batch against the new reference. Paused/failed jobs retain pins. Complete/cancel outstanding jobs before activating another snapshot. The rollback exception permits restoring a snapshot matching **every** outstanding job only when all those jobs are PAUSED or FAILED; pause any QUEUED jobs first.

## IT: run and preserve state

Use Node.js 24 LTS. Stop the old application, back up the data folder with a consistent SQLite backup, replace source files, retain the data folder, and run:

```text
npm ci
npm run build
npm start
```

For development use npm run dev. Both commands start a supervisor, the Next server bound to 127.0.0.1 and a separate durable worker. npm run worker is available for a separately supervised service, but does not start the web server. Running the Next executable directly does not start the worker. Worker health is checked against a 45-second heartbeat window; the UI explains how to restart it.

The additive SQLite schema initializes on connection. Existing saved batches and review decisions remain intact. ADDRESS_DB_PATH selects the operational database, shared by server and worker. Retain its SQLite WAL/SHM as appropriate for the backup method. Keep the reference-snapshots directory and all registered reference files alongside a backup of the operational database: its active pointer and history refer to these files. Backups must include custom reference locations if configured. Restoring only address.db can leave broken reference pointers. Recovery is not a substitute for backups, high availability, host disk durability or tested disaster recovery.

Original complete row data, results, review history and unfinished job rows are local sensitive data. Runtime databases, drafts, reference caches, tokens and customer files are excluded from the delivered source ZIP. The legacy direct-file upload API is retained for compatibility; the UI uses inspect + queued mapping.

## Reference administrator: stage, validate, activate, restore

Open **Reference management**. Inspect the active catalog, country coverage, source URLs/checksums/retrieval dates and precision/exclusion policy. The freshness reminder uses the oldest source retrieval date and recommends review after 30 days or when dates are unknown; it is an operational prompt, not an upstream publication guarantee.

Enter administrator name and change reason for each action. **Stage online** downloads the fixed configured public GeoNames sources and builds a separate candidate. **Stage offline** builds from the seven cached files under reference-data/sources; extract all four existing offline source packs into the project first. Missing/invalid source files fail safely. Both actions run in the background, can take several minutes, and validate the candidate without replacing the active reference. Batch work has priority over queued reference tasks.

Validation checks SQLite quick_check, schema/normalization compatibility, the source-manifest SHA fingerprint, table availability, row-count reconciliation and postal/place country integrity. It checks the installed structure/catalog, not independent postal accuracy or data-provider licensing. Use **Validate active snapshot** for the existing reference or **Validate** beside a retained version. Staging automatically validates successful candidates.

After inspecting the candidate, select **Activate**. Activation requires a validated candidate and no unfinished jobs. It validates again, archives a healthy legacy current file if necessary, and switches the database pointer atomically. Old snapshots remain available. The worker closes read-only reference handles between chunks and the server invalidates reference caches on pointer changes. Failed stage/validation/switch operations preserve the old active pointer and record a failed task. An interrupted reference task becomes failed when its 120-second lease expires; retry the action. Partial candidate files may remain for administrator inspection and are not activated.

Select **Roll back to this snapshot** to restore a retained validated version with an actor/reason audit. The same no-unfinished-jobs rule applies except for restoring all paused/failed job pins described above. A corrupt current reference is preserved and marked unvalidated; a healthy validated snapshot can still replace it. Keep sufficient disk space: a roughly 1 GB active dataset, staged candidates and retained versions accumulate. No automatic version pruning is included; do not delete files referenced by active/history records or resumable jobs.

Once a reference is registered for management, use these staged actions. The old reference:refresh CLI deliberately refuses to overwrite a registered snapshot, including when the application is stopped. reference:install detects the configured managed reference and reuses it at startup. First installation/offline setup still uses reference:install. ADDRESS_REFERENCE_DB_PATH can select the initial administrator-owned reference file and must never equal ADDRESS_DB_PATH.

Reference mutations can be protected by setting **MWTSI_ADMIN_TOKEN** in the environment inherited by both processes before startup. Enter it in the administrator token field; the browser sends x-mwtsi-admin-token for mutations, without storing it in localStorage. Without a token, the existing local-operator model applies. Typed actor names provide an audit label, not authenticated identity; this feature does not add enterprise SSO, roles or per-team isolation. Existing same-origin guards remain. No customer address data is sent to the public reference source.

## ELT: what this release enables

Different source layouts can enter the same analysis workflow while preserving reconciliation keys and downstream columns. Long batches survive browser disconnects and worker restarts with visible checkpoints. Reference updates have explicit provenance, staging, validation, controlled activation and rollback. These controls improve operational reproducibility; enterprise authentication, retention, high availability and independently measured country-level accuracy remain separate readiness work.

## Verification

See VERIFICATION.md for the release's exact automated results and platform limits. Regression tests cover mapped typed exports, duplicate submission, pause/resume, pinned-reference drift, worker process termination/restart, active-reference preservation, staged activation/rollback, invalid candidates, token checks and command-line overwrite protection. Browser checks cover custom mappings, reload recovery and real-reference validation.
