# v1.12.3 review dashboard verification

## Integration and behavior

The existing per-batch processing dashboard, decision history, Group access enforcement and export selection were reviewed before implementation. The new dashboard reports all completed batches, including those beyond the recent menu's 50-item cap. Admin can filter by batch and Group. User access is scoped in SQL before aggregates/options are assembled. Unassigned accounts see zero totals. Compact metadata is projected without returning source/evidence contents.

One shared readiness policy drives dashboard totals, new status filters and export selection: passed/accepted/approved outputs plus undecided automatic or name-only outputs are ready; failures/rejections are separate; all remaining rows are left to review. Total = ready + left to review + failed/rejected. Left to fix = left to review + failed/rejected. Human acceptance preserves findings. Diagnostic exports remain available. Open-batch summaries follow the table filters and export readiness follows the actual export selection.

## Automated verification

326 unit/integration tests across 27 files passed, including the full supplied 200-row workbook, 18,000-record long-name corpus, expanded-reference integration, name/priority/Group/identity/recovery/patch regressions, and 10 new dashboard tests. New cases cover every current/legacy state, exact and international Groups, blank/unassigned groups, cross-scope attempts, first-login/authentication, no-store responses, completed/partial jobs, more than 50 batches, live decisions and unique ready exports in both formats.

41 Linux Chromium production browser checks passed, including all 38 existing checks and three new dashboard tests: Admin filters/drill-through/ready exports/post-pass refresh; User-scoped totals and options/post-fail refresh/mobile fit; and failed aggregate requests with retry. Typecheck and production build passed. Desktop and mobile dashboard screenshots were inspected.

No dependency changes or database migration. Existing records, source columns, accounts, groups and decision history are preserved. The signed update retains local allowScripts permission compatibility. Native Windows/macOS browser execution remains unverified; tests ran on Linux Chromium.

## Patch delivery

Signed patches are built against supported releases 1.10.0, 1.11.0, 1.11.1, 1.12.0, 1.12.1 and 1.12.2. A real isolated v1.12.2 installation is upgraded with the signed external installer to verify database/review preservation, local allowScripts preservation, compiled dashboard routing and no dependency reinstall. Archives exclude databases, credentials, runtime state, dependencies, builds and private signing material. See PATCHING.md and DASHBOARD.md.
