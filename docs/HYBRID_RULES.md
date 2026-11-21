# Internal Hybrid slash profile

Source: Hybrid Address Priorities v1.0 and explicit pasted request. PMPG Hybrid Postal Address v1.12 is broader ISO20022 guidance; this is not an MX message serializer.

1. Preserve all original fields. Normalize components before this engine.
2. Name source limit 66 Unicode code points, split 33/33 into 1a/1b. Audit tail beyond66. Only name in continuation.
3. If both address logical lines exist, combine iff their pre-separator, pre-truncation length sum is strictly <33. Insert one space. Never use <=33.
4. Each resulting logical address source limit66; split into 2a/2b and2c/2d at33; audit tails.
5. 2z is postal then subdivision with one separator only when both retained. Payload33; truncate subdivision first, then overlong postal only if unavoidable. Audit all loss.
6. Town limit30, audit remainder. Exactly one 3/<ISO2>/<Town>; ZZ/NOTPROVIDED only as unresolved proposals.
7. Reserve all 1/ segments and one3/. Use remaining four-line capacity for 2a,2z,2c,2b,2d in that order. Audit every nonselected candidate with exact reason `Dropped due to Hybrid line priority`.
8. Name-only uses isolated SLASH_33_66 policy per pasted instructions; address validation NOT_APPLICABLE. Pending ACI 35-character unprefixed guidance is not assumed approved.

Validator returns internal-profile PMPG_Hybrid_Validation, duplication, length, issues and evidence conflicts. PASS establishes local checks, not bank acceptance, sanctions clearance, address deliverability or ISO20022 message compliance. Legitimate street-name overlap (e.g. QUEENS ROAD CENTRAL) remains, with parser notes; free-form repetition without legitimate context fails.

Name classification happens in Engine A, not this fixed engine. Engine B receives the evaluated, untruncated Name. It generates mandatory 1a/1b ahead of address choices; with two Name records and one country/town record, only one 2/ slot remains. Original Name and Address1 values are preserved separately from that proposal.

See [v1.5 priority and postal review](PRIORITY_REVIEW_v1.5.md) for selection enforcement and export fields.


## v3.2 postal coverage condition

A separate 2z is unnecessary when its complete literal postal/state payload is already retained within primary 2a. Match whole tokens with punctuation preserved; never use an omitted continuation or a lower-priority secondary as proof of retention. Omit that redundant candidate before applying the unchanged priority order, and report postal retained in primary. Existing saved results are not rewritten. See REGRESSION_UI_v3.2.md.
