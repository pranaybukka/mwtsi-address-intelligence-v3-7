# Correct failed and rejected records — v1.12.4

## What changed

Failed (FAILED) and historical Rejected (REJECTED) records can now be corrected and passed from Record Review. The same shared eligibility rule controls editable fields and the server's Pass/Fail transition. Admin can recover any accessible batch record; a User can recover only records in their exact assigned Group.

## Steps

1. Open Processing overview and click a batch's failed/rejected count, or choose Failed / Rejected in the record status filters.
2. Open the record. Its last failure, reviewer and reason remain visible.
3. Correct the Structured proposal, checking the adjacent original source and live Hybrid preview.
4. Click Pass at the top. This saves the corrected proposal and records the signed-in account without a reason popup.
5. If the output still fails, choose Fail and supply a new reason. Closing the drawer or cancelling the popup leaves unsaved edits unchanged.

No separate reopen operation is required. The latest decision controls current status, dashboard totals and ready-for-export selection. A recovery moves the record from Failed/Left to fix to Passed/Ready for export. Other selected status filters may still match retained validation findings. Record Review keeps passed output read-only. Bulk Pass still operates only on pending records.

## History and controls

The original source, earlier failure/rejection, reason, identity and any stored reviewed snapshot remain in review history. Each new decision appends its own current-account identity, before/after proposal, output snapshot, timestamp and version. Repeated Fail needs a new reason. Stale clients cannot overwrite newer changes, and User permissions cannot be expanded by altering a Group or record ID in a request.

Full analysis exports the latest decision and corrected output alongside complete Review_History/Audit entries. Source + Hybrid output exports the corrected stored Hybrid lines. Recovery is an operational acceptance; original findings and confidence remain independent, including accepted processing-error output.

## Patch installation

Stop the host application and worker. Extract `mwtsi-patch-to-v1-12-4.zip` alongside the existing application directory. From that application directory, run:

```bash
node "../mwtsi-patch-to-v1-12-4/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v1-12-4/apply-patch.mjs" --app "."
```

Use the actual extracted installer path. Restart with the normal startup command. Supported starting releases: 1.10.0, 1.11.0, 1.11.1, 1.12.0, 1.12.1, 1.12.2 and 1.12.3. Data, accounts, groups, review history and local allowScripts settings are preserved. No dependency change or database migration is required. See PATCHING.md for backup, external database and rollback options.
