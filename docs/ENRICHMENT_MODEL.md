# Enrichment and evidence

Candidate fields: value, confidence, source, authority, evidence, alternatives and reviewRequired. Export retains legacy Probability column names requested by the user, but values are heuristic scores, not calibrated probabilities.

Evidence policy: valid supplied bank country1.00 (bank authority); explicit long country name0.99 (address inference); exact town+postal reference country0.96; town+subdivision country0.88; uncorroborated unique town country0.75. Town linked to postal0.98; town with resolved country0.94; weak country town0.82; Hong Kong locality0.86 pending review. Unknown locality proposals0.50. No multiplication or probabilistic calibration is claimed.

Configurable defaults: country>=0.92 and town>=0.90. Authority order: human review, banking identifier, address inference, unresolved. Explicit country conflicts, bank/address disagreement, multiple plausible towns and malformed/routing context block auto. Arbitrary free-text ISO2 codes are not country authority. Street-name country words (GEORGIA ST) do not override locality evidence. Longest country alias wins overlapping names.

Postal patterns are country-specific; exact postal/place relationships corroborate, pattern-only matches are not deliverability evidence. Leading zeros and international spaces/hyphens remain text. Subdivision tokens must be independent and in locality context. Missing postal/subdivision is allowed where not mandatory; missing country/town always review. No US-suffix splitting of BERLIN/MADRID/ROMA.

Locality sanitization removes identified town/country/postal/subdivision from recognized locality segments only. Every change records source field, component, reason, before and after. Meaningful street overlaps are retained. Routing content remains and may require review; three surviving lines merge into logical secondary with notes and standard loss auditing.

Human edits preserve source, append evidence/history, rerun Engine B and validator. Approve asserts human verification of fields and acknowledgement of original conflicts (which remain in historical evidence). The legacy verified APPROVE action requires valid components; normal UI acceptance now uses ACCEPT and permits unresolved or invalid output without changes. Reject remains labeled in export. EDIT remains pending even if corrected components pass, until an explicit acceptance decision (or legacy verified approval).

No inference can guarantee a party's real location; seed/reference matches require operational validation and calibration.

## Output acceptance (user-requested workflow revision)

Reviewers may ACCEPT a single output as-is or all versioned pending outputs in a batch. Corrections are optional. Acceptance changes reviewState to ACCEPTED and removes the item from the pending queue. It never clears validation failures, unresolved fallbacks, conflicts, original reasons or confidence scores, and never promotes an unchanged proposal to AUTO_TRANSLATED. The audit event captures reviewer, reason, time and the exact accepted Hybrid lines plus validation snapshot. Processing status describes system findings; reviewState describes the operator decision. Accepted records can therefore retain PROPOSED_REVIEW_REQUIRED or ERROR as their processing status while being complete in the review workflow.

Edits supplied with ACCEPT rerun deterministic rules and validation. Human-supplied locality changes are recorded without asserting verified confidence. Accepted exceptions remain visible in results, filters and export. Batch acceptance explicitly covers all pending records, including those outside the current table filter, and commits atomically with version checks. The old APPROVE API remains for backward compatibility with verified approvals; it is not required for accepting output.

## Name interpretation in v1.4

Name/Address1 interpretation precedes locality parsing. The dedicated Name value remains the anchor, including all characters beyond66 until the Hybrid engine audits truncation. Exact multi-token known-name fragments in Address1 can be deduplicated; explicit new joint-name markers or Name labels can be proposed with cross-field evidence and review reasons. Ambiguous unmarked text, country/locality overlap and unseparated building-name overlap are retained rather than guessed. Numbered streets, routing and unit content are protected. Each action records source text, evaluated Name before/after and Address1 before/after. No name list, synthetic scenario label or extra-column data is consulted.

Source Name placement confidence1 means it was supplied in the dedicated field, not verified identity. Proposed cross-field Name confidence0.93 is heuristic and does not bypass review. Human-supplied Name edits are separately recorded, and acceptance-with-edits makes no independent identity verification assertion.
