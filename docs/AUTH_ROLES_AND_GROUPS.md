# Credentials, roles and groups — v1.11.1

## First login and upgrading

Back up the operational SQLite database before upgrading; keep the existing data directory and ADDRESS_DB_PATH. Stop the app and worker, replace application source, run npm ci, npm run build and npm start from the application folder. The additive schema creates credential/session/group/audit tables and a record Group index. Existing batches, source values, decisions, jobs, settings and reference files are preserved. Never replace your operational database with a test database. The first application access initializes exactly one Admin named admin, with temporary password 123456, only when authentication has never been initialized for that database. Restarts never reset the password.

Sign in at /login. A mandatory password-change screen prevents accessing data until the temporary password is replaced. Enter the current password and choose a different password of 12–128 characters, then confirm it. Do this on the trusted host before giving other people access. Every newly created account and Admin password reset requires this first-login change. There is no self-registration or unauthenticated password reset.

## Admin workflow

Use Users and groups in the workspace header. Create an account with a unique username, role, temporary password, active status and, for User accounts, a Group. Usernames accept 1–64 letters, numbers, dots, underscores or hyphens; comparison is case-insensitive. Admins have all-record access, independent of Group.

Edit an account to change its username, role, assigned Group or active status. Leave Reset password blank to preserve the password, or provide a new temporary password. Any account edit invalidates its existing sessions so the person must sign in again with the updated access. Disable an account to prevent sign-in; delete it to remove credentials and sessions. Previously recorded review/account audit history remains. You cannot delete, disable or demote your own Admin account, and at least one active Admin must remain. Updating your own account requires signing in again.

## Group management and import

Create group names manually under Manage groups, or choose a CSV/XLSX file under Group import file and click Import groups. Required column header: Group (case-insensitive; surrounding header spaces ignored). Excel imports find a worksheet containing that header. Other columns are ignored. Each following row supplies one name; empty cells are skipped. A name is nonblank text up to 200 characters without control characters. CSV names containing commas must be quoted. Excel formula/object cells are rejected. All rows are validated before any new group is committed.

Imports accept up to 2 MB and 10,000 data rows. Browser filename/path metadata and MIME variations do not locate files or reject valid workbooks; parsing uses uploaded bytes. Duplicate/existing exact names are skipped, with a created/skipped count. Existing dataset names register automatically when the Admin group catalog is opened, including groups in older batches. Registration does not rewrite source Group values.

CSV example:

```csv
Group
Operations
Treasury
"São Paulo, Operations"
```

A newly created/imported group can be assigned before any records are loaded. Importing group names does not upload address records, create users or move records between groups. Group names are exact and case-sensitive, including spaces, matching the preserved dataset Group values. Operations and operations are different groups. The same Group name across multiple datasets grants access to that Group in each dataset. Blank/absent source Groups are visible only to Admins. Unassigned Users see no records.

## User workflow

After signing in and changing the temporary password, Users see Assigned batches. Choose a batch to open only the records in the assigned Group. Summary counts, search, status filters and sorting operate on those permitted rows. Original source and the proposed Hybrid output remain visible for comparison. Edit the structured proposal and confirm Pass or Fail at the top; Pass immediately saves as the signed-in account without an identity-entry popup. Fail displays the signed-in account and requires only a reason in its popup. Edits save with either decision. Corrections remain optional. The User cannot change the preserved source Group to gain access to another group.

Pass all pending applies to the User's assigned records only. Mixed-group selections are rejected atomically; responses do not include another group's rows. Direct guessed record or hidden batch URLs return not found. Users cannot upload, create demonstration batches, download templates, export, change processing settings, administer jobs/references, or manage users/groups. These permissions are checked by API handlers even when a caller bypasses the UI. Users may read processing/reference information and use postal suggestions while reviewing; they cannot change those settings.

## Session and audit behavior

Passwords use per-password random salts and scrypt (N=32768, r=8, p=1, 64-byte key); plaintext passwords are never persisted. Sessions use random 256-bit tokens with only SHA-256 token hashes in SQLite, expire after eight hours, and use HttpOnly, SameSite=Strict cookies. All protected pages and APIs verify the current database account and password-change flag; private API responses are not cached. Logout, password changes, Admin account edits, resets and deletion revoke sessions. Five failed login attempts for a username within 15 minutes temporarily block further sign-in for that username.

New review events include actorId and actorUsername from the authenticated session, with reviewer set to that username. No initials or reviewer entry is needed; browser-supplied identity cannot override the session. Historical typed initials/reviewer values remain unchanged. Single and bulk review event payloads and event table rows commit atomically with the record version. Old reviews remain unchanged and have no authenticated actor backfilled. Review/account/group audit data remains after an account is deleted. Passwords and session tokens are not written to audit details.

## Hosting and backups

The downloadable application runs on your host; the download page does not host its database or accounts. All client computers must connect to the same application server/operational database. Keep the existing database location consistent across service restarts. The launcher binds to loopback by default; network binding and TLS/VPN must be configured deliberately for shared access. npm run dev also needs an explicit Next.js allowedDevOrigins entry for a LAN/VPN hostname; this is separate from application authentication.

Use HTTPS or a private VPN when transmitting credentials remotely. ADDRESS_SECURE_COOKIES=true forces Secure cookies for HTTPS deployments behind a trusted reverse proxy. It must not be enabled for plain HTTP clients. Reverse proxies must preserve Host and use a deployment configuration that makes the application's same-origin check see the public scheme; do not disable the check. This release does not configure the proxy or expose the app publicly.

Back up the complete operational SQLite database (including its authentication tables) and registered reference files using the documented SQLite backup procedure. Protect and encrypt backups under your IT policy: password hashes, review history and source records are sensitive. Do not delete authentication tables to reset a forgotten password. Keep a second trusted Admin account for recovery through the supported Admin screen. SSO/MFA, email recovery, public-hosting infrastructure, application-level encryption and retention automation remain separate work.

## Verification

See VERIFICATION.md for this release's test evidence. Automated checks cover mandatory password changes; every protected API without a session; all Admin-only endpoints as a User; mixed/blank/unassigned group isolation; direct record-ID access; edit/pass/fail and authenticated audit; atomic bulk actions; account CRUD/reset/disable/session revocation; duplicate users and self-lockout prevention; expiry, logout and origin checks; failed-login limiting; and CSV/XLSX group imports with path-like metadata, Unicode, duplicates and invalid content. Native Windows/macOS browser verification remains pending.
