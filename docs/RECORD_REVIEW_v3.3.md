# Record Review comparison canvas — v3.3.0

## Compare first, decide with context

Record Review opens a wider comparison canvas. The preserved original Name, Address 1–3, Bank country and Group sit beside the exact proposed slash output. Each output line has a readable label and a line number. This is a comparison of raw source fields against selected output, not a word-by-word semantic diff: normalization, interpretation, reordering and omission can change field boundaries.

On desktop the source stays visible as you scroll through the transformed values and editor. Its independently scrollable field list retains complete source values, including long names and line breaks. On smaller screens the cards stack with bounded source scrolling and reachable Pass, Fail, Previous and Next controls. The existing account palette, Dark/Light preference and reduced-motion setting apply.

Use **Edit transformed values** to focus the correction form directly below the output. Related source rows highlight while a field is focused; this is a reading aid, not a provenance claim. **Back to comparison ↑** returns to the output. The preview and both BNP/ORP tab checks reflect current drafts. A **Saved result** or **Unsaved preview** indicator distinguishes persisted output from proposed edits. **Values shortened or omitted** expands to show the affected data and a readable explanation; raw source remains preserved.

The Key, BNP/ORP names, Group, status and review reasons remain above the work area. The long identity and reasons have their own bounded scrolling. BNP/ORP tabs retain both drafts; Pass and Fail still apply to the entire record. Pass records the signed-in user; Fail collects a reason. Missing 1/ or 3/ warnings, reservation/version checks, automatic next-record movement, failed-record recovery and discard/keep protection remain active.

## Different detail for each role

**User:** plain labels such as Name, Address and Country / town; name/address evidence; current format findings; and readable decision history with actor, time and reason. Selected Hybrid rule candidate panels, candidate IDs, priority tables and raw technical candidate/audit dumps are omitted from the rendered review. Live Translate follows the same role distinction while retaining exact slash output and copy controls.

**Admin:** retains the selected rule labels and can expand **Selected Hybrid rule candidates** below the output for the selected sequence, capacity and postal retention. **Address priority & postal retention** and **Validation & audit** retain the detailed tables and underlying audits.

This is a presentation change. It does not introduce a new API redaction boundary: existing authorized record responses still contain analysis data. Server-enforced User Group isolation, upload/export restrictions and Admin controls are unchanged. Source values and historical decision text are displayed faithfully, even if they happen to contain technical-looking words or numbers.

## In-place update from v3.2.0

Use **mwtsi-patch-to-v3-3.zip** for an existing **3.2.0** installation. Earlier releases must first reach 3.2.0 through retained patches. Use the source ZIP only for a new installation.

1. Back up the existing database and configuration. Stop the host application, supervised worker and any separately started workers/reference jobs. Patch the host once; remote browsers only reconnect.
2. Extract the patch ZIP beside the existing application directory. Keep its installer, verification key and patches directory together. In a terminal, enter the existing directory containing package.json. Use Node.js 24 LTS.
3. Check and apply, using the real extracted path if the folders are not siblings:

```text
node "../mwtsi-patch-to-v3-3/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v3-3/apply-patch.mjs" --app "."
```

For an external database, include the same absolute database path on both commands:

```text
node "../mwtsi-patch-to-v3-3/apply-patch.mjs" --app "." --database "/actual/path/customer.sqlite" --check
node "../mwtsi-patch-to-v3-3/apply-patch.mjs" --app "." --database "/actual/path/customer.sqlite"
```

Windows example: `--database "C:\MWTSI-data\customer.sqlite"`. Quote paths containing spaces. The relative installer path works on Windows, macOS and Linux when the folders are siblings. Replace example database paths with actual paths; do not copy `/actual/path` literally.

4. Wait for **Patch operation complete**, then restart with the normal host command (`npm run dev` for development or `npm start` for an existing production setup). The installer builds in place and reuses unchanged dependencies. Refresh browser tabs.
5. Confirm version 3.3.0; open a known batch, switch BNP/ORP, inspect original/transformed output as Admin and User, and verify assigned-Group access and saved decisions.

No dependencies, schema, startup scripts, parser, enrichment, Hybrid selection rules or Excel output formats change. Existing source, results, reviews, accounts, Groups, appearance preferences, settings and export ledgers remain in place. The patch does not silently reprocess batches. Preserve local allowScripts and unrelated configuration; never bypass source conflicts. See [patching and recovery](PATCHING.md) for backups, conflict handling and rollback limitations. Code rollback does not reverse operational decisions made after an update.

## Verification

87 targeted unit/integration tests in seven files passed, including presentation helpers, role/access checks, pass/fail, auto-next, failed-record recovery and dual-address behavior. Six new production Chromium workflows cover Admin/User rendering, source preservation, live edits, joint decisions, human history, navigation, Group restrictions, Live Translate and widths 320/390/768/1024/1440 in Dark/Light mode, including a 320×600 viewport. Forty-eight existing review, navigation, recovery, appearance and dual-address browser workflows also passed. Typecheck and production build passed; the pre-existing dynamic export tracing warning remains.

The signed patch is checked/applied to a real isolated 3.2.0 installation in a Unicode/spaced path with an external SQLite database and local configuration. Release verification records before/after data fingerprints and a patched-server browser check. Historical full v3.2 address/25,000-record regression results remain documented separately; that full workload was not repeated for this UI-only release. Native Windows/macOS execution and a formal accessibility certification are not claimed. Download packaging excludes runtime data, credentials and private signing keys.
