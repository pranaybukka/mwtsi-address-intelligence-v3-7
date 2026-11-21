# Dependency security maintenance — v1.5.2

Date: 7 November 2026. Node.js 24 LTS is the supported installation baseline (package engine: Node >=24). Address priority rules, uploaded-byte handling and existing acceptance decisions are unchanged.

## Findings and selected fixes

The original full npm audit reported five affected packages: two critical and three moderate. Package counts include propagation to parent dependencies and are not five independent exploitable application paths. The critical findings were in the development/test dependency chain. The production-only audit originally reported two moderate affected packages in the ExcelJS/UUID chain.

| Dependency | Change | Purpose |
| --- | --- | --- |
| Vitest | 3.2.7 to pinned 4.1.12 | Fix mocker advisories; remove the vulnerable Tinypool worker dependency. |
| ExcelJS | Retained 4.4.0, latest published release checked | Preserve workbook behavior; repair specific transitive dependencies below. |
| ExcelJS UUID | Scoped override from 8.3.2 to 11.1.1 | Patched UUID library with CommonJS support for ExcelJS's v4 conditional-format IDs. No global ESM-only UUID substitution. |
| ExcelJS unzipper | Scoped override to 0.12.3 | Remove the old fstream/rimraf dependency chain. In-memory XLSX upload still uses its existing loader; streamed-reader compatibility is also tested. |
| ExcelJS fast-csv | Scoped override to 5.0.7 | Remove deprecated lodash.isequal through the CSV helper dependencies. This does not add a CSV upload/export UI. |
| archiver-utils glob | Scoped override to 14.0.4 | Remove deprecated glob/inflight and use a version outside the current glob/minimatch advisory ranges. Archive glob operation is tested. |
| better-sqlite3 | Retained current major, pinned 12.11.1 | Preserve the existing native binary installation path and SQLite schema. |

Overrides are recorded in package.json and the resolved versions/integrities in package-lock.json. They are application-maintained compatibility decisions beyond ExcelJS's original declared ranges; future updates must rerun the compatibility tests and workbook/browser regressions. No npm audit fix --force, patch inside node_modules, advisory suppression, or warning suppression was used.

The Vitest configuration is now vitest.config.mts using an ESM-safe path URL; the old .ts config was removed. This avoids the new test runner's configuration warning.

Next.js explicitly treats ExcelJS as a server external dependency alongside better-sqlite3. This uses native Node loading for the Node-only workbook library and avoids bundling an unused optional S3 helper in unzipper. No AWS SDK was added and no remote workbook access was enabled. Production upload and export browser checks validate this deployment configuration.

## Remaining installation warning

One **deprecation warning** remains: prebuild-install@7.1.3, required by better-sqlite3@12.11.1. It is an installer helper, not an npm audit vulnerability finding in the resolved dependency tree. The deprecated inflight, rimraf, lodash.isequal, glob, fstream and uuid versions shown in the original screenshot have been removed.

A clean install of the newest SQLite major attempted a native source build in this environment. We retained the working major rather than require users to introduce compiler tooling just to remove a warning. The remaining helper should be revisited when the supported SQLite installation path can be upgraded and verified on native Windows/macOS. The warning has not been hidden. Native binary downloads or compilation can still depend on host/CPU/Node availability, as in earlier releases.

## Verification artifacts

- security/npm-audit-before.json: original full report.
- security/npm-audit-after.json: updated full report.
- security/npm-audit-production.json: updated production-only report.
- dependency-compatibility.test.ts: streamed XLSX writer/reader round trip, Unicode/CSV quoting, conditional-format UUID generation, archive glob behavior.
- Existing upload platform/error, source column, Group, export mode, review, Name, parser and Hybrid priority checks remain in the suite.

The after reports contain **zero vulnerabilities in every severity**, including development dependencies. Audit results reflect the registry advisory data at verification time and must be repeated as advisories evolve.

## Installation and audit

Stop the app and back up the data folder. Keep your data folder and existing database; replace source files with v1.5.2, including package.json and package-lock.json. Use Node.js 24 LTS, then run:

```text
npm ci
npm run security:audit
npm run dev
```

npm ci rebuilds node_modules from the shipped lockfile. Do not copy node_modules between Windows and macOS. The single prebuild-install deprecation warning described above is expected; an installation error is different and should be investigated. No data migration or address workbook reupload is required by this dependency update.

See VERIFICATION.md for completed test/build counts and browser limitations. Native Windows and macOS validation is not inferred from Linux browser tests.
