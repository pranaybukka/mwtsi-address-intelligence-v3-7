# v2.3.1 — move to the next record after Pass or Fail

After a successful decision in Record Review, the next record in the current report opens automatically. This works for Admins and Users, including across report pages. Pass records the signed-in user immediately. Fail still requires a reason and records the signed-in user when confirmed.

## What happens while reviewing

The next record follows your current Group, multi-select statuses, search, dashboard focus, export tracking and sort order. Users remain limited to their exact assigned Group. The next matching record is determined after the decision saves. If Pass removes a record from Pending, the immediate next record opens without skipping it. If Fail remains selected, the same saved record is not reopened automatically. Duplicate source keys do not affect navigation.

At the end, review closes with a confirmation. “No records remain in the current report” means the active filters now match none. “End of the current report — no later matching records remain” may still leave earlier records to review. Navigation never wraps to the first row. Previous and Next remain available for manual navigation.

A record reserved by another review window opens read-only; it is not silently skipped. Failed/rejected records are still editable when reserved by you, and can later be passed. Passed decisions stay read-only.

Cancelling Fail or omitting its required reason does not save or advance. If saving fails, review stays on the record with your edits and the server error. If saving succeeds but opening the next record fails, the saved decision is shown read-only with **Retry next record**. Retry only reopens the next record; it never submits the decision again. You can also close and refresh the report.

## Update an existing v2.3.0 installation

Download **mwtsi-patch-to-v2-3-1.zip** and extract it beside your existing application folder. Keep the installer and patches subfolder together. Stop the host app and any separate workers with Ctrl+C or the service manager. Patch the host once; remote computers only refresh afterward.

Open a terminal in the existing application folder containing package.json. Verify the installed version and Node.js:

```text
node -p "require('./package.json').version"
node --version
```

This direct patch requires **2.3.0** and **Node.js 24 or newer**. If the extracted patch folder is next to the app, run:

```text
node "../mwtsi-patch-to-v2-3-1/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v2-3-1/apply-patch.mjs" --app "."
```

The same Node commands work on macOS, Windows and Linux. If you extracted elsewhere, replace the first quoted path with the actual path to apply-patch.mjs. Do not use a literal placeholder path. Wait for **Patch operation complete**. The installer verifies the signature, creates its backup and builds the app. Start with your normal command:

```text
npm start
```

If you normally use development mode, use npm run dev instead. Hard-refresh connected browsers. You keep the existing app folder, SQLite data, accounts, Groups, reference data and review/export history. No dependency, operational-schema, startup-script or address-rule changes are included.

Earlier versions must first reach v2.3.0 using the retained patches on the download page. Local source conflicts remain protected; do not overwrite them or disable verification. See [patch recovery and backups](PATCHING.md).

## Quick acceptance check

1. Filter a report to Pending review and open a record with at least two later matching records.
2. Pass it. Confirm the immediately following matching record opens and the saved decision shows the current user.
3. Fail the next record with a reason. Confirm the next matching record opens and the failed record retains its reason/history.
4. Review the last matching record. Confirm review closes with a completion message.
5. As a User, confirm every opened record belongs to the assigned Group and upload/export remain unavailable.

Engineering evidence and execution limits are in [verification](VERIFICATION.md). Screenshots on the download page use fictional data.
