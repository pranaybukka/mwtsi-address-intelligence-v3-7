# v1.13.2 ISO country verification

## Root cause and changes

The pre-change reproduction produced CN for CENTRAL HONG KONG SAR CHINA and arbitrarily selected CD for ambiguous KINSHASA CONGO. Bank_Country aliases such as UK, U.S.A. and Hong Kong SAR, China were incorrectly flagged invalid; three-digit numeric codes were not recognized. Country-edit handling differed from import, and pure validation accepted arbitrary two-letter strings without an explicit reference validity flag.

A shared exact structured-field resolver normalizes assigned alpha-2, alpha-3 and three-digit numeric inputs plus supported names/aliases to canonical ISO alpha-2. The existing seven language catalogs and qualified territory aliases are shared by browser preview and server decisions. Address parsing prefers qualified names and limits short-code matches to country/locality context; ambiguous independent country evidence leaves Country unresolved with alternatives. Bank authority and disagreements remain visible. Pure validation checks actual assigned ISO membership. The country alias seed advances idempotently to 5 without changing schema, reference snapshot files or saved operational records. Original source and decisions are preserved. No dependency changed.

## Checks

397 unit/integration tests across 30 files passed, including all prior Hybrid, upload, security, recovery, dashboard, deletion and patch regressions, the supplied 200-row workbook, full 18,000-row name corpus and expanded reference. The 43 new country scenarios round-trip alpha-2/alpha-3/three-digit numeric codes for all 249 assigned ISO entries, test HK/CN/MO/TW distinction, punctuation, supported languages, invalid/deprecated codes, ambiguous names, state/prose exclusions, bank conflicts, saved decisions and idempotent alias upgrades with preserved records. The existing seed-upgrade expectation now checks version 5.

62 Linux Chromium production browser checks passed. New scenarios verify real XLSX import/export (including a numeric Bank_Country cell), qualified territory output, ambiguity and identical country normalization in live review preview, saved decisions and attributed audit history. The animation timer test was made tolerant of initial hydration scheduling; it also passed three repeated runs. Animation application behavior is unchanged. Typecheck and production build passed.

Native Windows/macOS browser execution remains unverified. The same implementation serves every platform. Site preview infrastructure is unavailable; release links, disclosure structure, archive integrity and size are checked before native publication.

## Delivery

The signed patch supports 1.10.0, 1.11.0, 1.11.1, 1.12.0 through 1.12.5, 1.13.0 and 1.13.1. The real isolated 1.13.1 external-installer check/application and automatic alias upgrade are verified separately before publication; the release report records their final result and unchanged operational-data fingerprints. No new dependencies or operational-data rewrite. Source/patch archives exclude runtime databases, builds, installed dependencies, credentials and private signing material. Saved proposals are not recalculated; reupload the source or correct an editable record to use new country interpretation. See ISO_COUNTRY_CODES.md and PATCHING.md.
