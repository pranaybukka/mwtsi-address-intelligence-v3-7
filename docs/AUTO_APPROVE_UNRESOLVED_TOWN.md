# Auto-approve Unresolved town — v1.8.3

**Retired in v1.9.1.** Automatic town approval has been removed. This document describes a historical release; see [the current review/update guide](RECORD_REVIEW_COMPARISON.md).

Use **Processing settings → Auto-approve Unresolved town**. It defaults to **On** and saves independently of the postal lookup toggle.

The condition is the town's **Unresolved** state shown in the workspace: a blank/whitespace town or an explicit Unresolved value, ignoring case and surrounding whitespace. Matching uses the structured town value. The Hybrid export continues to use its existing placeholder format for a blank town; that serialization does not determine eligibility. A populated town is outside this rule even if a placeholder appears elsewhere in the record.

**On:** successfully processed address records with an Unresolved town are automatically accepted. **Off:** those records remain pending for manual review. Existing manual acceptance, edits and rejection remain available. Name-only records without a town line and processing ERROR records are excluded.

The UI labels system acceptances Auto-approved with issues. Original source, confidence, validation findings, evidence, output lines and processing status remain intact, including any other findings. Acceptance does not establish address completeness or deliverability.

Each new system acceptance records origin **AUTOMATIC_UNRESOLVED_TOWN**, reviewer **SYSTEM_AUTO_APPROVAL**, timestamp, reason, unchanged before/after components and an accepted-output snapshot. The event, result and optimistic-lock version are saved atomically. Replaying a committed chunk does not duplicate its decision.

Full analysis uses **Auto_Approve_Unresolved_Town**, **Auto_Approved** and **Acceptance_Origin**, with the actor/time/reason in existing acceptance fields. Summary reports the rule setting and automatic count; Audit retains settings and decision history. Source + Hybrid retains its source columns and four Hybrid lines.

Both processing options are captured for each new batch. Changing a toggle does not rewrite saved results or decisions. Reupload original data to apply a different rule. Saved v1.8.2 batches retain their original policy, captured setting and AUTOMATIC_NOTPROVIDED_CITY history when resumed; older batches without either automatic policy retain manual-review behavior. A legacy policy field may appear when exporting a legacy batch. Historical audits are preserved verbatim.

Upgrading retains the previous automatic toggle's saved On/Off value under the corrected name, along with postal lookup settings. GET /api/settings now returns **autoApproveUnresolvedTown**. PATCH accepts that boolean and/or postalLookupEnabled, merging changes atomically. The former autoApproveNotProvidedCity request field remains a compatibility alias; contradictory old/new values in one request are rejected. No dependency or destructive database migration is required.
