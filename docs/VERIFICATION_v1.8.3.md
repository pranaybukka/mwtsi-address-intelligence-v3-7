# v1.8.3 verification

245 unit/integration tests passed in 22 files with the supplied 200-row workbook, full 18,000-row Name/Address1 corpus and installed expanded-reference tests enabled. Existing processing, priorities, review, mapping, Group, export, recovery and reference-management regressions pass.

The corrected automatic acceptance condition uses the structured town's Unresolved state: blank/whitespace or explicit Unresolved, normalized for case and whitespace. The same helper renders Unresolved in the workspace. Tests demonstrate that matching is independent of the Hybrid placeholder and excludes populated town values, including literal NOTPROVIDED. Name-only output and processing errors remain excluded.

Four additional regression cases verify normalized state boundaries, independence from output serialization, preservation/migration of saved v1.8.2 On/Off settings, legacy API aliases/conflict rejection and retained captured v1.8.2 batch semantics/audit origins. Existing system event/version atomicity, pinned policies, independent toggles, Off/manual review, unchanged findings and export tests continue to pass.

28 Linux Chromium browser checks passed against the built production server. The automatic-acceptance checks use the corrected toggle label, assert the table's Unresolved state, verify new AUTOMATIC_UNRESOLVED_TOWN audit evidence and retained validation failures, and verify Off persistence/manual pending status. Native Windows/macOS browser verification remains pending; cross-platform filename/path/MIME simulations pass.

Typecheck and production build passed. Full dependency audit reports zero vulnerabilities; dependencies were not changed. No destructive schema migration is required. Current defaults, preserved historical choices, captured legacy policy behavior and export fields are documented in AUTO_APPROVE_UNRESOLVED_TOWN.md. Earlier verification/platform/reference limitations are retained in VERIFICATION_v1.8*.md and EXPANDED_REFERENCE_DATA.md.

Existing saved decisions and audit event JSON are preserved. New batches use the corrected policy; existing queued/resumed batches retain their captured version's semantics. The application ZIP excludes local databases, settings, uploads, drafts, caches and tokens. Synthetic tests do not establish independent global postal accuracy or deliverability.
