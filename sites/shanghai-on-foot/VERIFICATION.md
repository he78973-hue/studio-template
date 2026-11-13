# Publishing verification

Date: 2026-11-13. Template ID: `shanghai-on-foot`; scene: `creative`; tone: `sand`.

## Build and data

- Read repository `README.md` and `docs/template-publishing.md` before packaging.
- `npm ci` in `source/`: passed, npm audit reported zero vulnerabilities. npm 11 reported install-script review notices for esbuild/fsevents; the actual Vite build succeeded without changing npm configuration.
- `npm run check`: passed — 780 closed footprints, 90 roads, 2,185 m centreline, seven landmark anchors, nine-stop chain and three local JPEGs.
- `npm run build`: passed; static runtime exported to the template root. The separate Three.js chunk is approximately 150 KB gzip; Vite's existing large-chunk advisory is informational.
- Build output normalizes insignificant trailing whitespace in Three.js shader literals before content hashing. `git diff --cached --check` passes; the final preview was re-recorded from that generated bundle.
- Source and gallery materials match the user-approved warm-palette version. Packaging changes public-resource paths to be relative and adds a reproducible build/export workflow.

## Catalog and scope

- `python3 scripts/validate-catalog.py`: exit 0; 6 scenes, 22 templates.
- One existing warning: `step-studio` cover is 1,134,675 bytes, above its recommended 1 MiB limit. This PR does not alter that template or introduce a media warning.
- Compared parsed catalog to upstream `main`: all previous scene and template objects retain their values and ordering; exactly one new entry is appended.
- New directory, entry, PNG and MP4 all use the same `shanghai-on-foot` ID. No `repo`, `ref`, local filesystem path or invented public demo URL is added to the catalog.
- No credentials, absolute workstation paths, `node_modules`, research-only photographs or temporary QA fixtures are included.

## Browser acceptance

Chrome tested the committed-style static export under `/sites/shanghai-on-foot/`:

- Local script, style, map, favicon and photographs load under the nested URL; geographic-source link resolves within the template directory.
- All nine next-stop transitions and final overview return work; all three photographs decode, including lazy detail images.
- Keyboard start, credits dialog, Escape/focus return and arrival disclosure work.
- Desktop 1280×800, mobile 390×844 and narrow 320×740 render without document horizontal overflow. All three route facts remain present at 320 px.
- Static export exposes no development debug scene. Fresh application page reports no browser errors.
- Map orbit/zoom and detailed camera views are also visible in the actual recorded preview. The source application's warm-palette acceptance previously covered zoom bounds, north/reset, four-direction mansion views and WebGL reading fallback.

## Gallery media

| File | Verified properties |
| --- | --- |
| `preview/cover.png` | Independent, decoded PNG; 1280×800; 404,351 bytes |
| `preview/video.mp4` | H.264, yuv420p, 1280×800, 30 fps, 21.1 seconds; 2,730,563 bytes; no audio stream; faststart atom order passes repository validation |

- Real browser recording of the submitted static export: overview → Wukang Mansion → Romeo's Balcony → Duozhuayu → overview. No unrelated desktop content or synthetic still-image animation.
- Cover and video preserve the same aspect ratio and presentation. Representative frames and a browser-decoded frame at 12 seconds were inspected.
- A temporary browser fixture read the real catalog entry and verified muted hover/focus playback, seeking to 12 seconds, looping across the end, and fallback to the independent cover after an intentional missing-video response.
- Seeking was verified on an HTTP Range-capable local host (`206 Partial Content`). Python's basic file server was sufficient for the app but exposed a zero-length seekable range for the MP4; that hosting limitation was resolved in the media test host, not hidden by changing the video.
- The temporary fixture is not Studio itself and is not part of the submitted runtime.
- The final MP4 was additionally opened in Chrome's native video viewer; playback, seeking to 12 seconds and looping passed again after re-recording.

## Review and rollout boundary

Prepared from upstream `main` commit `613a5d1ee5f59941ece4a777ac92470fb81d474f`. Existing templates are unchanged. The PR records a fresh conflict check against upstream and GitHub's computed mergeability.

This submission does not deploy Studio or update `STUDIO_TEMPLATE_REF`. After review and merge, the target Studio environment owner must select the published, merged, immutable SHA containing catalog, source and media together, then validate the actual gallery/composer/detail playback and fallback in that environment. Physical mobile devices and non-Chrome engines were not tested in this publishing pass.
