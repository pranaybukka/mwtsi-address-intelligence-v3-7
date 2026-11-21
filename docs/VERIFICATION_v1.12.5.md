# v1.12.5 Admin batch deletion verification

## Implementation

The batch, records, review-events, job/checkpoints, mapping, settings, Group access and dashboard storage paths were reviewed. A new Admin-only DELETE /api/batches/[id] requires matching target-ID confirmation and the existing authentication, password-change and origin checks. The database helper independently enforces Admin and deletes batch-owned rows within an immediate SQLite transaction. QUEUED/RUNNING jobs must first be paused/cancelled. The existing worker lease and review-version checks prevent resurrection. A minimal BATCH_DELETED accountability entry is retained without customer contents; other data, accounts/groups/reference/global settings are untouched.

Admin sees Delete batch beside an open batch and on inactive/complete processing jobs. The native modal identifies the filename/full ID/counts, explains all-Group scope and permanent review-history removal, and requires DELETE. Cancel/Escape does not mutate data. Success clears matching active/tracked selections and refreshes recent/jobs/dashboard views. Stale batch loads cannot restore a deleted selection; a concurrent Admin deletion refreshes local state after a 404.

## Automated checks

354 unit/integration tests across 29 files passed, including the full supplied 200-row workbook, 18,000-row name corpus, expanded-reference tests and prior priority, recovery, role, dashboard and patch regressions. Seventeen new deletion cases cover mixed-Group whole-batch cleanup, associated rows, minimal audit, all inactive/active job states, User/unassigned role rejection, authentication/origin/password checks, confirmation, repeat deletion, transaction rollback, a worker interrupted by cancellation/deletion, stale reviewers and retained User/group access to other batches. The generic authorization regression now also checks the new DELETE method.

All 49 Linux Chromium production browser checks passed: the existing 45 and four new deletion scenarios. New checks cover typed confirmation/cancellation, whole-batch deletion from a filtered view, active-selection/recent/dashboard refresh, User UI/API denial, a paused mapped upload deleted on mobile, failed-delete retry and concurrent deletion. Typecheck and production build passed. Desktop/mobile screenshots were inspected. Native Windows/macOS execution remains unverified.

## Patch delivery

Signed patches support versions 1.10.0 through 1.12.4 in the delivered baseline list. A real isolated v1.12.4-to-v1.12.5 upgrade verifies that applying the patch preserves records, review events, accounts, groups, batches and local allowScripts, compiles the deletion route and needs no dependency reinstall. No migration, dependency change or automatic deletion occurs on patch application. Source archives exclude databases, runtime state, environment secrets, installed dependencies, builds and private signing material. See BATCH_DELETION.md and PATCHING.md. Code rollback does not restore data deleted later by an Admin.
