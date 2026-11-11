# Shanghai, Along the Water — interaction spec

## Audience / scenario / purpose
- Curious general readers browse a horizontal illustrated history on desktop, often while screen-recording for a short video. Touch and keyboard must remain usable.
- The tone is an authored museum plate wall: quiet paper illustrations on a dark gallery wall, with one playful pixel pelican as the guide.
- The reader controls time. Nothing autoplays; the bird lives inside the artwork rather than narrating over it.

## Visual thesis
Ten supplied 1200×750 plates hang as prints on an ink-green wall. Their baked typography carries the historical copy. Each plate contains its own pixel pelican, standing on that era's ground or water and entering from the plate's left edge. The yellow UI accent belongs to the same family as the bird's beak and feet.

## Source assets
- `assets/plates/01…10-*.png`: user-supplied `shanghai-timeline-png-svg.zip`, copied unmodified.
- `assets/birds/01…10-*.svg`: user-supplied `shanghai-pixel-birds-png-svg.zip`, copied unmodified; each bird matches its plate.
- `assets/brand-peli-shanghai.svg`: new 32×32 pixel mark combining the pelican with an Oriental-Pearl-style tower and waterline.
- Plates are shown as complete compositions, not cropped into decorative backgrounds. Their captions are duplicated in accessible HTML captions.

## Layout / components
- Fixed top rail: brand mark, edition line, sources trigger, chapter counter, gold progress hairline.
- Full-height horizontal story: ten plates, each scaled to fit both viewport height and width.
- Each panel is a `figure`: a `.scene` wrapper at the plate's 1200:750 aspect ratio, the plate image, and an absolutely positioned `.scene-bird`; below it a `<figcaption>` and a `<aside class="plate-note">` labelled `小鹈注`.
- No fixed margin companion and no click bubble. The note is permanent HTML, revealed automatically when its panel becomes current.
- Fixed bottom navigation: previous arrow, chapter dots/years, next arrow; at the final chapter next becomes restart.
- Compact cover cue: start button and browse hint, only on the cover.
- Sources dialog: four primary sources, a schematic-map caveat, and historical cautions.
- Mobile: plate at the top, readable caption below, note below the caption, navigation at the bottom.

## Icon system
- Source: Lucide glyphs, 24×24 grid, stroke 2, round caps/joins, `currentColor`; no emoji as UI icons.
- One registry in `icons.js`; placeholders use `data-icon` and are hydrated once.
- Sizes: navigation 22px; sources/book 15px; start 18px; close 20px; external 13px.
- Dynamic next icon (arrow ↔ restart) is produced from the same registry.
- All icon-only buttons carry `aria-label`; glyphs are `aria-hidden`.

## Interaction / motion contract
- Vertical wheel advances one chapter; horizontal wheel/trackpad, touch, drag, arrows, Page keys, Home/End and timeline buttons also work. Movement is bounded and reversible.
- Jumps of more than three chapters land immediately instead of skipping through every intermediate count state; short moves stay smooth.
- Active chapter updates URL hash, count, progress, timeline `aria-current` and accessible live status.
- Bird entrance is a ground walk, not a flight: `.scene-bird` starts at `left:-12%` of the scene, then crosses the full plate linearly to `left:89%` over `--motion-walk` (3000ms). The scene clips the entry, so the bird appears from behind the left edge. A 6-cycle `--motion-gait` (500ms) step animation ends with the walk. The bird never idles with a hover or bob after settling.
- Notes reveal automatically on `.panel.is-current` via opacity/translate; no click is required.
- The scene-bird and gait animations pause while the sources dialog is open or the document is hidden; `prefers-reduced-motion: reduce` removes them and leaves the bird at its final position.
- Sources dialog traps focus natively, closes on Escape or backdrop click, and does not allow background arrows to navigate while open.

## States
- Navigation: first (prev disabled), middle, last (next = restart), hover, active, focus-visible.
- Bird: walking in, settled, paused by dialog/background, reduced-motion static.
- Note: settled opacity 0.5 when inactive, 1 when current; always visible on mobile.
- Dialog: closed, opening, open, closing.
- Mobile: caption visible; no horizontal overflow; short viewports allow vertical scrolling inside a plate page.

## Out of scope
- Runtime video export, audio, chapter autoplay, zoomable plates, CMS, and new history chapters.
- Gallery registration and an actual browser-recorded PNG/MP4 preview are included only in the publishing package; the website does not load preview media.
- Replacing the supplied assets or re-typesetting their baked copy.

## Acceptance
- At 1440×900 and 1920×1080, all ten plates fit without cropping and every bird finishes at the right side of the plate without covering its baked title.
- On activation, the bird enters horizontally from the plate's left edge, crosses the full plate to the right side (89%), and stops on the era's ground/water; there is no vertical float or hover loop after it settles.
- Each chapter's `小鹈注` is visible without interaction at desktop and mobile widths.
- At 390×844, no horizontal overflow; plate, caption, note, bird and nav are reachable.
- Wheel, keys, buttons, timeline, drag and touch move exactly one chapter per action; restart returns to the cover.
- Icons are consistent in size/stroke and have no missing glyphs; all icon-only controls have names.
- Reduced motion removes the walk/gait; notes remain visible; no console errors; sources dialog opens/closes without navigating the story.
- The deliverable remains an interactive website. Gallery-only `preview/cover.png` and `preview/video.mp4` accompany the catalog entry; neither is a runtime dependency.
