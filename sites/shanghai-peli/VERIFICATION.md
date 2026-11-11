# Submission verification

Validated against upstream `main` at `f7dc511` on 2026-11-11. The submitted runtime files and 21 artwork assets are byte-identical to the user-approved local website; only packaging, attribution, and gallery material were added.

## Catalog and static checks

Run from the repository root:

```sh
python3 scripts/validate-catalog.py
node --check sites/shanghai-peli/app.js
node --check sites/shanghai-peli/icons.js
ffprobe -v error -show_streams -show_format -of json sites/shanghai-peli/preview/video.mp4
ffmpeg -v error -i sites/shanghai-peli/preview/video.mp4 -f null -
```

- Catalog validator: exit 0, 6 scenes, 13 templates, 1 warning.
- The single warning also occurs on the unchanged upstream baseline: `step-studio` cover is 1,134,675 bytes, above the recommended 1 MiB. This PR does not alter that template or add a warning.
- JavaScript syntax: both files pass.
- All existing catalog entries and their ordering are preserved; exactly one `shanghai-peli` entry is appended under the existing `creative` scene.
- Runtime resource paths, unique HTML IDs, 10 panels / 10 birds / 10 notes, CSS delimiter balance, and the 3000ms walk / 6 × 500ms gait were checked. Runtime code does not reference `preview/`.
- No build, package install, server API, credential, or generated LFS pointer is required.

## Gallery media

| Asset | Verified properties |
| --- | --- |
| `preview/cover.png` | Fully decoded PNG, 1280×800, 707,516 bytes, below 1 MiB |
| `preview/video.mp4` | H.264, yuv420p, 1280×800, 30 fps, 21.00 seconds, 2,796,540 bytes, no audio |
| Faststart | `moov` precedes `mdat` |

The video is an actual Chrome recording of this template, not a slideshow made from still images. The page's timeline was used to visit county → waterworks → metropolis → pudong → epilogue → county. Source frames and the matching separate cover were visually inspected; the MP4 decodes end to end with FFmpeg.

Chrome playback, a seek to exactly 12 seconds, and looping past the end passed. The basic Python static server does not implement HTTP byte ranges and reports an empty seekable range for direct media navigation; browser seeking was therefore verified using a Blob made from the **same submitted MP4 bytes**. Production gallery media delivery should support byte-range requests. No file changes were needed for this transport limitation.

## Website browser checks

- Keyboard Home → ArrowRight reaches `songze` and updates the accessible announcement.
- The sources dialog opens, pauses the bird, prevents background ArrowRight navigation, and closes with Escape.
- End → next/restart returns to the prologue, with previous disabled.
- The recorded timeline navigation reached every requested chapter without errors.
- At 320×844, 390×844, 1440×900, and 1920×1080, all 10 bird endpoints are within their scene bounds and document horizontal overflow is zero. Finished-animation positions were used for the boundary checks.
- Reduced motion: walk and gait are `none`, while the active note remains at opacity 1.
- Desktop and mobile screenshots were reviewed; no application console errors were reported in the website test session.
- Physical touch-device gestures were not re-tested for this packaging-only change.

## Publication boundary

This PR registers a template; it does not publish a Studio environment. No live-demo URL is asserted. After review and merge, the target Studio environment maintainer must choose the merged immutable SHA and verify real-gallery idle covers, hover/focus playback, composer/detail playback, and failed-video cover fallback. Those environment checks cannot be claimed from this standalone template preview.
