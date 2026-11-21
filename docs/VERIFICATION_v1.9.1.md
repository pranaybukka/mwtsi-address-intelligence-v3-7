# v1.9.1 verification

247 unit/integration tests passed in 23 files, with the supplied 200-row workbook, complete 18,000-row Name/Address1 corpus and installed expanded-reference tests enabled. Existing Hybrid processing, priority, Name, manual acceptance, mapping, Group, selected-status exports, recovery and reference-management regressions pass.

The former positive automatic-approval tests were replaced with retirement regressions. They verify that global saved On flags are ignored, both retired API options are rejected, new unresolved records stay pending with no system event, and old queued/paused jobs resume without automatically accepting remaining rows. Committed historical decisions, versions and audit events remain unchanged. Historical status/export classification is read-only. Status-filter fixtures now use manual acceptance or explicitly constructed historical fixtures, rather than creating new automatic decisions.

31 Linux Chromium browser checks passed against the built production server. The updated review tests verify no automatic-approval switch, the postal-only settings API, pending unresolved output and manual acceptance availability. Desktop geometry checks confirm Original source and Proposed Hybrid output are adjacent and aligned; editing town/country updates the preview while source stays unchanged. At a 390-pixel viewport the cards stack with no horizontal overflow. A desktop screenshot using synthetic data was visually inspected.

All existing multi-select OR/unique-export browser scenarios continue to pass with manually accepted overlap fixtures. Source data, live preview, decision controls and Excel export remain functional. Native Windows/macOS browser verification remains pending; existing filename/path/MIME simulations pass.

Typecheck and production build passed. Full dependency audit reports zero vulnerabilities. No dependency or destructive database migration was needed. The active automatic-decision generator was removed; only read-only historical acceptance classification remains. Old captured settings can be retained in archived Audit data, but remaining rows use only supported postal lookup configuration.

The application ZIP excludes customer databases, settings, uploaded workbooks, drafts, caches and tokens. The review screenshot contains fictional sample data. See RECORD_REVIEW_COMPARISON.md for behavior and upgrade instructions, and earlier verification files for reference/host limitations. Synthetic results do not establish independent worldwide postal accuracy or deliverability.
