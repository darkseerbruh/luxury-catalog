#!/usr/bin/env python3
"""
hashtag_blocks.py  -  the trend -> caption/article bridge (deterministic ranker).

Reads a trends export and emits docs/trends/proven-hashtags.md: proven-demand-first
hashtag + search-phrase blocks, grouped by brand and by topic. This is the ONE
repo-readable file the `social` agent (hashtags) and the `copywriter` agent (article
angles + on-page keywords) both READ at draft time. Neither agent can query Notion, so
this committed digest is the connective tissue between the research and the copy.

Input:  scripts/trends/terms_seed.json  (or pass another path as argv[1]).
  This is the CURATED layer exported from the Notion 'TikTok Trending Terms' DB: it
  carries the Category, Creators/saturation and decode fields the ranker needs. The raw
  OCR `clean.json` does NOT (categories + saturation are the owner's Notion work), so it
  feeds Notion, not this ranker. Refresh the seed from Notion, then rerun (README step 7).

Weighting (owner rule: "lean most heavily on PROVEN"):
  - PROVEN demand leads. Rank within every block by Pop # (search volume), then by
    searches-per-creator (spc = our opening). Established demand beats novelty.
  - OPENER  = high spc, not crowded -> a lane we can actually surface in. Flagged, kept high.
  - RISING  = breakout / fast-growth -> the speculative bet. Capped to 1 per block, optional.
  - PILLAR  = crowded head term -> fine for SEO, weak as a wedge. Listed last, labelled.

Regenerate whenever the Notion trends DB is refreshed (see README step 7) so the loop
stays closed: research -> this file -> captions + articles -> performance -> next refresh.

Usage:  python3 scripts/trends/hashtag_blocks.py [input.json]
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(REPO, "docs", "trends", "proven-hashtags.md")

# --- evergreen, always-safe tags (not trend-derived; the baseline every post can carry) ---
GLOBAL_EVERGREEN = ["#luxurybags", "#designerbags", "#handbagcollector", "#luxuryresale",
                    "#preloved", "#luxurycatalog"]
BRAND_EVERGREEN = {
    "Chanel": ["#chanelbag", "#chanelclassicflap"],
    "Louis Vuitton": ["#louisvuitton", "#lvbag"],
    "Hermès": ["#hermes", "#birkin", "#hermeskelly"],
    "Dior": ["#diorbag", "#ladydior"],
    "Gucci": ["#guccibag", "#vintagegucci"],
    "Coach": ["#coach", "#coachbag", "#vintagecoach"],
    "Goyard": ["#goyard", "#goyardbag"],
    "YSL": ["#ysl", "#yslbag", "#saintlaurent"],
    "Prada": ["#prada", "#pradabag"],
    "Celine": ["#celine", "#celinebag"],
    "Balenciaga": ["#balenciaga"],
    "Fendi": ["#fendi", "#fendibaguette"],
    "Loewe": ["#loewe", "#loewepuzzle"],
    "Jacquemus": ["#jacquemus"],
    "The Row": ["#therow", "#quietluxury"],
    "Miu Miu": ["#miumiu"],
    "Givenchy": ["#givenchy"],
    "Telfar": ["#telfar", "#telfarbag"],
    "McQueen": ["#alexandermcqueen"],
    "Margiela": ["#margiela", "#maisonmargiela"],
    "Gerard Darel": ["#gerarddarel"],
}
# topic angle notes for the copywriter (from the 2026-07-01 pattern read, dated)
TOPIC_ANGLE = {
    "Price question": "Our strongest edge: real comps -> an honest 'is it worth it' (estimate, not appraisal). ~2.8M combined demand, answered poorly.",
    "Comparison (vs)": "Our compare pages fit exactly. Decision-paralysis before a big spend. ~2.3M demand, rarely answered with data.",
    "Diaper bag": "Wide-open gap: aspirational + practical 'permission to buy'. ~0.85M, almost no honest which-actually-works answer.",
    "School / student": "Seasonal peak now -> Sept. 'First nice bag' for campus. ~1.25M, thinly answered (hauls, not guidance).",
    "Work / commuter": "'First real-job bag', laptop-fits-and-still-chic. ~0.79M, under-served.",
    "Authentication": "Ties to our published auth guides. Teach checkable markers, never a verdict. Fear-baity elsewhere.",
    "Thrift / resale": "Our Coach/thrift wedge. 'Luxury for less' treasure-hunt. ~1.6M, chaotic -> room for a trustworthy voice.",
    "Vintage / Y2K": "Nostalgia + 'found it secondhand' flex. ~3.8M, chaotic on names/dates -> our decode edge.",
    "Designer era": "The lineage reveal ('that designer used to be at that house'). Pure intrigue + smart-flex. A gap.",
    "Archival / season": "Collector depth: a specific year/collection/original. Our seasonal-archive is built for this.",
    "Color story": "Seasonal-colour dopamine, 'this exact colour'. Low-effort visual format.",
    "Status / hierarchy": "Ranking/tier debates print engagement. Bring rigour where others bring takes.",
    "Hermès game": "The acquisition ritual fascinates even non-buyers. No clean neutral explainer exists.",
    "New release": "'Is this the new It bag' curiosity. Fast to go stale -> post while the window is open.",
    "Media tie-in": "Show/film-driven spikes. Tag the media, ride the moment.",
}
TOPIC_ORDER = ["Price question", "Comparison (vs)", "Diaper bag", "School / student",
               "Work / commuter", "Authentication", "Thrift / resale", "Vintage / Y2K",
               "Designer era", "Archival / season", "Color story", "Status / hierarchy",
               "Hermès game", "New release", "Media tie-in"]
STOP = {"bag", "bags", "the", "a", "for", "is", "how", "much", "to", "know", "if", "of", "vs"}


def load(path=None):
    if path and os.path.exists(path):
        p = path
    else:
        p = os.path.join(HERE, "terms_seed.json")
        if not os.path.exists(p):
            sys.exit("no input: expected scripts/trends/terms_seed.json (or pass a path)")
    with open(p) as f:
        data = json.load(f)
    return p, data


def slug(term):
    """term -> #hashtag: alnum, lowercased, filler words dropped, capped length."""
    words = [w for w in re.findall(r"[a-z0-9]+", term.lower()) if w not in STOP]
    tag = "".join(words)
    return "#" + tag[:30] if tag else ""


def demand(t):
    return t.get("pop_k") or 0


def fmt_demand(t):
    pk = t.get("pop_k")
    if pk is None:
        return "spc-ranked" if t.get("spc") else "unranked"
    return f"{pk/1000:.2f}M" if pk >= 1000 else f"{int(pk)}K"


def tier(t):
    if t.get("saturated"):
        return "pillar"
    g = (t.get("growth") or "")
    is_rising = "breakout" in g or (g.startswith("+") and _pct(g) >= 150)
    spc = t.get("spc")
    if spc and spc >= 1500:
        return "opener"
    if is_rising:
        return "rising"
    return "proven"


def _pct(g):
    m = re.search(r"(\d+)", g or "")
    return int(m.group(1)) if m else 0


def badge(t):
    bits = []
    g = t.get("growth")
    if g:
        bits.append(g)
    if t.get("spc"):
        bits.append(f"spc {t['spc']:,}")
    if t.get("decode"):
        bits.append(f"= {t['decode']}")
    return " · ".join(bits)


def line(t):
    b = badge(t)
    sfx = f" · {b}" if b else ""
    page = f' · routes to {t["our_page"]}' if t.get("our_page") else ""
    return f'- `{t["term"]}` : {fmt_demand(t)}{sfx} · {slug(t["term"])}{page}'


# tiers, most-proven first
TIER_RANK = {"opener": 0, "proven": 1, "rising": 2, "pillar": 3}
TIER_LABEL = {"opener": "OPENER (high demand, low supply - lean here)",
              "proven": "PROVEN (established demand)",
              "rising": "RISING bet (optional; use at most 1 per caption)",
              "pillar": "PILLAR / SEO only (crowded - weak as a wedge)"}


def block(terms):
    """render a group's terms, proven-first, tier-labelled. List every term (no
    truncation); the 'max 1 rising per caption' cap is caption guidance, not a filter."""
    for t in terms:
        t["_tier"] = tier(t)
    terms.sort(key=lambda t: (TIER_RANK[t["_tier"]], -demand(t), -(t.get("spc") or 0)))
    out, current = [], None
    for t in terms:
        tr = t["_tier"]
        if tr != current:
            out.append(f"\n**{TIER_LABEL[tr]}**")
            current = tr
        out.append(line(t))
    return "\n".join(out)


def main():
    path, data = load(sys.argv[1] if len(sys.argv) > 1 else None)
    meta = data.get("_meta", {})
    terms = data["terms"]

    L = []
    L.append("# Proven Hashtags & Search Terms - the trend bridge")
    L.append("")
    L.append("> AUTO-GENERATED by `scripts/trends/hashtag_blocks.py`. Do not hand-edit -")
    L.append("> edit the seed (`scripts/trends/terms_seed.json`) or refresh `clean.json`, then rerun.")
    L.append("")
    L.append(f"**Source:** {meta.get('origin','?')}  ")
    L.append(f"**Captured:** {meta.get('captured','?')} · **n:** {meta.get('n','?')}  ")
    L.append(f"**Read as:** {meta.get('read_as','demand signal, not a verdict')}")
    L.append("")
    L.append("## How to use this")
    L.append("")
    L.append("- **Social (captions):** build each post's tags from the block that matches the "
             "bag/topic. Lead with **OPENER + PROVEN**; work the verbatim `search phrase` into "
             "the caption text (TikTok indexes caption words, not just #tags). Add at most one "
             "RISING bet. Always carry the evergreen baseline. Never force an off-topic tag.")
    L.append("- **Copywriter (articles):** §2 is your demand map. Pick angles where our edge meets "
             "high demand + low saturation; phrase titles/H2s in the reader's own search words.")
    L.append("- **The loop:** research -> this file -> captions + articles -> performance. Once we "
             "have live reach data, feed our own top-performing tags back into the seed so "
             "'proven' means *proven for us*, not just TikTok demand. Today it is TikTok demand.")
    L.append("")

    # §0 evergreen
    L.append("## 0. Evergreen baseline (always safe, not trend-derived)")
    L.append("")
    L.append("Global: " + " ".join(GLOBAL_EVERGREEN))
    L.append("")

    # §1 by brand
    L.append("## 1. By brand")
    by_brand = {}
    for t in terms:
        by_brand.setdefault(t["brand"], []).append(dict(t))
    brand_demand = {b: max(demand(x) for x in ts) for b, ts in by_brand.items()}
    for b in sorted(by_brand, key=lambda b: -brand_demand[b]):
        L.append("")
        L.append(f"### {b}")
        L.append(block(by_brand[b]))
        ever = BRAND_EVERGREEN.get(b)
        if ever:
            L.append(f"\n*Evergreen:* {' '.join(ever)}")
    L.append("")

    # §2 by topic (article angles + caption themes)
    L.append("## 2. By topic - article angles + caption themes")
    by_cat = {}
    for t in terms:
        for c in t.get("cats", []):
            by_cat.setdefault(c, []).append(dict(t))
    ordered = [c for c in TOPIC_ORDER if c in by_cat] + \
              [c for c in by_cat if c not in TOPIC_ORDER]
    for c in ordered:
        L.append("")
        L.append(f"### {c}")
        if c in TOPIC_ANGLE:
            L.append(f"*Angle:* {TOPIC_ANGLE[c]}")
        L.append(block(by_cat[c]))
    L.append("")
    L.append("---")
    L.append(f"*Generated from `{os.path.relpath(path, REPO)}` · "
             f"{len(terms)} terms · regenerate after every Notion trends refresh.*")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        f.write("\n".join(L) + "\n")
    print(f"wrote {os.path.relpath(OUT, REPO)} from {os.path.relpath(path, REPO)} "
          f"({len(terms)} terms, {len(by_brand)} brands, {len(by_cat)} topics)")


if __name__ == "__main__":
    main()
