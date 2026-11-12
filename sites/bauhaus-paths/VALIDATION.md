# Publishing validation · Bauhaus Paths

## Submitted package
- Template ID: `bauhaus-paths`; scene: `creative`; tone: `ink`.
- Root entry: `sites/bauhaus-paths/index.html`.
- Runtime files preserve the user-approved local prototype, apart from removal of an extra trailing blank line and one vendor indentation whitespace defect flagged by the staged diff check. Directory layout, test paths, gallery registration, preview assets and publishing documentation were adapted; no rendered behavior changed.
- No source PDFs, private research images, absolute local user paths, credential files or unrelated projects are included. Test screenshots/results stay in the ignored `qa/` directory.

## Checks performed
- `node --test sites/bauhaus-paths/tests/book-state.test.cjs sites/bauhaus-paths/tests/book-lifecycle.test.cjs`: **15 passed / 0 failed**.
- Browser smoke against this template's root entry with `BAUHAUS_BASE` and a dedicated Chrome CDP instance: **48 passed / 0 failed**. Covers direct file loading, all four spreads, history, page-edge drag, mobile, keyboard focus, WebGL models, reset/zoom and script/WebGL fallbacks.
- `python3 scripts/validate-catalog.py`: exit **0**, **6 scenes / 18 templates** after incorporating the latest upstream updates. One pre-existing warning: `step-studio` cover is 1,134,675 bytes, above the recommended 1 MiB. No Bauhaus warning; no exemptions or validator modifications.
- `git diff --check`: passed; no unresolved index entries.
- Compared the parsed catalog to upstream: all 17 existing template entries, their fields, scenes and relative order are preserved; only `bauhaus-paths` is added.

## Preview media
Recorded the submitted template in a real Chromium browser: page turns through the reading folio, then model selection and chair rotation. No source-book scans or unrelated desktop content.

| Asset | Measured result |
| --- | --- |
| `preview/cover.png` | Fully decoded PNG, 1280×900, 196,904 bytes |
| `preview/video.mp4` | H.264, 1280×900, 30 fps, 11.466667 seconds, 713,027 bytes |
| Audio | No audio stream |
| Faststart | `moov` precedes `mdat`, verified by repository validator |
| Browser playback | Playing; 1280×900 decoded; readyState 4; no media error |
| Browser seeking | Successfully sought to 7 seconds |
| Browser looping | Sought near the end; resumed at 0.9084 seconds, still playing, no media error |

MP4 SHA-256: `994282c6ae8a2e9a983e93640551f67b9c6db9368b01be5a7dc4f8cc3feecb0f`.

## Review and integration boundary
A separate read-only review found no actionable blockers in registration, runtime paths, licensing disclosures or enumerated files. Its Git command was unavailable under that runtime's permission gate, so the submitting process independently verified the upstream catalog preservation and complete change scope.

The branch was refreshed from upstream `main` at `ebf9e960291ee8db545a015f22c0b7ef4f8ffc54` before commit. The metadata reapplied without conflicts. Mergeability is checked again locally and on GitHub after creating the PR; it is a point-in-time result, not a promise against future upstream changes.

This validates repository submission and browser media playback, not a live Studio rollout. After review/merge, the target Studio environment owner must choose the full merged SHA and update server-side `STUDIO_TEMPLATE_REF`, then verify the real gallery. No target Studio environment or production configuration was changed, and the PR is not auto-merged.
