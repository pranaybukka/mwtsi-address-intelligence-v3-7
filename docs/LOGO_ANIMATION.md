> Superseded UI details: v2.2.0 removes the character/background, retains an animated routing globe and makes Dashboard the landing page. See [current UI guide](UI_REFRESH_v2.2.md) and [assessment](UI_ASSESSMENT_v2.2.md). The versioned design history below describes its original release.

# MWTSI logo animation — v1.13.1

The main workspace now periodically folds the MWTSI avatar into a spinning globe, then returns to the original logo. The sidebar mark and faint stationary backdrop share one timer: 16 seconds of the normal logo followed by a four-second transition/globe/return cycle. The backdrop stays anchored to the viewport while you scroll and cannot intercept clicks. The wordmark remains readable throughout.

## Motion controls

Use the small Pause logo animation button beside Change password to keep the original logo still. Resume restarts a full quiet interval. This preference is saved in that browser only, for either role; it does not change processing settings or other users' preferences. Your operating system/browser reduced-motion preference automatically disables the animation. Hidden tabs stop cycling and start a fresh quiet interval when visible again. Sign-in, password changes and administration keep the static logo.

## Technical behavior

A shared client provider controls both logo instances. CSS transforms and opacity perform the transition; a clipped inline SVG land strip turns inside a shaded globe. Decorative SVGs and the entire backdrop are hidden from assistive technology. There are no downloaded animation assets, new dependencies, network calls, data changes or database migrations. Timer and preference listeners are cleaned up when disabled/unmounted. Server rendering starts with the original static avatar, with motion enabled after browser preferences are read.

## Update an existing installation

Stop the host application and its worker. Extract `mwtsi-patch-to-v1-13-1.zip` beside the existing application folder. From the application folder run:

```bash
node "../mwtsi-patch-to-v1-13-1/apply-patch.mjs" --app "." --check
node "../mwtsi-patch-to-v1-13-1/apply-patch.mjs" --app "."
```

Use the actual extracted installer location. Restart normally and refresh your browser. The bundle supports 1.10.0, 1.11.0, 1.11.1, 1.12.0 through 1.12.5 and 1.13.0. It preserves records, decisions, users, groups, configuration and the permitted local allowScripts map. No dependency reinstall is needed for an existing 1.13.0 installation. See PATCHING.md for custom database/port arguments, backups and recovery.

Six new browser scenarios cover cycle timing/synchronization, globe movement and fixed backdrop, persisted pause/resume, reduced motion, hidden tabs, static administration/sign-in and mobile containment. See VERIFICATION.md for the full release checks and platform limits.
