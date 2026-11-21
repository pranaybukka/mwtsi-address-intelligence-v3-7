# v1.12.2 branding verification

The supplied avatar was prepared as a transparent PNG logo and integrated into sign-in/password change, the workspace sidebar and the Admin user/group screen. A shared responsive Brand component uses the same local asset and alt text. Browser and Apple icon metadata reference that asset. Mobile navigation shows a 48-pixel avatar and hides the wordmark in the compact rail. The download page also uses the new logo.

316 unit/integration tests across 26 files passed, including the full workbook/name/priority/reference/identity/Group/patch suite. All 38 existing Linux Chromium browser regressions passed against the production build. Typecheck and build passed. No dependency was added or changed, so the unchanged dependency graph retains its prior zero-vulnerability audit.

Additional browser QA verified the logo loads on desktop sign-in/workspace/admin, mobile sign-in has no horizontal overflow, the mobile logo fits the navigation rail, and browser icon metadata points to the avatar. Desktop/mobile screenshots were inspected. The public image asset is local; application data and review identity are unchanged. Native Windows/macOS execution certification remains pending.

The signed patch retains v1.12.1's exact-baseline validation and local allowScripts permission preservation. Supported starting versions are 1.10.0, 1.11.0, 1.11.1, 1.12.0 and 1.12.1. Existing accounts/groups, batches, reviews, databases and configuration are preserved. See BRANDING.md and PATCHING.md for operation. Source/delivery archives exclude customer databases, runtime state, environment secrets, installed dependencies, builds, backups and private signing keys.
