#!/usr/bin/env python3
"""Rebuild _by_bag/ from the manifest groups (keepers only)."""
import os, csv, re, shutil
P = os.path.expanduser("~/Documents/handbag-products/_clean")
GOOD, THUMB = os.path.join(P, "good"), os.path.join(P, "thumbnails")
BYBAG = os.path.join(P, "_by_bag")
csvp = os.path.expanduser("~/Documents/handbag-products/collection-labels.csv")
rows = list(csv.reader(open(csvp)))[1:]

ORDER = {"primary": 1, "comparison": 3, "detail": 4, "thumb": 5}
def slug(s): return re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_") or "misc"

if os.path.isdir(BYBAG): shutil.rmtree(BYBAG)
os.makedirs(BYBAG)
groups = {}
placed = 0
for r in rows:
    f, brand, model, group, typ, source, status, verify, notes = (r + [""] * 9)[:9]
    if status not in ("keep", "keep-best-thumb", "suggested-confirm"): continue
    src = None
    for d in (GOOD, THUMB):
        cand = os.path.join(d, f"IMG_{f}.jpg")
        if os.path.exists(cand): src = cand; break
    if not src: continue
    gdir = os.path.join(BYBAG, slug(group)); os.makedirs(gdir, exist_ok=True)
    o = 2 if status == "keep-best-thumb" else ORDER.get(typ, 6)
    tname = "best-thumb" if status == "keep-best-thumb" else (typ or "img")
    shutil.copy2(src, os.path.join(gdir, f"{o}_{tname}_IMG_{f}.jpg"))
    groups.setdefault(group, []).append((f, model, tname)); placed += 1

with open(os.path.join(BYBAG, "_index.txt"), "w") as fh:
    for g in sorted(groups):
        meta = next((rr for rr in rows if rr[3] == g), None)
        brand = meta[1] if meta else ""; model = meta[2] if meta else ""; verify = meta[7] if meta else ""
        fh.write(f"{g}  [{brand} · {model}]" + (f"  (verify: {verify})" if verify else "") + "\n")
        for f, m, t in sorted(groups[g]): fh.write(f"    {t:11} IMG_{f}\n")
        fh.write("\n")

print(f"groups: {len(groups)} | images placed: {placed}")
print(f"good: {len([x for x in os.listdir(GOOD) if x.endswith('.jpg')])} | "
      f"thumbs: {len([x for x in os.listdir(THUMB) if x.endswith('.jpg')])}")
