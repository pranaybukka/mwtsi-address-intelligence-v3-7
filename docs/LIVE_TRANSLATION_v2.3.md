> **v3.4.0:** Live Translate now includes structured/hybrid ISO PstlAdr XML with separate copy controls and local corrections. See [current ISO guide](ISO_POSTAL_LIVE_v3.4.md). The slash-copy behavior below remains; XML uses pre-slash components and its own limits. Since v3.3 technical candidate presentation is Admin-only.

# Live translate — MWTSI v2.3.0

## Enter one address and copy the transformed result

Choose **Live translate** in Workspace navigation. Both Admin and User roles can use this screen after signing in and completing any required password change. No workbook or batch is needed.

1. Enter a beneficiary/company **Name**. Two lines of Name information can be pasted into the same field.
2. Paste the **Address** over as many lines as needed. Include street/building, unit, town, postal code and country where available. Partial information is accepted and unresolved values stay visible.
3. Optionally enter **Country** as an ISO code or country name. It has the same authority as Bank_Country in a batch; a disagreement with address text produces a finding. Standard ISO territory codes remain distinct.
4. After a short pause in typing (350 ms), the app updates **Proposed Hybrid output**, using the existing country/postal/name interpretation and Hybrid engine. Selected candidate IDs, four-line capacity, 33-character payloads, Name continuation, truncation and postal retention follow the same rules as Record Review.
5. Use the separate **Ready to copy** section. **Copy Name** and **Copy Address** omit their 1/2/3 type prefixes but preserve selected line breaks; Country/Town retains its slash separator. **Copy Hybrid lines** copies the complete selected output with prefixes. Only selected/transformed content is copied: dropped postal/continuation values and truncated Name tails are not restored.

**Try an example** fills fictional details. **Clear input** cancels pending requests and clears the current result. **Translation details** expands interpreted fields, evidence sources/alternatives, selected-rule decisions and truncated content. Copying is allowed even when findings require review; it does not mean that an address is confirmed or approved.

## Automatic updates and postal lookup

The screen waits for a short typing pause rather than sending a request for every keystroke. Copy buttons are disabled while the result is out of date, loading or unavailable. Cancelled/older responses cannot replace newer input. A failed request retains your input and offers Retry translation.

Each request uses the **current saved application Postal code lookup setting**. On can propose a missing town when a supported, unambiguous postal/country relationship is available; Off prevents postal-derived missing-town filling. Supplied recognized towns can still be interpreted when Off. Unknown/ambiguous matches remain unresolved or produce alternatives and review findings. The displayed postal setting is the setting used for that result. Edit input, return to the screen or refocus the window to refresh against current configuration/reference data. Live translation does not change settings.

This differs from uploaded batches, which retain their starting setting. Input address lines use the same Name/Address1/Address2/Address3/Bank_Country analysis contract as uploads: the first two nonblank address lines become Address1 and Address2, and remaining lines are retained together in Address3 separated by ` / `. CRLF/newline variations are supported; no nonblank line is silently dropped. Input limits are 1,000 characters for Name, 4,000 for Address and 100 for Country; the JSON request is capped at 32 KiB.

## Copying from remote computers

Copy buttons first use the standard browser clipboard API. This normally requires HTTPS or localhost. On HTTP LAN hosts or when clipboard permission is unavailable, the app falls back to selecting the visible output and the browser's copy command. If automatic copying is still blocked, it leaves the text selected and asks for **Ctrl+C** or **Command+C**. The read-only output fields can also be selected and copied directly. No separate Windows/macOS implementation or access to the user's filesystem is involved.

## Data and permissions

This is a one-off preview, not a stored review record. It does not create batches, records, decisions, reservations, export jobs or export membership. Clipboard copies do not increase batch exported totals. Existing User restrictions on uploaded/exported batch data and exact Group visibility remain unchanged. A User can translate their own entered text; the API does not accept a batch ID, record ID, Group or client-supplied processing override.

Input and the current preview remain in this Workspace page's memory when switching sidebar sections, but are not saved to localStorage/sessionStorage or an operational record. Reloading, navigating to a different full page or signing out clears the live entry. Copy results you need before leaving. The app server processes submitted text using local reference data; no external enrichment provider is called. Requests use authenticated same-origin POSTs, private/no-store responses and bounded JSON validation. The server does not log entered names/addresses, and its reference query cache is local to each preview request.

Background batch completion refreshes workspace information without replacing an active live-entry draft. Existing saved-record Pass/Fail and audit behavior are unchanged.

## Apply the v2.3.0 patch

The signed **mwtsi-patch-to-v2-3.zip** directly upgrades **v2.2.0**. Earlier supported versions first follow their retained patch sequence to v2.2.0. There is no dependency, startup-script, address-rule or operational-schema change. Keep the existing application/database; do not reinstall or reseed it.

1. On the shared host, stop the app supervisor/service and any separate workers or reference import/install processes. Take a consistent operational backup, including an external ADDRESS_DB_PATH database if configured.
2. Extract mwtsi-patch-to-v2-3.zip outside the existing application folder. Keep apply-patch.mjs, its runtime/public key and patches subfolder together.
3. From the existing application folder containing package.json, use Node.js 24 LTS or newer and run:

```text
node "../mwtsi-patch-to-v2-3/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v2-3/apply-patch.mjs" --app "."
```

These commands assume a sibling patch directory and work in macOS/Linux terminals or Windows PowerShell. Use the actual quoted installer path if extracted elsewhere. Do not copy a literal /path placeholder. Wait for Patch operation complete; the updater builds in place and reuses dependencies. Existing supported local allowScripts permissions are preserved.

4. Restart with your normal command/service. Hard-refresh connected browsers. Existing accounts, Group assignments, batches, decisions, reference data and export history remain. Select Live translate, try an example and test the copy fields. Verify User upload/export restrictions remain.

If preflight reports a locally changed application file, compare it with the matching source baseline and merge safely; never bypass the conflict or overwrite unknown startup changes. scripts/serve.ts is unchanged in this release. See PATCHING.md for recovery/rollback. Rollback restores source/build, not operational database contents or decisions made after the upgrade.

See VERIFICATION.md and the download page's verification-v2-3.json for final verification evidence. Browser checks run in Linux Chromium; native Windows/macOS acceptance and a new concurrency capacity benchmark are not part of this release.
