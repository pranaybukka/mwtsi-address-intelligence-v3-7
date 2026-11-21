# v3.5.1 verification

The final release retains the complete v3.5 feature set and fixes a reproduced UI race: changing correction inputs while a saved preview loads could leave Preview disabled. Cancellation now clears loading and ignores the stale response. No data is applied by cancellation.

- Full default unit/integration suite:624 passed,10 opt-in external-fixture tests skipped,45 files passed/3 skipped.
- TypeScript and production build pass; existing export tracing warning remains.
- Production Chromium:33 distinct successful workflows, consisting of7 final new-feature workflows and26 existing pagination/reservation/export/dual-review/canvas/live-ISO workflows on the same production build. The new-feature file was rerun after correcting a fixture assumption about the default Pending filter; all7 passed. The saved-preview race also has a separate reproduce-before/fix-after check. No further production code changed after that build.
- The two25k dual-batch scale results in VERIFICATION_v3.5.md remain applicable to unchanged batch operations; they were not repeated for this one-line client-state fix. No new full25k address-engine regression or concurrency capacity claim.
- Final bundle includes signed direct upgrades from3.4.0 and3.5.0. Every non-root dependency lock entry is unchanged; no new startup/schema/priority change beyond v3.5 additive workflow support. Real installed upgrade, operational backup, externalSQLite fingerprints and Admin/User smoke checks are recorded in the final JSON before publication.

Native Windows/macOS browser execution remains unverified; automated browsers ran Linux Chromium. Static download-Site browser preview remains unavailable due to missing managed helper; asset links/hashes/archive/source provenance and native private publication are checked. Historical PDFs/Word/screenshots are retained in the immutable v3.4 source; current documentation is Markdown/CSV/JSON.
