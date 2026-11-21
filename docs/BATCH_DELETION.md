# Delete an uploaded batch — v1.12.5

## Admin instructions

1. Open an uploaded batch from Recent batches or the dashboard, then choose **Delete batch** beside its batch details. This action applies to the entire batch, including all Groups and all pages, even when the table is filtered.
2. For a processing upload, expand **Processing jobs**. Pause or cancel a queued/running job first. A paused, failed, cancelled or completed job offers **Delete batch**.
3. Check the filename, full batch ID and record/source-row counts in the confirmation dialog.
4. Type `DELETE`, then choose **Delete permanently**. Cancel or Escape closes the dialog without deleting anything.

Only Admin can see or invoke deletion. User-role requests are denied by the API even for the User's assigned group. Password-change and same-origin checks remain in force.

## Data removed and retained

Deletion permanently removes the selected batch's processed records, review history/events, staged source rows, processing job/checkpoints, import mapping, batch settings and batch entry from the active database. It is one transaction: a failure rolls everything back. An immediate write transaction serializes against job claims/resumes. Queued/running jobs are blocked until paused/cancelled; an old worker or stale review cannot recreate deleted rows.

Other batches, accounts, groups, reference data and global processing settings are retained. A minimal BATCH_DELETED audit entry records Admin identity, batch ID, time, row/event counts and previous job status. It does not retain customer names/addresses, workbook bytes or failure-reason contents.

The app clears matching active-batch/tracked-job browser selections, refreshes recent batches/jobs/dashboard counts and removes the deleted batch from filter choices. An Admin viewing a concurrently deleted batch can confirm deletion to refresh that stale local view. Other connected browsers lose API access immediately; already displayed data disappears when those views refresh.

Original workbook files on your computer, unsubmitted upload drafts and existing database backups are separate and remain unchanged. There is no undo in the app. Code/patch rollback does not restore deleted data; data recovery requires an appropriate database backup.

## API

Authenticated Admin request:

```http
DELETE /api/batches/<batch-id>
Content-Type: application/json

{"confirmation":"<same-batch-id>"}
```

Success returns the ID and deleted record, review-event and staged-source counts. Invalid confirmation returns 400; unauthenticated requests 401; User/first-login/cross-origin requests 403; missing/already deleted batches 404; active processing 409. Unexpected transactional failures return a generic 500 and leave the batch intact. Clients should refresh after a 404 because another Admin may have deleted the batch already.

## Apply the patch

Stop the host app/worker and extract `mwtsi-patch-to-v1-12-5.zip` beside the existing application directory. From the application directory:

```bash
node "../mwtsi-patch-to-v1-12-5/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v1-12-5/apply-patch.mjs" --app "."
```

Use the actual extracted installer path, then restart normally. Supports 1.10.0, 1.11.0, 1.11.1, 1.12.0, 1.12.1, 1.12.2, 1.12.3 and 1.12.4. Applying this patch does not delete existing batches. No dependency change or database migration is required; local allowScripts settings are preserved. See PATCHING.md for backup/recovery.
