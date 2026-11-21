# Reference data

SQLite schema: countries, country_aliases, subdivisions, subdivision_aliases, places, place_aliases, postal_codes, postal_patterns, address_tokens; plus metadata and operational tables. Indexed normalized aliases and postal keys; chunked IN queries, bounded lookup cache. ReferenceRepository isolates business logic from SQL and permits a PostgreSQL/AzureSQL adapter later. No per-address network calls.

Seed: i18n-iso-countries ISO names/alpha3 and multilingual aliases (English, French, German, Spanish, Portuguese, Japanese, Chinese); 76 curated demonstration places covering every requested market plus supplied test localities. These are SAMPLE reference relationships, not a full postal inventory. 249 ISO country entries are seeded; the package's non-ISO XK extension is excluded. Country rows and aliases can be governed in SQLite.

Run `npm run db:seed`. Seed initializes lazily on first processing. Country-specific postal patterns live in seed-data.json and the database. Short country aliases are conservative. No millions of places are embedded in source. Full place names and aliases come from imported data.

GeoNames compatible imports (download data separately and check current licensing/attribution):

```bash
npm run db:import -- places /data/allCountries.txt
npm run db:import -- postal /data/postal-allCountries.txt
```

The first accepts 19-column GeoNames geographical dumps, keeps feature class P (populated places) and indexes canonical/ASCII/alternate names. The second accepts the distinct 12-column postal dump. Import streams lines, commits chunks of5000 and upserts stable IDs. Country/subdivision identifiers are retained as source values; reconcile ISO subdivision aliases before operational use. Restart the app after import to clear process caches. Import updates are not a substitute for reference quality controls. Loading both sources may produce duplicate locality records; review behavior is conservative pending canonical identity reconciliation.

Reference source values remain on candidates; curated seed versus GeoNames source is distinguishable. GeoNames generally requires attribution (CC BY); validate exact source terms, versions and quality before ingesting. This delivery does not bundle third-party bulk dumps.

## v1.6 postal-town lookup

The additive version-4 seed adds major-city postal examples, bringing default coverage to 253 country/postal relationships, 102 towns and 44 countries/territories. A country-scoped postal reference can now propose a missing Town, always with review. The record drawer also offers manual lookup. See [POSTAL_TOWN_LOOKUP.md](POSTAL_TOWN_LOOKUP.md) for confidence, ambiguity, coverage and import limitations. Existing stored batches are not silently recalculated.
