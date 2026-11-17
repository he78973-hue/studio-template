"""Create food cutouts from local photographs; see assets/ASSETS.md for provenance."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]


def cutout(source, target, ellipse, crop, leaf=None):
    image = Image.open(ROOT / "assets" / source).convert("RGBA")
    scale = 3
    mask = Image.new("L", (image.width * scale, image.height * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse(tuple(round(v * scale) for v in ellipse), fill=255)
    if leaf:
        draw.polygon([(round(x * scale), round(y * scale)) for x, y in leaf], fill=255)
    mask = mask.resize(image.size, Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(0.45))
    image.putalpha(mask)
    image.crop(crop).save(ROOT / "assets" / target, "WEBP", quality=93)


cutout(
    "salad-signature.jpg", "bowl-signature.webp",
    (166, 177, 927, 931), (144, 124, 950, 950),
    [(515, 205), (532, 165), (545, 165), (551, 151), (566, 146),
     (581, 154), (599, 142), (609, 145), (623, 140), (627, 153),
     (621, 168), (637, 183), (642, 205)],
)
cutout("salad-garden.jpg", "bowl-garden.webp", (244, 12, 1040, 765), (227, 0, 1060, 783))
cutout("salad-avocado.jpg", "bowl-avocado.webp", (39, 330, 949, 1211), (18, 307, 973, 1232))
print("Prepared three local food cutouts.")
