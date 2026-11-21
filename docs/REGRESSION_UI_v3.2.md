# v3.2 — Address choices and review rendering

This release follows a full regression and an independent review of the supplied Hybrid Address Priorities document. The internal slash profile reserves Name (1a and, when needed, 1b) plus one Country/Town (3a). Address choices remain **2a primary > 2z postal/state > 2c secondary > 2b primary continuation > 2d secondary continuation**, within four lines and at most two address lines. The PMPG PDF describes broader ISO20022 practice; it does not override the application's explicit internal profile or approve pending Name-only guidance.

## Findings and corrections

### A redundant postal candidate displaced address information

Before: structured Primary `02110 MA`, Postal `02110`, Subdivision `MA`, a short Name and a secondary address produced two identical `2/02110 MA` lines. Secondary 2c was dropped. The old priority check passed because it checked ordering of candidates that had already been generated incorrectly.

The supplied rules make a separate postal/state record conditional on that information not already being present in the address lines. Candidate generation now checks whether the complete, literal postal/state payload is retained in primary 2a, which always fits after mandatory reservations. If so, it omits the redundant 2z and uses the remaining slot for the next applicable candidate. The audit says `RETAINED_IDENTICAL_LINE`, explains that postal is retained in primary, and labels 2z as unnecessary rather than dropped by priority.

Coverage uses complete Unicode letter/number boundaries and preserves punctuation. `02110` does not match part of `102110`; `MA` does not match `MAIN`; `AB-12` is not treated as `AB 12`. A match only in an omitted continuation or a lower-priority secondary never removes the separate postal candidate. Exact emitted malformed postal text remains distinct from priority validity; this check does not certify postal deliverability or reference correctness.

With a two-line Name and a separate primary that does not carry postal, the one address slot still goes to 2a and 2z is audited as dropped. No new rule promotes postal above primary, removes mandatory Name lines or exceeds capacity.

### Long dual headings could consume the review screen

The rendering audit reproduced 600–858px identity headings at tablet/desktop widths, leaving only 48–72px for the review body. The complete Key, BNP Name and ORP Name now have a bounded, keyboard-focusable scroll area. Pass, Fail, Close and the decision badge stay outside that area. Responsive spacing also leaves usable content on narrow screens; full original source values remain available beside the proposal. The identity participates in the review keyboard focus loop; restoring focus does not move the screen.

### Validation badges could describe the saved result instead of the draft

The drawer already computed validation for edited output, but its badges and Validation issues disclosure still read the saved record. They now display the active block's edited preview checks and show `UNSAVED PREVIEW CHECKS`. Switching blocks retains each draft. Saving still follows the existing authenticated, reserved and version-checked joint decision flow.

## UI refinements

The selected-candidate summary adds numbered, labelled output cards, an explicit reserved/available-slot count and a postal outcome callout. The existing exact candidate sequence, per-line identifiers, all-candidate decision table, source comparison and audit history remain available. Color tokens respect all six palettes and both display modes; green/amber/red outcomes retain their meaning. Name-only suppression of 3a has a policy-specific explanation.

The screen audit covers Dashboard, Upload, Batch workspace, Export, Live Translate and Users at widths 320, 390, 768, 1024 and 1440 in light and dark modes, plus long BNP/ORP review cases. Exact observations, screenshots and regression coverage are reported on the download page. Core twelve-palette contrast and keyboard controls remain part of the browser suite. Automated execution uses Linux Chromium; native Windows/macOS/Safari certification and a comprehensive accessibility audit are not claimed.

## Existing batches and decisions

Original source, account preferences, users, Groups, reservations, review events and export identities are preserved. No saved batch is silently reprocessed. Newly processed addresses and changed structured edits use the corrected candidate generation. Reimport original source into a new batch to analyze an old batch with the new rule. Existing signed decisions and captured findings remain historical evidence, even when current priority assessment identifies an old result for review. Pass acceptance remains available with the existing explicit missing-1/ or missing-3/ acknowledgement.

## Apply the signed patch

The **mwtsi-patch-to-v3-2.zip** bundle directly upgrades **v3.1.0 → v3.2.0**. Earlier versions first follow the retained patches to v3.1.0. No new dependencies, startup script or operational schema change is required.

1. Back up the operational database. Stop the host app and any separately started worker with Ctrl+C.
2. Extract the patch folder beside the existing application folder.
3. From a terminal in the existing application folder, run:

```text
node "../mwtsi-patch-to-v3-2/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v3-2/apply-patch.mjs" --app "."
```

Wait for backup, verification and rebuild to finish, then restart normally and refresh browsers. Use the actual extracted path if the patch is elsewhere. Do not bypass legitimate source conflicts. The supported local package.json allowScripts policy is preserved. Full source downloads are for new installations; existing installations use the patch.

See PATCHING.md for status, recovery and rollback. Code rollback preserves current operational data and account appearance choices; it does not undo later work or restore a database automatically.
