#!/usr/bin/env python3
"""Make a share-preview image (1200x630 PNG) for every blog post.

Run from the repository root after adding or retitling a post, then rebuild the pages:

    pip install pillow
    python3 scripts/build_og.py
    python3 scripts/build_posts.py

Images go to assets/img/og/<slug>.png. build_posts.py uses one when it exists and
falls back to assets/img/og-image.png otherwise.
"""
import json, pathlib, random, re
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img" / "og"
W, H, S = 1200, 630, 2  # drawn at 2x, then reduced for smooth edges
INTER = "/usr/share/fonts/opentype/inter/InterDisplay-%s.otf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
LABEL = {"project": "PROJECT BLOG", "personal": "PERSONAL AND FUN"}


def font(path, size):
    return ImageFont.truetype(path, size * S)


def front(name):
    raw = (ROOT / "posts" / name).read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---", raw, re.S)
    meta = {}
    if m:
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
    return meta


def wrap(draw, text, fnt, width):
    lines, cur = [], ""
    for w in text.split():
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=fnt) <= width:
            cur = t
        else:
            lines.append(cur); cur = w
    if cur:
        lines.append(cur)
    return lines


def make(slug, meta):
    rnd = random.Random(slug)
    im = Image.new("RGB", (W * S, H * S), (0, 0, 0))
    d = ImageDraw.Draw(im)
    for _ in range(46):  # sparse stars, like the site background
        x, y, r = rnd.randrange(W * S), rnd.randrange(H * S), rnd.choice([1, 1, 2, 2, 3])
        c = rnd.choice([70, 90, 120, 160])
        d.ellipse([x - r, y - r, x + r, y + r], fill=(c, c, c + 8))
    pad = 80 * S
    d.text((pad, 78 * S), LABEL.get(meta.get("category", "").lower(), "MY THOUGHTS"), font=font(MONO, 22), fill=(150, 156, 170))
    title = meta.get("title", slug)
    for size in (66, 58, 52, 46, 40):
        ft = font(INTER % "Medium", size)
        lines = wrap(d, title, ft, (W - 160) * S)
        if len(lines) <= 4:
            break
    lh = int(size * 1.16) * S
    y = 140 * S
    for ln in lines[:4]:
        d.text((pad, y), ln, font=ft, fill=(245, 245, 247)); y += lh
    tags = [t.strip() for t in meta.get("tags", "").strip("[]").split(",") if t.strip()][:4]
    if tags:
        d.text((pad, 470 * S), "  ·  ".join(tags), font=font(MONO, 20), fill=(127, 178, 255))
    d.line([(pad, 540 * S), ((W - 80) * S, 540 * S)], fill=(60, 62, 70), width=S)
    d.text((pad, 560 * S), "Anand Kumar", font=font(INTER % "Regular", 30), fill=(245, 245, 247))
    site = "anand-ambastha.github.io"
    d.text(((W - 80) * S - d.textlength(site, font=font(MONO, 20)), 566 * S), site, font=font(MONO, 20), fill=(150, 156, 170))
    OUT.mkdir(parents=True, exist_ok=True)
    im.resize((W, H), Image.LANCZOS).save(OUT / f"{slug}.png", optimize=True)


def main():
    names = json.loads((ROOT / "posts" / "index.json").read_text(encoding="utf-8"))
    n = 0
    for name in names:
        meta = front(name)
        if meta.get("draft", "").lower() == "true":
            continue
        make(name[:-3], meta); n += 1
    print(f"made {n} share images in {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
