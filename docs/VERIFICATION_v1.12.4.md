# v1.12.4 failed/rejected record recovery verification

## Root cause and change

The shared canDecide predicate accepted only PENDING/NONE, which disabled Record Review fields and blocked modern Pass/Fail on FAILED and legacy REJECTED. New regression cases reproduced eight failures against v1.12.3, including valid corrected Pass requests returning HTTP 409.

The smallest change extends that shared eligibility rule to FAILED/REJECTED. Review history remains append-only through the existing persistence flow, exact Group access still runs before mutation, and optimistic versions still reject stale clients. The review drawer now explains how to correct a failed output; dashboard copy and operating instructions reflect recovery. Passed output remains read-only in Record Review. Bulk Pass retains its pending-only selection. No processing, priority, upload, dependency or database architecture change.

## Verification

337 unit/integration tests across 28 files passed, including the supplied 200-row workbook, 18,000-row long-name corpus, expanded reference, name/priority, permissions, patching and prior dashboard tests. Eleven new cases cover current/legacy failures and both roles, immutable source/earlier events, current-user attribution, repeated Fail reason validation, draft edits, stale retries, foreign/blank/unassigned Groups, pending-only bulk Pass, corrected acceptance of processing-error output and latest-decision exports retaining prior failure audit.

All 45 Linux Chromium production browser checks passed, including all 41 existing checks and four role/state combinations (Admin/User × Failed/Rejected). New UI checks verify editable failed proposals, live Hybrid preview, reason-required Fail and cancellation, corrected Pass without a popup, preserved failure identity/reason, failed-to-ready dashboard transitions, read-only passed output and User isolation. Typecheck and production build passed. Desktop Admin and mobile User screenshots were inspected. Native Windows/macOS browser execution remains unverified.

## Delivery

Signed patch bundle supports 1.10.0, 1.11.0, 1.11.1, 1.12.0, 1.12.1, 1.12.2 and 1.12.3. A real isolated v1.12.3 upgrade verifies unchanged records, reviews, users, groups and batches, preserved local allowScripts, successful build and no dependency reinstall. Release archives exclude databases, credentials, runtime state, installed dependencies, builds and private signing material. See FAILED_RECORD_RECOVERY.md and PATCHING.md.
