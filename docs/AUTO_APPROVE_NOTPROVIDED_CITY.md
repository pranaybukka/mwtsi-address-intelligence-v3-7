# Auto-approve NOTPROVIDED city — v1.8.2

**Retired in v1.9.1.** Automatic town approval has been removed. This document describes a historical release; see [the current review/update guide](RECORD_REVIEW_COMPARISON.md).

**Historical v1.8.2 policy.** The current rule is [Auto-approve Unresolved town](AUTO_APPROVE_UNRESOLVED_TOWN.md); use that guide for v1.8.3 and later.

In **Processing settings**, use **Auto-approve NOTPROVIDED city**. It is **On by default**, including when upgrading an installation whose saved settings contain only the postal lookup option. Each toggle saves independently; changing one preserves the other.

**On:** a successfully processed record whose final Hybrid city is exactly NOTPROVIDED is automatically accepted. This includes missing towns rendered as the existing NOTPROVIDED placeholder, or a literal source value that produces that city. The UI labels the result **Auto-approved with issues**. It appears in accepted totals and the separate automatic-approval count; it is no longer pending manual review.

The rule applies even if the record has other validation findings. It records operational acceptance; it does not invent a city, promote confidence, certify an address or change the validation outcome. Original source, output lines, processing status, findings, evidence and confidence stay intact. Full analysis continues to show those findings.

**Off:** these records stay pending; the application does not automatically accept them. Existing manual acceptance, editing and rejection remain available. A city already resolved to a different value is unaffected by this rule. Name-only output without a city line and system processing ERROR records are not automatically accepted. Matching is exact on the output city, not a substring in names, extra columns or another address component.

Each automatic decision has an ACCEPT event with origin AUTOMATIC_NOTPROVIDED_CITY, reviewer SYSTEM_AUTO_APPROVAL, timestamp, configuration reason, before/after components and a snapshot of the accepted output/findings. The system actor is clearly identified; it is not a human verification. That event is saved atomically with the result and optimistic-lock version. Job replay/resume does not duplicate events. A prior accepted/rejected decision is not replaced by the automatic rule.

Full analysis adds **Auto_Approve_NOTPROVIDED_City** (the captured rule setting), **Auto_Approved** (the current automatic-acceptance indicator) and **Acceptance_Origin**. Existing Accepted_By/At/Reason, Output_Accepted and Accepted_With_Issues also apply. Summary includes the rule setting and autoApproved count; Audit contains settings and decision events. Source + Hybrid retains its source columns and four output lines.

New standard/mapped uploads and demonstration batches capture both settings when created. Queued, running, paused and resumed jobs keep those values. Changing the toggle does not reclassify completed results or rewrite existing decisions. Upload again to process an old workbook under the new setting. Jobs created before this feature retain the previous manual-review behavior when resumed; missing historical auto-approval settings mean Off for those saved batches, while the application default for new work is On.

The two toggles are independent: with postal lookup On, an actual postal-derived town can prevent the NOTPROVIDED condition. With postal lookup Off, a missing town stays unresolved; automatic acceptance can still accept its NOTPROVIDED output if the second toggle is On.

IT: GET /api/settings returns postalLookupEnabled and autoApproveNotProvidedCity. PATCH accepts either boolean field or both and merges atomically with current values. Unknown fields, empty objects and non-booleans are rejected. Existing same-origin local-operator protection applies. No dependency, reference download or destructive schema migration is required. Back up the operational SQLite database to retain settings, captured batch values and audits.
