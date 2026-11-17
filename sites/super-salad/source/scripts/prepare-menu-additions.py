"""Prepare the three attributed menu photographs; see assets/ASSETS.md for licenses."""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1] / "assets"
sources = [
    ("menu-greek-source.jpg", "menu-greek.webp", (55, 40, 665, 580)),
    ("menu-chicken-source.jpg", "menu-chicken.webp", (25, 40, 935, 950)),
    ("menu-shrimp-source.jpg", "menu-shrimp.webp", (100, 25, 970, 750)),
]
for source, target, crop in sources:
    image = ImageOps.exif_transpose(Image.open(ROOT / source)).convert("RGB")
    image = image.crop(crop)
    image.thumbnail((800, 800), Image.Resampling.LANCZOS)
    image.save(ROOT / target, "WEBP", quality=91)
    print(f"Prepared {target}: {image.width} x {image.height}")
