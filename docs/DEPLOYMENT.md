# Deployment

Use Node.js 24 LTS on a local/internal server with durable writable disk and native better-sqlite3 support. Install compiler tools if the platform cannot use a prebuilt binary. SQLite is not suitable for ephemeral edge Workers. Do not deploy this stateful app to an ephemeral/serverless filesystem.

```bash
npm ci
npm run db:seed
npm test
npm run build
npm start
```

`ADDRESS_DB_PATH=/secure/path/address.db` selects database location. Back up using SQLite online backup or a stopped service (include WAL appropriately); test restoration. Protect source/data paths, never place database or uploads under public/. Uploads are not retained as files; original row data, results and review history are persisted locally. Export contains sensitive source data; handle under the organization's data policy. No full addresses are logged by application code. No external validation calls are made.

This release includes local authenticated sessions, enforced Admin/User roles and source-Group record authorization. Read [credentials, roles and groups](AUTH_ROLES_AND_GROUPS.md) for first login, upgrade, group import, password resets and session revocation. Typed initials are stored separately from the authenticated audit actor. Public-facing hosting still requires TLS, request/resource controls, operational monitoring and independent security/load review; SSO/MFA and retention automation are not included.

Upload limits20MB/50k rows and150MB advertised ZIP expansion. XLSX only, no macros/external links; formulas in analyzed fields/Group are rejected. Extra-column formulas are treated as inert source data and never executed. ExcelJS/JSZip parse locally, no embedded code execution. Resource isolation remains recommended for hostile inputs; ZIP metadata checks are not a complete sandbox.

Private/internal service only. No publication or external address transfer was requested or performed. For later database migration implement ReferenceRepository and replace operational SQLite repositories/transactions with equivalent durable semantics. Threshold policy is in domain.ts; review changes in policy with regression validation.

## v1.8 durable worker and managed snapshots

npm run dev and npm start supervise both the web server and worker. Use durable local disk and a long-running Node service; a browser disconnect does not stop queued jobs. Keep operational database and all registered reference files together in backup/restore. Additive tables preserve existing batches/reviews. Configure MWTSI_ADMIN_TOKEN for reference mutation protection when needed; it does not provide SSO or batch authorization. Use the reference management screen instead of overwriting registered snapshots. See [the workflow/IT runbook](WORKFLOW_MANAGEMENT_v1.8.md) for leases, checkpoints, recovery, retention boundaries and snapshot staging/rollback.

## v1.12 patch maintenance

Existing installations should use signed version-specific patches rather than full source replacement. The host operator stops the service/workers and runs the local updater, which preserves operational data/configuration, snapshots SQLite, backs up changed code/build, skips unchanged dependencies, builds in place and supports recovery/rollback. Runtime leases prevent supported launchers from starting during maintenance. Backups are outside the application tree; .mwtsi is operational state and must not be shipped. See PATCHING.md for bootstrap and subsequent commands, database/port/environment settings, locks, additive schema compatibility and backup retention. App Admin role does not itself grant host filesystem/service permissions; maintenance runs as the installation's host operator.
