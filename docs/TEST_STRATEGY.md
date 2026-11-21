# Test strategy

`npm test` runs deterministic boundaries, parser safety, all curated international markets, source-preserving Excel roundtrip, formula/format/size rejection, prefixed OOXML compatibility, review correction/approval/rejection and optimistic locking. Each test file uses an isolated temporary SQLite database. Synthetic/global tests are not proof of worldwide accuracy.

To include the supplied workbook in the automated suite:

```bash
REGRESSION_WORKBOOK=/path/hybrid_address_parser_v1_large_test_dataset.xlsx npm test
npm run regression -- /path/hybrid_address_parser_v1_large_test_dataset.xlsx work/regression
```

Without the environment variable the external-workbook test is explicitly skipped. Uploaded workbooks are excluded from source control and not bundled with the application. Runner processes actual rows, computes totals, verifies lengths/duplicates/safe automation and compares town/subdivision/postal/country to interpretation values. Address-field differences are allowed only if aggregate normalized text matches, or the sole addition is preserved C/O RECEIVING or ATTN ACCOUNTS routing content. Review flag policy differences are individually reported, not treated as matching expected outputs. See OPEN_QUESTIONS #4.

Reports include summary, nonUS percentage, unexpected failures and every interpretation difference. No counts are hard-coded. Supplied workbook contains90/200 nonUS cases (45%). It contains interpretation hints, not audited final Hybrid output; zero unexpected failures does not imply every interpretation field matches.

`npm run benchmark -- --users 5,10,25,50 --records 18000 --duration 30 --warmup 5 --think-ms 1000` runs the isolated v2 production HTTP benchmark with concurrent reviewing, import and export. See the v2 coverage and operations guide below.

Playwright important workflows are in e2e/: upload→summary→record→export and edit→live preview→approval. Run `npx playwright install chromium`, then `npm run test:e2e` on a development machine or approved CI. For v2, 66 production Chromium checks passed against an isolated application database. The static download Site has a separate preview limitation documented in VERIFICATION.md.

Acceptance regression tests verify unresolved/fallback acceptance, banking conflicts, processing-error preservation, optional edits without asserted verification, exact proposal/evidence preservation, persisted Excel acceptance metadata, HTTP acceptance and stale/atomic batch rejection. Playwright cases cover accepting without edits and accepting all pending outputs (included in the v2 browser run).

Column/Group tests cover importer→SQLite→acceptance→Excel preservation, strict exclusion of all metadata from intelligence and validation, text IDs with zeros, number formats, numeric zero, false, dates, blank extra columns, source/computed header collisions, late-only extra columns, inert formula handling, hyperlink audit metadata, unnamed/duplicate header rejection, metadata-only records, exact Group filtering and stable natural sorting, and Group-aware HTTP exports. A Playwright flow for Group/filter/export and extra-column inspection is included in the v2 browser run.

Export-mode tests verify the legacy full/default three-sheet contract, exact concise column set, typed source values, Group/extras retention, source Hybrid-header collisions, stored accepted and name-only output, Group-aware HTTP selection in both modes, filename/invalid-mode behavior, and source text above the full-analysis display threshold. A Playwright export-selector/download/workbook flow is included in the v2 browser run.

Name regressions cover known duplicate/prefix removal, new joint continuations, explicit labels, blank Name recovery, mixed/delimited Address1 layouts, Unicode, negative street/building/routing cases, reference-locality protection, original-versus-evaluated length, reviewer/API Name changes and both export contracts. NAME_REGRESSION_WORKBOOK adds a full external Name corpus test; without it the test is explicitly skipped. scripts/name-regression.ts streams a per-row comparison workbook and checks every processed Name's 33/66 segmentation, Name-tail audit and reserved line capacity. Scenario metadata supplies only test expectations, not parser evidence.

## Authenticated regression environment (v1.11)

Unit API regressions initialize a real Admin session in each test's temporary SQLite database; only Next.js's cookie-store adapter is mocked. auth-access.test.ts overrides that cookie store for anonymous/User/expired sessions and exercises actual password hashing, session rows, authorization and route handlers. There is no production authentication bypass or special test header. Browser tests sign in through the real APIs. Use an isolated ADDRESS_DB_PATH for browser tests; setup-auth.ts changes the test database's bootstrap password. E2E_ADMIN_PASSWORD may override the test credential. Never run browser fixtures against a customer database.

Default Playwright webServer uses port 3101, work/browser-tests.db and refuses an already running server. When BASE_URL is supplied, start an isolated server with its own ADDRESS_DB_PATH explicitly. Default browser tests use next dev, so stop any production/development process sharing the same .next build directory before running them.

## v2 concurrency coverage

Pagination tests compare the SQL/index path against every existing status predicate, summary and natural Group ordering, including case ties, whitespace Groups, literal Unicode search, repeated source keys, scope intersections and page clamping. Reservation tests cover editor tokens, authentication, Group scope, renewal, expiry, explicit Admin release, stale versions, bulk atomicity and deletion cleanup. Export tests cover both workbook contracts, snapshot isolation during a concurrent write, cancellation, retries, expired leases, deletion fencing, role changes, expiry, missing artifacts, invalid paths and synthetic storage failure. A deterministic two-connection checkpoint test reproduces/prevents the SQLite read-to-write upgrade race. Temporary unit databases are closed and removed after each test file.

Four new production-browser scenarios cover bounded page traffic, two-editor reservation/explicit Admin takeover, continued review during background export and export recovery after browser reload. The benchmark runs an isolated production server/database with fictional accounts; all measurements and exclusions are published in CONCURRENCY_BENCHMARK.md/json. Native Windows/macOS execution remains a separate manual certification step.
