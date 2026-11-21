# v3.5.0 — Batch comparison, bulk correction previews and changes-only export

This release adds the workflows in that order. It retains the existing BNP/ORP analysis, Hybrid priorities, postal lookup setting, live translation/ISO postal fragments, record review, roles and export history.

## Batch comparison

Open **Compare batches** in the workspace. Choose a completed **Baseline batch** and **Target batch**, then Compare batches. Batch filename search and Load more reach older accessible batches; the menu is not limited to the fifty most recent.

Records match only on their **actual source Key plus exact Group**. Leading zeros, case and whitespace are significant. Internal record IDs are never substituted for a missing Key. A Group move is one removal and one addition. Missing keys and duplicate Key+Group combinations are flagged; ambiguous duplicate items show counts and the first source record on each side, without guessing matches. Counts for duplicate items differ from counts of records.

The summary separates unchanged, source changes, processing changes, processing unverified, proposal changes, other-column changes, additions, removals, duplicate keys and missing keys. Expand a record for baseline/target source and current slash Hybrid output, independently for BNP and ORP. Additional columns remain unanalyzed. Filter by Group, status (ANY selected) or Key/Group/Name search; one item appears once even if several statuses match. Status filters describe the target where present, otherwise the removed baseline. Pages contain twenty items.

### Optional reuse of a prior Pass

Select available items, then **Preview decision reuse**. Eligibility requires unique nonblank Key+Group, identical original address fields and block layout, matching recorded processing/reference/settings context, an explicit positive baseline human decision and an open target. Unchanged extra columns are not required; differences are flagged. Already-passed targets are skipped. Processing errors or irreproducible output require individual review.

The preview rechecks the previous corrected structured address under the current engine/reference and requires matching output, validation, processing status and address findings. Only the obsolete pending-edit workflow notice is disregarded when comparing an already-passed correction. Reservations are respected. Confirm before applying; missing 1/ or 3/ requires the existing explicit acknowledgement. Apply makes a **new Pass under the current signed-in account**, linked to the baseline batch/record/version/user/date. It does not overwrite the original source or impersonate the old reviewer. The earlier decision is unchanged.

**Existing batches from before v3.5 remain comparable.** They lack the newly recorded processing provenance, so automatic decision reuse is unavailable. Their data is not silently stamped or reprocessed. Reimport into a new batch for current provenance when appropriate; do not delete historical decisions to enable reuse.

## Bulk correction previews

Open **Bulk corrections**, choose a completed batch, then filter by Group, statuses and search. Select BNP, ORP or both independently; choose Name, Primary address, Secondary address, Town/city, Postal code, State/province or Country. Keys, Groups and original source columns cannot be bulk edited.

Choose either **Set field when it exactly matches** (blank can match an empty field) or **Replace literal text within the field**. Matching uses the app's existing case/whitespace normalization; replacement is literal text, not a regular expression. Country names are resolved to ISO codes. Enter the current match, new value and a reason.

Click **Preview corrections**. Inspect field differences and expand source/Hybrid output before and after. The preview changes no records. No-op records, passed records, processing errors and active Record Review reservations are explained as skipped. Reservations in another window under the same account also count. At most **1,000 filtered records** can be considered per preview; narrow filters when the limit is exceeded. Nothing is silently truncated.

Check the confirmation and **Apply corrections**. All applicable records are version/reservation/access/context checked together in one transaction. One stale record stops the entire apply, with no partial update. Applied edits remain **pending review**, retain previous failures/conflicts and the preserved source, record the account/reason and workflow ID, and give changed locality values unverified confidence. An explicit later Pass is required. A bulk correction is not an automatic approval.

## Stored previews and receipts

Saved comparisons/previews can be restored in the same account after a browser reload. Unapplied snapshots expire after thirty minutes. Access changes, record/batch revision changes, processing settings or active reference changes require a fresh preview. A reservation acquired after preview blocks apply. Repeated Apply for an already-applied preview returns its receipt without applying twice. Deleting either batch removes dependent snapshots. Snapshot access is owner-only and still requires current Group access. Applied receipts persist; expired item details are cleaned during subsequent preview creation.

## Changes-only Excel export (Admin)

Select **Changes-only** in Export format. The count shows distinct eligible records and changed fields for the current Group/scope/status/search/exported-or-remaining filters. Choose full selected scope or the existing all-records-in-Group scope, then prepare/download the background export.

This is a **net approved structured-field delta report**: the Before value is the first audited structured proposal; the Approved value is the current explicitly passed/accepted/approved proposal. It is not a fabricated mapping from structured fields back to raw Address1–3 and not a comparison with the last export or another batch. Automated readiness alone is insufficient. Pending, failed, unchanged, net-reverted, unverified legacy audit and output changed after approval are omitted. Pass as-is with no net field correction produces no change row. Both BNP and ORP are handled independently.

The Changes worksheet has Record_ID, Key, Group, Block, Field, Before_Value, Approved_Value, Part, Parts, Record_Version, Decision_User, Decision_At, Decision_Action and Basis. The Summary states scope and distinct record/field counts. Very long values use numbered chunks; reassemble by Record_ID+Block+Field in Part order. Excel strings remain inert, including values beginning with =. Original source remains in the application and Full analysis, rather than being rewritten in the delta report.

Only **distinct records actually included** enter the existing successful-export ledger. Repeated/overlapping exports do not duplicate coverage; failed/cancelled/queued exports add no membership. The dashboard's existing exported/remaining counts mean **exported in any format**, including this field-delta report. They do not assert that every source column was delivered or that only the current version was exported. Use export history/version and a full/source+Hybrid export when a complete row delivery is required. Changes-only does not mean never exported before; use Remaining when that is intended.

## Roles

Admins compare/correct all authorized data and export. Users can compare/correct/reuse decisions only for their exact assigned Group, including within mixed-Group batches, and retain review/edit/pass/fail capability. They cannot upload or export in any format. Status/Group filters cannot widen server-enforced access. User views contain no technical selected-Hybrid-rule panel; Admin record review retains it.

## IT: update an existing v3.4.0 installation

1. Back up the application and its actual SQLite database using the existing operational procedure, including external ADDRESS_DB_PATH/reference selections. Arrange a short maintenance window and stop the host app and worker (Ctrl+C in its terminal). Check the application package version and Node 24 LTS.
2. Download **mwtsi-patch-to-v3-5.zip**, extract it alongside the existing application folder. In a terminal already inside the application folder, run:

```bash
node -p "require('./package.json').version"
node "../mwtsi-patch-to-v3-5/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v3-5/apply-patch.mjs" --app "."
```

These same quoted Node commands work from macOS or Windows PowerShell. The relative path assumes that extracted sibling layout. Do not substitute the literal text /path. Earlier versions first follow retained patches to **3.4.0**. If a local source conflict is reported, retain changes and obtain/merge a matching patch; do not force replacement or edit hashes.

If the operational database is selected only by a shell/service startup variable, run the installer with that same environment or add `--database` with the actual SQLite path to both commands. Verify that the successful Apply report names a database backup for an existing database. A check validates source compatibility; it does not prove that the selected database path is your operational one. Append `--database` followed by your actual operational SQLite path in quotes when you use that option; use the same path your host startup uses. If you normally run on a custom port, also pass the same `--port` to the installer. Do not use an example path or invent a new database location.

3. Wait for successful completion. The signed installer validates the baseline, backs up managed files/database, runs typecheck/build and reuses existing dependencies when their inputs match. This release changes no dependency inputs or startup scripts. It adds workflow snapshot tables, a deletion trigger and local reference-revision triggers; it does not rewrite authoritative records/reviews/accounts/preferences or recompute saved addresses.
4. Restart normally (`npm start` for the production installation, or `npm run dev` for the development setup) and refresh browsers. Check the displayed 3.5.0 version, existing users/Groups/batches, Compare batches, a read-only correction preview, and export counts. Keep the installer log and backup until verification is complete.

The download site delivers v3.5 as a patch. For a **new installation**, extract the retained v3.4 full source, install dependencies there with Node24/npm ci, and apply this v3.5 patch before first normal use. No replacement full v3.5 source ZIP needs to be installed over an existing app. Current compact documentation contains text guides; historical binary guides/screenshots remain under hybrid-address/docs in the retained v3.4 source ZIP.

### Rollback and capacity

Follow PATCHING.md and the installer's recovery instructions. A code rollback leaves additive workflow tables unused, but cannot undo already-applied corrections/decisions/exports. Restore a matching operational backup only with a plan to reconcile newer work. Do not copy a live SQLite file without its coordinated backup procedure.

Comparisons materialize durable compact snapshots; large dual batches consume memory, SQLite space and brief write locks. Pages are bounded, but creating a comparison is synchronous in this release. Limit concurrent comparison creation on a small host. The 25k probe and timings are a local single-process measurement, not a concurrent-user capacity guarantee. Bulk preview caps the considered selection at1,000. Current preview retention is thirty minutes; applied receipts remain for audit. Backups should include the same authoritative database as before. No new external service or dependency is required.

## ELT

Batch comparison focuses review on changed records; optional decision reuse is explicit and attributable. Bulk previews reduce repetitive corrections without silently passing data. Changes-only output provides a compact approved correction feed, while preserving complete source/history and accurate distinct export coverage. Neither a Pass nor an export certifies address deliverability or releases a payment.
