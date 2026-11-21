# Hybrid rule candidates in Record Review — v2.0.1

Record Review now labels each proposed Hybrid line with its rule candidate ID and a plain-language description. The output panel also shows the selected sequence, for example `1a → 2a → 2z → 3a`. This is the line-generation/priority rule, separate from a probable town or country evidence candidate.

Expand **Address priority & postal retention** for a table of all eight candidates: 1a Name, 1b Name continuation, 2a Primary address, 2z Postal/state, 2c Secondary address, 2b Primary continuation, 2d Secondary continuation and 3a Country/town. Each row shows Selected, Dropped or Not generated, its generated Hybrid text and the selection reason. Optional address priority remains 2a > 2z > 2c > 2b > 2d, after mandatory Name and Country/town reservations.

Editing the structured proposal refreshes the labels, selection sequence and decision table immediately. The sequence is marked **UNSAVED PREVIEW** until the proposal is recorded. A second Name line can displace postal 2z when 2a uses the only remaining address slot; the table explains that result. Clearing primary address can make room for 2z again. Passing the record retains its chosen output and leaves its original source unchanged. Existing records are assessed from their saved structured proposal/output rather than trusting an old stored trace. If the output fails the current priority assessment, the panel labels the sequence **Expected** and warns of the mismatch; it does not present unverified labels on the saved output lines.

## Apply the patch

The v2.0.1 bundle directly upgrades v2.0.0. Earlier versions must first follow the v2 upgrade path in V2_UPGRADE_AND_OPERATIONS.md. Stop the host app/workers, extract mwtsi-patch-to-v2-0-1.zip beside the existing application directory and run from the application directory:

```bash
node "../mwtsi-patch-to-v2-0-1/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v2-0-1/apply-patch.mjs" --app "."
npm start
```

Use your existing database/environment/port options. Refresh connected browsers. No dependency or database schema changes are included. The v2.0.1 incremental patch does not change scripts/serve.ts. An earlier v2 upgrade blocked by a locally modified serve.ts still requires comparison/merge of that local file; this UI patch does not bypass source conflict protection. Keep the modified file and provide its contents and installed version to prepare a matching update.

## Verification

See verification-v2-0-1.md/json on the download page for completed checks. The browser regression exercises postal selection, second-Name displacement, restored postal capacity, live labels, Pass persistence and preserved source. Native Windows/macOS execution remains unverified.
