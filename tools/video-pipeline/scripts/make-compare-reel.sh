#!/usr/bin/env bash
# Stitch the 4 comparison slides into a ~12s vertical reel: slow push-in on each,
# 0.5s crossfades, silent AAC track (owner adds a trending sound in-app).
#   REEL_SLIDES=<dir> OUT=<path.mp4> bash scripts/make-compare-reel.sh
set -euo pipefail
SLIDES="${REEL_SLIDES:?set REEL_SLIDES to the slide dir}"
OUT="${OUT:?set OUT to the output mp4 path}"
DUR=3.4          # seconds each slide is on screen
XF=0.5           # crossfade seconds
FPS=30

# Per-slide: upscale (steadies zoompan), slow center push-in 1.00 -> 1.08.
zp() {
  echo "scale=2160:3840,zoompan=z='min(zoom+0.00045,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$(python3 -c "print(int($DUR*$FPS))"):s=1080x1920:fps=$FPS,setsar=1"
}

ff=(ffmpeg -y -v error)
for n in 1 2 3 4; do ff+=(-loop 1 -t "$DUR" -i "$SLIDES/s$n.png"); done

# xfade chain across the 4 push-in clips.
o1=$(python3 -c "print(round($DUR-$XF,2))")
o2=$(python3 -c "print(round(2*($DUR-$XF),2))")
o3=$(python3 -c "print(round(3*($DUR-$XF),2))")
fc="[0:v]$(zp)[v0];[1:v]$(zp)[v1];[2:v]$(zp)[v2];[3:v]$(zp)[v3];"
fc+="[v0][v1]xfade=transition=fade:duration=$XF:offset=$o1[x1];"
fc+="[x1][v2]xfade=transition=fade:duration=$XF:offset=$o2[x2];"
fc+="[x2][v3]xfade=transition=fade:duration=$XF:offset=$o3[vout]"

TOTAL=$(python3 -c "print(round(4*$DUR-3*$XF,2))")
ff+=(-f lavfi -t "$TOTAL" -i anullsrc=r=44100:cl=stereo)
ff+=(-filter_complex "$fc" -map "[vout]" -map 4:a
     -c:v libx264 -pix_fmt yuv420p -preset medium -crf 18 -r "$FPS"
     -c:a aac -b:a 128k -shortest "$OUT")
"${ff[@]}"
echo "done -> $OUT  (${TOTAL}s)"
