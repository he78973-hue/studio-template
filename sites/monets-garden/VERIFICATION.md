# Template acceptance · 2026-11-17

## Build and catalog

- From `source/`, `npm ci --no-audit --no-fund` and `npm run build`: passed.
- `node --check` for every editable JS module and `publish.mjs`: passed.
- All 27 published files match `source/dist` by SHA-256; editable JS/CSS matches
  the accepted project. Vite reports its standard >500 kB Three.js chunk warning.
- Production uses relative Vite output plus document/base-aware runtime asset URLs.
- `python3 scripts/validate-catalog.py`: exit 0; 6 scenes / 31 templates.
- One pre-existing warning: `step-studio` cover is 1,134,675 bytes (> recommended
  1 MiB). No warning for this template; existing material was not changed.
- Authored-file whitespace check passes. Unfiltered `git diff --check` flags
  upstream trailing whitespace in the generated Three.js shader strings and
  copied Cormorant/Vite licenses. Those three files retain their original bytes;
  they are excluded from the authored-file whitespace check.
- Compared against upstream `main` at `80128d2`: existing catalog entries and
  scene order are byte-equivalent as parsed JSON; only this template is prepended.

## Actual browser checks

Chrome 157 via `agent-browser`, serving the committed build under the nested path
`/sites/monets-garden/` (no Vite dev server or runtime CDN).

- Desktop 1280 × 720: entry, all five chapters, deep garden and painter hotspot,
  all three sourced stories, close and return home. Captured in the preview video.
- Mobile 390 × 844: no horizontal overflow; artwork, local fonts, deep scene and
  story dialog rendered. All observed local asset requests returned 200 under
  the template directory. Screenshot: `verification/mobile.png`.
- Reduced-motion enabled: motion off, no tracked UI animations, controls usable.
- Studio-style fixture: `srcdoc` iframe with an injected absolute `<base>` and
  `sandbox="allow-scripts allow-downloads allow-popups"` (no same-origin grant).
  Anonymous CORS resources loaded; entry, chapter selection and artist story
  were exercised. Screenshot: `verification/sandbox-story.png`.
- Browser page errors: none reported. Physical phones and a deployed Studio
  gallery were not used; the iframe check is a controlled compatibility fixture.

## Preview media

| Check | Result |
| --- | --- |
| Cover | Real PNG, decoded with Pillow and in Chrome |
| Cover dimensions / size | 1280 × 720 / 681,496 bytes |
| Video | Real capture of this submitted template, H.264 / yuv420p |
| Dimensions / frame rate | 1280 × 720 / 30 fps |
| Duration / size | 17.333 seconds / 6,014,000 bytes |
| Audio | No audio stream |
| Faststart | `moov` precedes `mdat`; repository validator passed |
| Playback | Chrome played without a media error |
| Seeking | Sought to 12.0s and advanced to 12.4505s |
| Loop | Sought to 17.2333s, then looped to 0.4928s |

Recording shows the invitation, five viewpoints, Monet's easel, all three story
tabs and a return to the invitation. The separate cover is a representative
opening frame, PNG palette-encoded to stay below 1 MiB. Encoding changes neither
aspect ratio nor content. Playback/seeking was checked using HTTP Range support.

## Publication boundary

This PR registers a template; it does not merge itself, deploy Studio or change
environment settings. The maintainer must synchronize the accepted upstream
revision into the Gitee catalog consumed by the target Studio and verify that
environment's resolved immutable SHA. Environments pinned by `STUDIO_TEMPLATE_REF`
require an explicit version update; current unpinned Studio code can resolve
published `main` automatically. Confirm the actual deployed version before
claiming the template is live.
