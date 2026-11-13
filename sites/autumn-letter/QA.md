# Submission checks — Autumn Letter

Date: 2026-11-13. Browser: desktop Chrome 157 on macOS, controlled with agent-browser over CDP.

## Build and catalog

- Clean template install: `npm ci` passed, audit reported 0 vulnerabilities.
- `npm run build` passed and produced the standalone `index.html`, including all three full dependency notices.
- `python3 scripts/validate-catalog.py` passed: **6 scenes, 22 templates, 1 warning**. The warning concerns the existing `step-studio` cover (1,134,675 bytes); the new template has no media warnings. ffprobe was available and its checks ran.
- The `autumn-letter` entry is appended to the catalog. Existing scene/template entries and their relative order are preserved.
- `git diff --check` passed. Template source uses no local absolute paths, API credentials, CDN imports, or runtime gallery-media dependencies.

## Static review (Gate A)

| Check | Result |
| --- | --- |
| Requested scope | Centered model and player; the removed introduction is absent |
| Complete content | Procedural geometry/textures and original melody; no placeholder media |
| Components | Existing player, status components and named Lucide icon registry reused |
| Styling | Existing semantic CSS tokens and responsive rules preserved |
| Controls | Play, mute, slider, reset, key hit-testing and canvas input have handlers |
| States | Loading, disabled, paused, muted and graphics/audio recovery states present |
| Accessibility | Named buttons/canvas/slider, pressed/value states, keyboard handlers and focus styles |
| Portable delivery | Inline classic JavaScript, CSS, favicon and licenses; generated from editable source |

## Current-bundle browser checks (Gate B)

- Opened the submitted `index.html` directly with `file://`: complete scene, **zero external script tags and zero resource requests**. All dependency license text was present.
- Opened the generated entry through the local template server and recorded its real UI. Playback moved the train, mouse dragging rotated the scene, and the reset button restored the original view.
- Playback reached a running AudioContext with nonzero RMS (`0.008543` in a sampled run).
- Desktop 1280 × 800 and mobile 390 × 844 screenshots were opened and visually inspected. The mobile document width equaled the viewport width (`390px`).
- axe-core 4.12.1, `wcag2a,wcag2aa`: **0 violations, 0 incomplete checks, 22 passes** on the checked desktop entry.
- No uncaught page errors after loading the submitted file and resizing it.

The unchanged source release was also checked during the immediately preceding UI iteration: play/pause, mute/restore, keyboard volume, winding-key activation, orbit/zoom/reset, zoom limits, paused audio/train positions, audio interruption and graphics recovery. Four model directions and detail views were inspected before packaging.

The user explicitly approved the centered layout before requesting this PR. Mobile checks use a simulated Chrome viewport; physical devices and other browser engines are not claimed as tested. Audio measurements are from the Web Audio graph, not a microphone recording.

## Gallery media

| Property | Cover | Video |
| --- | --- | --- |
| Path | `preview/cover.png` | `preview/video.mp4` |
| Dimensions | 1280 × 800 | 1280 × 800 |
| Size | 336,976 bytes | 1,888,490 bytes |
| Encoding | PNG | H.264, yuv420p, 20 fps |
| Duration | — | 10.2 seconds |
| Audio | — | No audio stream |
| Faststart | — | `moov` before `mdat`, checked by the catalog validator |

The cover is a separate real screenshot of the same submitted UI. The video is a real browser capture of playback, orbit and reset; no synthetic frames, static-image slideshow, aspect stretching or external desktop content. A 30 fps capture exceeded the recorder's encoder buffer and was discarded. The delivered take was recorded successfully at 20 fps, then remuxed without re-encoding to enable faststart and keep only its video stream.

- Both files fully decoded with FFmpeg without errors.
- Browser image decoding reported 1280 × 800 and `complete: true`.
- Browser video reported 1280 × 800, duration 10.2, readyState 4, muted playback with `paused: false`.
- Seeking to **5.0 seconds** completed without a media error; the resulting frame was inspected.
- Playback from 0.3 seconds before the end looped to **0.6959 seconds**, with no media error.

## Merge and publication scope

The branch starts from upstream `main` at `613a5d1ee5f59941ece4a777ac92470fb81d474f`; upstream is fetched again before submission and mergeability is checked after opening the PR.

These are repository and controlled-browser checks, not an assertion that the template is live in Studio. After review/merge, the target Studio environment owner must choose the published merged SHA, set server-side `STUDIO_TEMPLATE_REF`, and check idle covers, hover/focus, composer/detail playback and failure fallback in that actual environment. No Studio environment or production configuration is changed by this PR.
