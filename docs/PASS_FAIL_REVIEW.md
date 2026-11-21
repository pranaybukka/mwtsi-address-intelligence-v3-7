# Signed-in Pass / Fail Record Review — v1.11.1

## Pass

Open a record, inspect the preserved source beside Proposed Hybrid output, and optionally edit the structured proposal. Click Pass at the top to save immediately. No initials, reviewer-name or reason popup appears. The server records the signed-in username, stable account ID, timestamp and reviewed output. Passing preserves unresolved findings and does not certify address completeness.

## Fail

Click Fail at the top. The popup displays Recording as followed by your signed-in username and contains only a required Reason field. A reason must include text and be at most 2,000 characters. Confirm Fail saves the proposal, failure decision, account ID/username, reason and timestamp. Cancel or Escape returns to the record without committing a decision or losing edits in the current preview; keyboard focus returns to Fail.

Both buttons remain at the top, with Key and Name in the heading and review reasons directly below. Original source values remain immutable and source/Hybrid comparison stays side by side on desktop, stacked on narrow screens. No re-upload or mandatory correction is needed. If Pass fails, the record stays open with the server error and the proposal remains available for review.

## Attribution and history

The authoritative identity comes from the authenticated server session. Browser-supplied reviewer, initials, actorUsername or actorId cannot override it. Full usernames retain their original case and characters, including usernames longer than the former initials limit. New events record reviewer=username and actorUsername/actorId; no invented initials are saved. Review evidence/edit notes also use that account. Last decision shows its recorded username and time in Record Review. Historical initials and events remain unchanged, including decisions made before authentication existed. User deletion or rename does not rewrite past attribution.

Pass and Fail store PASSED/FAILED independently from validation/processing status. Both retain before/after components and a decision-output snapshot, plus the original source and evidence. Pass stores an empty reason. Events and record versions commit atomically. Stale, repeated or conflicting submissions are rejected without overwriting a decision. Completed decisions remain read-only in the UI.

## Batch Pass and roles

Pass all pending retains a confirmation showing the signed-in account and affected count, with no identity or reason entry. Confirm Pass records that same account on every selected pending record. Admins can pass pending rows in the whole batch. Users can pass only their assigned Group, including records outside current table filters within that Group. Group restrictions, completed-job checks and atomic versioned selection remain enforced on the server. No upload/export permissions are granted to Users by this change.

## Exports

Full analysis adds Decision_User and Decision_User_ID alongside Review_Decision, Decision_At, Decision_Reason and Output_Failed. Accepted_By uses the recorded username for new passed records. Decision_Initials remains available for historical initials; it is blank for new session-attributed decisions. An old event without an authenticated actor has blank Decision_User/Decision_User_ID, rather than being assigned a user retroactively. The lossless Audit worksheet retains the full event. Source + Hybrid export remains concise and unchanged.

## API and deployment

PATCH /api/records/{id} accepts action PASS with version and optional edits; FAIL also requires reason. Neither needs initials or reviewer. POST /api/batches/{id}/accept accepts action PASS and the explicit versioned selection. Authenticated legacy review operations also record the current session account; legacy review history and direct offline historical fixtures retain their original attribution. Nonblank Pass reasons are rejected. There is no destructive schema change or new dependency.

Back up and retain the existing operational database/data folder when replacing source. Run npm ci, build and restart as usual. Existing accounts, group assignments, sessions and historical decisions are retained. The account creating a decision must still be active, have completed password change and be authorized for the record's immutable source Group. Authentication, account management and remote-hosting guidance remain in AUTH_ROLES_AND_GROUPS.md.
