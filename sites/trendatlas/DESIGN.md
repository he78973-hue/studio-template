# TrendAtlas / 观潮

## Product thesis
A Chinese-language research desk for an export company's designers. Confirmed business scope: holiday decorations and home goods, exported to Europe and the United States. The manager's priorities are new product development and popular social content. Initial European coverage is UK, Germany and France, an implementation choice rather than confirmed country coverage. Data provenance remains visible.

## Visual thesis
An editorial research studio, with the precision of an analytics tool and the warmth of a material library. At the user's request, the palette is now led by walnut brown and warm beige rather than green. A deep-wine research focus and restrained sage signals add depth to cream surfaces. Product inspiration photography creates tactile context, without being presented as tracked product evidence.

## System
- Type: locally bundled DM Sans, followed by Avenir Next / system CJK sans for the interface; Georgia for the small editorial kicker. Tabular numerals for metrics.
- Color: walnut navigation and primary actions, beige canvas, cream surfaces, warm brown-gray text, wine highlights, sage positive signals and amber notices. UI colors originate in CSS tokens; source marks retain their source-specific colors.
- Layout: existing navigation rail; compact toolbar and research-context strip; compact record-led research focus; four metrics; two-column analytics on wide screens; four-column visual trend library. Analytics becomes one column on narrower screens.
- Surfaces: 12px panel radius, subtle borders, restrained shadows only for overlays.
- Icons: Lucide React, 18px/20px, consistent 1.7 stroke.
- Motion: short opacity/translation transitions only; honor reduced motion.
- Reusable components: IconButton, SectionHeading, TrendCard, TrendDetail, EmptyState, Modal, SourceBadge, TrendChart, ResearchContext, ResearchFocus, PlanAction.

## Data integrity
Seed data is fabricated to demonstrate a workflow, not a claim about current markets. Prominent demo label persists across pages and exports. Photos are inspiration references. Source links are discovery/search links, not evidence for the seed metrics. Imports are user-supplied records and never silently mix with seed data. Quarter planning is a human-editable heuristic, not a forecast.

## Business-specific extension
- Separate social content observations (platform, format, opening hook, raw plays/impressions, original post link) from new-product interpretation (SKU directions, materials, sampling task).
- Holiday calendar distinguishes the consumer holiday date, target shelf date and development kickoff. The user confirmed a three-month development-to-arrival cycle, represented as approximately 13 weeks. The four-week shelf buffer remains an editable assumption.
- Preserve existing saved research and plans. New optional import fields must remain backward-compatible with the original CSV schema.
- Keep the warm research-studio composition with its brown/cream base and restrained wine/sage accents. Use holiday photography, small seasonal tags and structured content-to-product rows.

## Decision-path refinement
- KPI summaries describe the filtered dataset; never decorate a summary with an unrelated record's history.
- Show the actual inclusive observation window, data provenance and latest matching observation. Removing filters preserves the user's time window.
- Pair charts with a native date slider and a data table. Distinguish series by line pattern as well as color. Export only visible series and retain demonstration provenance.
- Use shared, labeled planning controls; the saved state leads back to the quarterly plan. Mobile planning actions are at least 48px tall.
- Reference-image labels use an opaque walnut background and inverse text to remain legible over light photography. Keep the meaning of the development-cycle figure visible on mobile.
- Keep table overflow within its scrollable region; allow grid children to shrink with `min-width: 0`.

## Layout resilience
- Fixed sidebars scroll vertically when content exceeds viewport height. Direct children must not flex-shrink; clipping is reserved for decorative artwork, not navigation text or actions.
- Compact vertical spacing on short screens rather than hiding the seasonal card or its CTA.
- Equal-height trend/source cards anchor actions to the bottom of each grid row.
- Detail metrics use two columns on phones; modal headings balance line breaks and close controls do not shrink.
- Mobile empty-planner explanations retain a full readable text column, with their action on a separate row.

## Warm-brown color system

| Role | Color | Use |
| --- | --- | --- |
| Walnut | `#50392E` | Navigation rail, primary buttons, reference-image labels |
| Warm paper | `#F6F1E8` | Main canvas |
| Cream | `#FFFDF9` | Cards, fields and dialogs |
| Beige | `#E7D5B7` | Navigation selection and inverse-surface focus rings |
| Wine | `#7A3E48` | Holiday labels, saved state, active platform, leading chart series |
| Deep wine | `#63333B` | Research-focus surface |
| Sage | `#53664D` | Positive metrics and second chart series |
| Pale sage | `#EBF0E5` | Product-direction callouts and positive states |
| Caramel | `#9A6B3F` | Third chart series |

Brown and beige establish the atmosphere; wine provides emphasis; green supports the research signals. Do not assign all four colors equal visual weight. Keep status meaning explicit through labels and chart categories distinct through line patterns.

Existing `--forest*` identifiers are compatibility aliases to `--brand-brown*`, not green values. Product-reference color values in the research data are independent of the interface theme.
