# v1.5 priority and postal review

The supplied internal rules reserve Name 1a and, when needed, 1b before one mandatory Country/Town 3a. There are at most four records and at most two address records. Available address slots are allocated in this exact order: **2a primary > 2z postal/subdivision > 2c secondary > 2b primary continuation > 2d secondary continuation**.

Postal therefore outranks secondary address information and both continuations, but does not outrank primary address. Two Name records plus Country/Town leave only one slot: primary wins and postal is audited as dropped. Changing that outcome would change the supplied policy. After Name interpretation removes Name information from Address1, primary 2a can originate from a later source column.

The review drawer now reports address capacity, postal disposition and each candidate selection reason. Full analysis adds Hybrid_Priority_Validation, Hybrid_Address_Slots, Selected_Candidate_IDs, Hybrid_Selection_Audit, Postal_Selection_Status, Postal_Selection_Reason, Postal_In_2z, Postal_Dropped_By_Priority and Hybrid_Rule_Issues. Postal_In_2z means the expected 2z payload occurs in output; an identical payload can also be present under another candidate. NOT_PROVIDED means enrichment/review supplied no structured postal value, not proof that the original source had no postal text. Source + Hybrid export stays unchanged.

Validation independently rebuilds expected candidates and checks segmentation, combination boundary, mandatory reservation, capacity, exact selection order and loss audits. A stored trace is not trusted. Postal pattern parsing rejects leading numeric street house numbers; standalone postal/state lines can be sanitized into 2z even when Town is unresolved. Postal recognition remains heuristic and uses the configured country/reference data. Review-added address data is no longer discarded by original name-only classification.

Retain and back up the existing data folder when installing. Existing stored batches are not silently re-enriched. Reupload original workbooks to apply new parsing. Accept-as-is remains available and does not clear findings. Existing audience guides describe the v1.4 baseline; read this addendum for v1.5 changes.


The v3.2 correction applies the documented conditional generation of 2z when complete postal/state is already retained in primary 2a. Its audit uses RETAINED_IDENTICAL_LINE; Postal_In_2z is false for this disposition because there is no separate postal record. Current candidate cards and the regression findings are in REGRESSION_UI_v3.2.md.
