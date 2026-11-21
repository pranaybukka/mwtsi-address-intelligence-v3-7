# v1.8.1 verification

227 unit/integration tests passed in 21 files. The supplied 200-row workbook, the 18,000-row Name/Address1 corpus and the installed expanded-reference tests were enabled. Existing priority, Name, acceptance, mapping, Group, export, worker recovery and reference lifecycle regressions continue to pass.

The eleven new postal-setting tests cover default On on new/upgraded installations, saved Off persistence, disabled lookup returning without reference access, no postal-derived missing-town inference, existing On behavior, supplied-town preservation, synchronous uploads, both settings across queued checkpoints/pause/resume, strict API input and same-origin checks, direct manual API enforcement and Full analysis evidence.

26 Linux Chromium browser checks passed against the built production server with the expanded reference. The new check turns lookup off, reloads, uploads a postal-only address, verifies that the town remains empty and manual lookup is disabled, confirms the direct API has no candidates, then turns it back on and verifies a new upload proposes NEW YORK while the previous batch stays unchanged.

Typecheck and the production build passed. The full npm dependency audit reports zero vulnerabilities; no dependency updates or new packages were needed. v1.8 clean production-only install/worker verification is recorded in VERIFICATION_v1.8.md. Native Windows/macOS browser checks remain pending; cross-platform filename/path/MIME simulations pass.

The setting is captured at batch creation, stored separately from uploaded columns and exported in Full analysis. Running/queued/resumed/saved batches retain their starting setting. Switching off does not erase previously computed towns. Manual lookup follows the current global setting. See POSTAL_LOOKUP_CONFIGURATION.md for exact scope, upgrade behavior and APIs.

Runtime databases, uploads, local settings, drafts, reference caches and tokens are excluded from the application ZIP. Default On is defined in source; no saved local Off setting is shipped. See VERIFICATION_v1.8.md and EXPANDED_REFERENCE_DATA.md for reference coverage, licensing and earlier lifecycle/platform limits. Synthetic regression results do not establish independent worldwide postal accuracy or deliverability.
