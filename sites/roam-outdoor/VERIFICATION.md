# ROAM submission verification

Date: 2026-11-16. Prepared from the user-approved storefront and its completed motion/logic/UI walkthrough. The packaged React application source is unchanged from that verified revision; only publishing structure, credits and the build/export command were added.

## Build and catalog

- In `source/`: `npm ci` completed; npm reported zero vulnerabilities. The local npm install-script policy printed notices for esbuild/fsevents; Vite built successfully without changing that policy.
- `npm test`: **5/5 passed** (legacy-cart migration, merge/invalid entries, totals, shipping validation and supported demo methods).
- `npm run build`: **passed**. Vite output was exported into the template root, preserving preview files, licenses and source.
- At repository root: `test -f scripts/validate-catalog.py` and `python3 scripts/validate-catalog.py`: **exit 0**, 6 scenes, 23 templates.
- The one validator warning is pre-existing: `step-studio` cover is 1,134,675 bytes, above the recommended 1 MiB. This submission does not modify that template. ROAM media meets both recommended size limits; ffprobe was available and no media checks were skipped.
- Additional static checks passed: runtime entry/CSS/font paths resolve, editable source and lockfile exist, existing catalog entries and relative ordering are unchanged, exactly one ROAM entry exists, fixed media paths/localized fields are correct, and complete notices are present.
- Submission files exclude `node_modules`, build caches, source-photo downloads, local review artifacts, machine paths and credentials.

## Static deployment and interactions

Served the repository with Python's static HTTP server and opened `/sites/roam-outdoor/` through Chrome 157 and `agent-browser`.

- 1280×900 desktop: scene, local images, all three webfonts, category switching, product focus, color/size selection, add-to-bag and checkout work under the nested path.
- 390×844 phone: no document-width overflow; images and fonts loaded. Blank checkout shows four required errors; entering test-only shipping data completes the WeChat demo at **¥1,680** and clears the bag.
- No external runtime resource requests and no JavaScript runtime errors in the packaged-page check.
- The preceding full UI walkthrough also covered 1440×900, 1366×768, 768×900, 320px phones and short landscape windows, keyboard/Escape, quantity limits, removal, persisted-data recovery, both demo-payment methods, horizontal/cancelled/vertical gestures, reduced motion, native-transition fallback and rapid interruption. Identical application source is included here.
- This is Chrome/viewport emulation, not physical-device, Safari/Firefox or low-end FPS certification. Automated accessibility scans of the reviewed showroom/product/checkout reported no violations after fixes, but gradient/overlap contrast checks remain incomplete; no full WCAG certification is claimed.

## Gallery media

| Asset | Verified properties |
| --- | --- |
| `preview/cover.png` | Independently decoded PNG, 1280×900, 592,937 bytes (about 579 KiB) |
| `preview/video.mp4` | H.264, yuv420p, 1280×900, 30fps, 19.566667 seconds, 1,506,965 bytes (about 1.44 MiB), no audio stream, faststart |

Recorded the actual packaged template at its submitted appearance. The sequence shows clothing, caps, packs, footwear, shell color/size selection, shopping bag, blank checkout and return to the showroom. It includes no personal shipping information. The separate cover matches the opening scene and aspect ratio.

Media commands (from repository root):

```sh
ffprobe -v error -show_streams -show_format -of json sites/roam-outdoor/preview/video.mp4
python3 scripts/validate-catalog.py
```

The finalized MP4 played in Chrome and sought to 15 seconds, with dimensions 1280×900 and no media error. A temporary, explicitly labeled fixture read the pending root catalog entry and exercised idle PNG, muted inline hover/focus playback, selected composer/detail playback, pausing on close and cover fallback after a deliberately failed video request. The fixture was removed before submission. These are controlled pre-merge browser checks, not proof of rollout in a real Studio environment.

## Review and rollout boundary

- Review the root catalog registration together with the template README, photo-source limitations and complete dependency/font notices.
- New code and media are confined to `sites/roam-outdoor/`; shared changes are registration/notice additions in `catalog.json`, `README.md` and `THIRD_PARTY_NOTICES.md`.
- The PR is based on upstream `main`; final branch synchronization and GitHub mergeability are recorded in the PR, where the latest remote state is visible.
- After merge/publication, the target Studio environment owner must choose the full merged commit SHA, update server-side `STUDIO_TEMPLATE_REF` and verify the real gallery. No target environment or deployment owner has been supplied, so this submission does not change environment configuration or claim the template is already live.
