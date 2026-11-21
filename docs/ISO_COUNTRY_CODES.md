# ISO country assignment — v1.13.2

The application uses assigned ISO 3166-1 alpha-2 country/territory codes. Hong Kong is HK, China is CN, Macao is MO and Taiwan is TW. A territory is not collapsed to a parent country. This is geographic address coding, not a nationality or sovereignty decision.

## What was fixed

Previously, country names were interpreted differently across Bank_Country, address text and review edits. A qualified string such as CENTRAL HONG KONG SAR CHINA could match both Hong Kong and China, with CN selected first. Unqualified Congo could select the first of CD/CG despite its ambiguity. Bank aliases and punctuation were inconsistently accepted. The pure preview validator also accepted arbitrary two-letter strings when called without a reference check.

A shared exact country-field resolver now normalizes recognized alpha-2, alpha-3, three-digit numeric codes and supported names/aliases to assigned alpha-2 values. Examples: UK or U.K. → GB; USA, U.S.A. or 840 → US; DEU or Deutschland → DE; Hong Kong SAR, China → HK; Macao SAR, China → MO. Numeric values require exactly three digits (e.g. 036 for Australia); text preserves leading zeroes. The same resolver runs in review preview and on the server, so the saved Hybrid output matches the preview.

The catalog uses the existing i18n-iso-countries dependency (7.14.x) and the application's English, French, German, Spanish, Portuguese, Japanese and Chinese names, plus explicit aliases. It does not perform fuzzy spelling correction or call an external service. All 249 assigned alpha-2 entries are supported. Non-assigned/user-assigned codes such as XK, arbitrary strings such as AA/ZZ and deprecated codes such as SU/YU are not treated as current assigned entries. UK is accepted as an input alias and outputs GB.

Address parsing recognizes qualified territory names before shorter country words inside them. Short country codes require a dedicated final country line or a matching locality in that country; a conflicting known subdivision prevents treating a final state abbreviation as a country. Three-digit numbers in free-form addresses are not automatically treated as country codes. Street/prose fragments and corporate suffixes are not sufficient evidence.

## Ambiguity and authority

Congo can mean CD or CG; Korea can mean KP or KR. Supply a specific name or assigned code. Multiple independent explicit countries without authoritative Bank_Country leave Country unresolved and retain candidate alternatives for review. A supplied Bank_Country still follows the existing authority policy: a recognized authoritative code wins, but disagreement with address-country evidence stays visible and blocks automatic translation. Invalid/ambiguous Bank_Country stays flagged rather than receiving authoritative status. Passing output with retained findings remains an explicit human decision.

Names, original address fields, Bank_Country and additional source columns remain unchanged. Review history records the canonical proposed country in before/after snapshots and the current signed-in account. Exports retain original source fields alongside computed country/Hybrid output.

## Existing batches

The patch adds country aliases idempotently (seed version 5) without changing the schema, reference snapshot files or operational records. Existing saved proposals and decisions are not silently rewritten. To apply new interpretation to an existing source file, upload it as a new batch and reconcile using its key. To correct an individual pending/failed record, edit Country (ISO-2), verify the preview and Pass. Existing rules keep passed records read-only. Retain old batches/history for audit or use the existing Admin deletion workflow when appropriate.

## Apply the patch

Stop the app and worker. Extract mwtsi-patch-to-v1-13-2.zip beside the existing application directory, then run from that application directory:

```bash
node "../mwtsi-patch-to-v1-13-2/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v1-13-2/apply-patch.mjs" --app "."
```

Use your actual installer path. Restart normally and refresh browsers. Supported starting versions: 1.10.0, 1.11.0, 1.11.1, 1.12.0 through 1.12.5, 1.13.0 and 1.13.1. Data, accounts, groups, settings, review history and the permitted local allowScripts map are preserved. No new dependency or schema migration; the small alias seed runs automatically. See PATCHING.md for custom database/port options and recovery.

## Sources and checks

ISO country entries: https://www.iso.org/obp/ui/#iso:code:3166:HK and https://www.iso.org/obp/ui/#iso:code:3166:CN . The Hong Kong Trade and Industry Department also confirms ISO HK: https://www.tid.gov.hk/en/tradecircular/2020/ci6262020.html .

43 new unit/integration scenarios include an exhaustive round trip of alpha-2/alpha-3/numeric codes for all 249 entries. New browser scenarios exercise actual workbook import/export and preview/decision/audit consistency. See VERIFICATION.md and the release report for final results and platform limits.
