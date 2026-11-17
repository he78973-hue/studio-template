# Asset manifest

## Inherited photography

The food photographs below were already present when this continuation began. The original project spec describes them as Unsplash imagery, but does not retain photographer names or source URLs. This manifest records the local source without inventing attribution.

| Used asset | Local source | Placement |
| --- | --- | --- |
| `bowl-signature.webp` | `salad-signature.jpg` | Hero, signature tofu bowl |
| `bowl-garden.webp` | `salad-garden.jpg` | Avocado garden salad |
| `bowl-avocado.webp` | `salad-avocado.jpg` | Rainbow vegetable bowl (filename inherited) |
| `salad-energy.jpg` | Original local photograph | Avocado and pomegranate salad |
| `salad-seasonal.jpg` | Original local photograph | Egg and vegetable bowl |
| `juice.jpg` | Original local photograph | Orange juice |
| `juice-cutout.webp` | `juice.jpg` | Transparent glass cutout for the spread-out gallery and receipt |
| `bowl-seasonal-crop.webp` | `salad-seasonal.jpg` | Close crop used inside a circular presentation plate |

`scripts/prepare-assets.py` creates the three transparent WebP cutouts from the local source photographs. It requires Pillow and is not part of the normal build.

`scripts/prepare-gallery-assets.py` creates the juice cutout and the seasonal plate crop. The avocado/pomegranate photograph is cropped to a circular presentation plate in CSS. These are presentation treatments of the inherited files, not new photography.

### Commercial-use audit — 2026-11-16

**Status for all six original photographs: source and individual licensing unverified.** All cutouts and crops inherit the rights status of their source photographs; cropping or background removal does not establish a new license.

- The project contains no original image-page URLs, photographer attribution or photo-specific license records.
- macOS source metadata (`kMDItemWhereFroms`, `kMDItemAuthors`, `kMDItemCopyright`, `kMDItemCreator`) is empty for all six original JPGs.
- The [official Unsplash commercial-use FAQ](https://help.unsplash.com/en/articles/2612315-can-i-use-unsplash-images-for-personal-or-commercial-projects) allows most personal and commercial uses under its license. This general policy does not establish that these particular local files came from Unsplash or which license applies to them.
- Free-to-use photography is not automatically public-domain or open-source content. The [Unsplash releases and trademarks guidance](https://help.unsplash.com/en/articles/2612329-releases-and-trademarks) also distinguishes a copyright license from rights in depicted subjects.
- To establish commercial-use provenance, recover the original image pages and applicable licenses, or supply owned/licensed product photos. None of the six inherited photographs is labelled cleared for commercial use in this audit.

## Nine-item expansion — sources checked 2026-11-16

These three new photographs have source-specific license records. Attribution, a source link, the license (linked where applicable), and a crop/compression notice appear in the corresponding ingredient receipt.

| Local source → displayed derivative | Author / work | Source page | License |
| --- | --- | --- | --- |
| `menu-greek-source.jpg` → `menu-greek.webp` | zone41, *Greek Salad Choriatiki* | [Commons, revision 1284734567](https://commons.wikimedia.org/w/index.php?title=File:Greek_Salad_Choriatiki.jpg&oldid=1284734567) | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| `menu-chicken-source.jpg` → `menu-chicken.webp` | T. Bjornstad, *Chicken salad with eggs* | [Commons, revision 855996518](https://commons.wikimedia.org/w/index.php?title=File:Chicken_salad_with_eggs.jpg&oldid=855996518) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| `menu-shrimp-source.jpg` → `menu-shrimp.webp` | Jon Sullivan, *Prawn salad with garlic croutons* | [Commons, revision 1268015498](https://commons.wikimedia.org/w/index.php?title=File:Prawn_salad_with_garlic_croutons.jpg&oldid=1268015498) | Public domain, released by author according to the source page |

The source pages were read directly: Greek salad credits the [zone41 Flickr account](https://www.flickr.com/photos/zone41/) and records a Flickr license review; chicken salad identifies the uploader's own work and the ShareAlike condition; prawn salad records Jon Sullivan's worldwide public-domain release. These licenses permit commercial reuse subject to their stated conditions.

Downloaded files:
- Greek: https://upload.wikimedia.org/wikipedia/commons/5/5f/Greek_Salad_Choriatiki.jpg (774 × 590).
- Chicken: https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Chicken_salad_with_eggs.jpg/960px-Chicken_salad_with_eggs.jpg (960 × 960 rendition).
- Prawn: https://upload.wikimedia.org/wikipedia/commons/8/8a/Prawn_salad_with_garlic_croutons.jpg (1000 × 750).

Processing: `python3 scripts/prepare-menu-additions.py` applies EXIF orientation, crops, resizes to at most 800px, and saves WebP at quality 91. Display additionally uses a circular CSS crop. No generated ingredients were added. Output dimensions are 610 × 540, 800 × 800, and 800 × 667 respectively.

The Greek derivative remains available under CC BY 2.0. **The chicken derivative and its crop/resizing contributions are distributed under CC BY-SA 4.0**, with the original author credited; this applies to that image, not automatically to the unrelated website code. Preserve these notices when redistributing the images. The prawn derivative remains public-domain material. New recipe copy is an authored example, not the photographer's recipe or endorsement.

## Typography

- Font: Barlow Condensed ExtraBold, Latin subset, weight 800.
- File: `barlow-condensed-800.woff2`.
- Provider: Google Fonts; family designed by Jeremy Tribby.
- Binary source: https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B47b1z3bWuQ.woff2
- License: SIL Open Font License 1.1; see `OFL-BarlowCondensed.txt`.
- Chinese: local Noto Sans SC when installed, otherwise PingFang SC / Microsoft YaHei / system sans-serif. No remote font request at runtime.

## Other assets

- `favicon.svg`: inherited brand bowl mark.
- UI icons and brand wordmark emblem: inherited inline SVG symbols in `index.html`.
- Root JPEG: inherited three-stage blue fluted-glass visual reference; not shipped in the site.
