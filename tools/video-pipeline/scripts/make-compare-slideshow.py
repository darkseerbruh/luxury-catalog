# Same-world two-bag value SLIDESHOW (faceless Hero tier).
# Outputs discrete 1080x1350 carousel slides you swipe. NOT a video: we never
# stitch these into a motion/Ken-Burns mp4 (locked owner rule 2026-07-06).
# Numbers are OUR tracked resale, dated + n + source on-screen, framed as an
# estimate, not an appraisal. No investment/appreciation claims.
#   PAIR=flap-birkin REEL_SLIDES=<dir> python3 scripts/make-compare-slideshow.py
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SP = os.environ.get("REEL_SLIDES", "/tmp/compare-slides")
os.makedirs(SP, exist_ok=True)
W, H = 1080, 1350
INK = (23, 24, 28)
IVORY = (239, 233, 222)
GOLD = (198, 161, 91)
MUTED = (150, 146, 138)
FAINT = (96, 94, 92)

SER = "/System/Library/Fonts/Supplemental/Georgia.ttf"
SERB = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
SERI = "/System/Library/Fonts/Supplemental/Georgia Italic.ttf"
SANS = "/System/Library/Fonts/Helvetica.ttc"
CUT = "/Users/ariellecoambes/Documents/handbag-campaign-images"

# ---- Pairing config. Every number traces to docs/data-collection-handoff.md. ----
PAIRS = {
    "flap-birkin": {
        "left": {
            "img": f"{CUT}/cutouts/chanel-classic-flap.png",
            "name": "Chanel Classic Flap", "sub": "Medium",
            "resale": "$5,700", "keep": "~88%", "keep_pct": 0.88,
            "src": "median  ·  116 sold  ·  TheRealReal  ·  Jun 2026",
        },
        "right": {
            "img": f"{CUT}/cutouts/hermes-birkin.png",
            "name": "Hermès Birkin 30", "sub": "Togo",
            "resale": "$18,000", "keep": "~155%", "keep_pct": 1.0,  # bar caps at full
            "src": "median  ·  102 sold  ·  TheRealReal  ·  2026",
        },
        "hook": "Which icon actually holds its value?",
        "cover_sub": "Two grails, side by side.",
        "keep_head": "How much of its retail each one keeps",
        "take_head": "Both hold value. They play different games.",
        "take_body": "The Flap keeps most of what it cost. The Birkin resells above retail, because Hermes gates who can buy one new.",
    },
}
PAIR = PAIRS[os.environ.get("PAIR", "flap-birkin")]
L, R = PAIR["left"], PAIR["right"]


def f(p, s):
    return ImageFont.truetype(p, s)


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


def base(eyebrow="LUXURY CATALOG   THE DATA"):
    im = Image.new("RGBA", (W, H), INK + (255,))
    d = ImageDraw.Draw(im)
    center(d, W / 2, 96, eyebrow, f(SANS, 26), GOLD, ls=7)
    d.line((W / 2 - 44, 146, W / 2 + 44, 146), fill=GOLD, width=2)
    return im, d


def footer(d, page):
    y = H - 112
    cx = W / 2
    d.polygon([(cx, y), (cx + 10, y + 13), (cx, y + 26), (cx - 10, y + 13)], fill=GOLD)
    center(d, cx, y + 44, "luxurycatalog.com", f(SANS, 27), IVORY, ls=3)
    center(d, W - 70, y + 6, page, f(SANS, 26), FAINT)


def fit(path, bw, bh):
    im = Image.open(path).convert("RGBA")
    s = min(bw / im.width, bh / im.height)
    return im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)


def place(canvas, sprite, x, y):
    a = sprite.split()[3]
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sh.paste((0, 0, 0, 150), (x + 8, y + 18), a)
    sh = sh.filter(ImageFilter.GaussianBlur(22))
    canvas.alpha_composite(sh)
    canvas.alpha_composite(sprite.convert("RGBA"), (x, y))


# ---------------- Slide 1: cover (question + both bags) ----------------
canvas, d = base()
lines = wrap(d, PAIR["hook"], f(SERB, 74), W - 130)
by = block(d, W / 2, 250, lines, f(SERB, 74), IVORY, 92)
center(d, W / 2, by + 18, PAIR["cover_sub"], f(SERI, 40), MUTED)
lc = fit(L["img"], 380, 470)
rc = fit(R["img"], 420, 470)
row = 760
place(canvas, lc, 150, row + (470 - lc.height))
place(canvas, rc, W - 150 - rc.width, row + (470 - rc.height))
d = ImageDraw.Draw(canvas)
footer(d, "1 / 5")
canvas.convert("RGB").save(f"{SP}/slide-1.png")

# ---------------- Slide 2: what each resells for ----------------
canvas, d = base()
center(d, W / 2, 230, "What each one resells for now", f(SERB, 56), IVORY)
center(d, W / 2, 302, "our tracked resale, not a list price", f(SERI, 34), MUTED)
colw = W / 2
lc = fit(L["img"], 300, 360)
rc = fit(R["img"], 330, 360)
iy = 400
place(canvas, lc, int(colw / 2 - lc.width / 2), iy + (360 - lc.height))
place(canvas, rc, int(W - colw / 2 - rc.width / 2), iy + (360 - rc.height))
d = ImageDraw.Draw(canvas)
py = 820
center(d, colw / 2, py, L["resale"], f(SERB, 92), GOLD)
center(d, W - colw / 2, py, R["resale"], f(SERB, 92), GOLD)
center(d, colw / 2, py + 118, L["name"], f(SER, 38), IVORY)
center(d, W - colw / 2, py + 118, R["name"], f(SER, 38), IVORY)
center(d, colw / 2, py + 176, L["src"], f(SANS, 23), FAINT)
center(d, W - colw / 2, py + 176, R["src"], f(SANS, 23), FAINT)
d.line((W / 2, 400, W / 2, 1060), fill=(52, 52, 58), width=2)
footer(d, "2 / 5")
canvas.convert("RGB").save(f"{SP}/slide-2.png")

# ---------------- Slide 3: share of retail kept (the answer) ----------------
canvas, d = base()
lines = wrap(d, PAIR["keep_head"], f(SERB, 56), W - 150)
block(d, W / 2, 240, lines, f(SERB, 56), IVORY, 70)
colw = W / 2
py = 470
center(d, colw / 2, py, L["keep"], f(SERB, 130), GOLD)
center(d, W - colw / 2, py, R["keep"], f(SERB, 130), IVORY)
center(d, colw / 2, py + 200, L["name"], f(SER, 38), MUTED)
center(d, W - colw / 2, py + 200, R["name"], f(SER, 38), MUTED)
bar_y = py + 280
bw = 320
for cx, pct, col in [(colw / 2, L["keep_pct"], GOLD), (W - colw / 2, R["keep_pct"], IVORY)]:
    x0 = cx - bw / 2
    d.rounded_rectangle([x0, bar_y, x0 + bw, bar_y + 24], radius=12, fill=(48, 48, 54))
    d.rounded_rectangle([x0, bar_y, x0 + bw * pct, bar_y + 24], radius=12, fill=col)
note = wrap(d, "Above 100% means it resells for more than its retail. Our estimate from recorded sales, not an appraisal.", f(SERI, 34), W - 180)
block(d, W / 2, 1050, note, f(SERI, 34), MUTED, 46)
footer(d, "3 / 5")
canvas.convert("RGB").save(f"{SP}/slide-3.png")

# ---------------- Slide 4: the take ----------------
canvas, d = base()
lines = wrap(d, PAIR["take_head"], f(SERB, 62), W - 140)
by = block(d, W / 2, 330, lines, f(SERB, 62), IVORY, 78)
body = wrap(d, PAIR["take_body"].replace("Hermes", "Hermès"), f(SER, 44), W - 200)
block(d, W / 2, by + 60, body, f(SER, 44), MUTED, 62)
footer(d, "4 / 5")
canvas.convert("RGB").save(f"{SP}/slide-4.png")

# ---------------- Slide 5: CTA ----------------
canvas, d = base()
lines = wrap(d, "Compare any two bags yourself.", f(SERB, 72), W - 130)
by = block(d, W / 2, 360, lines, f(SERB, 72), IVORY, 90)
center(d, W / 2, by + 28, "Free. No account.", f(SERI, 44), GOLD)
pill = "luxurycatalog.com"
pf = f(SANS, 44)
pw = tw(d, pill, pf) + 84
px = W / 2 - pw / 2
py = 760
d.rounded_rectangle([px, py, px + pw, py + 100], radius=50, outline=GOLD, width=3)
center(d, W / 2, py + 26, pill, pf, IVORY, ls=2)
center(d, W / 2, py + 176, "FOLLOW ALONG", f(SANS, 32), MUTED, ls=8)
footer(d, "5 / 5")
canvas.convert("RGB").save(f"{SP}/slide-5.png")

print("slideshow ->", SP, "(5 slides)")
