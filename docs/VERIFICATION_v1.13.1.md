# v1.13.1 logo animation verification

## Scope

The workspace sidebar avatar and stationary transparent backdrop share a periodic logo-to-spinning-globe-to-logo animation. The original mark holds for 16 seconds; the transition, globe and return take four seconds. A browser-local pause/resume control, reduced-motion preference handling and hidden-tab suspension keep motion optional. Sign-in, password and administration pages retain a static avatar. Server output starts static and browser preference listeners/timers are cleaned up when disabled or unmounted.

Only presentation, component wiring, tests, documentation and release versions changed. No backend rule, API authorization, schema, reference data or dependency changed. A shaded inline SVG globe uses CSS opacity/transforms; there are no remote animation assets. The decorative backdrop remains fixed, aria-hidden and pointer-events:none.

## Checks

354 unit/integration tests across 29 files passed, including full supplied workbook, 18,000-row name corpus, expanded reference, Hybrid priorities, upload, permissions, recovery, deletion, dashboard and signed patch tests. Typecheck and production build passed.

60 Linux Chromium production browser checks passed: all 54 prior workflow/interface scenarios plus six animation scenarios. New coverage checks shared 16-second hold/four-second return/repeat timing, moving globe land, stationary background during scrolling, mobile containment, persisted pause/resume without changing processing settings, reduced-motion changes, hidden-tab suspension and static sign-in/administration. Desktop/mobile screenshots and a recording of the live animation were inspected. The video preview is user-initiated, with no autoplay.

Native Windows/macOS browser execution remains unverified. This release uses the same browser implementation on all platforms. Site preview infrastructure is unavailable in this session; static links, release/archive integrity and size are validated before native publication.

## Delivery

The signed v1.13.1 bundle supports 1.10.0, 1.11.0, 1.11.1, 1.12.0 through 1.12.5 and 1.13.0. The installer preserves existing data, credentials, groups, settings, review history and the permitted local allowScripts map. No dependency reinstall is needed from 1.13.0. Source and patch archives exclude operational databases, installed dependencies, build/runtime state and private signing material. New screenshots/video remain separate Site previews rather than repeated media in every signed payload.

The actual isolated 1.13.0 installer check/application is verified separately before publication; see the release report for its final result. Earlier verification remains in VERIFICATION_v1.13.0.md. See LOGO_ANIMATION.md and PATCHING.md for update and motion-control instructions.
