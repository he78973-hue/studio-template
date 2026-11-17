"""Prepare presentation crops from inherited photos; original rights status is unchanged."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
image = Image.open(ROOT / "assets/juice.jpg").convert("RGBA")
scale = 3
mask = Image.new("L", (image.width * scale, image.height * scale), 0)
draw = ImageDraw.Draw(mask)


def polygon(points):
    draw.polygon([(x * scale, y * scale) for x, y in points], fill=255)


# The straw, citrus garnish, and glass are masked separately.
polygon([(438, 445), (529, 124), (541, 117), (557, 122), (561, 135), (463, 466)])
draw.ellipse((128 * scale, 249 * scale, 321 * scale, 510 * scale), fill=255)
polygon([
    (256, 388), (286, 376), (342, 368), (404, 368), (471, 377),
    (498, 390), (506, 418), (501, 1039), (497, 1098), (486, 1121),
    (458, 1136), (404, 1144), (338, 1141), (287, 1130), (266, 1114),
    (261, 1087), (251, 438),
])
mask = mask.resize(image.size, Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(0.5))
image.putalpha(mask)
image.crop((110, 100, 580, 1160)).save(ROOT / "assets/juice-cutout.webp", "WEBP", quality=93)
print("Prepared assets/juice-cutout.webp from the existing juice.jpg.")

Image.open(ROOT / "assets/salad-seasonal.jpg").crop((286, 0, 753, 420)).save(
    ROOT / "assets/bowl-seasonal-crop.webp", "WEBP", quality=93
)
print("Prepared assets/bowl-seasonal-crop.webp from the existing seasonal photo.")
