# Postal code → probable town / city — v1.6.0

**v1.8.1:** Postal code lookup is configurable under Processing settings and defaults to On. Off disables automatic postal-derived town lookup and manual lookup; batches retain their starting setting. See [configuration guide](POSTAL_LOOKUP_CONFIGURATION.md).

The application can now propose a missing town from a recognized postal code and an independently identified country. It also offers a manual lookup in the record review drawer. This runs locally with no address data sent to a third party.

## How to use

1. Upload the existing source workbook. Postal text must be in the analyzed Address1/Address2/Address3 columns. Bank_Country can provide the ISO-2 country; explicit country evidence can also resolve it. Extra columns remain metadata and are not analyzed.
2. When no gazetteer city was identified and a single postal/country relationship is found, the app proposes the city, shows POSTAL_TOWN_LOOKUP evidence and keeps the record pending review. The proposed Hybrid Country/Town line can contain that probable city; it is not certified or automatically accepted.
3. Open a record and find **Postal code → probable town / city** beneath the structured fields. Set Postal code and Country (ISO-2), then click **Look up probable town**.
4. Review the suggestions and sources. Click **Use [city] as proposed town** to update the preview. This changes only Town; it does not automatically overwrite state/country, save or accept the record. Enter a reviewer and note to save or accept. Accept-as-is remains available.

Examples: US 10001 → NEW YORK; US 90012 → LOS ANGELES; US 02110 → BOSTON; AU 3000 → MELBOURNE; GB SW1A 1AA → LONDON; CA M5V 3L9 → TORONTO. Keep postal codes as text to retain leading zeros.

## Matching and ambiguity

Country is required. A postal code alone cannot establish country: 1000 has different relationships in Belgium and the Philippines. Country resolution still follows the existing evidence/authority rules and any conflict remains visible.

Lookup uses exact normalized reference keys (case, spaces and hyphens normalized). A US ZIP+4 may fall back to its five-digit ZIP when the full code has no match. No arbitrary numeric-prefix inference, postcode-area extrapolation, geographic API calls or fabricated postal padding is used. Base-ZIP results explicitly identify that weaker match. The automatic extractor still uses country-specific postal patterns; manual lookup accepts normalized reference keys, including codes entered without separators.

Multiple distinct localities leave the automatic Town unresolved and expose alternatives for review. Duplicate records for the same normalized town/subdivision collapse. The manual UI shows at most 20 options and reports the total if more exist. A known explicit city is not overwritten because of a postal disagreement; that disagreement remains a conflict. Leading street house numbers rejected by the existing postal extractor cannot seed a probable town.

Single exact matches use 0.85 heuristic confidence, US base-ZIP matches 0.80, and ambiguous alternatives 0.65. These are evidence scores, not measured probabilities. Postal-derived towns require review even if configured thresholds are lowered. Manual acceptance records the decision without claiming verified confidence; existing human review/save semantics remain unchanged.

Unknown codes report **No match in the local postal reference**. This does not mean the code is invalid. Postal territories can contain multiple localities; a single match in a limited reference does not establish unique real-world coverage or deliverability.

## Bundled coverage and expansion

The default database has **253 country/postal relationships across 102 towns in 44 countries/territories** after applying the additive seed update. It combines the existing 76 demonstration place records with an additional curated selection of major-city code examples. It is a starter reference, not a complete national/worldwide postal database or authoritative postal-service inventory. The coverage CSV lists exactly what is bundled, with normalized codes and reference sources. Updated code examples live in src/db/major-postal-data.json; existing examples remain in seed-data.json. Sources remain distinguishable in lookup evidence (existing canonical places can retain CURATED_DEMO_SEED as their source).

Use the existing GeoNames-compatible postal importer to extend country coverage from a governed, appropriately licensed local dataset:

```text
npm run db:import -- postal path/to/postal-reference.txt
```

See REFERENCE_DATA.md for format and attribution requirements. Restart the application after importing to clear reference caches. Uploaded customer workbooks are never accessed through their original filesystem paths; the importer path above is an administrator's server-owned reference file.

## Storage, API and exports

Seed metadata advances from version 3 to 4. The upgrade inserts reference relationships and canonical aliases idempotently; it does not delete or rewrite customer batches/reviews. No schema migration is required. Existing batches are not silently re-enriched: reupload the original source for automatic postal-town inference, or use manual lookup in a pending record.

GET /api/reference/postal?country=US&postal=10001 returns a country-scoped local reference result: FOUND, AMBIGUOUS, NOT_FOUND, COUNTRY_REQUIRED, INVALID_COUNTRY or INVALID_POSTAL. It includes candidate city/subdivision/country/source, heuristic confidence and EXACT/US_BASE_ZIP match type. Inputs are length-limited and SQL lookups parameterized; responses are not cached. This is a local-app endpoint, not a public authenticated postal service.

Full analysis already exports Enriched_Town_Candidate, Town_Source, Town_Probability, Town_Promoted, Enrichment_Evidence and Processing_Notes. Postal-only suggestions use POSTAL_TOWN_LOOKUP, remain below the promotion threshold and carry reference evidence. Source + Hybrid export retains its original shape and includes the proposed Hybrid lines. Original source fields and extra columns remain unchanged.

## Verify and install

Examples are supplied in postal-town-lookup-sample.xlsx and the corresponding Full analysis results workbook. The coverage CSV and JSON report document the actual shipped reference. Unit/integration tests cover country scope, normalized codes, leading zeros, ZIP+4 fallback, ambiguity/deduplication, explicit-city conflict, street-number rejection, unknown country/code, API and additive seeding. Browser tests cover automatic proposals and manual lookup/save/accept behavior. See VERIFICATION.md for final test/build counts and platform limitations.

Stop the app, back up and retain your data folder, replace the source with v1.6.0, then use Node.js 24 LTS and run npm ci and npm run dev. First processing/lookup applies the reference seed upgrade automatically. The security-maintained dependency tree and documented prebuild-install warning are retained.
