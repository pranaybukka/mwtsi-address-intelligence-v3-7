# Local package permissions and the first patch — v1.12.1

The reported v1.11.1 installation had the official package settings plus a local allowScripts object:

```json
"allowScripts": {
  "better-sqlite3@12.11.1": true,
  "esbuild@0.28.2": true,
  "fsevents@2.3.3": true
}
```

These are dependency installation permissions. The v1.12 installer compared package.json byte-for-byte with the release archive and rejected this otherwise compatible installation before changing files. That check protected local changes, but did not distinguish this installation policy from application changes.

Use the new **mwtsi-patch-to-v1-12-1.zip** bundle. Extract it into a new folder alongside your existing app; retain all installer files and the patches subfolder. Stop the host app and workers. From your existing application folder, for the layout reported in the conversation:

```text
node "../mwtsi-patch-to-v1-12-1/apply-patch.mjs" --app "." --check
```

Use the actual extracted installer path if it differs. A successful check reports valid=true, target 1.12.1 and preservedSettings containing package.json: allowScripts. Then apply:

```text
node "../mwtsi-patch-to-v1-12-1/apply-patch.mjs" --app "."
```

Wait for Patch operation complete, run npm run update:status and restart using your normal command. There is no need to install v1.12 first. The replacement bundle supports 1.10.0, 1.11.0, 1.11.1 and 1.12.0. It is an in-place update; existing accounts, records and database paths stay in place. Custom database/port/environment options from PATCHING.md still apply.

Keep your allowScripts entries. Do not delete them or replace package.json with an original copy to force the update. The old installer continues to reject this local addition; use the new installer from the new bundle, not just its .mwtpatch file through an older updater.

The updated signed manifest includes the exact original package.json baseline, with a checksum tied to the release's existing precondition. The updater compares the complete parsed package contents, permitting formatting/key order differences and the explicitly supported local allowScripts object. All other keys, scripts, dependencies, overrides, version and engine requirements must still match the starting release. Other files and package-lock.json retain their strict checksum checks. There is no force/ignore-conflicts switch.

The local allowScripts map is validated as a map of boolean permissions and copied into the trusted target package without changing true or false values. The same behavior supports subsequent signed patches. Backups record the actual original file hash/bytes and the effective installed hash, alongside signed release hashes. Explicit rollback, failed-build rollback and interrupted-operation recovery can therefore restore the exact original file, including its local policy and formatting. The operational database is not replaced by code rollback.
