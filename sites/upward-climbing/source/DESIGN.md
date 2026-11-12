# UPWARD design contract

## Audience and purpose

A Chinese climbing-club landing page for urban young adults, beginner climbers and returning recreational climbers. Explain the venue clearly and make choosing a session easy. Its tone is energetic, social and welcoming.

## Signature

- Chalk-white backgrounds, charcoal typography and controlled climbing-orange accents.
- Large Chinese headlines, Barlow Condensed English display text and photographic climbing imagery.
- Asymmetric hero, thin organizing rules, flat timetable and ticket-shaped brand moments.
- Alternating open image-led sections and denser practical information.
- Original logo and large directional arrow belong to brand artwork, separate from UI glyphs.

## Implementation

- `src/tokens.css`: sole value layer for colors, typography, spacing, icon sizes and component dimensions.
- `src/styles.css`: semantic classes using those tokens. Raw values are allowed only for CSS media-query thresholds and font-file metadata.
- `src/components/icons.jsx`: sole Lucide import and semantic glyph registry. No per-instance stroke, color or arbitrary pixel size.
- `src/components/Brand.jsx`: existing brand artwork, with independent optical geometry.
- `src/App.jsx`: established page and booking components.

## Typography and controls

- Practical body text: 14px; main transactional and activity titles: 16px.
- Essential metadata: 12–13px. 10–11px is reserved for secondary captions and brand microcopy.
- Functional icon source: 24 × 24, stroke 2, round caps and joins, currentColor.
- Named rendered sizes: xs 16, sm 20, md 24, lg 32, xl 48.
- Icon-only targets: 44 × 44 minimum. Mobile date targets remain at least 44px wide at the 360px test viewport.
- Selected timetable filters use an orange underline and darker orange text, not color alone.
- Native dialogs manage focus; Escape closes them. Opening mobile navigation focuses its first link; Escape restores the menu button.
- Reduced-motion preference disables transition and loading animation and removes smooth programmatic scrolling.

## Verified contrast examples

| Pair | Ratio |
| --- | --- |
| Secondary text / chalk | 5.43:1 |
| Secondary text / deeper paper | 5.09:1 |
| Secondary text / olive-tint surface | 5.01:1 |
| Dark orange / orange-tint label | 4.96:1 |
| Charcoal / action orange | 4.63:1 |
| Large orange headline / chalk | 3.11:1 |
| Control outline / chalk | 3.28:1 |
| Secondary footer text / charcoal | 7.93:1 |

## Verification

Run `npm run audit:design`, `npm test`, and `npm run build` from this source directory. Open the exported template at desktop and mobile widths. Current submission checks and gallery-media specifications are recorded in `../VERIFICATION.md`.

Venue data and booking remain clearly labeled as a local demonstration.
