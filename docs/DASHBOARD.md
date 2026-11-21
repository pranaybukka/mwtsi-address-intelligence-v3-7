> Superseded UI details: v2.2.0 removes the character/background, retains an animated routing globe and makes Dashboard the landing page. See [current UI guide](UI_REFRESH_v2.2.md) and [assessment](UI_ASSESSMENT_v2.2.md). The versioned design history below describes its original release.

# Review progress dashboard

## Integration review

The previous Processing overview summarized only the open batch. Its metric cards counted processing status, not the subsequent human decision, and the Group/status/search filters only changed the records table. Its export readiness formula (total minus pending minus failed) was implicit. The batches menu caps results at 50, so it cannot be used to calculate installation-wide totals.

The integration adds an authenticated, read-only `/api/dashboard` aggregate over every completed batch, independent of that menu limit. Incomplete, paused, cancelled and failed processing jobs are excluded until completed. The database query projects only IDs, Group, processing status and review state; complete records and source contents are not sent to the dashboard. Exact group authorization is applied in SQL before options or totals are assembled. Users retain the existing assigned-group model; no account or database migration is needed.

## Counts and readiness

- **Passed:** PASSED, ACCEPTED and legacy APPROVED decisions, even when validation findings remain.
- **Failed / rejected:** FAILED and legacy REJECTED decisions.
- **Ready for export:** passed records plus records with review state NONE and processing status AUTO_TRANSLATED or NAME_ONLY. Name-only output remains eligible under the existing policy. Automatic results are shown separately from human passes.
- **Left to review:** every other completed record, including pending edits, review flags and processing errors without a final decision.
- **Left to fix:** left to review plus failed/rejected. Failed/rejected output can be opened, corrected and passed by Admin or its assigned-group User. It stays failed until a new decision or a saved draft edit changes the current state; prior failures and reasons remain in the audit history.

The nonoverlapping totals reconcile: total = ready for export + left to review + failed/rejected. Passed is a subset of ready for export. Processing/validation findings remain independent of decisions. Records with the same source key are still separate records; overlapping status filters never duplicate an internal record ID.

## Using the overview

Open Processing overview. The Review progress dashboard appears even without an open batch. Admin initially sees all completed batches and all groups, including ungrouped data. Users initially see only their exact assigned group across completed batches; unassigned Users see zero totals and no foreign batch/group options.

Filter dashboard totals by batch and Group, or use Refresh totals. The batch breakdown shows the same counts and provides links to open ready, pending and failed/rejected records in the existing review/table workflow. The overview refreshes after local decisions, bulk passes and completed uploads, every 30 seconds while visible, and on returning to the browser tab. Remote activity appears on the next refresh. Dashboard filters are separate from the open batch table controls.

Open-batch totals, validation checks and export readiness now reflect that table's Group/status/search filters. Status selection gains Ready for export, Left to review and Left to fix. Admin can choose Ready for export and Matching selected filters in either export format to export that unique selection. Diagnostic/all-record exports remain available, including pending or failed output; readiness is an operational indicator, not a new export restriction. Users still cannot upload or export.

## Verification

Automated coverage checks all current and legacy decision states; readiness reconciliation; more than 50 batches; empty and incomplete jobs; exact Group matching and unassigned access; foreign filter attempts; authentication; counts after pass/fail/edit/bulk pass; unique ready exports in both formats; and dashboard filtering/drill-through in Chromium. See VERIFICATION.md for release results and platform limits.

## Correcting failures — v1.12.4

Open a failed/rejected count in the batch breakdown, or select Failed / Rejected in the status filters. Open the record, edit the structured proposal while checking the live Hybrid preview, then click Pass. No separate reopen action is needed. The signed-in account is recorded on the new Pass; the earlier failure reason and decision remain in Review history. To record another Fail, supply a new reason in the popup. Cancelling a popup or closing the drawer does not save draft input. The existing API draft-edit action remains available for supported records and returns the output to pending review.

After Pass, the record moves from Failed/Left to fix into Passed/Ready for export, and the current failure filters no longer match it. Full analysis reports the latest Pass with every previous decision in Review_History and Audit; compact output uses the corrected stored Hybrid lines. Group access, optimistic version checks and the pending-only bulk Pass selection remain in force. Record Review keeps passed outputs read-only.
