# Particle workspace — submission validation

Date: 2026-11-12. Browser: Chrome 157 via agent-browser/CDP.

## Source and registration

- New template: `sites/particle-workspace/`, ID `particle-workspace`.
- Root `catalog.json`: `tools` scene, `ink` tone, Chinese/English title and description, repository-relative PNG/MP4 paths. Existing entries and their order are preserved.
- Runtime does not reference `preview/`. No external `previewUrl`, moving `ref`, per-template `repo`, local filesystem paths, user backup files, or private desktop content are registered.
- Submission uses the tested v0.3 implementation, with generic workspace wording, path-scoped IndexedDB and deployment-aware extension instructions.
- Extension source and downloadable ZIP were checked together; archive CRC passed. Initial data is authored example material, not an exported personal library.
- Attribution and limitations are recorded in README, CREDITS and the root third-party notices.

## Static checks

All returned exit code 0:

```bash
node --check sites/particle-workspace/app.js
node --check sites/particle-workspace/storage.js
node --check sites/particle-workspace/backup.js
node --check sites/particle-workspace/tests/storage.test.js
node --check sites/particle-workspace/tests/backup.test.js
node --check sites/particle-workspace/extension/background.js
node --check sites/particle-workspace/extension/popup.js
test -f scripts/validate-catalog.py
python3 scripts/validate-catalog.py
git diff --check
```

Catalog result on the GitHub submission branch: **6 scenes, 22 templates, 0 errors, 1 warning**. The warning is pre-existing: `step-studio` cover is 1,134,675 bytes, above the recommended 1 MiB. This change leaves that template untouched. Particle's cover and video are below their recommended limits. `ffprobe` was installed, so codec/audio/duration checks were not skipped.

The GitHub submission is based on upstream `613a5d1ee5f59941ece4a777ac92470fb81d474f`. Its newly merged UPWARD entry is preserved before Particle in the catalog. Particle's runtime, tests and preview bytes are unchanged from the previously verified submission; only this report and the shared registration were reconciled with the newer base.

## Native data regression

Served the repository root on a dedicated local QA port and loaded the test pages under `/sites/particle-workspace/tests/`.

- `storage.html`: **13 PASS / 0 FAIL** — migration retention, per-record concurrency, same-field conflicts, rollback, idempotent retries, URL duplicates, project recency and notifications.
- `backup.html`: **23 PASS / 0 FAIL** — portable images/SVG, offline parsing/restoration, deterministic copies, preserved project references and bookmark notes, repeated restore, corrupted/unsafe data rejection, immutable verified bundles, mid-transaction failure, preview/commit races, local/remote image failures, persistent trash, restoration, deletion markers and non-executing SVG image decoding.
- Both suites use disposable random database names and delete them after completion.

## Browser checks

- The repository-relative template entry loaded its local resources and all initial cards.
- Changed a favorite through the directory entry, opened `index.html#library` and confirmed the same favorite persisted; reverted the fixture afterwards. Both entry forms resolve to one namespace.
- Generated and downloaded a real backup under the repository subpath: 12 assets, 3 projects, 12 embedded images, approximately 1.2 MB. No missing local-resource errors.
- Extension instructions displayed the current full template-directory URL, including the `/sites/particle-workspace/` subpath.
- Opened workspace, library and asset details using the actual controls.
- Mobile 390×844: no horizontal overflow; axe 4.12.1 reported 44 passes, 0 violations, 0 incomplete.
- Desktop 1280×900: axe reported 45 passes, 0 violations, 1 incomplete contrast item for the decorative canvas caption. The caption was visually inspected in the screenshot; this is not reported as an automated contrast pass.
- No assertion of physical iOS/Android testing or native extension installation is made.

## Gallery media

The final template was recorded in the browser, showing workspace → library → Mori asset detail → workspace. The independent cover was captured from the same initial workspace. No unrelated desktop, user library contents or credentials appear in the material. Runtime appearance/behavior was unchanged after recording.

| File | Verified properties |
| --- | --- |
| `preview/cover.png` | Real PNG, decoded and visually inspected; 1280×900; 304,509 bytes |
| `preview/video.mp4` | H.264; 1280×900; 30 fps; 9.3 seconds; 624,953 bytes; no audio stream; faststart |

Conversion from the real WebM recording used libx264, CRF 23, yuv420p, `-an` and `-movflags +faststart`. No stretching or static-image slideshow was used. The repository script confirmed `moov` before `mdat`.

Browser playback check against the actual MP4:

- `readyState = 4`, `videoWidth = 1280`, `videoHeight = 900`, `duration = 9.3`, `error = null`.
- Muted playback advanced normally.
- Seeking to 4.5 seconds completed and rendered the asset detail frame.
- With looping enabled, playback from the final 0.2 seconds wrapped to approximately 0.6 seconds.

## Publishing handoff

This is a template-registration change, not a completed Studio rollout. The target Studio environment and its owner were not supplied. After review and merge, the environment maintainer must select the merged 40-character SHA for `STUDIO_TEMPLATE_REF`, then verify the real gallery's idle cover, hover/focus playback, selected/composer and detail playback, stop behavior, and cover fallback on media failure.

Local source/media validation does not substitute for that environment acceptance. Cloud sync and model integrations remain explicitly unconnected.
