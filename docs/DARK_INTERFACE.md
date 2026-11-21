> Superseded UI details: v2.2.0 removes the character/background, retains an animated routing globe and makes Dashboard the landing page. See [current UI guide](UI_REFRESH_v2.2.md) and [assessment](UI_ASSESSMENT_v2.2.md). The versioned design history below describes its original release.

# MWTSI dark workspace — v1.13.0

The application now uses a dark charcoal interface with mint accents, clearer typography, larger controls and responsive tables, filters, dialogs and account screens. The transparent MWTSI avatar is a decorative fixed background: it stays stationary as the page scrolls, appears behind content, is ignored by screen readers and never receives clicks.

## Find your work

The overview keeps review totals, batch filters and export readiness prominent. Batch breakdown is an accordion; expand it to open records behind a count. Routine totals refreshes retain its collapsed/open state within the same filters. The records table comes before optional Processing diagnostics. Expand those diagnostics for automatic classifications, validation and confidence counts. Current batch Group/status/search and export controls keep their existing behavior.

Upload starts with workbook selection and recent batches. How it works can fold away. Workspace controls follow daily work; Processing settings, Processing jobs and Reference management can each expand/collapse. Public reference attribution remains available at the bottom.

## Review a record

Key/Name, review reasons and the top Pass/Fail controls remain in place. Original source and Proposed Hybrid output remain adjacent on desktop and stack on mobile. The Structured proposal editor now follows that comparison directly. Name evaluation, Evidence & candidates, Address priority & postal retention and Validation & audit expand independently when needed. Postal lookup remains available with the current on/off policy.

Accordion content stays mounted when folded, so toggling a section does not discard field state or interrupt processing/status polling. Closing a record without a decision still leaves unsaved edits uncommitted. Keyboard Enter/Space toggles a disclosure. The record focus loop ignores collapsed content, and reduced-motion preferences disable decorative transitions. Color labels, icons and text continue to distinguish decisions without relying on color alone.

## Existing controls

This release changes presentation and information order. Admin/User Group access, immutable source, Pass/Fail identity/history, failed-record correction, ready/export rules, deletion confirmations, column mapping, durable jobs and reference behavior retain the existing API/database implementation. No dependency or schema change is required. Browser-native dark controls and the same responsive layout serve every platform.

## Update in place

Stop the host app and worker. Extract `mwtsi-patch-to-v1-13.zip` beside the application directory, then run from the existing application directory:

```bash
node "../mwtsi-patch-to-v1-13/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v1-13/apply-patch.mjs" --app "."
```

Use the actual extracted installer path. Restart normally and refresh the browser to load the new interface. Supports 1.10.0, 1.11.0, 1.11.1 and 1.12.0 through 1.12.5. Data, accounts, decisions, groups, settings and local allowScripts permissions are preserved. See PATCHING.md for backup and recovery.
