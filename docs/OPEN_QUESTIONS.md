# Open questions and policy decisions
1. **MX versus slash profile:** PMPG p11 has 2x70 MX lines, p28 postal in 3/, p40 town 35. Internal request explicitly requires slash payloads 33, postal in 2z and town 30. Implement internal profile; no XML or ISO20022 message certification.
2. **DOCX example inconsistencies:** Some example text exceeds four lines; use explicit selected Line1–4 table and pasted priority rules.
3. **NAME_ONLY:** DOCX pending ACI response says unprefixed name first 35. Pasted request requires 33/66 segments. Isolate nameOnlyPolicy using pasted slash name segments. Address validation NOT_APPLICABLE; never count resolved.
4. **Workbook flags:** All 90 international cases expect review even where user permits high-confidence automation. Row104 expects no review despite unresolved country; NAME_ONLY expects review. Report these as policy discrepancies; do not weaken safety to reproduce flags.
5. **Bank country:** Banking authority selects country as requested, but may not be party country (PMPG p43–45). Any disagreement blocks automation. No automatic cutover bridging.
6. **Fallbacks:** ZZ/NOTPROVIDED proposal only; no automatic province-for-town substitution.
7. **Reference coverage:** No full licensed gazetteer supplied. Seed markets/localities are demonstrative; load quality-controlled global data before operational use. Unknowns require review.
8. **Heuristic scores:** Must calibrate on independently labeled operational data before approving production thresholds.
9. **Third logical line:** Preserve surviving content by joining overflow into secondary, auditing merge and subsequent 66-character loss. Original fields unchanged.
10. **Production:** Local single-user app; SSO, role separation, retention, encryption and infrastructure review needed before enterprise exposure. No public hosting requested.

11. **User-approved output acceptance:** Later instruction permits acceptance without correction. This supersedes any earlier assumption that operational acceptance requires all findings to be repaired. ACCEPTED review state records that decision independently of processing/validation status; it does not certify compliance or automatic resolution.

12. **Group interpretation:** Treat the requested constant field as a standard per-record source column named Group, not one enforced value across the whole upload. It is immutable during remediation and used for filtering/sorting. Group is optional for backward compatibility. Exact Group labels are kept; blanks/whitespace-only values share the No group option. There is no address inference from Group.
13. **Additional workbook logic:** Extra formulas export cached values (or literal formula text if no cache), never executable formulas; original formula and hyperlink target metadata remain in the source audit. Duplicate or unnamed data-bearing columns are rejected rather than overwritten/discarded. Source header collisions namespace computed fields and disclose mappings in Summary.

14. **Name interpretation:** v1.4 implements the user's instruction to consider Name information in Address1. Known duplicates and explicit continuations are separately audited. An arbitrary alphabetic line is insufficient proof of a person/organization name, and geographic/building overlaps are retained for review. No surname dictionary is treated as global truth. Ambiguous continuation boundaries may require Name editing; the original source is never silently overwritten.
15. **Stored results:** Interpretation improvements apply on new processing/reupload, not retroactively to previously accepted outputs. A notice identifies legacy stored batches.
