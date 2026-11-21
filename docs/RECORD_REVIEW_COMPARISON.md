# Record Review comparison and removal of automatic town approval — v1.9.1

**v1.10 update:** Key and Name, top Pass/Fail buttons and reasons below the heading are documented in [the decision guide](PASS_FAIL_REVIEW.md).

Record Review now places **Original source · PRESERVED** beside **Proposed Hybrid output** at the top of a wider review drawer. Both cards align on desktop screens. The proposed output remains live: edits to the structured fields update the Hybrid preview using the existing rules, while original source values remain unchanged. Additional source columns, evidence, edits, validation and review controls remain available below the comparison. On screens up to 800 pixels wide, the cards stack vertically for readable text and controls.

**Auto-approve Unresolved town has been removed.** There is no configuration switch or supported API option for automatic town approval. Unresolved-town records stay pending for an operator's decision. Editing, accepting as-is and rejecting remain available; corrections are optional and findings stay visible.

The removal also applies to unprocessed rows of previously queued, running, paused or failed jobs. Old saved On values, including the earlier NOTPROVIDED-city setting, cannot reactivate it. Completed historical decisions are preserved; the application does not revoke or rewrite them. Review/export history can identify **Previously auto-approved** records, and their original audit actors, timestamps, origins and findings remain intact.

Processing settings now exposes only postal code lookup, still On by default. Existing postal lookup choices are retained. GET /api/settings returns postalLookupEnabled; PATCH accepts exactly that boolean field. Requests containing either retired automatic-approval field are rejected. Archived batch settings may retain their original fields in Audit as historical evidence, but only postal lookup can affect remaining work. No destructive database migration is required.

Full analysis no longer generates active Auto_Approve_Unresolved_Town or Auto_Approve_NOTPROVIDED_City columns or a configuration Summary row. Historical acceptance indicators/events remain available. Source + Hybrid, multi-select status filtering, unique selected-filter exports and fixed Hybrid priorities are unchanged.

When upgrading, stop the previous application, back up and retain the data folder, replace source files, run npm ci and restart with npm run dev, or build and run npm start. Old queued jobs can then resume with automatic approval removed. Browser refresh loads the revised review layout and controls.
