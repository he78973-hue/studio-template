# Shanghai, on foot — design notes

- **Intent:** a readable, map-led afternoon walking guide, with the miniature neighborhood as the principal visual.
- **Palette:** warm ivory `#fbf4e8`, bark ink `#4c3527`, chestnut actions `#80502f`, terracotta route/focus `#a34f32`, restrained leaf gold `#bd8b3d`.
- **Type:** Chinese Song-style display headings; device sans-serif for body copy and controls. Keep prose readable and metadata secondary.
- **Layout:** desktop reading rail beside the large map; mobile map above an independently scrolling reading sheet. Retain all three route facts at narrow widths and fixed detail navigation.
- **Scene:** one unit equals one metre; preserve shared projected coordinates. Ground, contextual materials and reflected light must be tuned alongside CSS when recoloring.
- **Interaction:** synchronize stop text, pins and camera; allow drag to interrupt flights; retain bounded zoom, reduced motion, keyboard navigation and reading fallback.
- **Evidence:** the submitting user approved the warm palette and modest layout refinement. This template packages that version, adapting public-asset URLs for nested static hosting. See `VERIFICATION.md` for publishing checks.
