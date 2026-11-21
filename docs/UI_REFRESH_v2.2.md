# MWTSI v2.2.0 — dashboard and review navigation

## What changes

MWTSI opens on a dedicated Dashboard with filtered review readiness and unique export coverage. Batch workspace, Review records, Upload addresses and Export results have distinct navigation destinations. The character logo and fixed background are removed. MWTSI remains, with a quiet animated routing globe, a pause control and reduced-motion support. Record Review adds Previous/Next and Record x of y, preserves report filters/order across pages and protects unsaved edits.

Read [the complete UI assessment](UI_ASSESSMENT_v2.2.md) for findings, definitions and follow-up recommendations. No processing rules, dependencies, startup script, account model or operational data schema change in this release.

## Apply to an existing installation

The signed **mwtsi-patch-to-v2-2.zip** directly supports **v2.1.0**. Check the installed version from the existing application folder:

```text
node -p "require('./package.json').version"
node --version
```

Use Node.js 24 LTS or newer, as required by the current app. If installed v2.0.0 or v2.0.1, apply the retained v2.1.0 patch first. Earlier supported installations follow V2_UPGRADE_AND_OPERATIONS.md, then v2.1.0, then v2.2.0. Keep each extracted patch folder outside the existing application folder. The full source archive is for new installs, not an in-place update.

1. Schedule a short host maintenance stop. Stop the app supervisor/service, standalone workers and reference imports/installers. Patch the shared host once; remote computers only refresh their browsers.
2. Take a consistent operational backup using the existing backup procedure. With all writers stopped, include the configured SQLite database (also if ADDRESS_DB_PATH is external), local configuration and required reference/export storage. The patch source backup is not a database backup.
3. Download and extract mwtsi-patch-to-v2-2.zip beside the existing app directory. The folder contains apply-patch.mjs, its runtime/public verification key and patches/2.1.0.mwtpatch. Keep them together.
4. From the existing app folder containing package.json, run:

```text
node "../mwtsi-patch-to-v2-2/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v2-2/apply-patch.mjs" --app "."
```

These quoted relative commands work in macOS/Linux terminals and Windows PowerShell when the extracted folder is a sibling. If it is elsewhere, use its actual full path; do not copy a literal /path placeholder. Wait for Patch operation complete. The updater verifies the signature/source baseline, preserves supported local allowScripts permissions and builds in place. Dependencies are reused because they do not change.

5. Restart with your normal command/service (npm start for production, npm run dev if that is how this host normally runs). Hard-refresh connected browsers. Existing credentials, Group assignments, batches, preserved source, decisions and export history remain.
6. Verify package.json shows 2.2.0. Sign in, open Dashboard, filter a known Group, drill into a count and use Previous/Next. Check source/proposal comparison and existing export coverage. A User must still see only their assigned Group and no upload/export/admin actions.

If --check reports a locally changed file, stop and compare it with the matching source baseline. Do not bypass conflicts or overwrite unknown startup changes. scripts/serve.ts is unchanged in this release; an unresolved earlier v2 startup conflict still needs a matching merge. See PATCHING.md for backup/recovery commands and rollback limits.

## Using the dashboard

Choose a Batch, Group and any statuses. Multiple statuses mean ANY-match, deduplicated by internal record ID. Metrics show Total, To review, Failed / rejected, Ready & unexported, Exported — unique and Remaining to export. Passed, Ready for export and Needs attention appear below. Review readiness and export coverage are separate progress views.

Click a metric for the selected batch, or use a batch-row count/action. With All completed batches selected, a top metric moves to the batch breakdown. A focused drill keeps original statuses and adds the clicked category as an intersection. The report displays the focus and offers Clear focus. Current Group/export-tracking and matching filters carry into exports across all matching pages.

Remaining is no tracked successful export, including records that still need review. Ready & unexported is the actionable ready subset. Exported counts a record once even when multiple workbooks include it; it is generation history, not proof of local download. Pre-tracking batches continue to disclose incomplete history. Record edits do not reset an exported flag.

Admins see all completed authorized data; Users see only their exact assigned Group. In-progress imports are excluded until completed. Findings may overlap. Admin Workspace activity summarizes jobs independently of record filters. Dashboard totals refresh every 30 seconds, on window focus or with Refresh totals.

## Reviewing a sequence

Open a row in Batch workspace or Review records. Previous and Next follow the current report's Group/status/search/export-tracking/focused metric and Group sort, including across report pages. There is no wrap. Close returns to the current record/page. The former reservation is released before opening the next record. A neighbor reserved by someone else opens read-only and is not silently skipped.

Unsaved edits prompt Keep editing or Discard changes and continue when navigating, closing, pressing Escape or clicking the backdrop. Navigation never saves or passes a record. Pass records the signed-in account without a popup; Fail still requires a reason. Both save the current proposal and retain validation findings/audit under existing rules. A successful decision closes review as before. If another reviewer changes a record so it leaves this report, close and refresh after the navigation message.

## Globe and accessibility

The decorative globe uses local SVG/CSS land movement, routing pulses and an orbiting point. It does not show real record locations. The header pause/resume control stores a browser-local choice; old animation-off preferences are honored. System reduced motion and a hidden browser tab suspend motion. Sign-in and administration display a static globe. Controls/filters remain labelled on small screens; a skip link and visible keyboard focus aid navigation.

## Rollback and limits

This is a source/UI update, with no new operational schema or dependency migration. Use the updater's documented rollback after stopping runtime processes. Rollback does not restore database contents or undo decisions/exports created after upgrade. v2.1 durable tracking limitations still apply if rolling farther back to code that does not record exports. Screenshots/browser checks were performed in Linux Chromium; native Windows/macOS acceptance remains pending.
