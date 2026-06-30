#!/usr/bin/env python3
"""
Cut the single best proposed clip per BAG into a muted, web-optimized loop and
place it in that bag's _by_bag/<group>/ folder (prefixed 0_clip_ so it sorts
ahead of the stills).

Inputs (defaults under ~/Documents/handbag-products):
  segments_all.csv     (from find_segments.py)
  collection-labels.csv (the manifest: file -> group)
Source videos: ~/Downloads/Purses
Usage: python3 cut_best_per_bag.py
"""
import os, csv, glob, re, subprocess

SRC = os.path.expanduser("~/Downloads/Purses")
PROD = os.path.expanduser("~/Documents/handbag-products")
SEG = os.path.join(PROD, "segments_all.csv")
MAN = os.path.join(PROD, "collection-labels.csv")
BYBAG = os.path.join(PROD, "_clean", "_by_bag")


def slug(s): return re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_") or "misc"


def find(idn):
    for ext in (".MOV", ".MP4", ".mov", ".mp4", ".m4v"):
        p = os.path.join(SRC, f"IMG_{idn}{ext}")
        if os.path.exists(p):
            return p
    return None


def main():
    group_of = {}
    for r in list(csv.reader(open(MAN)))[1:]:
        if r and r[6] in ("keep", "keep-best-thumb", "suggested-confirm"):
            group_of[r[0]] = r[3]
    best = {}  # group -> (score, id, start, end)
    for r in list(csv.reader(open(SEG)))[1:]:
        vid = r[0].replace("IMG_", "")
        g = group_of.get(vid)
        if not g:
            continue
        score, s, e = float(r[4]), float(r[1]), float(r[2])
        if g not in best or score > best[g][0]:
            best[g] = (score, vid, s, e)
    made = 0
    for g, (score, vid, s, e) in sorted(best.items()):
        src = find(vid)
        if not src:
            continue
        gdir = os.path.join(BYBAG, slug(g))
        os.makedirs(gdir, exist_ok=True)
        out = os.path.join(gdir, f"0_clip_IMG_{vid}_{s:g}-{e:g}.mp4")
        subprocess.run(["ffmpeg", "-y", "-ss", str(s), "-to", str(e), "-i", src, "-an",
                        "-vf", "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease",
                        "-c:v", "libx264", "-crf", "20", "-preset", "veryfast",
                        "-movflags", "+faststart", out],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.path.exists(out) and os.path.getsize(out) > 0:
            made += 1
            print(f"  {slug(g)[:34]:34} <- IMG_{vid} {s:g}-{e:g}s ({os.path.getsize(out)//1024}KB)")
    print(f"\n{made} bag clips written into {BYBAG}/<bag>/")


if __name__ == "__main__":
    main()
