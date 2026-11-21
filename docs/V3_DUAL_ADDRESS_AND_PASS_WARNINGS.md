# MWTSI v3.0 — BNP + ORP and missing-line Pass warnings

v3 keeps one source record, Key, Group, reservation, decision, version and export identity. It independently analyzes BNP and ORP using the same existing Name/address engine, reference data and captured postal lookup setting. One Pass/Fail decision covers the complete record. There are no separate block approvals.

## Upload and mapping

Download the BNP + ORP template from Upload addresses. Suggested headers are:

| BNP | ORP |
| --- | --- |
| BNP_Name | ORP_Name |
| BNP_Address1 | ORP_Address1 |
| BNP_Address2 | ORP_Address2 |
| BNP_Address3 | ORP_Address3 |
| BNP_Bank_Country | ORP_Bank_Country |

Group and Key Field are shared. Other source columns remain preserved without becoming address evidence. Leading-zero postal codes must be supplied as text in analyzed address fields, as before.

The mapper automatically suggests prefixed columns and opens for detected ORP fields. Choose **BNP + ORP** to analyze both. Map Name and Address1 for each block; other address fields can be Not supplied. Source headers can differ from these suggestions. A source column cannot accidentally map to two analyzed fields. BNP and ORP countries, postals, names and locality evidence are never copied between blocks.

Choose **BNP only** to retain ORP-like source columns as unanalysed extras. Existing unprefixed Name/Address1/Address2/Address3/Bank_Country files remain BNP-only. A dual profile's wholly blank required block is retained with a review finding; partially populated and Name-only blocks use the normal processing policies. Upload limits remain 20 MB/50,000 rows. The worker checkpoints source records after both outputs are available and retains the captured profile/settings across pause, resume and restart.

## Review and decisions

Record Review shows the Key and both names. BNP/ORP tabs show each block's Hybrid validation and analysis status. Each tab retains original source beside proposed output, structured edits, evidence and all priority/postal details. Edits survive tab changes. Arrow keys/Home/End navigate the tabs. Review reasons are labelled BNP or ORP at the top.

Pass saves the current proposal for both blocks and records the signed-in user. Fail requires a reason and records both snapshots. Failed/rejected records remain editable by Admins and exact assigned-Group Users. Each decision increments the record version once, appends one event and releases its row reservation. Previous/Next and automatic advancement follow the captured filtered report, one source record at a time.

### Missing 1/ or 3/ warning

Before an explicit Pass, every enabled block is checked for a Name line beginning **1/** and a Country/Town line beginning **3/**. Missing lines open a **Missing Hybrid lines** dialog identifying BNP, ORP or both and the missing line types.

- **Return to review** cancels without saving or advancing and preserves edits.
- **Pass anyway** explicitly acknowledges the warning, saves the signed decision and advances normally.
- Intentionally Name-only output also warns for its absent 3/ line and explains why it is absent. It can still be passed.
- The warning checks the proposed edited output. Entering a Name can remove a missing 1/ warning; deleting it can create one.
- Findings are retained. Acknowledgement does not create a placeholder Name/Country, erase failed checks or certify deliverability.

Pass all pending first reads a scope/revision-fenced preview. If any pending records are missing 1/ or 3/, the batch confirmation lists a count and up to 20 example record/block identifiers. Confirm Pass stays disabled until the missing-line acknowledgement checkbox is selected. The save is atomic; a stale revision, reservation conflict or missing acknowledgement saves no partial selection. Scope remains every pending record in the batch for Admins, or the assigned Group for Users, including rows outside current table filters.

The server independently checks final outputs before writing. Affected Pass requests return 409 with code MISSING_HYBRID_LINES_ACK_REQUIRED unless acknowledgeMissingLines is boolean true. Failed or cancelled requests do not advance. The accepted warning is recorded in the signed review event and full export; API integrations must present it to the operator before setting acknowledgement.

## Dashboard, filtering and exports

Record totals and address-block totals are separate: 25,000 dual records contain 50,000 blocks. Existing record readiness, decision, Group and export totals count each source record once. Automatic readiness reflects both required blocks; explicit human Pass can still accept unresolved findings.

Address-block filters include BNP/ORP findings, Hybrid pass/fail, both blocks with findings, dual records and missing 1/ or 3/. Explicit compound choices support BNP Hybrid pass AND ORP findings, or the reverse. Multiple selected choices retain the existing ANY-match rule with no duplicate records. Search includes both structured blocks. Dashboard block counts follow the same authorized Batch/Group/status selection; findings remain visible after acceptance and may overlap.

Both export formats produce one Results row per source record:

- **Source + Hybrid:** preserved original columns plus BNP_Hybrid_Line1–4 and ORP_Hybrid_Line1–4 for dual data.
- **Full analysis:** shared record/decision metadata, separately prefixed BNP/ORP fields, validations, evidence, candidates and both Hybrid outputs, plus Summary and lossless Audit chunks.

A computed heading colliding with an original source heading is prefixed Remediation., retaining both values and a heading note. Both block analyses and joint review events are retained in the full audit. BNP-only batches retain their legacy unprefixed outputs, with an added full-analysis missing-line acknowledgement field. Repeated exports count distinct internal record IDs; exporting two address blocks does not count as two exported records. Users remain unable to upload/export; their data, counts, reservations and review actions remain Group-scoped.

Live translate continues to provide one-off address entry and copy-ready output using the same address engine. Dual-record upload, review and export are selected through the batch profile.

## Existing data and technical compatibility

Old saved records and review/export history are not reprocessed or rewritten. Existing rows are presented as BNP-only; previously stored ORP extra columns remain extras until an explicit dual-profile reimport. New dual records use schemaVersion: 3, retaining the BNP intelligence/Hybrid projection at the top level, independent BNP status/validation/reasons fields, aggregate row status/validation/reasons and nested orp analysis. Consumers should use the address-block helpers or documented BNP/ORP export fields rather than assume the top-level validation describes only BNP.

Derived record indexes/totals are rebuilt additively under address-block-index-schema=3. Authoritative record IDs, original source, decisions, actors, Groups and export memberships are retained. No dependency or startup-script change is required. New joint events include per-block before/after/output snapshots and acknowledgedMissingLines when applicable; old events remain unchanged.

Before reverting to old application code after creating dual data, use a matching application/database backup and reconcile newer work. Older code does not understand both blocks; a code-only downgrade does not undo new operational data. See PATCHING.md for backups/recovery.

## Apply v3 without reinstalling

This signed direct patch requires installed **2.3.2** and Node.js 24 or newer. Earlier installations first follow the retained patches to 2.3.2. Download/extract **mwtsi-patch-to-v3.zip** beside the existing app folder; keep installer and patches subfolder together. Stop the host app and separate workers, and open a terminal in the existing application folder containing package.json:

```text
node -p "require('./package.json').version"
node "../mwtsi-patch-to-v3/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v3/apply-patch.mjs" --app "."
```

The same Node commands work on macOS, Windows and Linux. Replace the first quoted path with the actual extracted location when needed. Never use a literal placeholder or bypass local-source conflicts. The installer verifies the signature, backs up application/database, rebuilds and warms derived indexes. Wait for **Patch operation complete**. Start normally with npm start (or npm run dev if that is your usual command), then refresh connected browsers. No reinstall or routine npm ci is required; unchanged dependencies are reused. Local package.json allowScripts is preserved. Patch the shared host once.

## Acceptance checks

Upload a small BNP + ORP workbook with different countries/postals, a long Name, a missing Name and Name-only output. Check independent output and preserved originals; edit both tabs and record one joint decision. Cancel and acknowledge each missing-line warning; check bulk acknowledgement, signed history and automatic next-record navigation. Compare block/dashboard counts with distinct record/export counts and both formats. Repeat review as an assigned-Group User and confirm other Groups and upload/export remain inaccessible. Test old BNP-only batches and paused old jobs before operational rollout.

See VERIFICATION.md and the published verification/benchmark reports for measured evidence and execution limits.
