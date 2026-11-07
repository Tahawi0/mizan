"""Generate share cards (PNG) for every atlas entry, in the «manuscript» style.

Output: cards/og/<slug>.png (1200x630, link preview) and cards/post/<slug>.png (1080x1350, social post).
Needs Pillow built with libraqm (for Arabic shaping). Run: python tools/cards.py
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "tools" / "fonts"
SITE = "tahawi0.github.io/mizan"
KIND = {"fallacy": "مغالطة", "bias": "انحياز", "philosopher": "فيلسوف", "school": "مدرسة وفكرة"}
PAPER, LEAF, INK, MUTED, GOLD, LAPIS = "#E9E1CC", "#F3EDDD", "#221C14", "#6B604E", "#A47E2E", "#1F3B73"


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size, layout_engine=ImageFont.Layout.RAQM)


def tw(d, s, f):
    return d.textlength(s, font=f, direction="rtl", language="ar")


def wrap(d, text, f, width):
    lines, cur = [], ""
    for w in text.split():
        t = (cur + " " + w).strip()
        if tw(d, t, f) <= width or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def rtl(d, x_right, y, s, f, fill):
    d.text((x_right - tw(d, s, f), y), s, font=f, fill=fill, direction="rtl", language="ar")


def center(d, cx, y, s, f, fill):
    d.text((cx - tw(d, s, f) / 2, y), s, font=f, fill=fill, direction="rtl", language="ar")


def frame(d, W, H, m):
    d.rectangle([m, m, W - m, H - m], fill=LEAF, outline=GOLD, width=3)
    d.rectangle([m + 12, m + 12, W - m - 12, H - m - 12], outline=GOLD, width=1)
    for x, y in [(m, m), (W - m, m), (m, H - m), (W - m, H - m)]:  # corner diamonds
        d.polygon([(x, y - 11), (x + 11, y), (x, y + 11), (x - 11, y)], fill=PAPER, outline=GOLD)


def scale_icon(d, cx, cy, s, col):
    w = max(2, int(s / 14))
    d.line([(cx, cy - s * .55), (cx, cy + s * .5)], fill=col, width=w)
    d.line([(cx - s * .35, cy + s * .5), (cx + s * .35, cy + s * .5)], fill=col, width=w)
    d.line([(cx - s * .6, cy - s * .35), (cx + s * .6, cy - s * .35)], fill=col, width=w)
    for sx in (-1, 1):
        px = cx + sx * s * .6
        d.line([(px, cy - s * .35), (px - s * .18, cy + s * .05)], fill=col, width=w)
        d.line([(px, cy - s * .35), (px + s * .18, cy + s * .05)], fill=col, width=w)
        d.chord([px - s * .2, cy - s * .08, px + s * .2, cy + s * .18], 0, 180, outline=col, width=w)


def fit_title(d, name, maxw, start):
    size = start
    while size > 40:
        f = font("ElMessiri-Bold.ttf", size)
        if tw(d, name, f) <= maxw:
            return f
        size -= 4
    return font("ElMessiri-Bold.ttf", 40)


def card(e, W, H, out):
    im = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(im)
    m = 34
    frame(d, W, H, m)
    pad = m + 60
    right, inner = W - pad, W - 2 * pad
    portrait = H > W
    y = pad + (30 if portrait else 0)
    rtl(d, right, y, KIND[e["kind"]], font("ElMessiri-Bold.ttf", 34 if portrait else 30), GOLD)
    y += 70 if portrait else 58
    tf = fit_title(d, e["name"], inner, 104 if portrait else 84)
    rtl(d, right, y, e["name"], tf, INK)
    y += int(tf.size * 1.55)
    d.line([(right - 120, y), (right, y)], fill=GOLD, width=3)
    y += 34 if portrait else 26
    bf = font("Amiri-Regular.ttf", 46 if portrait else 38)
    lh = int(bf.size * 1.75)
    lines = wrap(d, e["oneLine"], bf, inner)
    for ln in lines[: (7 if portrait else 4)]:
        rtl(d, right, y, ln, bf, INK)
        y += lh
    exs = e.get("examples") or ([{"where": "من حياتنا", "text": e["life"]}] if e.get("life") else [])
    if portrait and exs:
        y += 26
        ex = exs[0]
        ef = font("Amiri-Regular.ttf", 36)
        rtl(d, right, y, ex["where"], font("ElMessiri-Bold.ttf", 28), LAPIS)
        y += 52
        exl = wrap(d, ex["text"], ef, inner - 30)
        top = y
        for ln in exl[:6]:
            rtl(d, right - 30, y, ln, ef, MUTED)
            y += int(ef.size * 1.7)
        d.line([(right, top + 8), (right, y - 10)], fill=GOLD, width=3)
        tip = e.get("detect") or e.get("useIt")
        if tip:
            y += 40
            rtl(d, right, y, "إزاي تكشفها؟" if e.get("detect") else "استخدمها النهارده", font("ElMessiri-Bold.ttf", 34), GOLD)
            y += 62
            df = font("Amiri-Regular.ttf", 38)
            limit = H - pad - 120
            lh2 = int(df.size * 1.7)
            sents = [s.strip() + "." for s in tip.replace("؟", "؟.").split(".") if s.strip()]
            sents = [s[:-1] if s.endswith("؟.") else s for s in sents]
            best = []
            for i in range(1, len(sents) + 1):
                ls = wrap(d, " ".join(sents[:i]), df, inner)
                if y + len(ls) * lh2 > limit:
                    break
                best = ls
            for ln in best:
                rtl(d, right, y, ln, df, INK)
                y += lh2
    # footer
    fy = H - pad - (40 if portrait else 34)
    ff = font("ElMessiri-Bold.ttf", 36 if portrait else 32)
    label = "ميزان"
    rtl(d, right - 58, fy - 6, label, ff, INK)
    scale_icon(d, right - 22, fy + 18, 40, GOLD)
    sf = font("Amiri-Regular.ttf", 28 if portrait else 24)
    d.text((pad, fy + 4), SITE, font=sf, fill=MUTED)
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, optimize=True)


def site_card(out):
    W, H = 1200, 630
    im = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(im)
    frame(d, W, H, 34)
    scale_icon(d, W / 2, 175, 120, GOLD)
    center(d, W / 2, 250, "زِن كلامك", font("ElMessiri-Bold.ttf", 110), INK)
    center(d, W / 2, 420, "مرجع مصري مفتوح عن المغالطات والانحيازات وإزاي نفكر صح", font("Amiri-Regular.ttf", 36), MUTED)
    center(d, W / 2, 510, SITE, font("Amiri-Regular.ttf", 28), GOLD)
    im.save(out, optimize=True)


def main():
    entries = json.loads((ROOT / "content/entries.json").read_text(encoding="utf-8"))
    for e in entries:
        card(e, 1200, 630, ROOT / "cards/og" / f"{e['slug']}.png")
        card(e, 1080, 1350, ROOT / "cards/post" / f"{e['slug']}.png")
    phil = json.loads((ROOT / "content/philosophy.json").read_text(encoding="utf-8"))
    for e in phil:
        card(e, 1200, 630, ROOT / "cards/og" / f"{e['slug']}.png")
        card(e, 1080, 1350, ROOT / "cards/post" / f"{e['slug']}.png")
    site_card(ROOT / "cards/og/site.png")
    icons()
    print("cards:", len(entries) + len(phil))


def icons():
    out = ROOT / "assets" / "icons"
    out.mkdir(parents=True, exist_ok=True)
    for size, pad in [(192, 0), (512, 0), (512, 1), (180, 0)]:
        im = Image.new("RGB", (size, size), LAPIS if pad else PAPER)
        d = ImageDraw.Draw(im)
        if not pad:
            d.rounded_rectangle([size * .04, size * .04, size * .96, size * .96], radius=size * .18, fill=PAPER, outline=GOLD, width=max(2, size // 60))
        scale_icon(d, size / 2, size / 2, size * (.38 if pad else .46), GOLD)
        name = "maskable-512.png" if pad else ("apple-touch.png" if size == 180 else f"icon-{size}.png")
        im.save(out / name, optimize=True)


if __name__ == "__main__":
    main()
