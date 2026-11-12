# UPWARD template submission checks

Checked on 2026-11-12 against the Gitee repository's `main` base `3d79248e563e16196b2893e69dd535895b828cbe`.

## Registration and packaging

- Added `sites/upward-climbing/` with a directly served static entry, runtime assets, editable React/Vite source and lockfile, tests, dependency licenses, README and the PNG/MP4 preview pair.
- Registered `upward-climbing` in root `catalog.json`, using the existing `sites` scene and `sand` tone, bilingual title/description and repository-relative media paths. Existing entries retain their content and order.
- No fabricated public demo URL, per-template repository/ref or Studio application changes.
- Root README and third-party notices reference the template.
- Source uses relative image/credit URLs and Vite's relative base. Rebuilds take place inside `source/dist/`, then export only the generated runtime files; preview, source and licenses remain separate.
- Old portraits, original reference screenshots, personal design archives, `node_modules` and intermediate build output are excluded from the submission.

## Commands and results

Run in `source/`:

```sh
npm ci
npm run build
npm test
npm run audit:design
```

- Clean install completed, dependency audit reported zero vulnerabilities. The local npm installation emitted its install-script approval notices for esbuild and fsevents; the build succeeded without changing approval settings.
- Production build and static export passed without Vite warnings after separating the build output from the export target.
- Eight tests passed: Shanghai date/year boundaries, booking cutoff, capacity, validation, storage recovery, time-period/category combinations and available-only filtering.
- Design audit passed: 136 tokens, 21 glyphs and 32 resolved static icon references.

Run in the repository root:

```sh
python3 scripts/validate-catalog.py
ffprobe -v error -show_streams -show_format -of json sites/upward-climbing/preview/video.mp4
```

- Catalog validator exited 0: six scenes, fifteen templates.
- The only catalog warning is the existing `step-studio` cover (1,134,675 bytes, above the recommended 1 MiB). That asset is unchanged. UPWARD has no media-size or format warning.
- Video: H.264, yuv420p, 1280 × 900, 30 fps, 634 frames, 21.133333 seconds, 1,927,782 bytes, exactly one video stream and no audio stream. The validator confirmed `moov` before `mdat`.

## Browser evidence

The exported template was served at `/sites/upward-climbing/` from a plain Python HTTP server rooted at the repository; no Vite development server or external asset CDN was required.

- Chrome opened the correct title, `岩点 UPWARD — 下一站，向上。`.
- All six photo placements decoded using the four local JPEGs. Image requests and the footer credit URL resolved under `/sites/upward-climbing/assets/`, rather than `/assets/` at the server root.
- Barlow Condensed loaded successfully. Desktop 1280 × 900 and mobile 390 × 844 layouts were inspected; neither had horizontal page overflow.
- The real gallery recording exercises section navigation, the beginner-category entry action, available-only filtering, booking-dialog opening and closing, and a return to the hero. It records the submitted static template, not a mock animation.
- The independent cover was decoded and visually inspected. The MP4 was opened directly in Chrome and played with decoded frames and no media error. Seeking to 7 seconds succeeded; a screenshot of the beginner section was inspected. Playback from the final 0.4 seconds looped back to the start and continued without error.
- The credit file retains authors, original-source and license URLs, modification notices and the distinction between copyright permission and third-party rights. UTF-8 BOM is preserved for direct browser reading.

## Studio rollout boundary

This is a repository submission, not a live Studio publication. No target Studio environment or rollout owner was supplied. After review and merge, the target environment owner must select the merged full SHA and complete the publishing guide's real-gallery checks: idle cover, hover/focus playback, selected-composer/detail playback and failed-video fallback. Those Studio integration states are not claimed as tested here.
