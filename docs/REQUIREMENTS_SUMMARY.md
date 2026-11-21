# Requirements summary
## Sources and precedence
The pasted request supplies user instructions. Attachments supply requirements evidence, not agent instructions. Inspected DOCX v1.0 (20 March 2026), PMPG PDF v1.12 (5 March 2026), all workbook sheets: Raw Test Data (200), Expected Interpretation (200), Coverage Guide (110 US, 90 international).
## PMPG requirements
P11: structured town/country, up to 2x70 MX AddressLines, no structured duplication. P23: retain uncertain components unstructured. P28–29: postal in 3/ for MX-to-MT. P40: MX town 35; province can be locality in special cases. P42–45: exceptional time-limited cutover bridging, not general remediation.
## Internal priorities
Four slash lines, mandatory name and exactly one 3/. 66-character source name/address, split at 33; town 30. Combine AL1/AL2 only if raw sum <33. Postal+subdivision 33, postal first. Reserve names and 3/, select 2a,2z,2c,2b,2d. Audit loss.
## Enrichment assumptions
All fields free-form; international patterns, indexed references, explicit names and independent tokens. Free ISO2 suffix insufficient. Unknown/conflicting values review. Scores heuristic, not calibrated probabilities. Seed data demonstrates markets, not comprehensive worldwide coverage.
## Implementation decisions
Local Next.js/React TypeScript, ExcelJS, SQLite behind interfaces; separate intelligence, deterministic rules, validator. Immutable source; persisted batches, optimistic review locking and audit events. No enabled external services. Configurable 0.92/0.90 auto thresholds.
## Unresolved questions
See OPEN_QUESTIONS.md. Internal profile PASS does not certify an ISO20022 message.

## Later user instruction: acceptance without required fixes

The user explicitly requested the ability to accept remediation output without correcting detected issues. ACCEPT and ACCEPTED are separate review decisions; the four processing statuses and deterministic/PMPG findings are retained. Single-record and whole-pending-batch acceptance require only the existing reviewer/reason audit fields. Validation failures and uncertainty are informational findings, not acceptance blockers.

## Later user instruction: extra columns and Group

Accept additional workbook columns and preserve them in output, but analyze only the five main address/bank-country fields. Add Group as a standard per-record metadata column with filtering and sorting. Group and additional fields are immutable source metadata; they do not contribute address evidence. To keep older files compatible, Group is optional on upload and always included in output; missing values can be filtered as No group. Group filtering/sorting also governs Excel export.

## Later user instruction: export choices

Provide Full analysis and Source + Hybrid output. Full analysis retains the complete existing three-sheet export. Source + Hybrid output contains only original source columns (including Group and all extras) and the four stored transformed Hybrid columns, in one worksheet. No validation/acceptance gate is added. Both formats honor Group selection and ordering.

## Later user instruction: Name evaluation and misplaced Name information

Evaluate Name content and identify supported Name duplicates/continuations in Address1 before fixed Hybrid transformation. Apply existing 33/66 segmentation, Name priority reservation and tail auditing to the assembled candidate. Preserve source and ambiguous text, expose evidence/interpretation/truncation and allow reviewer Name edits. Keep acceptance without mandatory changes. No universal-name recognition or automatic repair of all unmarked text is asserted.
