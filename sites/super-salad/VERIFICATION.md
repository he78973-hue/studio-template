# Super Salad submission verification

Status: repository submission, ready for review. The user approved the design before packaging. Studio deployment/integration is pending maintainer review and a merged immutable commit.

## Build and static entry

Executed inside `source/`:

```sh
npm ci
npm test
npm run build
```

- Clean install succeeded; npm audit reported zero vulnerabilities. npm reported install-script notices for esbuild/fsevents; the production build succeeded without changing npm configuration.
- All six Node tests passed: malformed storage, unknown IDs/invalid quantities, maximum quantity, mixed totals, new/legacy ID compatibility and CSS milliseconds/seconds parsing after minification.
- Vite 6.4.6 built and exported the template successfully, with a relative resource base.
- Served the repository through a plain Python HTTP server and opened `/sites/super-salad/`, not the Vite development server.
- At 1280 × 960: nine dishes, zero failed images, no horizontal overflow; recorded runtime resource requests all resolved inside this template's local directory.
- At 390 × 844: category counts 5 salads / 3 bowls / 1 drink / 9 total; the chicken receipt image loaded, the receipt scrolled without horizontal overflow, and its add button could be fully brought into view. Escape restored focus to the chicken trigger with no hidden source dish.
- Browser error log was empty. Testing used Chrome; mobile checks used a resized desktop viewport, not physical touch hardware.

## Recorded gallery assets

Captured the submitted static template at 1280 × 960 and 30 fps with `agent-browser record`, then encoded a silent H.264 faststart MP4 with ffmpeg. This is a real browser recording, not a slideshow or synthetic animation.

| Asset | Verified properties |
| --- | --- |
| `preview/cover.png` | Decoded PNG; 1280 × 960; 985,248 bytes (under 1 MiB) |
| `preview/video.mp4` | H.264 / yuv420p; 1280 × 960; 30 fps; 19.1 seconds; 2,062,535 bytes (about 1.97 MiB); no audio stream; `moov` before `mdat` |

The separate cover shows the same opening hero as the video. The recording proceeds through the nine-item table, tofu/chicken receipts, successful add feedback, a two-item bag totaling ¥80, local order preview, and return to the hero. No personal data is entered.

- ffprobe confirmed codec, frame rate, dimensions, duration and absence of audio.
- The repository validator confirmed faststart atom order.
- Opened the committed MP4 in Chrome: playback advanced, seeking to 7 seconds succeeded, looping across the end returned to the beginning, and `HTMLMediaElement.error` remained null.
- Opened the decoded cover, the video's browser screenshot and a six-frame contact sheet for visual review.

## Repository validation

Executed at repository root:

```sh
python3 scripts/validate-catalog.py
git diff --check
```

The catalog validator returned exit code **0**: **6 scenes, 30 templates, 1 warning**. The warning concerns the existing `step-studio` cover (1,134,675 bytes, above the recommended 1 MiB). This PR does not modify that file; the new cover and video are within the recommendations. No codec checks were skipped because ffprobe was available.

`super-salad` is registered once in the existing `marketing` scene, with `forest` tone, bilingual title/description and the required root-relative PNG/MP4 paths. Existing entries retain their content and relative order. No fabricated public preview URL, per-template repository/ref, legacy-media exemption or Studio frontend change is included.

## Rights and handoff

Photograph-specific license/provenance records are in `source/assets/ASSETS.md`. The three new images carry CC BY 2.0, CC BY-SA 4.0 and public-domain records. The original six photographs remain individually unverified; the submission does not assert an open redistribution/commercial sublicense for them. The chicken derivative retains ShareAlike terms, and the live receipt includes attribution and modification notices.

The reusable brief is in `DEVELOPER_PROMPT.md`. Source code, built entry, media, manifest and notices are submitted together. After review and merge, the target Studio environment owner must select a full merged SHA and set `STUDIO_TEMPLATE_REF`, then verify the real gallery's idle cover, hover/focus playback, selected preview, failure fallback and template startup. Local verification is not a claim that the template is already published in Studio.
