# Reels log

Durable record of every video the pipeline makes. The render files live locally in
`output/` (too large for git); this log is the committed history. Newest first.

**2026-07-08 — "Class is in session" thrift reel #2 (haul IMG_7921-7937).** Second run of
the come-thrift-with-me / class-is-in-session format (reuses `scripts/build-thrift-bed.mjs`).
17 clips identified from ffmpeg frames; spec `examples/thrift-class-2.json`, VO script
`examples/thrift-class-2.vo-script.md`, bag IDs + comp sources `examples/thrift-class-2.bags.md`.
Structure: trustworthy brands (Guess tote, Steve Madden floral crossbody, Vera Bradley quilted,
BCBG camel satchel) → dupes (blue fleece Chanel-flap knockoff HERO, mustard woven-PU, the white
made-in-China care tag / no maker's stamp) → landfill (nude patent croc with the cracking/peeling
handle). On-screen numbers all traceable: **$4.99** = the one legible Goodwill tag (red, IMG_7929);
resale = dated estimates (Guess $15-35, Steve Madden $10-22, Vera Bradley $18-35, BCBG $18-35, dupes
~$0), archivist sold comps 2026-07-08, framed as estimate-not-appraisal. Open/close verbatim; no
grails found so the "no grails" close stands. Lexicon: added vera bradley, bcbg, goodwill, bottega
(steve madden/shein already present; "guess" deliberately NOT added, it collides with the verb).
**Status: packaged for local render** (owner records VO to `input/thrift-class-2-vo.m4a`, drops the
17 clips in `input/clips/`, then `node scripts/build-thrift-bed.mjs examples/thrift-class-2.json &&
npm run make thrift-class-2`). Only $4.99 was a hard price on screen; every other tag was the new
QR style or unreadable, so no other price beats (never invented an ask).

**2026-07-06 — FOUNDER-FACE visual-bed A/B (new bank + 21 variants).** Owner filmed 16
own-face desk clips (bag wall behind); banked at `~/Documents/handbag-campaign-images/founder-broll`
(originals + silent 1080x1920 vertical cuts), catalog `founder-broll-manifest.json`. Built
founder-bed variants of all 21 existing text posts (9 swipe-batch statements + 12 kw/kw2
questions) via `scripts/montage-card.mjs` with `pos:top` (hook clears her face), same
text/font/duration as each faceless twin so the A/B isolates ONE variable (the bed). Plus a
voiceover pilot `gucci-myth-founder` via new `scripts/montage-vo.mjs`. Media hosted on temp
GitHub release `founder-broll-2026-07-06` (Metricool ingests, then delete). **12 matched-pair
drafts STAGED** (draft:true, autoPublish:false, IG Reel + TikTok, caption/title mirror the
faceless twin exactly, B-arm at twin-date + ~7d, 18:00 ET):
`kw-love-you` 346293700 (Jul15) · `kw-keep-one` 346293732 (Jul17) · `kw-when-knew` 346293746 (Jul19) ·
`kw-hold-value` 346294253 (Jul21) · `kw-bought-young` 346294277 (Jul23) · `kw-go-back` 346294629 (Jul25) ·
`kw2-too-many` 346294647 (Jul27) · `kw2-pass-down` 346294654 (Jul29) · `kw2-wait` 346294661 (Jul30) ·
`kw2-first-taught` 346294667 (Jul31) · `kw2-still-thinking` 346294669 (Aug2) · `love-language` 346294671 (Aug4).
**9 SHELVED (not real):** `kw2-the-day` + the 8 statements (`first-bag, hermes-game, hills,
junkie, macbook-fit, value-fendi, doc-flight, aff-deserve`) have **no faceless twin in Metricool**,
so they are not experiment arms (owner rule: if it isn't in Metricool it isn't real). Their
founder renders stay in `output/` unused unless a faceless twin is ever posted. **Experiment is
12 pairs, complete.** Temp media release deleted after Metricool ingested the 12. **Registry:
`docs/social-experiments.md`** (hypothesis + both arms' post ids per pair). Owner picks sound +
publishes each B-arm draft. Canon: `docs/social-content-calendar.md` 3.6.

**2026-07-06 — on-screen follow-CTA card added (pipeline feature).** `headline.json` now
takes an optional `"follow"` line, rendered as a bottom pill with a `+ Follow` badge that
pops at the outro and holds to the cut. Phrase the value to CONTINUE the badge (e.g.
`"for the full Chanel map"` reads as "+ Follow for the full Chanel map"), not to repeat the
word Follow. Never spoken; it satisfies
script-requirements.md rule 27 (the follow ask, our current growth goal) without a re-film.
Timing defaults to the site-CTA phrase, or set `"followAt"`. The 3 Chanel reels below have
`"follow"` added to their (gitignored) `input/*.headline.json`; they need a re-render
(`npm run make <base>.mp4`) and a Metricool re-stage to carry the card. New reels: just add
the `"follow"` line.

**2026-07-06 — text-card mode (pipeline feature).** For text-hook reels (the "put
a thought on screen over one clip" format): `scripts/montage-card.mjs` renders ONE
held clip with the whole hook shown statically on one screen, in the brand **Playfair
serif** (not Poppins, no per-word gold sweep), size set per hook via `captionFontPx`.
`cardFooter:true` adds the editorial footer (gold diamond + italic "know the facts on
every bag" + FOLLOW ALONG + luxurycatalog.com pill), placed in the lower third and
lifted off the very bottom so it clears TikTok's caption + action buttons. Serif +
italic loaded in `load-font.ts`; style in `Page.tsx` / `CardFooter.tsx`. Batch 1 below
re-rendered in this style.

**2026-07-06 — data-comparison SLIDESHOW mode (Hero tier, new format).** Faceless same-world
two-bag value comparison as a 5-slide 1080x1350 carousel (brand ink+gold, Georgia serif):
`scripts/make-compare-slideshow.py` outputs discrete slides (cover question + both bags →
resale price each → share-of-retail-kept with bars → the take → CTA). Numbers are OUR tracked
data, dated + n + source on-screen, hedged "our estimate, not an appraisal"; no investment
claims. **It ships AS a slideshow: we do NOT stitch these into a motion mp4** (owner rule
2026-07-06 — a Ken-Burns push on a slide deck is a fake video). Pairing config at the top of
the script (`PAIRS`), swap via `PAIR=<key>`. First superseded the wrong Flap-vs-Neverfull
pairing (cross-tier, "different worlds") AND a fake-motion reel export — both retired.

| Date | Concept | Mode | Source | Caption / script | Status |
|------|---------|------|--------|------------------|--------|
| 2026-07-06 | Flap vs Birkin 30 (retention) | data slideshow (5 slides, 1080x1350) | cutouts flap + birkin; Flap $5,700 sold n=116 TRR Jun2026 · 88% · Birkin30 $18,000 sold n=102 TRR 2026 · 155% | cover Q → resale each → % of retail kept (hedged) → take → CTA. `PAIR=flap-birkin` | **staged Metricool draft** post 346219038, IG carousel + TikTok slideshow, 2026-07-29 10:00 ET, draft+autoPublish:false. Owner adds sound + publishes. |
| 2026-07-06 | Birkin 30 vs Kelly 28 (retention) | data slideshow (5 slides) | cutouts birkin + kelly; Birkin30 ask $19,995 n=356 · 155% · Kelly28 ask $18,000 n=289 · 118% | "Birkin or Kelly: which holds more?" both beat retail, Birkin holds most. `PAIR=birkin-kelly` | **staged Metricool draft** post 346219069, IG + TikTok, 2026-08-05 10:00 ET, draft. |
| 2026-07-06 | Flap vs Kelly 28 (retention) | data slideshow (5 slides) | cutouts flap + kelly; Flap $5,700 sold n=116 · 88% · Kelly28 ask $18,000 n=289 · 118% | "Chanel or Hermès: which holds its value?" Flap keeps most, Kelly beats retail. `PAIR=flap-kelly` | **staged Metricool draft** post 346219094, IG + TikTok, 2026-08-12 10:00 ET, draft. |
| 2026-07-06 | Neverfull MM vs Speedy 30 (reversal) | data slideshow (5 slides) | cutouts neverfull(mono) + speedy(damier); lists $1,500 n=336 vs $1,623 n=82 → sells $770 n=87 vs $566 n=93 | "which holds up better?" the flip: Speedy lists higher, Neverfull sells higher (holds the floor). Source: seed-neverfull-speedy.ts. `PAIR=neverfull-speedy` | **staged Metricool draft** post 346218934, IG + TikTok, 2026-07-22 10:00 ET, draft (leads the batch, widest reach). |

**2026-07-06 staging** — all 4 compare slideshows staged as Metricool drafts (blogId 6480195,
draft+autoPublish false), IG carousel + TikTok photo slideshow, rolling weekly Wednesdays
10:00 ET (Jul 22 → Aug 12). Media hosted via temp GitHub release `content-compare-slideshows-2026-07-06`
(Metricool ingested to its CDN, release then deleted). Owner reviews in the planner, adds a
TikTok sound in-app, and publishes. Post ids 346218934 / 346219038 / 346219069 / 346219094.
| 2026-07-06 | Love languages, handbag edition | text-card (one held clip, full hook in ONE textbox, font 52) | broll bank IMG_5193 (black CHANEL shopping bag on a cream quilted car seat, door open) | "What's your love language? Mine's Words of Authentication, Acts of Purchase, Receiving Gifts, Quality Leather, and Physical Unboxing." | **staged Metricool draft** (post 346160480, IG Reel + TikTok, 2026-07-06 18:00 ET, draft+autoPublish:false). Owner adds trending sound in-app + publishes. Silent render; ask-a-question hook invites "which one's yours" comments / stitch-your-own-swap. spec `examples/love-language.json` |
| 2026-07-03 | Chanel 25: classic or Boy? (the debate) | talking-head + synced mic + 4 cued cutouts | `Chanel_2026_0 3.MOV` + `script 4.m4a` (auto-synced, match 0.83); cutouts = Chanel brand images (25, Classic Flap, Boy) VIDEO-USE library | Her script (kit 1 debate). Headline "Chanel 25: Classic or Boy?", CTA box luxurycatalog.com. Fixes: garbled CTA re-transcribed from clean mic ("search Chanel 2026 on luxurycatalog.com"), dropped final "comments." restored | draft v4 (captions aligned to audio; opens on scripted "Is the Chanel 25" via trim.json startPhrase, ad-lib "a tale of two futures" cut; passes npm run verify; bags on gold-edged cards, each NAMED, with the spoken price pinned under the card) |
| 2026-07-03 | Every Chanel type, one pass (taxonomy) | talking-head + synced mic + 7 cued cutouts | `Chanel_2026_0 2.MOV` + `script 3.m4a` (auto-synced, match 0.83); cutouts = Chanel brand images (Classic Flap, Boy, WOC, 19, 22, 25, 31) VIDEO-USE library | Her script (kit 1 taxonomy). Headline "Every Chanel type, one pass", CTA box. Fixes: Deauville, 31 Rue Cambon, feed-not-feet, Totes | draft v2 (captions RE-ALIGNED to audio after the sync-delay caption bug fix; opens on her first word, 5.2s dead air cut; bags on gold-edged cards, each NAMED, with the spoken price pinned under the card) |
| 2026-07-03 | Chanel in 2026, decoded (starter map) | talking-head + synced mic + 5 cued cutouts | `Chanel_2026_0.MOV` + `script 1.m4a` (auto-synced, match 0.84); cutouts = Chanel brand images (25, Classic Flap, 19, 22, WOC) VIDEO-USE library | Her script (kit 1 explainer). Headline "Chanel in 2026, decoded", CTA box. Prices spoken as pre-loved asking medians. Fixes: BLANK_AUDIO tail stripped, year-named-too | draft v2 (captions RE-ALIGNED to audio after the sync-delay caption bug fix; opens on her first word, 2.4s dead air cut; bags on gold-edged cards, each NAMED, with the spoken price pinned under the card) |
| 2026-07-02 | 4 luxury bags moms use as diaper bags, ranked | talking-head + synced mic + 4 cued cutouts | phone video + computer-mic audio (auto-synced); bag stills = web stand-ins (Gucci Ophidia, LV OnTheGo, Goyard Saint Louis, LV Neverfull) | Her own script (ranked 4→1, CTA to luxurycatalog.com "search luxury diaper bags") | draft v2 (pipeline fixes: captions aligned to audio, opens on first word, bags now on gold-edged CARDS upper-left off her face; passes npm run verify. STILL BLOCKED to post: Teleprompter.com watermark baked into her source footage moves around/onto the headline -> re-film; stand-in images -> swap) |
| 2026-07-01 | Know your Hermès (8-bag roll call) | headless montage | `_by_bag/`: Birkin 40, Mini Kelly 20, Constance, Lindy, Bolide, Evelyne, Roulis, Picotin | Per bag: "The <name>" | draft (demo; 2 clips are spread shots + some show competitor tags, recut before posting) |
| 2026-07-06 | Swipe batch 1: aff-deserve | text-card (one held clip, full hook on one screen, font 66) | broll bank IMG_6332 | "You deserve beautiful things just because you love them." | draft (silent; add trending sound in-app; payoff in post caption per docs/social-batch-2026-07-06.md) |
| 2026-07-06 | Swipe batch 1: value-fendi | text-card (font 62) | broll bank IMG_6668 (Paris) | "You can buy that Fendi three times over used vs new." | draft (real July 2026 figures live in §8/caption; refresh before posting) |
| 2026-07-06 | Swipe batch 1: doc-flight | text-card (font 52) | broll bank IMG_6240 | "A Netflix documentary on holding my bag the whole flight because I don't trust the overhead bin." | draft |
| 2026-07-06 | Swipe batch 1: first-bag | text-card (font 58) | broll bank IMG_2561 | "Here's exactly what I would do if I were buying my first big girl bag." | draft (payoff = 5-step checklist in caption) |
| 2026-07-06 | Swipe batch 1: hermes-game | text-card (font 58) | broll bank IMG_2607 | "I wish someone told me this before I tried to play the Hermès game." | draft |
| 2026-07-06 | Swipe batch 1: macbook-fit | text-card (font 50) | broll bank IMG_2581 | "I used to watch every review to see if a bag fit my MacBook. Now I just check Luxury Catalog." | draft (verify a bag page shows fit data before linking) |
| 2026-07-06 | Swipe batch 1: junkie | text-card (font 56) | broll bank IMG_2588 | "I wasted thousands on designer bags. And I'll do it again because I'm a junkie." | draft |
| 2026-07-06 | Swipe batch 1: hills | text-card (font 66) | broll bank IMG_2561 @12 (shares first-bag location; diversify later) | "Hills I will die on as a handbag collector." | draft (payoff = the 3 hills in caption) |

## B-roll usage manifest

**2026-07-06** — owner reviewed the full ~92-clip b-roll bank. Her calls (in/out
usable ranges, tags, rejects, holds) live in `tools/video-pipeline/broll-manifest.json`
(`ranges`=[in,out] usable seconds; `status` use/reject/hold; un-annotated clips default
to the full clip, "good throughout"). Read it before pulling any keep-warm clip. Rejects:
IMG_2588, IMG_2578, IMG_2606 (too much movement). Hold: IMG_3053 (waterfall, distinctive,
use-case TBD). Note: `examples/junkie.json` was built on now-rejected IMG_2588; owner
cleared it to post as-is (2026-07-06), but do not reuse IMG_2588 for anything new.

Ready-to-post 6s vertical segments cut from the trimmed usable windows live in the
gitignored `output/broll-cuts/` (capped at 4 per clip; ask to generate more from any clip).

## Metricool staging

- **2026-07-06 week-2 content sprint (all 3 tiers)** — staged as Metricool drafts
  (blogId 6480195, draft+autoPublish false), IG + TikTok.
  - **Keep-warm reels (6):** specs `examples/kw2-*.json`, 10:00 ET Jul 13-18. Post ids
    346183300 / 346183353 / 346183467 / 346183555 / 346183609 / 346183658.
  - **Hero data carousel (5 slides):** Chanel Classic Flap leather+hardware resale spread
    (caviar+gold ~$7,200 vs lambskin+silver ~$4,700). Source: TheRealReal June 2026, n=116
    (docs/data-collection-handoff.md:257). Framed as our estimate + "your call not a verdict".
    Jul 15 18:00, post 346183774. **REFRESH the two figures against live data before publishing.**
  - **Signature carousel (cover + 6):** her real owned bags from `_BEST` (1684/3310/6723/
    4201/7600/5133). Bag models NOT asserted in copy (IDs uncertain per _GUESSES flag).
    Jul 17 18:00, post 346183940.
  - Slides generated by `scripts/make-slides.py` (Georgia serif, ink+gold brand look, 1080x1350).
    Media host: temp GitHub release `content-week2-2026-07-06` (deleted post-ingest).

- **2026-07-06 keep-warm batch** — 6 reflective question-reels (single-textbox text cards
  over approved b-roll) staged as Metricool **drafts** (blogId 6480195, draft+autoPublish
  false), IG Reel + TikTok, 10:00 ET 2026-07-07..12 (Metricool best-time peak on both
  networks, reslotted from 09:00). Specs `examples/kw-*.json`. Owner adds a
  trending sound in-app + publishes. Media host: temp GitHub release `reels-keepwarm-2026-07-06`
  (deleted post-ingest). Love-language reel (post 346160480) staged same way for 2026-07-06 18:00.


- **2026-07-06** — the 3 Chanel reel drafts SWAPPED to the follow-card cut (full-quality
  re-render with the on-screen "+ Follow for the full Chanel map" pill). Media re-hosted via
  a temp GitHub release that Metricool ingested (then deleted). Same text, schedules, and
  `draft:true` kept; only the video changed. New post ids: 346158025 (starter map, Jul 8),
  346158158 (taxonomy, Jul 24), 346158698 (25 debate, Aug 11). Owner reviews + publishes
  from the planner.
- **2026-07-05** — the 3 Chanel reels staged as Metricool **drafts** (blogId 6480195,
  `draft:true`, `autoPublish:false`), each targeting Instagram Reel + TikTok, media on
  Metricool's CDN. Post ids 345666985 (starter map), 345667051 (taxonomy), 345667089
  (25 debate). Media host: a temp GitHub release (`reels-chanel-2026-07-03`) that Metricool
  ingested from, then deleted. Owner reviews + publishes from the Metricool planner; the
  pipeline never posts live. Metricool auto-ingests public URLs (incl. linked Google
  Drive/Dropbox), so a temp GitHub release asset is the zero-setup media host for future reels.
