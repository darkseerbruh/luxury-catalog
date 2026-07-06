# Reels log

Durable record of every video the pipeline makes. The render files live locally in
`output/` (too large for git); this log is the committed history. Newest first.

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

| Date | Concept | Mode | Source | Caption / script | Status |
|------|---------|------|--------|------------------|--------|
| 2026-07-03 | Chanel 25: classic or Boy? (the debate) | talking-head + synced mic + 4 cued cutouts | `Chanel_2026_0 3.MOV` + `script 4.m4a` (auto-synced, match 0.83); cutouts = Chanel brand images (25, Classic Flap, Boy) VIDEO-USE library | Her script (kit 1 debate). Headline "Chanel 25: Classic or Boy?", CTA box luxurycatalog.com. Fixes: garbled CTA re-transcribed from clean mic ("search Chanel 2026 on luxurycatalog.com"), dropped final "comments." restored | draft v4 (captions aligned to audio; opens on scripted "Is the Chanel 25" via trim.json startPhrase, ad-lib "a tale of two futures" cut; passes npm run verify; bags on gold-edged cards, each NAMED, with the spoken price pinned under the card) |
| 2026-07-03 | Every Chanel type, one pass (taxonomy) | talking-head + synced mic + 7 cued cutouts | `Chanel_2026_0 2.MOV` + `script 3.m4a` (auto-synced, match 0.83); cutouts = Chanel brand images (Classic Flap, Boy, WOC, 19, 22, 25, 31) VIDEO-USE library | Her script (kit 1 taxonomy). Headline "Every Chanel type, one pass", CTA box. Fixes: Deauville, 31 Rue Cambon, feed-not-feet, Totes | draft v2 (captions RE-ALIGNED to audio after the sync-delay caption bug fix; opens on her first word, 5.2s dead air cut; bags on gold-edged cards, each NAMED, with the spoken price pinned under the card) |
| 2026-07-03 | Chanel in 2026, decoded (starter map) | talking-head + synced mic + 5 cued cutouts | `Chanel_2026_0.MOV` + `script 1.m4a` (auto-synced, match 0.84); cutouts = Chanel brand images (25, Classic Flap, 19, 22, WOC) VIDEO-USE library | Her script (kit 1 explainer). Headline "Chanel in 2026, decoded", CTA box. Prices spoken as pre-loved asking medians. Fixes: BLANK_AUDIO tail stripped, year-named-too | draft v2 (captions RE-ALIGNED to audio after the sync-delay caption bug fix; opens on her first word, 2.4s dead air cut; bags on gold-edged cards, each NAMED, with the spoken price pinned under the card) |
| 2026-07-02 | 4 luxury bags moms use as diaper bags, ranked | talking-head + synced mic + 4 cued cutouts | phone video + computer-mic audio (auto-synced); bag stills = web stand-ins (Gucci Ophidia, LV OnTheGo, Goyard Saint Louis, LV Neverfull) | Her own script (ranked 4→1, CTA to luxurycatalog.com "search luxury diaper bags") | draft v2 (pipeline fixes: captions aligned to audio, opens on first word, bags now on gold-edged CARDS upper-left off her face; passes npm run verify. STILL BLOCKED to post: Teleprompter.com watermark baked into her source footage moves around/onto the headline -> re-film; stand-in images -> swap) |
| 2026-07-01 | Know your Hermès (8-bag roll call) | headless montage | `_by_bag/`: Birkin 40, Mini Kelly 20, Constance, Lindy, Bolide, Evelyne, Roulis, Picotin | Per bag: "The <name>" | draft (demo; 2 clips are spread shots + some show competitor tags, recut before posting) |

## Metricool staging

- **2026-07-05** — the 3 Chanel reels staged as Metricool **drafts** (blogId 6480195,
  `draft:true`, `autoPublish:false`), each targeting Instagram Reel + TikTok, media on
  Metricool's CDN. Post ids 345666985 (starter map), 345667051 (taxonomy), 345667089
  (25 debate). Media host: a temp GitHub release (`reels-chanel-2026-07-03`) that Metricool
  ingested from, then deleted. Owner reviews + publishes from the Metricool planner; the
  pipeline never posts live. Metricool auto-ingests public URLs (incl. linked Google
  Drive/Dropbox), so a temp GitHub release asset is the zero-setup media host for future reels.
