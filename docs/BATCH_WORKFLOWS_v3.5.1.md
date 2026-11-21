# v3.5.1 — Final batch workflow patch

This contains the v3.5 batch comparison, bulk correction preview and changes-only export features. Read [the full workflow and limitations](BATCH_WORKFLOWS_v3.5.md). It also fixes changing correction inputs while a saved preview is loading: loading cancels cleanly, the Preview button remains usable and the outdated response is ignored. No operational data or existing preview is applied by cancellation.

## Upgrade

This final bundle directly supports **3.4.0 or3.5.0**. You need only this bundle from either version. No dependency, startup, address rule or schema changes beyond the additive v3.5 workflow schema are introduced.

Back up the actual operational database; stop the app and worker. Extract **mwtsi-patch-to-v3-5-1.zip** beside the app. From inside the existing application directory:

```bash
node "../mwtsi-patch-to-v3-5-1/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v3-5-1/apply-patch.mjs" --app "."
```

If your database is chosen only through a shell/service startup variable, supply the same environment or append `--database` followed by the actual operational SQLite path in quotes. Use the same custom `--port` when relevant. Verify that Apply reports a database backup for an existing operational database. A check validates source compatibility, not the selected database's identity. Never bypass a local source conflict. Wait for successful completion, restart normally and refresh browsers.

Earlier versions first reach3.4.0 with retained patches. For a new installation use the retained v3.4 full source, npm ci with Node24 LTS and this final patch. Existing installations use the patch, without reinstalling the app. Original source/patch archives are retained unchanged. Code rollback does not undo newer decisions/corrections; use a coordinated operational backup and reconcile newer work when needed.
