"""用独角兽头像生成浏览器角标 favicon.ico 与各尺寸 png。"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public"
SRC = PUB / "temp-gate-avatar.png"

img = Image.open(SRC).convert("RGBA")

# 原图已是 1:1 透明底，居中裁成正方形（若非正方）
w, h = img.size
side = min(w, h)
left = (w - side) // 2
top = (h - side) // 2
img = img.crop((left, top, left + side, top + side))

# favicon.ico：Windows 浏览器标签标准多尺寸
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
img.save(PUB / "favicon.ico", format="ICO", sizes=ico_sizes)

# PNG 尺寸：apple / Android / PWA
for size in (180, 192, 512):
    img.resize((size, size), Image.LANCZOS).save(
        PUB / f"favicon-{size}.png", format="PNG"
    )

# apple-touch-icon 用 180
img.resize((180, 180), Image.LANCZOS).save(
    PUB / "apple-icon.png", format="PNG"
)

print("generated:")
for name in ("favicon.ico", "favicon-180.png", "favicon-192.png", "favicon-512.png", "apple-icon.png"):
    p = PUB / name
    print(f"  {name}: {p.stat().st_size} bytes")
