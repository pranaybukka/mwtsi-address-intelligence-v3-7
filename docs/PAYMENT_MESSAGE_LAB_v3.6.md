# MWTSI Address Intelligence v3.6 — Integrated Payment Message Lab

## What is included

The Payment Message Lab is part of the signed-in Address Intelligence workspace. Admins see **Payment message lab** in navigation. It supports pacs.008, pacs.009 Core/COV, pain.001, XML copy/download, ACI RTPSMsg/RTPSHdr/BusMsg envelopes, configurable SourceCode, header version choices, scenarios, negative tests, standards packages and searchable BICs.

The supplied ISOBIC directory includes all 110,909 branch records as BIC11 choices plus 36,632 BIC8 choices: 147,541 total. All reference and validation assets are served through authenticated Admin-only handlers, outside public/. Their chunks fit the existing signed updater's per-file size limit. No external bank lookup or payment delivery connection is introduced.

Existing User accounts retain their review permissions and do not gain payment XML export or directory access. Anonymous requests, Users and accounts requiring a password change cannot fetch module HTML, code, schemas or BIC data. Assets are private/no-store and vary by authentication cookie.

## Use an approved address in a payment

1. Sign in as an Admin and open an approved record in Review.
2. Select the required BNP or ORP address block.
3. Choose **Use as debtor** or **Use as creditor**. Unsaved edits must be saved and passed first.
4. The Payment Message Lab opens with the approved address summary.
5. Choose pacs.008, pacs.009 COV or pain.001, then click **Load as debtor/creditor** above the lab.
6. Inspect the XML and validation results before copying or downloading.

The handoff rechecks the saved record version and approval. It copies the saved name, town, country, postal code, subdivision and primary/secondary address lines. It does not change the operational record, its decision or audit history, account identifiers or BIC selections. COV customer addresses populate the underlying customer-payment block. pacs.009 Core uses financial-institution parties and rejects customer-address handoffs.

No silent truncation occurs. An address exceeding the ISO party limits (name 140, town 35, postal 16, subdivision 35, address lines 70 each), lacking a usable town/country, or changed since the reviewed version is rejected for review. New address lines remain editable in Parties & agents. The handoff requires an explicit confirmation because it replaces one party's existing test-draft address.

## Validation limits

The lab performs ISO base-XSD validation plus selected local checks. Full SWIFT CBPR+ usage rules and complete ACI adapter-schema validation remain incomplete. A matching BIC reference does not establish current connectivity or active registration. These are test messages, not production payment instructions.

## Browser data

Integrated payment scenarios and directory imports stay in the browser and are scoped to the signed-in account. They are separate from the operational SQLite address database. To transfer earlier standalone payment tests, export the library from the standalone lab and import it into the integrated module. Keep the same browser and Address Intelligence hostname/port for continuing access to local browser data.

## Fresh local installation

Requires the existing Address Intelligence runtime: **Node.js 24 LTS**, not the standalone payment lab's Node 18 minimum.

Extract `mwtsi-address-intelligence-v3-6.zip`, open Terminal in the extracted `hybrid-address` folder, and follow its existing setup instructions:

```bash
npm ci
npm run build
npm start
```

Use the initial Admin setup/change-password flow for a new database. Existing startup, worker, reference installation and authentication mechanisms are unchanged.

## Existing v3.5.1 installation — full-source upgrade

This release introduces no operational database schema change and no dependency changes; package versions are bumped to 3.6.0. Do not point a standalone Payment Message Lab branding patch at Address Intelligence.

1. Stop the existing app and its worker. Back up the actual operational database using your existing backup procedure while they are stopped. Include any applicable WAL/SHM state consistently; do not copy a live SQLite file and assume it is a complete backup.
2. Retain the entire old application folder, configuration and database as a backup. Extract v3.6 into a **new, separate folder**. Do not unzip over your locally edited files.
3. Copy the required existing `.env`/`.env.local` configuration deliberately. Configure **absolute** `ADDRESS_DB_PATH` and `ADDRESS_REFERENCE_DB_PATH` values pointing to your retained operational and reference databases. The defaults otherwise point to the new folder's `data/address.db` and `data/reference.sqlite`, which would be a new installation. Preserve any custom bind host, port and secure-cookie settings. Do not replace operational data with package files; this ZIP contains no operational database, users or passwords.
4. In the new v3.6 folder, run `npm ci` and `npm run build`, then use your normal startup command. Preserve the same hostname/port if keeping browser-local state and existing bookmarks.
5. Verify your existing account, batches, groups and reviews before processing. Open Payment message lab as Admin, and verify a passed BNP/ORP handoff.
6. Keep the old folder and backup until validation is complete. Returning to old code does not undo new operational decisions; coordinate backups and reconcile newer work before any data rollback.

Existing documentation is retained unchanged in the signed patch comparison; this guide is a new file. Local edits to unrelated documentation are not part of the integration's application-file changes. If changing source manually, reconcile your own code customizations rather than overwriting them blindly.

## Signed incremental patch

The original v3.5.1 updater verifies Ed25519 release signatures. Its public trust key is preserved in v3.6. The original private signing key is not present in this workspace, so no ready-to-apply signed patch is claimed or distributed.

The separate **v3.6 signing preparation kit** contains a verified v3.5.1 source baseline and instructions for generating a matching patch locally with your original signing key and the existing `scripts/create-patch.mjs`. It never asks you to upload the private key. That builder verifies that the key matches `scripts/update-key.pem` and emits the normal signed `.mwtpatch` consumed by your updater. Do not replace the trust key or disable signature verification to install this integration. Without the original key, use the full-source upgrade procedure above.

## Verification

- TypeScript and production Next.js build passed.
- 632 default unit/integration tests passed; 10 opt-in fixture tests were skipped.
- Production HTTP checks covered login/password gating, Admin module and private asset delivery, all BIC choices, approved-field copying, stale-version rejection, and ordinary User denial.
- The embedded bridge was checked for same-origin/parent-source enforcement, scope separation, account/BIC preservation and size/Core restrictions.
- Reviewed address lines and postal fields passed the official ISO schemas for pacs.008, pacs.009 COV and pain.001.
- Operational schema and update trust key remain unchanged.
- Real-browser visual workflows and native macOS execution were not verified in this environment. Existing v3.5.1 historical browser results are not claimed as v3.6 browser certification.
