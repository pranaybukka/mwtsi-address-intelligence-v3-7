# Updating MWTSI with patches

## Current update: v3.5.1

The final **mwtsi-patch-to-v3-5-1.zip** directly upgrades **3.4.0 or3.5.0**. It includes all v3.5 batch workflows and a saved-preview loading cancellation fix. Only one bundle is needed from either starting version. See [exact commands](BATCH_WORKFLOWS_v3.5.1.md) and [the full workflow](BATCH_WORKFLOWS_v3.5.md).

## Previous update: v3.5.0

The **mwtsi-patch-to-v3-5.zip** bundle directly upgrades **3.4.0**. It adds exact source Key+Group batch comparison and optional safely reproduced prior Pass decisions, stored bulk correction previews that save pending edits, and Admin changes-only field exports. Additive SQLite workflow tables/reference revision triggers preserve existing data; no dependency/startup-script change. Users remain restricted to their assigned Group and cannot export. Existing batches without new provenance remain comparable but do not gain decision reuse automatically. See [workflow, limitations, exact commands and recovery](BATCH_WORKFLOWS_v3.5.md). For new installs use retained v3.4 source plus this patch.

## Previous update: v3.4.0

The **mwtsi-patch-to-v3-4.zip** bundle directly upgrades **3.3.0**. Live Translate adds separate structured/hybrid PstlAdr XML previews, copy controls, local element corrections and explicit missing/overflow/unmapped findings. Slash output and shared batch processing remain unchanged. No dependency, schema, startup, permission or export-format changes. Data, decisions, settings and preferences remain in place. See [ISO workflow and exact update commands](ISO_POSTAL_LIVE_v3.4.md).

## Previous update: v3.3.0

The **mwtsi-patch-to-v3-3.zip** bundle directly upgrades **3.2.0**. It adds a source/output comparison canvas with the editor beside a sticky source panel, plain-language output/loss/history for Users and expandable technical rule details for Admins. Live Translate follows the same role presentation. No dependencies, schema, startup, processing or export changes. Existing data and preferences stay in place. See [workflow, role differences and exact commands](RECORD_REVIEW_v3.3.md).

## Previous update: v3.2.0

The **mwtsi-patch-to-v3-2.zip** bundle directly upgrades **3.1.0**. It corrects a redundant postal/state candidate already retained in primary 2a, makes long dual review headings usable, updates edited-preview validation, and adds clearer candidate/capacity/postal explanations. No dependency, startup or schema changes. Existing source, records, preferences and history remain in place; saved batches are not silently reprocessed. See [regression findings and update commands](REGRESSION_UI_v3.2.md).

## Previous update: v3.1.0

The **mwtsi-patch-to-v3-1.zip** bundle directly upgrades **3.0.0**. It adds six account-specific color schemes in Dark and Light mode, immediate preview/cancel/reset and explicit server-side preference saving. Existing accounts default to Aurora dark. The additive user_appearance table does not rewrite records, accounts or Groups; a delete-account trigger clears its preferences. Address rules, postal settings, exports, startup scripts and dependency inputs are unchanged. See [appearance, support and exact commands](APPEARANCE_v3.1.md). Earlier versions first follow the retained patches to v3.0.0. A code rollback ignores the retained preference table; it does not restore or erase operational data.

## Previous update: v3.0.0

The **mwtsi-patch-to-v3.zip** bundle directly upgrades **2.3.2**. It adds independent BNP/ORP processing within one source record, joint review, block filters/counts and one-row combined exports, plus mandatory acknowledgement before explicit Pass of output missing 1/ or 3/. Bulk Pass is revision-fenced and requires acknowledgement where applicable. Derived indexes are rebuilt additively; authoritative old records/history stay unchanged. No dependency/startup-script change. See [workflow, API compatibility and exact commands](V3_DUAL_ADDRESS_AND_PASS_WARNINGS.md). Old batches remain BNP-only; reimport with the dual profile to analyze preserved ORP extras. Code-only rollback cannot reinterpret new dual data; use matching backups/reconcile newer work.

## Previous update: v2.3.2

The **mwtsi-patch-to-v2-3-2.zip** bundle directly upgrades **2.3.1**. It corrects shared street recognition so a five-digit house number is not postal evidence and a word such as LINCOLN inside a DRIVE street is not independent town evidence. Live translate, direct uploads and worker processing use the same fix. Existing saved results/history are not recalculated; re-upload affected workbooks for full reanalysis. No dependency, startup or operational-schema change; Hybrid priorities stay the same. See [root cause and exact update commands](POSTAL_STREET_CONTEXT_FIX_v2.3.2.md).

## Previous update: v2.3.1

The **mwtsi-patch-to-v2-3-1.zip** bundle directly upgrades **2.3.0**. Successful Pass/Fail decisions automatically open the next record in the current report, preserving Group, status, search, dashboard focus, export tracking and sort order. At the end, review closes with confirmation. Failed saves stay open; a navigation retry does not resubmit a saved decision. No dependency, startup, processing-rule or operational-schema change. See [review advance and exact commands](REVIEW_AUTO_ADVANCE_v2.3.1.md). Earlier installations first reach v2.3.0 using the retained patch sequence.

## Previous update: v2.3.0

The **mwtsi-patch-to-v2-3.zip** bundle directly upgrades **2.2.0** with live Name/address entry, shared Hybrid preview and copy-ready selected output for both roles. No dependency, startup, processing-rule or operational-schema change. See [live translation and exact update commands](LIVE_TRANSLATION_v2.3.md). Earlier versions follow the retained sequence below; never bypass local source conflicts.

## Previous update: v2.2.0

The **mwtsi-patch-to-v2-2.zip** bundle directly upgrades **2.1.0** with a dedicated insights dashboard, MWTSI routing globe and Previous/Next review. Dependencies, scripts/serve.ts and operational schema are unchanged. See [UI assessment](UI_ASSESSMENT_v2.2.md) and [exact upgrade instructions](UI_REFRESH_v2.2.md). v2.0.0/v2.0.1 first apply v2.1.0 below. Never bypass a local-source conflict.

## Previous update: v2.1.0

The **mwtsi-patch-to-v2-1.zip** bundle directly upgrades 2.0.0 or 2.0.1 with durable unique export coverage and additive SQLite history. No dependency change or scripts/serve.ts replacement is included. See [export tracking and upgrade commands](EXPORT_TRACKING_v2.1.md). Pre-existing batches have incomplete historical coverage; the migration does not fabricate past exports.

## Previous update: v2.0.1

The incremental **mwtsi-patch-to-v2-0-1.zip** directly upgrades v2.0.0 with selected Hybrid rule labels in Record Review. Earlier versions first use the major-version path below. See [candidate review and upgrade commands](HYBRID_CANDIDATE_REVIEW_v2.0.1.md). The UI patch does not modify scripts/serve.ts or bypass local source conflicts.

## Current major release: v2.0.0

Use **mwtsi-patch-to-v2.zip** for a direct upgrade from 1.13.0, 1.13.1 or 1.13.2. Earlier supported versions (1.10.0 through 1.12.5) first apply the retained universal 1.13.2 patch, then v2. Stop all app/worker processes before each step. The current bundle includes the installer and matching signed payloads; no reinstall or dependency upgrade is required. See [V2_UPGRADE_AND_OPERATIONS.md](V2_UPGRADE_AND_OPERATIONS.md) for exact commands, additive index warming, reservation behavior, export recovery and benchmarking.

The first-patch examples below describe the original updater rollout. For a current upgrade, substitute the current bundle location and follow the starting-version sequence above.

## What changes from now on

Existing installations receive versioned update patches. Keep the same application folder, database, accounts, groups and reference data. You do not uninstall the app, extract a complete replacement application, reseed data or set up accounts again. A patch replaces only its declared changed application files and builds the updated app in place. Updates require a short stop/restart on the host computer; other computers reconnect after the host restarts.

The first patch installs this updater into supported existing releases: 1.10.0, 1.11.0, 1.11.1 and 1.12.0. The bootstrap ZIP chooses the matching patch from the installed package.json version. It includes the current signed-in Pass/reason-only Fail behavior when upgrading from a release that predates it. A separate full source ZIP remains available for new installations and disaster recovery.

## First patch: no reinstall

1. Download and extract **mwtsi-patch-to-v1-12-1.zip** somewhere outside your application folder, such as Downloads. Keep its files and patches subfolder together. It contains the installer, public verification key and supported version-specific patches.
2. On the host, stop the app with Ctrl+C, or stop its service. Stop separate workers and reference-install/import commands too. Do not run a patch on each remote computer: patch the shared host once.
3. Open a terminal in your existing application folder (the folder containing package.json). Use Node.js 24 LTS or newer.
4. Run the following, substituting the path to the extracted patch folder. The same Node command works on Windows, macOS and Linux:

```text
node "/full/path/mwtsi-patch-to-v1-12-1/apply-patch.mjs" --app "."
```

On Windows the quoted first path can be, for example, C:\Users\Manny\Downloads\mwtsi-patch-to-v1-12-1\apply-patch.mjs. On macOS it can be /Users/manny/Downloads/mwtsi-patch-to-v1-12-1/apply-patch.mjs. Do not point --app at a newly extracted full application: point it at the existing installation you currently use.

5. The installer prints the resulting version, backup location and whether dependencies were updated. Wait for **Patch operation complete**. Start the app using your normal command:

```text
npm start
```

If you normally use development mode, restart with npm run dev instead. The installer already builds the production application, so a separate npm run build is not required. Do not run npm ci yourself for each patch: the updater decides whether dependencies need changing.

6. Hard-refresh connected browsers. Sign in using your existing accounts. Only an installation upgraded from v1.10, before credentials existed, initializes the first admin / 123456 login and requires its password change; existing credentials are never reset by a patch.

## Future patches

After this first update, use the installed updater from your existing application folder:

```text
npm run update -- "/full/path/to/the-matching-update.mwtpatch"
```

Stop the app/workers before applying, wait for completion, then restart normally. Release downloads will state the required starting version and target version. A patch for a different starting version is rejected before application files change; use the matching patch or the documented sequence. A missing full source installation or missing Node runtime is not repaired by an update patch.

For a read-only package/version/source-conflict check:

```text
npm run update -- "/full/path/update.mwtpatch" --check
```

To see installed version, recent patch history and whether recovery is needed:

```text
npm run update:status
```

The first external installer also supports --check and --status before the updater is installed. --check does not replace files or build, and can run while the app is active. Application/source checks are repeated when applying the patch.

## Custom database, port and environment

Run maintenance using the same environment as the host service. The updater reads the installation's Next environment files when the installed Next environment loader is available; production is the default. If you use development-specific environment files, add --mode dev. Existing .env files are never part of a patch.

For a custom operational database or port, pass them explicitly when they are not already set in that environment:

```text
npm run update -- "/full/path/update.mwtpatch" --database "/full/path/address.db" --port 3001
```

These options also work with the first external installer. Use the actual operational database path so the correct database is backed up. Relative database paths resolve inside the existing app folder. ADDRESS_DB_PATH and PORT are also respected. A missing default database is allowed only for an unused installation; the updater does not create a new customer database or copy data into a different path.

The launcher retains loopback binding by default. Existing next.config.ts is preserved, including LAN allowedDevOrigins settings. From v1.12 the launcher also forwards explicit Next CLI arguments, so npm start -- --hostname 0.0.0.0 or npm run dev -- --hostname 0.0.0.0 can be used when deliberately configuring network access. Authentication, TLS/VPN and development-origin configuration remain separate requirements.

## What the installer protects

- Ed25519 signature and per-file SHA-256 checksums validate packages against the updater's trusted public key. A corrupt/altered package, unsupported version or unsupported Node requirement is rejected.
- Only declared application source, scripts, documentation, tests and selected project metadata can change. The installer rejects traversal, drive paths, backslashes, Windows reserved names, case-colliding entries, source symlinks and protected destinations.
- data, operational SQLite files, reference databases/archives, .env files, next.config.ts, node_modules as patch payload, samples, .git, work, attachments and maintenance state are excluded from patch payloads. Unknown local files are left alone. A changed managed file with unexpected contents causes a conflict rather than being overwritten. Custom source-code changes may require a matching patch or a reviewed merge.
- With unchanged locked dependencies, existing node_modules is reused. If the dependency graph changes or Next is missing, the updater runs npm ci --include=dev itself, then builds using the host's Node runtime. Native modules are installed for that host; no macOS node_modules are shipped to Windows.
- Supported launchers/workers/reference installers and patch build/install subprocesses register runtime leases. Recovery refuses to race a build subprocess that survived its updater parent. Maintenance and startup share a lock, and incomplete patches block supported v1.12+ startup until recovery. First upgrades also check the service port and the legacy worker PID recorded in the operational database. Custom launchers/independent scripts still must be stopped explicitly.

## Backups and failed updates

Before changing application files, the updater backs up the old versions of every affected file, the previous .next build if present, and a consistent SQLite backup of the operational database when it exists. Backups are stored next to the application folder in **APPLICATION_FOLDER.mwtsi-backups/BACKUP_ID**, outside the build/source tree. A protected .mwtsi folder inside the app holds maintenance locks, history and the current operation journal. Backups may contain personal data and password hashes: protect them under your host's access and backup policy. Disk must have room for the operational database snapshot and previous build; the large unchanged reference databases are not copied.

If dependency installation or build fails after files change, the updater attempts to restore the previous application files/build automatically. It also reinstalls the old locked dependencies if dependency installation was attempted. If the previous app had only a development build, restart in the same development mode you used before.

If rollback cannot finish, or the process/host was interrupted, keep the app stopped and run:

```text
npm run update -- --recover
```

Keep the extracted external installer: if a first-time update was interrupted before the update command was installed, or rollback removes it, run recovery through that external copy instead:

```text
node "/full/path/mwtsi-patch-to-v1-12-1/apply-patch.mjs" --app "." --recover
```

Recovery restores the application from the durable backup. It does not automatically retry the failed update. Correct the underlying disk/permission/network/build issue, check the package again and rerun the patch. Do not delete the journal/backups to force startup. A malformed lock or an interrupted .reclaim lock may require a host operator to verify that all app/updater processes are stopped, remove only that identified stale lock and rerun recovery. Legacy launchers predating v1.12 cannot enforce the new recovery marker themselves, so first-upgrade operators must not restart after an interruption until recovery completes.

## Returning to the previous version

Stop the app/workers and use the backup ID shown in patch status/output:

```text
npm run update -- --rollback BACKUP_ID
```

If rolling back the first update removes the updater, the external installer can perform the same command using --app and --rollback. A rollback must match the current installed version and refuses to overwrite managed files edited since the patch. Backup checksums are verified before restoration.

Rollback restores **code and build**, preserving the current operational database. Reviews, user changes and batches created after an update are not erased. The database snapshot remains available for a deliberate database restore under the existing IT recovery procedure; do not copy it over current data as part of an ordinary code rollback. Restoring an older release also restores that release's access-control behavior, so choose a suitable fallback release before sharing access.

Retain the most recent working backup and the external installer. Older backups can be removed under your retention policy after the release has been accepted and an independent operational backup exists. There is no automatic backup deletion.

## Release administration

Patches are signed by the release publisher. The trusted updater/key must initially come from the trusted download page, just as the original application did; replacing both an installer and its key defeats that initial trust. Private signing keys are kept outside application/download archives. The release builder refuses private-key PEM content and never includes runtime trees. Signing-key custody/backup and any deliberate trust-key rotation belong to the release operator.

scripts/create-patch.mjs generates a patch from a previous official source ZIP and a target source tree. Set MWTSI_PATCH_SIGNING_KEY_FILE to a protected Ed25519 private-key file, then pass --base, --target and --out. Do not distribute that private key. Versioned source archives remain available as release baselines; customers install the small signed patch rather than replacing their installation.

This patch format is for application updates with preserved data and additive-compatible database changes. Destructive migrations, data resets or incompatible rollback assumptions require a separate reviewed migration process; the updater never silently restores/rewrites a live operational database. Release validation must include compatibility/migration checks when schema or data contracts change. No automatic internet update service or remote executable-upload API is enabled.

## v1.12.1 local dependency permissions

The replacement first-patch bundle preserves a local package.json allowScripts boolean map. It verifies the signed release baseline and every other package setting before merging that policy; formatting/key ordering alone do not block a package update. Unrelated source/package/dependency changes still require review, and signatures/checksums remain enforced. Use the newly extracted installer if the old v1.12 installer reported a package.json conflict. See PACKAGE_POLICY_FIX.md for the exact retry commands and root cause.
