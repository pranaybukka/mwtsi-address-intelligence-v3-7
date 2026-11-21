# Multi-select status filters and selected export — v1.9

Open a batch and expand **Statuses**. Check any combination of processing statuses, review decisions and validation findings. Selections match **ANY** chosen status. A record that is Accepted with issues and Hybrid fail matches either selection and appears once. **Clear statuses** restores all statuses. Counts beside individual choices can overlap and are not additive; the matching-record count is unique.

Available choices include Auto translated, Review required, Name only, Errors; Pending review, Passed, Failed, Accepted output (legacy), Accepted with issues, Previously auto-approved (historical decisions), Verified approval, Rejected; Hybrid pass/fail/not applicable, Duplicate pass/fail, Evidence conflicts, With truncation, With dropped data, Country/Town below threshold and Unresolved town. Unresolved town uses the existing blank/Unresolved state and excludes name-only output.

Group filtering and text search narrow the status matches. Group sorting controls their order. Search keeps the existing name, Group and structured-address search behavior, ignoring case and surrounding whitespace. Metric/check shortcuts select the corresponding single status. Filter changes reset the table to its first page. Selections remain when navigating between results, review and export; a new batch resets them.

Review exceptions starts with a visible Pending review selection when no other statuses are selected. A direct /review entry also starts with Pending review. Adding other choices broadens the list so existing decisions can be inspected. Record controls still follow their review state. These filters do not alter any processing result or acceptance decision.

Choose **Export scope** separately from **Export format**:

- **All records in selected Group** (default): export the chosen Group and sort order, preserving previous behavior. Status/search selections do not narrow this option.
- **Matching selected filters**: export the union of selected statuses, narrowed by Group and search, across every table page. The displayed count is the unique number of exported records. With no selected status, this option exports all status types matching Group/search.

Both scopes work with **Full analysis** and **Source + Hybrid output**. A record is exported once by its internal Record_ID. Separate source rows with identical names, addresses or source keys remain separate records. Existing original-column/type preservation and computed-header collision handling apply. No analysis or acceptance is rerun during export.

Full analysis Summary records the scope, Group, sort, selected status labels, search and unique count; its status totals describe only exported records. Source + Hybrid keeps its concise Results-only layout. Empty selections disable the download links and explain how to change the selection; direct API requests with zero matches return a JSON error instead of an empty workbook. Incomplete jobs remain blocked from export.

Dashboard counts and **Pass all pending** continue to describe the entire batch. Batch passing is not limited to the export selection; its existing explanation remains visible. Filter choices are held in the current workspace session and are reset on a full page reload; completed source/results/review decisions remain saved.

IT/API: GET /api/batches/{id}/export retains mode=full|source-hybrid and Group parameters. scope=all is the default. Use scope=selected with repeated status parameters and optional search to apply selection, for example:

```text
/api/batches/{id}/export?scope=selected&status=acceptedWithIssues&status=pmpgFail&mode=full
```

Status values are validated against the shared filter catalog. The server uses the same ANY-match, search and record-ID uniqueness function as the UI. Optional page parameters do not restrict the export. Unknown scopes/statuses, conflicting Group parameters and oversized search values are rejected. Search is limited to 1,000 characters. No dependency or database migration is required.
