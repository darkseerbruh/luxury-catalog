# Same-world two-bag value SLIDESHOW (faceless Hero tier).
# Outputs discrete 1080x1350 carousel slides you swipe. NOT a video: we never
# stitch these into a motion/Ken-Burns mp4 (locked owner rule 2026-07-06).
# Numbers are OUR tracked resale, dated + n + source on-screen, framed as an
# estimate, not an appraisal. No investment/appreciation claims.
#   PAIR=flap-birkin REEL_SLIDES=<dir> python3 scripts/make-compare-slideshow.py
#
# Two story modes:
#   "retention" — resale price each, then % of retail each keeps (holds-value).
#   "reversal"  — what each LISTS for, then what each SELLS for (the flip).
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
TRACK = (48, 48, 54)

SER = "/System/Library/Fonts/Supplemental/Georgia.ttf"
SERB = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
SERI = "/System/Library/Fonts/Supplemental/Georgia Italic.ttf"
SANS = "/System/Library/Fonts/Helvetica.ttc"
CUT = "/Users/ariellecoambes/Documents/handbag-campaign-images"
MAXKEEP = 1.6   # retention-bar scale so >100% bars still differentiate
MAXLV = 1700    # reversal-bar scale ($) so list vs sold read on one axis

# ---- Pairings. Every number traces to docs/data-collection-handoff.md, the
#      self-updating article charts, or supabase/seed/seed-neverfull-speedy.ts. ----
PAIRS = {
    "flap-birkin": {
        "mode": "retention",
        "hook": "Which icon actually holds its value?",
        "cover_sub": "Two grails, side by side.",
        "keep_head": "How much of its retail each one keeps",
        "take_head": "Both hold value. They play different games.",
        "take_body": "The Flap keeps most of what it cost. The Birkin resells above retail, because Hermès gates who can buy one new.",
        "left": {"img": f"{CUT}/cutouts/chanel-classic-flap.png", "name": "Chanel Classic Flap",
                 "resale": "$5,700", "src": "median sold  ·  116  ·  TheRealReal  ·  Jun 2026",
                 "keep": "~88%", "keep_num": 0.88},
        "right": {"img": f"{CUT}/cutouts/hermes-birkin.png", "name": "Hermès Birkin 30",
                  "resale": "$18,000", "src": "median sold  ·  102  ·  TheRealReal  ·  2026",
                  "keep": "~155%", "keep_num": 1.55},
    },
    "birkin-kelly": {
        "mode": "retention",
        "hook": "Birkin or Kelly: which holds more?",
        "cover_sub": "Two Hermès grails, side by side.",
        "keep_head": "How much of its retail each one keeps",
        "take_head": "Both beat retail. One beats it harder.",
        "take_body": "Both Hermès icons resell above what they cost new. The Birkin, the hardest to be offered, holds the most.",
        "left": {"img": f"{CUT}/cutouts/hermes-birkin.png", "name": "Hermès Birkin 30",
                 "resale": "$19,995", "src": "typical asking  ·  356  ·  our tracking  ·  2026",
                 "keep": "~155%", "keep_num": 1.55},
        "right": {"img": f"{CUT}/cutouts/hermes-kelly.png", "name": "Hermès Kelly 28",
                  "resale": "$18,000", "src": "typical asking  ·  289  ·  our tracking  ·  2026",
                  "keep": "~118%", "keep_num": 1.18},
    },
    "flap-kelly": {
        "mode": "retention",
        "hook": "Chanel or Hermès: which holds its value?",
        "cover_sub": "The Flap and the Kelly, side by side.",
        "keep_head": "How much of its retail each one keeps",
        "take_head": "One keeps most of it. One beats it.",
        "take_body": "The Flap holds most of what it cost. The Kelly resells above retail, because Hermès controls who is offered one new.",
        "left": {"img": f"{CUT}/cutouts/chanel-classic-flap.png", "name": "Chanel Classic Flap",
                 "resale": "$5,700", "src": "median sold  ·  116  ·  TheRealReal  ·  Jun 2026",
                 "keep": "~88%", "keep_num": 0.88},
        "right": {"img": f"{CUT}/cutouts/hermes-kelly.png", "name": "Hermès Kelly 28",
                  "resale": "$18,000", "src": "typical asking  ·  289  ·  our tracking  ·  2026",
                  "keep": "~118%", "keep_num": 1.18},
    },
    "neverfull-speedy": {
        "mode": "reversal",
        "hook": "Neverfull or Speedy: which holds up better?",
        "cover_sub": "Two Louis Vuitton icons, side by side.",
        "list_head": "What each one lists for",
        "sold_head": "What each one actually sells for",
        "take_head": "The one that lists higher sells for less.",
        "take_body": "Same house, same everyday tier. The Speedy asks more, but the Neverfull holds the higher resale floor. Asking is where a seller starts. Sold is the market.",
        "left": {"img": f"{CUT}/directory/Louis_Vuitton/cutouts/neverfull.png", "name": "LV Neverfull MM",
                 "list": "$1,500", "list_src": "asking  ·  336  ·  our tracking  ·  2026", "list_num": 1500,
                 "sold": "$770", "sold_src": "median sold  ·  87  ·  our tracking  ·  2026", "sold_num": 770},
        "right": {"img": f"{CUT}/cutouts/lv-speedy.png", "name": "LV Speedy 30",
                  "list": "$1,623", "list_src": "asking  ·  82  ·  our tracking  ·  Jun 2026", "list_num": 1623,
                  "sold": "$566", "sold_src": "median sold  ·  93  ·  our tracking  ·  2026", "sold_num": 566},
    },
}
KEY = os.environ.get("PAIR", "flap-birkin")
P = PAIRS[KEY]
L, R = P["left"], P["right"]


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


def base():
    im = Image.new("RGBA", (W, H), INK + (255,))
    d = ImageDraw.Draw(im)
    center(d, W / 2, 96, "LUXURY CATALOG   THE DATA", f(SANS, 26), GOLD, ls=7)
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


def bar(d, cx, y, frac, col):
    bw = 320
    x0 = cx - bw / 2
    d.rounded_rectangle([x0, y, x0 + bw, y + 24], radius=12, fill=TRACK)
    d.rounded_rectangle([x0, y, x0 + bw * max(0.04, min(frac, 1.0)), y + 24], radius=12, fill=col)


def slide_cover(page):
    canvas, d = base()
    lines = wrap(d, P["hook"], f(SERB, 74), W - 130)
    by = block(d, W / 2, 250, lines, f(SERB, 74), IVORY, 92)
    center(d, W / 2, by + 18, P["cover_sub"], f(SERI, 40), MUTED)
    lc = fit(L["img"], 380, 460)
    rc = fit(R["img"], 420, 460)
    row = 770
    place(canvas, lc, 150, row + (460 - lc.height))
    place(canvas, rc, W - 150 - rc.width, row + (460 - rc.height))
    d = ImageDraw.Draw(canvas)
    footer(d, page)
    return canvas


def slide_two_bags_prices(head, sub, lval, lsrc, rval, rsrc, page, lbar=None, rbar=None, lcol=GOLD, rcol=GOLD):
    canvas, d = base()
    center(d, W / 2, 230, head, f(SERB, 54), IVORY)
    if sub:
        center(d, W / 2, 300, sub, f(SERI, 34), MUTED)
    colw = W / 2
    lc = fit(L["img"], 290, 340)
    rc = fit(R["img"], 320, 340)
    iy = 390
    place(canvas, lc, int(colw / 2 - lc.width / 2), iy + (340 - lc.height))
    place(canvas, rc, int(W - colw / 2 - rc.width / 2), iy + (340 - rc.height))
    d = ImageDraw.Draw(canvas)
    py = 790
    center(d, colw / 2, py, lval, f(SERB, 92), lcol)
    center(d, W - colw / 2, py, rval, f(SERB, 92), rcol)
    center(d, colw / 2, py + 118, L["name"], f(SER, 38), IVORY)
    center(d, W - colw / 2, py + 118, R["name"], f(SER, 38), IVORY)
    if lbar is not None:
        bar(d, colw / 2, py + 172, lbar, lcol)
        bar(d, W - colw / 2, py + 172, rbar, rcol)
        yy = py + 220
    else:
        yy = py + 172
    center(d, colw / 2, yy, lsrc, f(SANS, 23), FAINT)
    center(d, W - colw / 2, yy, rsrc, f(SANS, 23), FAINT)
    d.line((W / 2, 390, W / 2, py + 140), fill=(52, 52, 58), width=2)
    footer(d, page)
    return canvas


def slide_retention(page):
    canvas, d = base()
    lines = wrap(d, P["keep_head"], f(SERB, 56), W - 150)
    block(d, W / 2, 240, lines, f(SERB, 56), IVORY, 70)
    colw = W / 2
    py = 470
    center(d, colw / 2, py, L["keep"], f(SERB, 130), GOLD)
    center(d, W - colw / 2, py, R["keep"], f(SERB, 130), IVORY)
    center(d, colw / 2, py + 200, L["name"], f(SER, 38), MUTED)
    center(d, W - colw / 2, py + 200, R["name"], f(SER, 38), MUTED)
    bar(d, colw / 2, py + 280, L["keep_num"] / MAXKEEP, GOLD)
    bar(d, W - colw / 2, py + 280, R["keep_num"] / MAXKEEP, IVORY)
    note = wrap(d, "Above 100% means it resells for more than its retail. Our estimate from recorded sales, not an appraisal.", f(SERI, 34), W - 180)
    block(d, W / 2, 1050, note, f(SERI, 34), MUTED, 46)
    footer(d, page)
    return canvas


def slide_take(page):
    canvas, d = base()
    lines = wrap(d, P["take_head"], f(SERB, 60), W - 140)
    by = block(d, W / 2, 320, lines, f(SERB, 60), IVORY, 76)
    body = wrap(d, P["take_body"], f(SER, 44), W - 200)
    block(d, W / 2, by + 56, body, f(SER, 44), MUTED, 62)
    footer(d, page)
    return canvas


def slide_cta(page):
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
    footer(d, page)
    return canvas


slides = [slide_cover("1 / 5")]
if P["mode"] == "retention":
    slides.append(slide_two_bags_prices("What each one resells for now",
                                        "our tracked resale, not a list price",
                                        L["resale"], L["src"], R["resale"], R["src"], "2 / 5"))
    slides.append(slide_retention("3 / 5"))
else:  # reversal
    slides.append(slide_two_bags_prices(P["list_head"], "the sticker on the listing",
                                        L["list"], L["list_src"], R["list"], R["list_src"], "2 / 5",
                                        lbar=L["list_num"] / MAXLV, rbar=R["list_num"] / MAXLV,
                                        lcol=MUTED, rcol=MUTED))
    slides.append(slide_two_bags_prices(P["sold_head"], "what buyers actually paid",
                                        L["sold"], L["sold_src"], R["sold"], R["sold_src"], "3 / 5",
                                        lbar=L["sold_num"] / MAXLV, rbar=R["sold_num"] / MAXLV,
                                        lcol=GOLD, rcol=MUTED))
slides.append(slide_take("4 / 5"))
slides.append(slide_cta("5 / 5"))

for i, canvas in enumerate(slides, 1):
    canvas.convert("RGB").save(f"{SP}/slide-{i}.png")
print(f"slideshow [{KEY}] -> {SP} ({len(slides)} slides)")
