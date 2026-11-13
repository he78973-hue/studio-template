# studio-template

Curated front-end and mobile templates for StepFun Studio workspace gallery and agent init flows.

## Template publishing

See the [上架流程 / publishing guide](./docs/template-publishing.md) for registration, validation, PR review, fixed-commit configuration, browser acceptance, troubleshooting, and rollback. Passing validation or merging a PR does not automatically publish templates in Studio.

## Catalog: source of truth

The root [catalog.json](./catalog.json) owns all gallery content: scene/category IDs and localized titles, template IDs, localized titles and descriptions, ordering, source directories, tones, preview-media paths, and optional live-demo URLs. The `scenes` and `templates` arrays define display order; readers must preserve that order. The tables below are documentation, not a second catalog.

The exact schema is:

```ts
{
  schemaVersion: 1,
  scenes: Array<{ id: string; title: { zh: string; en: string } }>,
  templates: Array<{
    id: string;
    scene: string;
    title: { zh: string; en: string };
    description?: { zh: string; en: string };
    dir: string;
    tone: 'forest' | 'sand' | 'night' | 'ink' | 'lilac' | 'sea';
    cover?: string;
    coverHover?: string;
    previewVideo?: string;
    previewUrl?: string;
  }>
}
```

- Scene and template IDs must be unique, and each template's `scene` must reference a listed scene.
- `dir`, `cover`, `coverHover`, and `previewVideo` are repository-root-relative POSIX paths, with no leading slash, traversal, local filesystem paths, or URLs. Media lives in the respective template's `preview/` directory; `previewUrl`, when present, is a public HTTPS live-demo URL, not a local preview URL.
- Entries contain no `repo` or `ref`. Studio's server supplies one fixed repository and one selected **published, merged, immutable commit** for the catalog, template source, and preview media together. Readers resolve every relative path against that same commit; do not combine source from one revision with media from another.
- Studio owns only loading, rendering, playback, and selection; this repository owns the catalog, content, and media. There is no manual copying to Studio's public assets and no separate Studio-maintained title/category/order list. Studio's generic placeholder remains a renderer fallback, not template-owned media.
- Adding a template directory or a README table entry alone does not register it in the gallery: add its entry to root [catalog.json](./catalog.json) in the same PR.
- A template PR or branch change does **not** automatically roll out to Studio. After merge and publication, update Studio's server `STUDIO_TEMPLATE_REF` to the selected full commit SHA, then validate the gallery. Do not read preview/catalog data from an open PR branch or follow a moving `main`/release tag at runtime.

## Sites

| ID | Scene | Notes |
| --- | --- | --- |
| `space-dash` | Games | Three.js NEON DASH (provided demo) |
| `snowbound` | Games | Offline Three.js alpine skiing game with four starting landscapes and keyboard/touch controls ([template notes](./sites/snowbound/README.md)) |
| `aurora-launch` | Marketing | Apple-inspired launch page |
| `prism-studio` | Tools | Google Material–inspired dashboard |
| `atelier` | Sites | Editorial portfolio |
| `stepfun-3d` | Creative | 3D digital pavilion |
| `weather-garden` | Creative | Mobile-first Three.js weather Web App; non-commercial public API demo ([template notes](./sites/weather-garden/README.md)) |
| `step-studio` | Sites | Brand & digital design studio ([demo notes](./sites/step-studio/README.md)) |
| `meridian-ops` | Tools | Global operations dashboard ([template notes](./sites/meridian-ops/README.md)) |
| `aurelle` | Marketing | Beauty brand storefront ([template notes](./sites/aurelle/README.md)) |
| `cais` | Sites | Porto Rocha 形式语言工作室作品集（[template notes](./sites/cais/README.md)） |
| `fourier-pelican` | Creative | Dual-coordinate Fourier epicycle animation ([template notes](./sites/fourier-pelican/README.md)) |
| `periodic-table-3d` | Creative | Offline atomic atlas with light/dark themes and Canvas fallback ([template notes](./sites/periodic-table-3d/README.md)) |
| `shanghai-peli` | Creative | Horizontal illustrated Shanghai history, full-width pixel-pelican walks and sourced notes ([template notes](./sites/shanghai-peli/README.md)) |
| `bauhaus-paths` | Creative | Four-spread reading folio with an equal-colour exercise and three approximate 3D design studies ([template notes](./sites/bauhaus-paths/README.md)) |
| `umbra-one` | Marketing | Offline monochrome liquid-glass launch page with fictional private-compute data ([template notes](./sites/umbra-one/README.md)) |
| `rare-books-3d` | Creative | Interactive R3F bookshelf: 60 astronomy books in four InstancedMesh batches, spine atlas with on-demand high-res texture streaming, golden-hour lighting, immersive star-map spread ([template notes](./sites/rare-books-3d/README.md)) |
| `upward-climbing` | Sites | Editorial climbing-club website with pricing, equipment guides and local booking demos ([template notes](./sites/upward-climbing/README.md)) |

Paths: `sites/<id>/` with `index.html` entry.

## Mobile apps

- `pocket-planet` — original Pocket Planet Explorer: camera field notes, optional tilt rover controls, coordinate-inspired exploration, and native haptic feedback. Path: `apps/pocket-planet/`.
- Read [the mobile README](./apps/pocket-planet/README.md) first: pinned pnpm install, Android JDK/SDK bootstrap (explicit license review), validation, and signed-debug APK build. Primary artifact: `apps/pocket-planet/artifacts/pocket-planet.apk`; this is an Android app template, not a website publishing flow.
- Template source and gallery media use the same published fixed commit configured by Studio; see the [catalog contract](#catalog-source-of-truth).
- Browser preview is a local, accessible fallback demo, not proof of native device support. APKs cannot install on iOS; iOS requires its own signing/distribution setup.

## Gallery preview assets

Starting with `step-studio`, **every new template and every gallery-material refresh must include both a static cover and a recorded preview video**. Existing templates are grandfathered until their next gallery-material refresh; do not fabricate recordings for them.

Use the same fixed filenames for website and mobile templates, declared as repository-root-relative paths in [catalog.json](./catalog.json):

```text
sites/<id>/preview/cover.png
sites/<id>/preview/video.mp4
apps/<id>/preview/cover.png
apps/<id>/preview/video.mp4
```

| File relative to the template directory | Required format | Studio usage |
| --- | --- | --- |
| `preview/cover.png` | A real PNG image, stored separately from the video | Default gallery cover, loading poster, and playback-failure fallback |
| `preview/video.mp4` | MP4 containing H.264 video, no audio track, with the `moov` atom before `mdat` (faststart) | Muted, looping, inline playback on gallery hover/focus, in the selected composer preview, and in the detail preview |

Legacy material is grandfathered: `pocket-planet` retains [preview/cover.svg](./apps/pocket-planet/preview/cover.svg), and `space-dash`, `plane-war`, and `stepfun-3d` retain `preview/hover.gif` via `coverHover`. Other legacy templates retain PNG covers without a video. These files preserve the existing gallery bytes; do not fabricate new videos for legacy entries. A new template or gallery-material refresh must use the PNG/MP4 pair above, with `previewVideo` preferred over legacy `coverHover`.

### Material requirements

- Check both files into this repository alongside the template. A desktop path, external link, GIF, or Git LFS pointer is not a replacement for either file.
- Record the actual template at the revision being submitted. The cover must show the same template and presentation as the video; it may be extracted from a representative video frame but must remain a separate image file. Do not include secrets, personal data, or unrelated desktop content.
- Preserve the template's aspect ratio instead of stretching the material. A 1280-pixel-wide capture at 30 fps is recommended for desktop sites; portrait captures are allowed for mobile templates. Recommended limits: 5–30 seconds and at most 10 MiB for video, at most 1 MiB for the cover.
- When a template's appearance or demonstrated behavior changes, update both assets in the same change. Keep the fixed filenames and describe the refreshed recording in the template README.
- Preview assets are gallery material, not runtime dependencies. Website code must not depend on them; publishing the website still only requires its entry point and runtime assets. A browser recording of a mobile template is not proof that its native APK works.

### Submission and Studio integration checklist

- [ ] Both `preview/cover.png` and `preview/video.mp4` exist and can be decoded; verify video playback and seeking in a browser, not just the extension.
- [ ] The video has no audio, supports faststart, and can loop; the separate cover matches its content and aspect ratio.
- [ ] Material matches the submitted template version; rights/credits and the template README are up to date.
- [ ] Update the root [catalog.json](./catalog.json) in the same change: scene, localized titles/descriptions, array order, `dir`, `tone`, and repository-root-relative `cover` / `previewVideo` paths. Do not use `coverHover`/GIF for a new recorded preview.
- [ ] Validate the schema and confirm every catalog source/media path exists. Do not copy gallery assets into Studio's public directory or duplicate catalog metadata in Studio.
- [ ] After the template change is merged and published, update only Studio's configured version to the fixed commit containing the catalog, template, and media together. No open PR branch data or moving ref is an automatic rollout.
- [ ] Verify idle cover, hover/focus playback, selected-composer playback, and static-cover fallback when video loading fails.

Reference implementation: [Step Studio preview notes](./sites/step-studio/README.md#studio-模板预览素材).

## License

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
