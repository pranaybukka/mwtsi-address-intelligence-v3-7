# v3.1 — A workspace that feels like yours

Every signed-in Admin and User can choose a color scheme and an explicit Dark or Light mode. Aurora dark is the default for new and existing accounts. The six palettes are Aurora (teal), Ocean (blue), Amethyst (violet), Ember (copper), Rose (dusty rose) and Graphite (slate). Each palette includes coordinated surfaces, controls, focus rings, navigation, Hybrid previews and the animated globe.

## Choose and save

1. Open **Appearance** in the workspace header. Admins also have the control on Users and groups; enrolled accounts can access it on Change password.
2. Select **Dark** or **Light**, then a color scheme. The whole page previews the selection immediately, while the dialog remains open.
3. Choose **Save appearance** to keep the selection. A failure message leaves the preview available for retry. Saving never changes address results or processing options.
4. **Cancel**, the close button or Escape discards the preview. **Reset to default** previews Aurora dark; save to keep that reset.

The choices are native radio groups: Tab moves between controls and arrow keys change the selected option. The dialog traps focus and returns it to Appearance after closing. The controls fit small screens; the dialog scrolls to keep actions reachable. Reduced-motion and the existing globe pause control remain respected.

## Personal preferences

Preferences belong to the authenticated account, not a Group or the whole installation. Save on one computer and the same appearance is rendered when that account next opens the app on another computer. A full page load uses the saved scheme directly in the server-rendered HTML, before browser hydration. The app does not depend on localStorage, an external theme service, cookies containing theme values or the operating system's preferred mode.

Other already-open tabs/devices refresh their theme on a full reload; this release does not broadcast preference changes live. If the same account saves different choices in two tabs, the last successful save is retained. Save does not require an Admin and does not expand the User's Group access, upload/export rights or record permissions. Sign-in and mandatory first-password-change pages use the default until an enrolled account is available. Signing out returns to the default sign-in page.

Pass, Fail and review/warning indicators retain green, red and amber semantics across all twelve palette/mode combinations. Labels and icons remain present. Changing the theme does not change Excel output colors/content, postal settings, BNP/ORP results, reservations, review decisions, batch/export counts or reference data.

## IT implementation and compatibility

- No new dependencies. Requires the existing Node.js 24+ runtime.
- Shared allowlisted preferences: `src/lib/appearance.ts`; CSS tokens: `src/app/appearance.css`.
- Authenticated `GET` and `PATCH /api/account/appearance`. PATCH accepts exactly `{ "scheme": "ocean", "mode": "light" }`. It derives the target account from the session and rejects supplied user IDs, arbitrary CSS, unknown values, malformed JSON, oversized requests and cross-origin mutations. Both roles can use their own endpoint; password-change-required, disabled and anonymous sessions cannot.
- Additive `user_appearance` table stores account ID, scheme and mode. Existing accounts need no migration or setup; missing or unrecognized preferences fall back to Aurora dark. A delete-account trigger removes its preferences. No operational tables are rewritten.
- Root layout reads the signed-in account's preference and renders data-scheme/data-mode. The client previews changes and saves only on explicit confirmation. Preferences are not placed in shared caches; API responses use private/no-store and Vary: Cookie.
- The existing three application stylesheets now use semantic color tokens. Status tokens remain distinct from the selected accent. No address parsing, Hybrid priorities, postal lookup, database record indexing or export processing changes.

## Apply the signed v3.1 patch

This patch upgrades **v3.0.0 → v3.1.0**. Earlier versions first follow the retained patches to v3.0. Do not reinstall or replace your data folder.

1. Back up the operational database and stop the host app and any separately running worker with Ctrl+C.
2. Extract `mwtsi-patch-to-v3-1.zip` beside the existing application folder. Leave the ZIP contents together.
3. In a terminal opened in the existing application folder, run:

```text
node "../mwtsi-patch-to-v3-1/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v3-1/apply-patch.mjs" --app "."
```

4. Wait for backup, source verification and rebuild to complete. Restart with your usual command and refresh the browsers. Open Appearance from the header.

If your extracted patch is elsewhere, use its actual absolute path instead of the example relative path. Keep legitimate local edits; a source conflict must be merged or matched to a patch, not bypassed. The updater preserves the supported local package.json allowScripts policy. See [patching and recovery](PATCHING.md) for status, durable backups and rollback commands.

A code rollback to v3.0 leaves the additive preference table harmlessly in place; v3.0 ignores it. It does not erase saved address data, reviews or accounts. Reapplying v3.1 restores the saved appearance choices. A deliberate database restore remains a separate IT recovery operation.

## Verification scope

Release verification covers all twelve combinations' core text/accent/status contrast (at least 4.5:1), keyboard preview/cancel, save and server-rendered persistence, second-device loading, save-failure recovery, 320px mobile/reduced-motion behavior and Admin/User separation. Targeted appearance browser workflows are verified. The full browser regression was stopped at the user's request; the 560 unit/integration checks had already completed. These checks do not constitute a complete accessibility audit or native Windows/macOS/Safari certification. Exact release results are in VERIFICATION.md and the download page.
