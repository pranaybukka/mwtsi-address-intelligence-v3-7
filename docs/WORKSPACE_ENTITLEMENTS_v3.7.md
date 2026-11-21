# MWTSI Address Intelligence v3.7 — Workspace entitlements

## Configure User access

Sign in as Admin, open **Users and groups**, edit a User and select **Workspace entitlements**. Save the account. The affected User must sign in again; saved changes invalidate existing sessions immediately. Session polling redirects an already open workspace to login within about 30 seconds, and new server requests are checked immediately.

| Entitlement | User behavior |
| --- | --- |
| Live translate | Translate and copy one-off name/address input. |
| Compare batches | Compare assigned-Group records and preview/reuse approved decisions. |
| Bulk corrections | Preview and apply pending corrections within the assigned Group. |
| Upload addresses | Inspect/upload workbooks whose every row has Group exactly equal to the assigned Group; manage own jobs. |
| Export results | Download assigned-Group results and changes; manage own prepared exports. |
| Payment message lab | Generate/copy/download test payment XML, use the BIC directory and hand off saved approved addresses within the assigned Group. |

Select all or clear all is available. Clearing all leaves assigned-Group record review available. Existing Users without a saved entitlement configuration keep Live translate, Compare batches and Bulk corrections, matching earlier behavior. Upload, Export and Payment message lab default off. New User forms use those same defaults. Admins always retain every option.

Navigation, direct page requests and backend operations enforce grants. Entitlements do not grant account administration, Group management, reference/settings management, demonstration-data creation or batch deletion. A User cannot change their own entitlements.

Operational record access requires an exact, nonempty assigned Group. Users can review all records within that Group, including another user's batches; upload drafts/jobs and prepared exports additionally belong to their requesting account. Existing unowned upload resources remain Admin-only. Uploads with mixed, blank or foreign Groups are rejected before any rows import. Use the assigned-Group template and map the Group column. No Group is silently rewritten. One-off translation and synthetic payment tests can work without an assigned Group, but record access and upload cannot.

Revoking upload access, disabling the owner or changing their Group cancels their upload worker at its next checkpoint; already committed rows stay saved. Prepared exports recheck access and Group at generation/checkpoints/download. Reassigning a User prevents access to prior-Group exports. A queued User export stays pinned to its original Group after promotion to Admin. Payment XML copy/download and Live translate copy belong to those feature grants; Export results governs operational address exports.

## Install on a Mac

Requires **Node.js 24 LTS**. The full release contains `package-lock.json`, so `npm ci` works from the extracted **hybrid-address** folder:

```bash
npm ci
npm run build
npm start
```

For an existing v3.6 (or v3.5.1) installation:

1. Stop the app and worker. Back up the actual operational SQLite database consistently while stopped, using your existing procedure, and retain the entire old application folder.
2. Extract the v3.7 ZIP into a **new separate folder**. Reconcile local source customizations; do not unzip over your edited application.
3. Deliberately copy your required existing `.env`/`.env.local` settings. Set absolute `ADDRESS_DB_PATH` and `ADDRESS_REFERENCE_DB_PATH` pointing to your retained operational and reference databases. Preserve bind host, port and secure-cookie settings. The default paths in a new folder would create a new installation. This release contains no operational database or account passwords.
4. Run the commands above in the new `hybrid-address` folder, then use your normal startup command and hostname/port. Verify existing accounts, Groups, batches and reviews.
5. As Admin, edit a test User, grant the desired options and save. Sign in again as that User and verify their navigation and Group scope before normal work.

Two additive tables store user grants and upload-resource ownership. Existing account, batch, record and history columns are unchanged. Existing legacy User permissions are preserved. Keep the old folder and consistent database backup until validation is complete. Code rollback does not undo new operational decisions; reconcile later work before any database restore.

## Signed patch preparation

The updater trust key is unchanged. The original private release signing key is unavailable here, so this download is a full-source release, **not an already signed incremental patch**. The companion signing preparation kit contains the v3.6 source baseline and instructions to build a v3.6 → v3.7 patch locally using your original private signing key and the existing trusted builder. Do not upload that key or bypass signature/source-conflict checks. Without that key, use the full-source upgrade above.

The Payment Message Lab remains test-only. Its v3.6 guide describes the XML features and validation limits; this guide supersedes its Admin-only access statements.

## Verification

- 638 unit/integration tests passed; 10 opt-in fixture tests skipped.
- TypeScript and production Next.js build passed.
- Focused tests cover all six independent gates, defaults, grant validation, session invalidation, cross-Group denial, upload ownership/revocation, export ownership/reassignment/promotion and Admin API denial.
- Production HTTP checks verify the Admin editor, six granted/denied pages, backend gates and session revocation.
- Real-browser visual workflows and native macOS execution were not verified in this environment.
