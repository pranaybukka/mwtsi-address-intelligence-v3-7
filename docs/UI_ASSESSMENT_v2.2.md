# UI and usability assessment — MWTSI v2.2.0

Assessment date: 10 November 2026 (ET). Scope: sign-in, navigation, dashboard, upload/mapping, batch report, record review, exports and account administration. Method: source/role/workflow inspection, production Chromium task checks, desktop/mobile screenshot inspection and keyboard checks with fictional data. This is an engineering usability assessment; no independent user research or formal accessibility certification was performed.

## Findings and implemented changes

| Area | Observed friction in v2.1 | v2.2 response | Operator benefit |
| --- | --- | --- | --- |
| Landing and hierarchy | Upload was the landing page; portfolio totals and single-batch controls competed on one long results page. | Dashboard becomes the landing page. Batch workspace and Review records remain separate destinations. | Understand workload before selecting an action. |
| Insight priorities | Processing, decisions and export totals were scattered. Readiness could be confused with a completed export. | Six prominent metrics, review/export progress, secondary Passed/Ready/Needs attention totals, scoped batch actions and quality findings. | Distinguish work to review, failures to recover and data ready for its first tracked export. |
| Scope | Counts and report controls occupied different parts of the same page. | Dashboard Batch, Group and multi-status filters precede metrics. Count drill-downs retain the selected intersection. | A number opens the records that explain it. |
| Branding | Large character artwork, a fixed watermark and avatar morph competed with address data. | Character assets and background are removed from current app source. MWTSI wordmark, abstract M browser icon and routing globe replace them. | Brand stays visible without covering operational information. |
| Motion | Character-to-globe morph was visually dominant. | Quiet wireframe/land drift, route signals and an orbiting point; browser-local pause, reduced-motion and hidden-tab suspension. | A globe remains part of the identity while users control movement. |
| Readability | Many small labels and dense controls; mobile rail relied on icons. | Larger labels, clearer contrast/spacing, visible focus, skip-to-content and labelled responsive navigation. | Easier scanning, keyboard access and mobile orientation. |
| Review sequence | Close and reopen a record for each review; no position in report. | Previous/Next with Record x of y, consistent filters/sort, cross-page navigation and no wrapping. | Continue a review without losing report context. |
| Unsaved work | Closing a review could silently discard edits. | Explicit Keep editing / Discard changes and continue dialog for navigation, close, Escape and backdrop. | Prevent accidental loss; navigation never implicitly saves or passes. |
| Collaboration | Moving among records could retain an earlier reservation until expiry. | Await release of the prior reservation before opening the next. A reserved neighbor opens read-only with owner information. | Predictable reviewer ownership without silently skipping records. |
| Valuable existing detail | Source/proposal, candidate rules, evidence and audit are necessary but lengthy. | Preserve comparison/editor and existing expandable detail sections. Keep decisions and navigation above the scrolling body. | Essential actions remain reachable without hiding the audit. |
| Exports | Exported and ready are different questions; repeated workbooks can mislead totals. | Carry v2.1 durable unique coverage into the main dashboard, including Ready & unexported. | See remaining scope without counting a record twice. |
| Administration | Administrator and review actions can overwhelm a reviewer. | Keep role-specific destinations and server-side Group authorization; workspace job activity is Admin-only and labelled independent of record filters. | Reviewers see assigned data; Admin sees operational context. |

## Dashboard interpretation

Total = Ready for export + To review + Failed / rejected. Passed is a subset of Ready for export. Ready includes passed/legacy accepted records and untouched automatic/name-only records under the existing readiness policy. Needs attention = To review + Failed / rejected. Readiness does not require every validation finding to be corrected.

Exported — unique counts distinct internal records included in successfully generated tracked workbooks, across formats and repeated/overlapping exports. It does not prove a file was saved locally. Remaining to export = Total − Exported — unique. Ready & unexported is the intersection of readiness with no tracked successful export. Editing a record does not reset its ever-exported state. Earlier batches retain the incomplete-history disclosure; no historic memberships are guessed.

Dashboard status choices match ANY selected status, once per internal record. Clicking a narrower count adds an AND focus, preserving the original status selection. The batch report shows that focus explicitly and allows it to be cleared. Export "matching filters" includes the focus across all matching pages; "all statuses" clears status/search/focus but preserves the selected Group/export-tracking scope, as before. Findings can overlap and are not summed as additional records.

Admin totals cover every completed batch, independent of the 50-item recent-batch selector. A User sees only their exact assigned Group, including batch options, status counts and insights. Incomplete processing batches enter the dashboard only after completion. Workspace job counts are separate Admin-only operational totals, not filtered record totals. Refresh is automatic every 30 seconds or on window focus, with a manual Refresh totals button and update time in ET.

## Interaction details

- Open a batch or count from the dashboard to inspect its filtered report. Without a selected batch, a top metric scrolls to the batch breakdown so a batch can be chosen.
- Previous/Next uses the report captured when review opens: Group, ANY statuses, focused metric, search, export tracking and Group sort. The report page follows the record across page boundaries; closing returns focus to its row button.
- Boundaries disable the corresponding button. There is no wrap, auto-pass or automatic decision on navigation. Pass and Fail retain their existing behavior and close review on success.
- Navigation releases the prior reservation; the new record then claims its own. Another reviewer’s reserved record is visible read-only, with navigation available. Passed records also remain read-only.
- A record removed from scope by another reviewer causes a clear navigation error. Close and refresh to use the updated report; navigation is not a frozen batch snapshot.
- Unsaved proposal edits trigger a choice before navigation or close. Pass/Fail saves the current proposal under existing validation/version rules. Closing the browser or tab is outside the in-app discard dialog.
- Settings and evidence accordions preserve mounted state. Reduced motion or pausing affects decoration, not processing settings, data or exports.

## Assessment of retained screens

Upload keeps one platform-independent File/bytes pipeline, mapping preview and recoverable processing. Its grouped configuration stays outside the main dashboard. Batch workspace keeps server-side pages, clear filters, status chips, unique export coverage and record-level context. Record Review retains original source next to proposed Hybrid output on desktop, stacking on smaller screens, with Key/Name and reasons first. Exports retain both formats, matching/all-status scope and background job progress. Administration retains explicit user/Group management and destructive-action confirmation. Password screens retain forced first-login change and do not animate decoration.

## Further work worth validating

1. Observe representative Admin and Group User tasks with real operators: find the next batch, recover a failed row, review a sequence and export remaining records. Measure time, wrong turns and abandonment before adding more UI.
2. For installations with hundreds of batches, add search/pagination to the dashboard batch breakdown and options. Record review already uses server-side pagination; the portfolio breakdown still returns its authorized batch summaries together.
3. Consider saved filter views, personal review queues and optional decision-and-next after user testing. Current explicit decisions and no automatic skip are retained deliberately.
4. Run a formal keyboard/screen-reader and contrast audit, then native Windows Chrome/Edge and macOS Chrome/Safari acceptance. Current browser evidence is Linux Chromium.
5. Agree on business SLA/aging definitions before adding overdue queues or reviewer productivity charts. Do not infer productivity or deadlines from processing status alone.

## Delivery and evidence

See UI_REFRESH_v2.2.md for update commands and operating instructions, VERIFICATION.md for checks, and the versioned verification JSON on the download page for final counts/checksums. Before/after desktop/mobile screenshots use only fictional test data. Patch distribution excludes operational databases, exports and private signing material. Address rules, reference matching, source preservation, review decisions and role policy are unchanged.
