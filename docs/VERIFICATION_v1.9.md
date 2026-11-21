# v1.9.0 verification

258 unit/integration tests passed in 23 files, with the supplied 200-row interpretation workbook, the full 18,000-row Name/Address1 corpus and installed expanded-reference tests enabled. Existing Hybrid processing, priorities, Name, review, mapping, Group, export, automatic approval, recovery and reference-management regressions pass.

Thirteen new status-selection cases verify overlapping processing/decision/validation statuses, ANY/OR semantics, duplicate status/input-ID prevention, retention of distinct rows sharing a source key, no-selection behavior, Group/search/sort intersection, name-only and review-state predicates, shared catalog validation, both workbook formats, selected/all export scopes, summary counts/selection evidence, empty results and invalid query rejection.

31 Linux Chromium browser checks passed against the built production server. Three new cases verify a 28-row batch with overlapping statuses: 20 unique matches across two table pages export as exactly 20 records in both formats; Group/search narrow the same selection; the whole-Group scope preserves all Group records; clearing status choices restores all; zero-match export links are disabled; and direct review entry shows a visible Pending selection that can be broadened and exported without hidden filtering.

Typecheck and the production build passed. The full dependency audit reports zero vulnerabilities; dependencies were not changed. Native Windows/macOS browser verification remains pending, while existing filename/path/MIME simulation tests pass. The checkbox multi-select does not require platform modifier keys. Browser tests use one worker against the shared local application/database.

The UI and export route use the same single-pass status/search selection and internal-record-ID uniqueness helper. Export filters apply across every page before workbook generation. Equal source keys/names/addresses do not merge separate records. Full analysis Summary describes the exported selection and computes totals from that subset. Source + Hybrid keeps its original-column layout. Existing incomplete-job export guards continue to pass.

No processing rules or saved decisions were changed; no schema migration was needed. Dashboard metrics and bulk acceptance remain batch-wide. Filter choices are transient workspace state and survive view navigation; full reload resets them. See STATUS_FILTERS_AND_EXPORT.md for exact scope semantics and API values. Earlier lifecycle, reference and host verification limits are retained in VERIFICATION_v1.8*.md and EXPANDED_REFERENCE_DATA.md.

No customer database, local settings, uploads, drafts, source caches or tokens are included in the source ZIP. Synthetic verification does not establish independent worldwide postal accuracy or deliverability.
