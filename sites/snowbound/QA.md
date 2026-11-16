# Snowbound — submission verification

Date: 2026-11-13. Browser: Chrome 157 on macOS. Desktop: 1280 × 800. Narrow-screen browser emulation: 393 × 852.

## Fixes verified in this pass

1. The narrow-screen jump button previously handled only `pointerdown`; focusing it and pressing Enter did not jump. Added keyboard/assistive `click` activation without duplicating pointer jumps. Verified Enter produced a positive airborne height; pointer activation still works.
2. The WebGL context-loss recovery now focuses Reload, and the game key handler yields to the error surface. Forced context loss and keyboard Enter returned to a working welcome screen without trapping focus behind the recovery message.
3. Production URLs are relative. The submitted root `index.html` is a built entry, separate from the non-mutating Vite source entry. Verified the exact submitted build at `/sites/snowbound/`, with JS/CSS/favicon returning HTTP 200 and no development hook.

## Automated checks

- `npm ci`: exit 0, audit reported 0 vulnerabilities. This machine's npm emitted install-script policy warnings for esbuild/fsevents; install and the subsequent build completed successfully, with no approval/config changes.
- `npm test`: exit 0, **7 tests passed** (region continuity, duration, deterministic traversable obstacles, jump collision, terrain continuity, destination selection, 100 m starting clearance).
- `npm run build`: exit 0. Vite's only build warning is the Three.js-containing main chunk exceeding 500 kB (558.19 kB raw / 146.40 kB gzip). It is needed at game startup; no fake threshold increase or chunk split was introduced.
- `python3 scripts/validate-catalog.py` at repository root: exit 0, **6 scenes / 22 templates**. One existing warning: `step-studio` cover is 1,134,675 bytes, over the recommended 1 MiB. Snowbound has no media/schema warning.
- Source files match the tested working project; production source and preview recording use the same code revision.

## Browser results

24 scripted browser assertions passed after the fixes, supplemented by actual CLI clicks, key presses, mouse dragging, tab changes, screenshots, and production recording.

| Check | Observed result |
| --- | --- |
| Four destinations | Selected state and chapter matched 0 / 1 / 2 / 3; each started around 2 m with no obstacle in the next 80 m |
| A / D / arrows | Lateral velocities had the expected sign, about −7.93 / +7.52 / −7.56 / +7.58 m/s |
| Jump and landing | Space reached 1.223 m; returned to 0 on landing |
| Jump clearance | Cleared the stump at absolute 144 m and continued to 148.76 m |
| Grounded collision | The same stump produced the fall/result state at 142 m |
| Pause / resume | Distance held exactly at 2,378.008027285201 m; resumed movement afterward |
| Retry / R / change location | Retry reset to about 1 m and changed the seed; R changed it again; returning to selection restored ready state |
| Region transitions | Real movement across four positioned boundary checks changed 0→1→2→3→0 with collision detection active |
| Segment reclamation | Retained 13 segments; geometry counts 98 / 104 / 122 / 100, dropping after town |
| Ice | Ice physics flag true at the tested valley position |
| Smoke / gondolas | Position samples changed; town contained 23 chimneys in the loaded segments |
| Narrow-screen pointer drag | Right drag produced +8.407 m/s; after release velocity decayed to 0.165 m/s |
| Narrow-screen jump | Pointer produced jump height 0.012 m immediately; keyboard Enter produced 0.226 m |
| Dialog focus | Shift+Tab from Continue reached Change location; Tab wrapped back to Continue |
| Background tab | Production run paused at 1 m when another tab opened; returning kept it paused |
| WebGL recovery | Reload received focus on forced context loss; Enter restored ready state and hid the error |
| Production play | Selected town, started, jumped twice and reached 126 m while recording |
| Runtime requests | Built JS, CSS and favicon loaded from the template subpath; `window.__snowbound` was undefined |
| Developer entry | Template `npm run dev` served the working game with the development bridge while preserving the built root entry |
| Console | No application page errors in the gameplay pass; deliberate context-loss exercise is recorded separately |

Development-only `seek`, `setPlayer` and `inspect` were used to position repeatable collision/region tests and model views; simulation and collision detection stayed active. For the unobstructed scene/model screenshots only, the pause panel was temporarily hidden in the DOM. The gallery MP4 was recorded from the production build without these controls.

## Visual evidence

- `screenshots/40-publish-welcome.png`: entry screen.
- `screenshots/41-publish-paused.png`: pause dialog.
- `screenshots/42-publish-mobile.png`, `43-publish-mobile-play.png`: narrow-screen selection and gameplay.
- `screenshots/44-publish-rear.png` through `47-publish-left.png`: four-angle model inspection, no missing surfaces observed.
- `screenshots/48-publish-forest.png` through `51-publish-town.png`: all landscapes.
- `screenshots/52-publish-transition.png`: valley approaches ahead of the open slope.
- `screenshots/53-publish-video-seek.png`: decoded MP4 at 9 seconds.

All listed screenshots were opened and visually reviewed. The original project's earlier graybox and iteration records are not bundled in this template.

## Gallery media

| Asset | Verified format |
| --- | --- |
| `preview/cover.png` | Independently decoded PNG, 1280 × 800, matching the town selection shown in the recording |
| `preview/video.mp4` | H.264 High, yuv420p, 1280 × 800, 30 fps, 12.500 seconds, 2,118,747 bytes, one video stream and no audio |

The repository validator confirmed MP4 `moov` precedes `mdat`. Browser playback advanced normally. In a controlled media fixture, seeking reached exactly 9 seconds, and loop playback moved from 12.3 to 0.3925 seconds with `video.error === null`.

The local Python static server does not provide byte-range seeking; the fixture fetched the same MP4 into a complete Blob URL to validate browser decode/seek/loop independently of that server limitation. Real Studio media delivery and fallback behavior still require the target environment's acceptance pass.

## Final static audit (Gate A)

| Item | Result |
| --- | --- |
| Scope and source | PASS — only the new game template and catalog/documentation additions |
| UI consistency | PASS — existing visual language, shared state dialog and CSS variables retained |
| Real content | PASS — no placeholder images, routes, backend or public demo URLs |
| Interactions | PASS — visible controls have working actions, keyboard jump and recovery fixed |
| Responsive layout | PASS — desktop and narrow-screen evidence reviewed |
| Runtime/dependencies | PASS — local production resources, license text present, no required secret or CDN |
| Tests/build | PASS — seven tests and production build succeeded; warning explained above |
| Catalog/media/docs | PASS — registered paths exist, real cover/video decode, README and prompt match behavior |

Gate B: fresh browser interaction and screenshot review completed; user explicitly approved the visual design and requested submission.

## Boundaries

Physical-phone performance and Safari/Firefox behavior were not measured. The recorded environment does not prove native/mobile-device performance. No real Studio deployment was changed or verified; after merge a maintainer must choose an immutable merged SHA and validate the actual gallery, preview playback/fallback, and launch flow in the intended environment.
