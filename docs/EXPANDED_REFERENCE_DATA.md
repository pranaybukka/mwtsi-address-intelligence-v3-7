# Expanded reference data — v1.7 baseline, v1.8 administration

MWTSI now installs and uses a local, indexed GeoNames postal/locality reference in addition to the starter examples. This is a substantially larger openly licensed baseline that can be distributed with attribution. It is not a complete postal-operator validation product. Premium or postal-authority datasets require their own agreement/access and have not been purchased or connected.

## Verified snapshot

The verified source files were retrieved on 7 November 2026. Their checksums and counts are in reference-data/verified-snapshot.json and the downloadable source catalog.

- Snapshot: 14a75cba24111e3ce1fb (normalization version 3).
- 5,011,160 imported postal/delivery/location-reference relationships across 123 countries/territories; 4,283,671 distinct country/code keys.
- 4,812,170 relationships eligible for exact-key lookup, including major-code references; 116 countries have eligible relationships. Area-only and non-postal-proof rows remain catalogued but are excluded from postal-town lookup.
- 1,165,857 combined locality records, including postal delivery localities, and 2,041,762 normalized aliases.
- 230,416 distinct gazetteer locality keys from 236,876 accepted cities500 source rows. Do not equate postal delivery localities or source row counts with distinct cities.
- About 1 GB for the built reference database, plus approximately 60 MB of source downloads. Allow at least 4 GB free disk space for dependencies, staging a refresh and operational data. Initial build can take several minutes; later starts reuse the installed database.

The online sources change. A later fresh install or reference:refresh can legitimately have different counts/checksums. The optional offline source packs reproduce this verified source snapshot; import time can differ while its source-content snapshot ID remains stable.

## Sources, precision and rights

Source URLs and upstream field definitions:

- https://download.geonames.org/export/zip/allCountries.zip — supported-country postal records.
- https://download.geonames.org/export/zip/CA_full.csv.zip — full Canadian codes.
- https://download.geonames.org/export/zip/GB_full.csv.zip — full British codes.
- https://download.geonames.org/export/zip/NL_full.csv.zip — full Dutch codes.
- https://download.geonames.org/export/dump/cities500.zip — populated places / administrative seats with multilingual aliases, not every geographic feature.
- https://download.geonames.org/export/dump/admin1CodesASCII.txt and countryInfo.txt — administrative names and additional postal patterns.

GeoNames publishes these files under CC BY 4.0 and permits commercial use with attribution. Preserve GeoNames attribution and the upstream UK Royal Mail notice. The license, readmes, transformation notice and source manifest are included under docs/reference-data. The app displays attribution and installed coverage. See https://www.geonames.org/export/ and the upstream readmes for source terms.

The standard postal dump has only first-part codes for CA/GB/NL; those rows are skipped in favor of the separate full-code files. CL/IE/MT/AR partial-area records are marked AREA_ONLY and excluded from exact-code lookup, including preventing an area-only row from being relabeled through the starter fallback. BR/CN records are marked MAJOR_CODE; those datasets do not provide every individual postal code. AE/HK/MO source location/regional identifiers are marked NON_POSTAL_PROOF and excluded pending postal-operator confirmation, with source patterns disabled for those provider rows. This conservative policy and the relevant UPU country-sheet URLs (which have varying publication dates) are in reference-data/quality-policy.json. It is not a claim that postal systems cannot change. Other country coverage is uneven, postal places need not be official postal towns, and coordinates/accuracy fields are not used as proof of an address. No arbitrary prefix inference was added. US ZIP+4 retains its explicit five-digit fallback.

## Install and operate

Use Node.js 24 LTS. Stop the application and back up/retain the existing data folder when updating source. In the extracted hybrid-address folder:

```text
npm ci
npm run reference:install
npm run dev
```

The first reference:install downloads only public reference files from the fixed GeoNames URLs, records hashes/metadata, builds a staging SQLite database, checks it and renames it into data/reference.sqlite. It does not upload customer addresses. npm run dev and npm start also run this installer before starting the server; when a valid reference is already present, the check is quick and makes no network request. tsx is now a runtime dependency so this step also works after npm ci --omit=dev.

Public reference downloads can be blocked by corporate network policy. Offline alternative:

1. Download the four offline reference source packs from the application download page.
2. Extract each pack **into the extracted hybrid-address project folder**. They populate reference-data/sources without replacing customer data.
3. Run npm run reference:install -- --offline, then npm run dev.

Keep all seven data files together. Missing/invalid offline files cause installation to fail rather than silently claim full coverage. ZIP member names are read as data streams; paths from inside an archive are never extracted as filesystem destinations.

In v1.8 use **Reference management** to stage online/offline, inspect/validate and Activate a candidate, or Roll back to a retained validated snapshot. Once registered, a managed snapshot cannot be overwritten by the old reference:refresh CLI. Pending/resumable jobs pin references and block activation. See [the v1.8 administration guide](WORKFLOW_MANAGEMENT_v1.8.md) for the restore-pin exception, optional administrator token, task recovery and backups. ADDRESS_REFERENCE_DB_PATH can select the initial reference file and must differ from ADDRESS_DB_PATH. Runtime data/source caches are excluded from source ZIPs and build traces.

## Evidence, precedence and behavior

Expanded exact postal matches take precedence over curated starter links when present. Starter/local links remain fallback evidence when the expanded reference has no eligible match. Sources remain visible, and conflicting locations within the expanded data produce alternatives. It does not silently overwrite an explicit known city in the source address.

Postal delivery names can be streets or neighborhoods. They are not all gazetteer towns: only separately marked cities500 locality keys enter gazetteer inference. Singapore postal delivery names resolve to the city-state locality SINGAPORE. Administrative source codes are not universally ISO 3166-2 codes and are not automatically invented in output merely because a city was found.

Longer locality names take precedence over contained words (NEW YORK is not split into NEW + YORK). Country-only aliases such as MEXICO do not become an alternative city through a gazetteer alias. Postal corroboration can disambiguate the same observed city alias across states; independently different city evidence remains reviewable. The Name locality guard requires complete geographic context, so a surname that happens to be a city does not suppress an otherwise exact supplied-Name duplicate.

Postal-derived missing towns remain proposals requiring review, even under lowered confidence thresholds. Country is still required/independently resolved; source data, Name processing, fixed Hybrid priorities and accept-as-is remain in force. More comprehensive data may reveal ambiguity and increase review flags; synthetic tests do not establish worldwide address accuracy or deliverability.

The UI reports installed coverage or explicitly says starter-only/unavailable. GET /api/reference/status supplies the active catalog. The processing snapshot ID/provider/license/counts are stored in record intelligence and exported as Reference_Data_Snapshot in Full analysis, with detailed evidence in Audit. Existing saved batches/reviews are not reprocessed by installation; reupload original workbooks to use expanded inference. Manual edits retain existing human-review audit semantics.

## Verification and boundaries

See VERIFICATION.md for final checks. Both starter-only baseline regressions and explicit expanded-reference tests are required. The supplied 200-row interpretation workbook and complete 18,000-row Name/priority corpus were also run against the real expanded snapshot. Tests verify checksums, full-code/area handling, delivery-name isolation, state/name disambiguation, atomic failed refresh, provenance and live full-code lookup.

The two user-supplied allCountries attachments could not be transferred because each exceeded the tool's 32 MB limit. They were not inspected, used, redistributed or assigned a license. A ZIP-compressed CSV under 32 MB, smaller country files or a representative header/sample is still needed before their schema/provenance can be reconciled. This verified release uses only the listed public GeoNames sources.
