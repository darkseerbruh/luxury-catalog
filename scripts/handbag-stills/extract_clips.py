#!/usr/bin/env python3
"""
Pull video CLIPS (segments) out of the handbag videos.

Three modes:
  --ranges 3-7,12-18.5   cut exact segments (seconds, or mm:ss). Hand-pick moments.
  --scenes               auto-split the whole video at scene changes into clips.
  (default trims, add --web to re-encode muted + web-optimized for the detail page)

--web  : H.264, audio stripped, scaled to <=1080 short side, +faststart (loops/web).
         Without --web, segments are stream-copied (instant, keyframe-snapped).

Usage:
  python3 extract_clips.py OUT_DIR video.MOV --ranges 3-7,12-18 --web
  python3 extract_clips.py OUT_DIR video.MOV --scenes --min 1.5 --web
"""
import os, sys, subprocess, re, argparse


def secs(t):
    t = str(t).strip()
    if ":" in t:
        m, s = t.split(":"); return int(m) * 60 + float(s)
    return float(t)


def duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", path], capture_output=True, text=True)
    try: return float(r.stdout.strip())
    except Exception: return 0.0


def scene_times(path, thresh):
    r = subprocess.run(["ffmpeg", "-i", path, "-vf", f"select='gt(scene,{thresh})',showinfo",
                        "-f", "null", "-"], capture_output=True, text=True)
    return [float(m) for m in re.findall(r"pts_time:([0-9.]+)", r.stderr)]


def cut(path, start, end, out, web):
    if web:
        cmd = ["ffmpeg", "-y", "-ss", str(start), "-to", str(end), "-i", path,
               "-an", "-vf", "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease",
               "-c:v", "libx264", "-crf", "20", "-preset", "veryfast",
               "-movflags", "+faststart", out]
    else:
        cmd = ["ffmpeg", "-y", "-ss", str(start), "-to", str(end), "-i", path, "-c", "copy", out]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return os.path.exists(out) and os.path.getsize(out) > 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out_dir"); ap.add_argument("video")
    ap.add_argument("--ranges"); ap.add_argument("--scenes", action="store_true")
    ap.add_argument("--min", type=float, default=1.0, help="min clip length for --scenes")
    ap.add_argument("--thresh", type=float, default=0.3, help="scene sensitivity")
    ap.add_argument("--web", action="store_true")
    a = ap.parse_args()
    os.makedirs(a.out_dir, exist_ok=True)
    name = os.path.splitext(os.path.basename(a.video))[0]
    ext = "mp4"
    made = []
    if a.ranges:
        for i, rng in enumerate(a.ranges.split(","), 1):
            s, e = rng.split("-"); s, e = secs(s), secs(e)
            out = os.path.join(a.out_dir, f"{name}_clip{i:02d}_{s:g}-{e:g}.{ext}")
            if cut(a.video, s, e, out, a.web): made.append(out)
    elif a.scenes:
        bounds = [0.0] + scene_times(a.video, a.thresh) + [duration(a.video)]
        seg = 0
        for s, e in zip(bounds, bounds[1:]):
            if e - s < a.min: continue
            seg += 1
            out = os.path.join(a.out_dir, f"{name}_scene{seg:02d}_{s:.1f}-{e:.1f}.{ext}")
            if cut(a.video, s, e, out, a.web): made.append(out)
    else:
        ap.error("give --ranges or --scenes")
    for m in made:
        print(f"  {os.path.basename(m)}  ({os.path.getsize(m)//1024} KB)")
    print(f"{len(made)} clip(s) -> {a.out_dir}")


if __name__ == "__main__":
    main()
