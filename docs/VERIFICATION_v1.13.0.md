# v1.13.0 dark interface verification

## Scope

The shared interface was redesigned with charcoal surfaces, mint accents, readable typography, responsive controls and tables, dark account/admin/dialog screens and a transparent decorative viewport-fixed MWTSI logo. The backdrop is aria-hidden, pointer-events:none and independent of scroll. No new image or dependency was introduced.

A native-details Accordion retains mounted content while folded. How it works, batch breakdown, Processing diagnostics, processing/reference tools, review reasons and record evidence/audit can collapse. Daily work precedes workspace controls; the records table precedes optional diagnostics. The structured editor immediately follows the source/Hybrid comparison. Review focus handling ignores hidden disclosure descendants. Native keyboard toggles, focus rings, reduced-motion behavior and dark form controls are supported.

## Checks

354 existing unit/integration tests across 29 files passed, including the full supplied 200-row workbook, 18,000-row name corpus, expanded reference, fixed priorities, permissions, recovery, deletion, dashboard and patch tests. Backend business logic, API authorization, database schema and dependencies are unchanged.

54 Linux Chromium production browser checks passed: all 49 existing workflow checks and five new dark-interface scenarios. Coverage includes stationary backdrop position after scrolling, decorative/pointer behavior, keyboard disclosure toggles, preserved input/settings state, retained batch disclosure state after totals refresh, collapsing review reasons, editor/comparison ordering, source preservation on close, 320/390/768-pixel layouts, account management, dark sign-in and input text contrast above 4.5:1. Two prior browser scenarios were adapted to open the newly folded Name/Evidence panels before inspecting their contents. Typecheck and production build passed. Desktop/mobile upload, dashboard, review, admin and sign-in screenshots were inspected; the compact step bar was refined after visual review.

Native Windows/macOS execution remains unverified; the same responsive implementation is used on every platform. The new theme remains dark by default, with no separate OS-specific path.

## Delivery

A signed v1.13.0 patch bundle supports 1.10.0, 1.11.0, 1.11.1 and 1.12.0 through 1.12.5. A real isolated v1.12.5 upgrade verifies unchanged records, reviews, users, groups, batches and local allowScripts, successful build and no dependency reinstall. Source/patch archives exclude customer databases, credentials, runtime state, builds, installed dependencies and private signing material. New UI screenshots are separate download previews rather than repeated binary payloads in every patch.

The download site mirrors the dark identity and folds previous release notes into disclosures. Its retained public releases start at 1.10, as requested. Older standalone signed payloads remain available inside their original patch ZIPs; no required source baseline is changed. See DARK_INTERFACE.md and PATCHING.md.
