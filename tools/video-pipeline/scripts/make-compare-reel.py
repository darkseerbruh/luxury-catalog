# Two-bag value-comparison reel (faceless Hero tier).
# Builds 4 vertical 1080x1920 slides on the brand ink+gold system, then the
# companion build step (make-compare-reel.sh) adds a slow push + crossfades and
# stitches them into a ~13s reel. Numbers are OUR tracked resale data, dated +
# sourced; framed as an estimate, never an appraisal. No appreciation claims.
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SP = os.environ.get("REEL_SLIDES", "/tmp/compare-reel-slides")
os.makedirs(SP, exist_ok=True)
W, H = 1080, 1920
INK = (23, 24, 28)
IVORY = (239, 233, 222)
GOLD = (198, 161, 91)
MUTED = (150, 146, 138)
FAINT = (96, 94, 92)

SER = "/System/Library/Fonts/Supplemental/Georgia.ttf"
SERB = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
SERI = "/System/Library/Fonts/Supplemental/Georgia Italic.ttf"
SANS = "/System/Library/Fonts/Helvetica.ttc"

CHANEL = "/Users/ariellecoambes/Documents/handbag-campaign-images/cutouts/chanel-classic-flap.png"
NEVERFULL = "/Users/ariellecoambes/Documents/handbag-campaign-images/directory/Louis_Vuitton/cutouts/neverfull.png"


def f(path, sz):
    return ImageFont.truetype(path, sz)


def tw(d, t, ft):
    return d.textlength(t, font=ft)


def wrap(d, t, ft, maxw):
    words, lines, cur = t.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if tw(d, test, ft) <= maxw:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def center(d, cx, y, t, ft, fill, ls=0):
    if ls:
        total = sum(tw(d, c, ft) + ls for c in t) - ls
        x = cx - total / 2
        for c in t:
            d.text((x, y), c, font=ft, fill=fill)
            x += tw(d, c, ft) + ls
    else:
        d.text((cx - tw(d, t, ft) / 2, y), t, font=ft, fill=fill)


def block(d, cx, y, lines, ft, fill, lh):
    for ln in lines:
        center(d, cx, y, ln, ft, fill)
        y += lh
    return y


def base():
    im = Image.new("RGBA", (W, H), INK + (255,))
    d = ImageDraw.Draw(im)
    center(d, W / 2, 150, "LUXURY CATALOG   THE DATA", f(SANS, 28), GOLD, ls=7)
    d.line((W / 2 - 46, 205, W / 2 + 46, 205), fill=GOLD, width=2)
    return im, d


def footer(im, d, follow=True):
    y = H - 190
    cx = W / 2
    if follow:
        center(d, cx, y, "know the facts on every bag", f(SERI, 34), MUTED)
        y += 60
    d.polygon([(cx, y + 6), (cx + 11, y + 20), (cx, y + 34), (cx - 11, y + 20)], fill=GOLD)
    center(d, cx, y + 62, "luxurycatalog.com", f(SANS, 30), IVORY, ls=3)


def fit(img_path, box_w, box_h):
    im = Image.open(img_path).convert("RGBA")
    scale = min(box_w / im.width, box_h / im.height)
    return im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)


def shadow(canvas, sprite, x, y):
    # soft drop shadow under a bag cutout for depth on the ink bg
    a = sprite.split()[3]
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sh.paste((0, 0, 0, 150), (x + 10, y + 22), a)
    sh = sh.filter(ImageFilter.GaussianBlur(24))
    canvas.alpha_composite(sh)
    canvas.alpha_composite(sprite.convert("RGBA"), (x, y))


# ---------------- Slide 1: hook (question) ----------------
canvas, d = base()
lines = wrap(d, "Which bag actually holds its value?", f(SERB, 88), W - 150)
by = block(d, W / 2, 380, lines, f(SERB, 88), IVORY, 108)
center(d, W / 2, by + 24, "Two icons, side by side.", f(SERI, 46), MUTED)
# both bags at the bottom, facing in
ch = fit(CHANEL, 430, 560)
nf = fit(NEVERFULL, 470, 560)
row_y = 1060
shadow(canvas, ch, 155, row_y + (560 - ch.height))
shadow(canvas, nf, W - 155 - nf.width, row_y + (560 - nf.height))
d = ImageDraw.Draw(canvas)
footer(canvas, d)
canvas.convert("RGB").save(f"{SP}/s1.png")

# ---------------- Slide 2: what they resell for ----------------
canvas, d = base()
center(d, W / 2, 290, "What each one resells for now", f(SERB, 64), IVORY)
center(d, W / 2, 372, "our tracked resale, not a list price", f(SERI, 38), MUTED)
colw = W / 2
ch = fit(CHANEL, 360, 470)
nf = fit(NEVERFULL, 400, 470)
img_y = 500
shadow(canvas, ch, int(colw / 2 - ch.width / 2), img_y + (470 - ch.height))
shadow(canvas, nf, int(W - colw / 2 - nf.width / 2), img_y + (470 - nf.height))
d = ImageDraw.Draw(canvas)
py = 1060
center(d, colw / 2, py, "$5,700", f(SERB, 104), GOLD)
center(d, W - colw / 2, py, "$1,450", f(SERB, 104), GOLD)
center(d, colw / 2, py + 135, "Chanel Classic Flap", f(SER, 42), IVORY)
center(d, colw / 2, py + 187, "Medium", f(SER, 42), IVORY)
center(d, W - colw / 2, py + 135, "LV Neverfull MM", f(SER, 42), IVORY)
center(d, W - colw / 2, py + 187, "Monogram", f(SER, 42), IVORY)
center(d, colw / 2, py + 258, "median  ·  116 sold-priced  ·  Jun 2026", f(SANS, 27), FAINT)
center(d, W - colw / 2, py + 258, "typical  ·  153 listings  ·  Jul 2026", f(SANS, 27), FAINT)
d.line((W / 2, 540, W / 2, 1370), fill=(52, 52, 58), width=2)
footer(canvas, d, follow=False)
canvas.convert("RGB").save(f"{SP}/s2.png")

# ---------------- Slide 3: retention payoff (the answer) ----------------
canvas, d = base()
lines = wrap(d, "How much of its original retail each one keeps", f(SERB, 60), W - 150)
block(d, W / 2, 320, lines, f(SERB, 60), IVORY, 76)
colw = W / 2
py = 660
center(d, colw / 2, py, "~88%", f(SERB, 150), GOLD)
center(d, W - colw / 2, py, "~55%", f(SERB, 150), MUTED)
center(d, colw / 2, py + 215, "Chanel Classic Flap", f(SER, 44), IVORY)
center(d, W - colw / 2, py + 215, "LV Neverfull MM", f(SER, 44), IVORY)
# simple bars
bar_y = py + 300
bw = 340
for cx, pct, col in [(colw / 2, 0.88, GOLD), (W - colw / 2, 0.55, MUTED)]:
    x0 = cx - bw / 2
    d.rounded_rectangle([x0, bar_y, x0 + bw, bar_y + 26], radius=13, fill=(48, 48, 54))
    d.rounded_rectangle([x0, bar_y, x0 + bw * pct, bar_y + 26], radius=13, fill=col)
hedge = wrap(d, "Our estimate from recorded resale. Not an appraisal.", f(SERI, 40), W - 220)
block(d, W / 2, 1300, hedge, f(SERI, 40), MUTED, 52)
footer(canvas, d, follow=False)
canvas.convert("RGB").save(f"{SP}/s3.png")

# ---------------- Slide 4: CTA ----------------
canvas, d = base()
lines = wrap(d, "Compare any two bags yourself.", f(SERB, 82), W - 150)
by = block(d, W / 2, 560, lines, f(SERB, 82), IVORY, 100)
center(d, W / 2, by + 34, "Free. No account.", f(SERI, 48), GOLD)
# URL pill
pill = "luxurycatalog.com"
pf = f(SANS, 46)
pw = tw(d, pill, pf) + 90
px = W / 2 - pw / 2
py = 1120
d.rounded_rectangle([px, py, px + pw, py + 108], radius=54, outline=GOLD, width=3)
center(d, W / 2, py + 28, pill, pf, IVORY, ls=2)
center(d, W / 2, py + 210, "FOLLOW ALONG", f(SANS, 34), MUTED, ls=8)
footer(canvas, d, follow=False)
canvas.convert("RGB").save(f"{SP}/s4.png")

print("slides ->", SP)
