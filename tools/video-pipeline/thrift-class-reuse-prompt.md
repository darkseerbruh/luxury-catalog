# Reusable prompt: "class is in session" thrift reel

Paste this into a fresh chat alongside a new batch of thrift-haul clips (and, when
you have it, your voiceover). It reproduces the whole workflow that made the first
`thrift-class` reel.

---

I'm dropping a batch of thrift-haul handbag clips (photos/videos), and I want the same
"come thrift with me, class is in session" educational reel we built before. The
scaffolding lives in `tools/video-pipeline` (see `examples/thrift-class.json` and
`scripts/build-thrift-bed.mjs`). Work top to bottom:

1. **Identify every bag.** Extract frames from each clip with ffmpeg, and for each bag
   tell me the brand, what it is, and read any thrift price tag on screen. Crop the
   logo/medallion when you are not sure. Guess if you must, but label it a guess.

2. **Value each one.** Give a resale range as an ESTIMATE, not an appraisal, with the
   date, and run the `archivist` agent for sold comps. Every number that ends up on
   screen has to trace to evidence: the thrift tag is exact, the resale is a dated
   estimate. No verdicts on value or authenticity, use "markers to check" and "my take."

3. **Write the voiceover.** Run the `brand-voice` skill first. No em dashes. This is the
   founder persona, so first person, warm, funny, no gatekeeping. Keep my open verbatim:
   "Sit down, class is in session. I'm Arielle, founder of luxurycatalog.com, your
   resource for all the info on handbags. I'm going to teach you what to look for at the
   thrift by showing you what I look for." And my close verbatim: "Ultimately we didn't
   find any grails today, but we did learn how to spot quality a little better. K thanks
   bye, see you next time." (Swap the "grails" line if we DID find one.) Structure:
   trustworthy brands first, then the laughable dupes (Chanel-style copies that took
   every code except the logo; how to tell: loose threads, white made-in-China tags, no
   maker's stamp inside), then the landfill pile (cheap PU that peels and cracks, and the
   Shein-in-your-cart cost-per-wear point). Every dupe/fake call is evidence-led (show the
   tell on screen), never a blind guess.

4. **Price beats only where a tag is readable.** The format is "they're asking X, it's
   worth a toss in the bin" for junk, or "they're asking Y, good bag but that's not a
   thrift price, up to you, it won't come apart on you" for a real-but-overpriced bag.
   Skip the beat for any bag whose tag we cannot read. Do not invent asks.

5. **Package it for me to render locally** (the caption pipeline's Whisper/sharp
   downloads are blocked in web sessions, so I run the render on my Mac):
   - Copy `examples/thrift-class.json` to `examples/<newname>.json` and rewrite the `bed`
     (clip IMG order + durations, clamped to real clip length), the `headline`, the
     `cues` (a real-Chanel reference image + any interior-proof still), and the
     `callouts` (each spoken price phrase to its tag card).
   - I record the VO myself and drop it at `input/<name>-vo.m4a` (never an AI voice), and
     I put the clips in `input/clips/`.
   - Run order is: `node scripts/build-thrift-bed.mjs examples/<newname>.json` then
     `npm run make <name>`.
   - Add any new brand names to `luxury-lexicon.json` so the captions spell them right.

Deliver: the identified-bags table (brand / what it is / tag / resale estimate), the VO
script for me to record, and the ready-to-run spec committed to the branch.

---

Notes for whoever runs this:
- Keep the run on my Mac. Web sessions cannot download Whisper (GitHub 403) or sharp
  (libvips 403), so the captioned render only completes locally.
- `build-thrift-bed.mjs` matches clips by IMG number, so any filename containing the
  number works. It clamps each cut to the clip's real length and loops the bed to fill
  the voice, so short clips are fine.
- The authored `callouts.json` (spoken-phrase to price card) is how worded prices
  ("thirty bucks") get an on-screen "$29.99" card, since the auto dollar-detector only
  catches a literal "$" in the transcript.
