Current release: [v3.5 verification scope](VERIFICATION_v3.5.md). Historical results below retain their original scope.

# v3.4.0 Live ISO postal address verification

**104 targeted unit/integration tests in four files** passed:22 new ISO cases plus existing Live Translate, ISO country and postal/street tests. **25 production Linux Chromium workflows** passed:7 new XML and18 existing live/postal/review workflows. Independent browser DOMParser checks and exact clipboard comparisons cover both XML fragments; additional coverage includes escaping, illegal characters, limits/tails, country/Town placeholders, Name-only input, long Name capacity, building/postal separation, lookup Off, local-only ISO corrections/navigation/reset, stale/error copies, User restrictions, unchanged batches and five viewport widths320–1440 in both modes. Typecheck and production build passed; the pre-existing export tracing warning remains. Desktop Dark/Light output screenshots were inspected.

This is focused regression. The full v3.2/25,000-record workload was not repeated. ISO previews are field/length-checked PostalAddress24-style fragments, not complete-message XSD or bank-acceptance certification. Native Windows/macOS execution and formal accessibility certification remain pending. The shared server/API/parser/Hybrid engine, auth, database, startup and Excel output modules are unchanged. Source/analysis and operational decisions are not rewritten by ISO formatting.

Publication requires signed direct3.3.0→3.4.0 patch preflight/application to a real isolated installation with Unicode/spaced path, external SQLite and local allowScripts/configuration, preservation fingerprints, and a patched-server browser check. verification-v3-4.json records the exact results and hashes. All published source/patch ZIPs and retained datasets remain immutable. Historical PDFs/Word guides and screenshots remain in the full source ZIP's docs tree; the compact documentation pack contains Markdown/CSV/JSON guides. Static download-Site verification covers links/archive integrity/Git provenance/native owner-private publication; its managed browser-preview helper is unavailable. Runtime databases, secrets and signing keys are excluded. See [ISO guide](ISO_POSTAL_LIVE_v3.4.md).

---

## Historical v3.3 verification

# v3.3.0 comparison canvas verification

This UI-only release passed **87 targeted unit/integration tests in seven files**, **six new production Chromium workflows** and **48 existing review/appearance/navigation/dual-address browser workflows**. Typecheck and production build passed, with the existing dynamic export tracing warning. New coverage verifies clean User presentation versus retained Admin rule details, source preservation, unsaved current checks for both BNP/ORP, Fail history, signed joint decisions and automatic next, exact Group restrictions and User Live Translate copy controls. Desktop/tablet/mobile widths 320, 390, 768, 1024 and 1440 in Dark/Light include short 320×600; all twelve existing palette/mode contrast checks passed. Desktop Admin/User and compact mobile screenshots were visually inspected.

The signed direct 3.2.0 → 3.3.0 patch is verified on a real isolated installation in a Unicode/spaced path with an external SQLite database, local allowScripts and unrelated configuration. Release publication requires before/after preservation fingerprints and a patched production browser check; verification-v3-3.json records results and artifact checksums. Dependency inputs, server/startup code, processing/Hybrid engine, authorization, database and Excel output modules are unchanged. No stored result, source, review or preference is silently rewritten.

This is focused regression for a presentation release. The full 575-test/120-browser/25,000-dual-record workload below was completed for v3.2 and was not rerun for v3.3. Automated execution used Linux Chromium; native Windows/macOS/Safari and formal accessibility certification remain pending. The static download Site is verified through links, archive integrity, hashes, exact Git provenance and native private publication; its managed preview helper is unavailable. Runtime databases, secrets and private signing keys are excluded. See [review guide](RECORD_REVIEW_v3.3.md).

---

## Historical v3.2 verification

# v3.2.0 full regression, choices and rendering verification

The user's full-regression request superseded the earlier request to stop the v3.1 browser rerun. Baseline v3.1 passed all 560 unit/integration tests and all 116 production Chromium workflows. Independent assessment nevertheless reproduced gaps in candidate generation and screen rendering. REGRESSION_UI_v3.2.md documents each root cause and the resulting behavior.

## Address rules and data

The corrected release passed **575 unit/integration tests in 43 files**, with the supplied workbook, complete 18,000-row Name/Address1 workbook and real expanded-reference snapshot enabled. Fifteen new priority cases include **3,456 independent literal-oracle combinations** across Name/address lengths, strict combination boundary, postal/state and Town limits; complete embedded/combined postal coverage; partial/building-number/omitted-secondary exclusions; punctuation distinctions and a larger house number cut at character 33; emitted malformed postal text; Unicode segmentation and Name-only policy. The oracle does not call the production candidate, priority, selection or truncation helpers.

All **25,000 dual-address test records / 50,000 BNP+ORP blocks** were imported and processed with zero processing errors and zero priority failures. Source values, typed metadata, mandatory Keys/Groups, line limits and Name retention were checked on every row. All 2,000 identical-input pairs matched; 506 five-digit-building cases passed. Both export formats and metadata exclusion were checked on 78 records across 39 scenarios, postal Off on eight samples and in-memory missing-line Pass acknowledgement on 18 samples. These generated observations are not an independently audited address-correctness oracle or a deliverability claim. Exact reference snapshot, statuses, counts and coverage are in dual-validation-v3-2.json on the download page.

The documented priority order, mandatory Name/Country reservation and four-line/two-address limits are unchanged. Only redundant 2z generation is corrected when complete literal postal/state is proven retained in primary 2a. Token boundaries use original primary content to avoid mistaking a cut number for a complete postal value. Ambiguous, partial or clipped coverage conservatively retains a separate postal candidate. Existing saved results and decisions are not rewritten; new processing and changed edits use the corrected engine.

## Browser and rendering

The complete production Linux Chromium suite passed **120 workflows**: all existing 116 plus four new priority/rendering workflows. Coverage includes independent dual blocks and draft switching, priority changes after edits, missing-line warnings/acknowledgement, Pass/Fail/next-record behavior, failure recovery, reservations, Group access, column mapping/checkpoints, both export formats/unique tracking, cross-platform upload metadata, reference settings, all twelve palette/mode combinations and keyboard/mobile behavior.

A separate **70-screen before/after rendering audit** covers six main views at five widths (320, 390, 768, 1024 and 1440) in both modes plus long dual-record review. No horizontal document overflow was observed. Before, long identities consumed 600–858px and left as little as 48px for review content; after, all measured long-record cases left **329–416px** and retained reachable decision controls. Full original names remain accessible in the scrollable identity and preserved source.

After that full pass, a small keyboard correction included the scrollable identity in the existing focus loop and prevented automatic focus restoration from moving the screen. The four affected priority/rendering workflows were rerun against the final production build, including Shift+Tab to the identity, return to Pass, fully visible controls and a compact 320×600 viewport. That compact case exposed only 169px of content, so the short-height identity limit was reduced to leave over 180px without hiding the complete scrollable identity. This targeted recheck covers the final focus correction; a second complete browser rerun after that correction is not claimed. Typecheck and production build also passed. The existing dynamic background-export filesystem tracing warning remains.

Screenshots were inspected for dark/light review, compact mobile, long names and candidate explanations. The selected-candidate summary now provides numbered labels, reserved/available capacity and semantic postal outcomes. Current preview validation badges/issues follow the active draft, while signed historical findings remain preserved.

## Patch and limits

The signed direct v3.1.0 → v3.2.0 patch is checked/applied to a real isolated installation in a Unicode/spaced path with an external SQLite database, local allowScripts and unrelated local next.config.ts/environment settings. Before/after fingerprints cover authoritative records, reviews, accounts, Groups, batches, processing/reference/batch settings, export ledgers and saved appearance preferences. A patched-server browser then verifies the corrected duplicate-postal preview, candidate choices, saved decision and preservation of older batches/preferences. Publication waits for successful preservation checks; verification-v3-2.json records the exact outcome and artifact hashes.

No new dependencies, operational schema, startup, reference, Group-permission or Excel-format changes are included. Parser/enrichment code and the priority constants are unchanged. Prior versioned source/patch ZIPs and all retained test datasets remain byte-identical. Redundant historical screenshots may be archived outside the download Site to fit capacity, with old screenshot links explicitly replaced by current-preview links; current documentation retains historical guides.

Automated browsers ran in Linux Chromium. Native Windows 11 Chrome/Edge and macOS Chrome/Safari certification, a full accessibility audit, bank acceptance and regulatory compliance are not established by these checks. The managed static download-Site preview helper is unavailable; that page is checked through asset links, ZIP integrity, hashes, Git source provenance and native owner-private publication. Runtime databases, credentials and private signing keys are excluded from downloads.
