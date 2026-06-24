# Resale-Data Capture Runbook — every size variant

*Generated 2026-06-23. Execute in a **Claude-in-Chrome** session (logged in to TheRealReal). This is the full extended catalog: **165 size variants across 46 capture groups.***

> **Why a browser session:** TheRealReal is bot-blocked to plain `fetch`, and the Claude-on-the-web environment's network policy denies the resale/archive/eBay domains outright (verified: `403 to CONNECT`). Capture must run where there's a logged-in browser. This runbook is pure execution — no decisions left.

## Legal posture (locked — do not deviate)
- Prices are facts: read public listings, store each with its `source_url`, show attributed with a link back.
- **Never** ingest reseller photos or verbatim descriptions. Rate-limit politely.
- **Never invent specs** — unverified colour/leather/hardware/year → `null`.


**Progress (2026-06-24): the full catalog is captured AND loaded.** ~225 distinct variants
carry TheRealReal resale rows in prod (4,461 rows on the 2026-06-23 snapshot + 116 Chanel
hero on 06-22). All 165 size-variant targets adapt+load cleanly from the raw files already in
`data/ingest/_raw/` — **no fresh browser capture is needed to (re)load**; just re-run the adapt
loop over the existing raw files. Only run a NEW Chrome capture when you want a *fresh* snapshot
(new listings / price movement) — and if you do, load it on its own date so it doesn't duplicate
an existing day (the dedup index keys on `observed_on`, so re-loading the same raw file under a new
date creates near-duplicate rows that skew the per-variant median/range).

## The loop (same 5 steps for every group)
```
# 1. Scaffold the size variants for the style (idempotent; needs SUPABASE_SERVICE_ROLE_KEY)
npx tsx supabase/seed/scaffold-variants.ts "<Brand>" "<Style>" <size...> --write

# 2. CAPTURE in Chrome -> data/ingest/_raw/<rawKey>.json
#    Open https://www.therealreal.com/products?keywords=<query>
#    Collect product URLs, then same-origin fetch each (<=8-10 per call), parse JSON-LD Product:
#    save [{url,name,sku,price,currency,condition,desc}, ...]  (desc = the period/newline-separated spec facts)

# 3. Adapt raw -> landing (pass ALL targetKeys that share the rawKey in ONE run)
npx tsx supabase/ingest/sources/trr-jsonld.ts <targetKey> [<targetKey> ...]

# 4. Load to prod (dry-run without --write)
npm run load:prices -- therealreal --write

# 5. Refresh the per-variant price summary so bag pages update
npm run summary:refresh
```

**Tip — catch-all alternative:** instead of curated per-size predicates you can run one broad brand capture and let the loader route every listing (curated variant if the size lands, else `discovered_listing`):
```
npx tsx supabase/ingest/sources/trr-jsonld.ts --catch-all --brand "<Brand>" [--style-guess "<style>"] <rawKey>
```

## Status legend
✅ loaded already (skip unless refreshing) · ⬜ to capture

## Capture groups

### `chanel-classic-flap-medium` — Chanel Classic Flap
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Chanel" "Classic Flap" Medium --write`
- **TRR search:** `keywords=Chanel+Classic+Flap`  → save to `data/ingest/_raw/chanel-classic-flap-medium.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts chanel-classic-flap-medium`
- **Sizes:** ✅ 116 Medium

### `hermes-birkin-25` — Hermès Birkin
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Hermès" "Birkin" 25 --write`
- **TRR search:** `keywords=Hermès+Birkin`  → save to `data/ingest/_raw/hermes-birkin-25.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts hermes-birkin-25`
- **Sizes:** ⬜ 25

### `hermes-birkin-30` — Hermès Birkin
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Hermès" "Birkin" 30 --write`
- **TRR search:** `keywords=Hermès+Birkin`  → save to `data/ingest/_raw/hermes-birkin-30.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts hermes-birkin-30`
- **Sizes:** ✅ 102 30

### `hermes-birkin-35` — Hermès Birkin
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Hermès" "Birkin" 35 --write`
- **TRR search:** `keywords=Hermès+Birkin`  → save to `data/ingest/_raw/hermes-birkin-35.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts hermes-birkin-35`
- **Sizes:** ✅ 108 35

### `hermes-birkin-40` — Hermès Birkin
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Hermès" "Birkin" 40 --write`
- **TRR search:** `keywords=Hermès+Birkin`  → save to `data/ingest/_raw/hermes-birkin-40.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts hermes-birkin-40`
- **Sizes:** ⬜ 40

### `hermes-kelly-25` — Hermès Kelly
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Hermès" "Kelly" 25 --write`
- **TRR search:** `keywords=Hermès+Kelly`  → save to `data/ingest/_raw/hermes-kelly-25.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts hermes-kelly-25`
- **Sizes:** ⬜ 25

### `hermes-kelly-28` — Hermès Kelly
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Hermès" "Kelly" 28 --write`
- **TRR search:** `keywords=Hermès+Kelly`  → save to `data/ingest/_raw/hermes-kelly-28.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts hermes-kelly-28`
- **Sizes:** ✅ 91 28

### `hermes-kelly-32` — Hermès Kelly
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Hermès" "Kelly" 32 --write`
- **TRR search:** `keywords=Hermès+Kelly`  → save to `data/ingest/_raw/hermes-kelly-32.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts hermes-kelly-32`
- **Sizes:** ⬜ 32

### `lv-neverfull-pm` — Louis Vuitton Neverfull
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Louis Vuitton" "Neverfull" PM --write`
- **TRR search:** `keywords=Louis+Vuitton+Neverfull`  → save to `data/ingest/_raw/lv-neverfull-pm.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts lv-neverfull-pm`
- **Sizes:** ⬜ PM

### `lv-neverfull-mm` — Louis Vuitton Neverfull
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Louis Vuitton" "Neverfull" MM --write`
- **TRR search:** `keywords=Louis+Vuitton+Neverfull`  → save to `data/ingest/_raw/lv-neverfull-mm.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts lv-neverfull-mm`
- **Sizes:** ✅ 105 MM

### `gucci-wide` — Gucci GG Marmont + Gucci Jackie 1961 + Gucci Dionysus + Gucci Horsebit 1955
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Gucci" "GG Marmont" Small Medium --write`
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Gucci" "Jackie 1961" Mini Small Medium Large --write`
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Gucci" "Dionysus" "Super Mini" Mini Small Medium --write`
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Gucci" "Horsebit 1955" Mini Small Shoulder --write`
- **TRR search:** `keywords=Gucci`  → save to `data/ingest/_raw/gucci-wide.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts gucci-gg-marmont-small gucci-gg-marmont-medium gucci-jackie-mini gucci-jackie-small gucci-jackie-medium gucci-jackie-large gucci-dionysus-super-mini gucci-dionysus-mini gucci-dionysus-small gucci-dionysus-medium gucci-horsebit-mini gucci-horsebit-small gucci-horsebit-shoulder`
- **Sizes:** ✅ 102 Small · ⬜ Medium · ⬜ Mini · ⬜ Small · ⬜ Medium · ⬜ Large · ⬜ Super Mini · ⬜ Mini · ⬜ Small · ⬜ Medium · ⬜ Mini · ⬜ Small · ⬜ Shoulder

### `lv-speedy` — Louis Vuitton Speedy
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Louis Vuitton" "Speedy" 20 25 30 35 40 Nano HL --write`
- **TRR search:** `keywords=Louis+Vuitton+Speedy`  → save to `data/ingest/_raw/lv-speedy.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts lv-speedy-20 lv-speedy-25 lv-speedy-30 lv-speedy-35 lv-speedy-40 lv-speedy-nano lv-speedy-hl`
- **Sizes:** ⬜ 20 · ⬜ 25 · ⬜ 30 · ⬜ 35 · ⬜ 40 · ⬜ Nano · ⬜ HL

### `lv-alma` — Louis Vuitton Alma
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Louis Vuitton" "Alma" BB PM MM GM Mini Nano --write`
- **TRR search:** `keywords=Louis+Vuitton+Alma`  → save to `data/ingest/_raw/lv-alma.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts lv-alma-bb lv-alma-pm lv-alma-mm lv-alma-gm lv-alma-mini lv-alma-nano`
- **Sizes:** ⬜ BB · ⬜ PM · ⬜ MM · ⬜ GM · ⬜ Mini · ⬜ Nano

### `dior-book-tote` — Dior Book Tote
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Dior" "Book Tote" Mini Small Medium Large --write`
- **TRR search:** `keywords=Dior+Book+Tote`  → save to `data/ingest/_raw/dior-book-tote.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts dior-book-tote-mini dior-book-tote-small dior-book-tote-medium dior-book-tote-large`
- **Sizes:** ⬜ Mini · ⬜ Small · ⬜ Medium · ⬜ Large

### `chanel-boy` — Chanel Boy
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Chanel" "Boy" Mini Small Medium Large --write`
- **TRR search:** `keywords=Chanel+Boy`  → save to `data/ingest/_raw/chanel-boy.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts chanel-boy-mini chanel-boy-small chanel-boy-medium chanel-boy-large`
- **Sizes:** ⬜ Mini · ⬜ Small · ⬜ Medium · ⬜ Large

### `celine-luggage` — Celine Luggage Tote
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Celine" "Luggage Tote" Nano Micro Mini Medium --write`
- **TRR search:** `keywords=Celine+Luggage+Tote`  → save to `data/ingest/_raw/celine-luggage.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts celine-luggage-nano celine-luggage-micro celine-luggage-mini celine-luggage-medium`
- **Sizes:** ⬜ Nano · ⬜ Micro · ⬜ Mini · ⬜ Medium

### `ysl-loulou` — Saint Laurent Loulou
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Saint Laurent" "Loulou" Toy Small Medium Large --write`
- **TRR search:** `keywords=Saint+Laurent+Loulou`  → save to `data/ingest/_raw/ysl-loulou.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts ysl-loulou-toy ysl-loulou-small ysl-loulou-medium ysl-loulou-large`
- **Sizes:** ⬜ Toy · ⬜ Small · ⬜ Medium · ⬜ Large

### `gucci-ophidia` — Gucci Ophidia
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Gucci" "Ophidia" "Super Mini" Mini Small Medium Large Jumbo --write`
- **TRR search:** `keywords=Gucci+Ophidia`  → save to `data/ingest/_raw/gucci-ophidia.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts gucci-ophidia-super-mini gucci-ophidia-mini gucci-ophidia-small gucci-ophidia-medium gucci-ophidia-large gucci-ophidia-jumbo`
- **Sizes:** ⬜ Super Mini · ⬜ Mini · ⬜ Small · ⬜ Medium · ⬜ Large · ⬜ Jumbo

### `lv-bumbag` — Louis Vuitton Bumbag
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Louis Vuitton" "Bumbag" Mini Standard --write`
- **TRR search:** `keywords=Louis+Vuitton+Bumbag`  → save to `data/ingest/_raw/lv-bumbag.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts lv-bumbag-mini lv-bumbag-standard`
- **Sizes:** ⬜ Mini · ⬜ Standard

### `hermes-herbag` — Hermès Herbag
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Hermès" "Herbag" PM MM --write`
- **TRR search:** `keywords=Hermès+Herbag`  → save to `data/ingest/_raw/hermes-herbag.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts hermes-herbag-pm hermes-herbag-mm`
- **Sizes:** ⬜ PM · ⬜ MM

### `hermes-lindy` — Hermès Lindy
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Hermès" "Lindy" Mini 26 30 34 --write`
- **TRR search:** `keywords=Hermès+Lindy`  → save to `data/ingest/_raw/hermes-lindy.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts hermes-lindy-mini hermes-lindy-26 hermes-lindy-30 hermes-lindy-34`
- **Sizes:** ⬜ Mini · ⬜ 26 · ⬜ 30 · ⬜ 34

### `lv-neonoe` — Louis Vuitton NéoNoé
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Louis Vuitton" "NéoNoé" BB MM --write`
- **TRR search:** `keywords=Louis+Vuitton+NéoNoé`  → save to `data/ingest/_raw/lv-neonoe.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts lv-neonoe-bb lv-neonoe-mm`
- **Sizes:** ⬜ BB · ⬜ MM

### `lv-capucines` — Louis Vuitton Capucines
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Louis Vuitton" "Capucines" Mini BB MM GM East-West --write`
- **TRR search:** `keywords=Louis+Vuitton+Capucines`  → save to `data/ingest/_raw/lv-capucines.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts lv-capucines-mini lv-capucines-bb lv-capucines-mm lv-capucines-gm lv-capucines-east-west`
- **Sizes:** ⬜ Mini · ⬜ BB · ⬜ MM · ⬜ GM · ⬜ East-West

### `lv-onthego` — Louis Vuitton OnTheGo
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Louis Vuitton" "OnTheGo" PM MM GM East-West --write`
- **TRR search:** `keywords=Louis+Vuitton+OnTheGo`  → save to `data/ingest/_raw/lv-onthego.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts lv-onthego-pm lv-onthego-mm lv-onthego-gm lv-onthego-east-west`
- **Sizes:** ⬜ PM · ⬜ MM · ⬜ GM · ⬜ East-West

### `lv-pochette-metis` — Louis Vuitton Pochette Métis
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Louis Vuitton" "Pochette Métis" Standard East-West --write`
- **TRR search:** `keywords=Louis+Vuitton+Pochette+Métis`  → save to `data/ingest/_raw/lv-pochette-metis.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts lv-pochette-metis-standard lv-pochette-metis-east-west`
- **Sizes:** ⬜ Standard · ⬜ East-West

### `lv-twist` — Louis Vuitton Twist
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Louis Vuitton" "Twist" PM MM --write`
- **TRR search:** `keywords=Louis+Vuitton+Twist`  → save to `data/ingest/_raw/lv-twist.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts lv-twist-pm lv-twist-mm`
- **Sizes:** ⬜ PM · ⬜ MM

### `ysl-envelope` — Saint Laurent Cassandre Envelope
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Saint Laurent" "Cassandre Envelope" Small Medium Large --write`
- **TRR search:** `keywords=Saint+Laurent+Cassandre+Envelope`  → save to `data/ingest/_raw/ysl-envelope.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts ysl-envelope-small ysl-envelope-medium ysl-envelope-large`
- **Sizes:** ⬜ Small · ⬜ Medium · ⬜ Large

### `loewe-puzzle` — Loewe Puzzle
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Loewe" "Puzzle" Mini Small Medium Large --write`
- **TRR search:** `keywords=Loewe+Puzzle`  → save to `data/ingest/_raw/loewe-puzzle.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts loewe-puzzle-mini loewe-puzzle-small loewe-puzzle-medium loewe-puzzle-large`
- **Sizes:** ⬜ Mini · ⬜ Small · ⬜ Medium · ⬜ Large

### `chanel-reissue` — Chanel 2.55 Reissue
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Chanel" "2.55 Reissue" 224 225 226 227 Mini --write`
- **TRR search:** `keywords=Chanel+2.55+Reissue`  → save to `data/ingest/_raw/chanel-reissue.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts chanel-reissue-224 chanel-reissue-225 chanel-reissue-226 chanel-reissue-227 chanel-reissue-mini`
- **Sizes:** ⬜ 224 · ⬜ 225 · ⬜ 226 · ⬜ 227 · ⬜ Mini

### `gucci-attache` — Gucci Attache
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Gucci" "Attache" Small Large --write`
- **TRR search:** `keywords=Gucci+Attache`  → save to `data/ingest/_raw/gucci-attache.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts gucci-attache-small gucci-attache-large`
- **Sizes:** ⬜ Small · ⬜ Large

### `hermes-roulis` — Hermès Roulis
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Hermès" "Roulis" Mini 23 --write`
- **TRR search:** `keywords=Hermès+Roulis`  → save to `data/ingest/_raw/hermes-roulis.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts hermes-roulis-mini hermes-roulis-23`
- **Sizes:** ⬜ Mini · ⬜ 23

### `lv-petite-malle` — Louis Vuitton Petite Malle
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Louis Vuitton" "Petite Malle" Standard --write`
- **TRR search:** `keywords=Louis+Vuitton+Petite+Malle`  → save to `data/ingest/_raw/lv-petite-malle.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts lv-petite-malle-standard`
- **Sizes:** ⬜ Standard

### `lv-dauphine` — Louis Vuitton Dauphine
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Louis Vuitton" "Dauphine" Micro Mini MM GM --write`
- **TRR search:** `keywords=Louis+Vuitton+Dauphine`  → save to `data/ingest/_raw/lv-dauphine.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts lv-dauphine-micro lv-dauphine-mini lv-dauphine-mm lv-dauphine-gm`
- **Sizes:** ⬜ Micro · ⬜ Mini · ⬜ MM · ⬜ GM

### `hermes-jypsiere` — Hermès Jypsière
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Hermès" "Jypsière" Mini 28 31 34 --write`
- **TRR search:** `keywords=Hermès+Jypsière`  → save to `data/ingest/_raw/hermes-jypsiere.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts hermes-jypsiere-mini hermes-jypsiere-28 hermes-jypsiere-31 hermes-jypsiere-34`
- **Sizes:** ⬜ Mini · ⬜ 28 · ⬜ 31 · ⬜ 34

### `gucci-bamboo-1947` — Gucci Bamboo 1947
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Gucci" "Bamboo 1947" Mini Small Medium Large --write`
- **TRR search:** `keywords=Gucci+Bamboo+1947`  → save to `data/ingest/_raw/gucci-bamboo-1947.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts gucci-bamboo-1947-mini gucci-bamboo-1947-small gucci-bamboo-1947-medium gucci-bamboo-1947-large`
- **Sizes:** ⬜ Mini · ⬜ Small · ⬜ Medium · ⬜ Large

### `gucci-soho-disco` — Gucci Soho Disco
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Gucci" "Soho Disco" Mini Small --write`
- **TRR search:** `keywords=Gucci+Soho+Disco`  → save to `data/ingest/_raw/gucci-soho-disco.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts gucci-soho-disco-mini gucci-soho-disco-small`
- **Sizes:** ⬜ Mini · ⬜ Small

### `hermes-bolide` — Hermès Bolide
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Hermès" "Bolide" Mini 25 27 31 35 --write`
- **TRR search:** `keywords=Hermès+Bolide`  → save to `data/ingest/_raw/hermes-bolide.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts hermes-bolide-mini hermes-bolide-25 hermes-bolide-27 hermes-bolide-31 hermes-bolide-35`
- **Sizes:** ⬜ Mini · ⬜ 25 · ⬜ 27 · ⬜ 31 · ⬜ 35

### `lv-coussin` — Louis Vuitton Coussin
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Louis Vuitton" "Coussin" BB MM PM --write`
- **TRR search:** `keywords=Louis+Vuitton+Coussin`  → save to `data/ingest/_raw/lv-coussin.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts lv-coussin-bb lv-coussin-mm lv-coussin-pm`
- **Sizes:** ⬜ BB · ⬜ MM · ⬜ PM

### `gucci-diana` — Gucci Diana
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Gucci" "Diana" Mini Small Medium Maxi --write`
- **TRR search:** `keywords=Gucci+Diana`  → save to `data/ingest/_raw/gucci-diana.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts gucci-diana-mini gucci-diana-small gucci-diana-medium gucci-diana-maxi`
- **Sizes:** ⬜ Mini · ⬜ Small · ⬜ Medium · ⬜ Maxi

### `gucci-blondie` — Gucci Blondie
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Gucci" "Blondie" Mini Small Medium Large --write`
- **TRR search:** `keywords=Gucci+Blondie`  → save to `data/ingest/_raw/gucci-blondie.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts gucci-blondie-mini gucci-blondie-small gucci-blondie-medium gucci-blondie-large`
- **Sizes:** ⬜ Mini · ⬜ Small · ⬜ Medium · ⬜ Large

### `chanel-deauville` — Chanel Deauville
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Chanel" "Deauville" Mini Small Medium Large --write`
- **TRR search:** `keywords=Chanel+Deauville`  → save to `data/ingest/_raw/chanel-deauville.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts chanel-deauville-mini chanel-deauville-small chanel-deauville-medium chanel-deauville-large`
- **Sizes:** ⬜ Mini · ⬜ Small · ⬜ Medium · ⬜ Large

### `chanel-vanity` — Chanel Vanity Case
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Chanel" "Vanity Case" Mini Small Medium Large --write`
- **TRR search:** `keywords=Chanel+Vanity+Case`  → save to `data/ingest/_raw/chanel-vanity.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts chanel-vanity-mini chanel-vanity-small chanel-vanity-medium chanel-vanity-large`
- **Sizes:** ⬜ Mini · ⬜ Small · ⬜ Medium · ⬜ Large

### `hermes-picotin` — Hermès Picotin Lock
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Hermès" "Picotin Lock" 18 22 26 Micro --write`
- **TRR search:** `keywords=Hermès+Picotin+Lock`  → save to `data/ingest/_raw/hermes-picotin.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts hermes-picotin-18 hermes-picotin-22 hermes-picotin-26 hermes-picotin-micro`
- **Sizes:** ⬜ 18 · ⬜ 22 · ⬜ 26 · ⬜ Micro

### `lv-keepall` — Louis Vuitton Keepall
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Louis Vuitton" "Keepall" 25 45 50 55 60 --write`
- **TRR search:** `keywords=Louis+Vuitton+Keepall`  → save to `data/ingest/_raw/lv-keepall.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts lv-keepall-25 lv-keepall-45 lv-keepall-50 lv-keepall-55 lv-keepall-60`
- **Sizes:** ⬜ 25 · ⬜ 45 · ⬜ 50 · ⬜ 55 · ⬜ 60

### `hermes-evelyne` — Hermès Evelyne
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Hermès" "Evelyne" TPM PM GM --write`
- **TRR search:** `keywords=Hermès+Evelyne`  → save to `data/ingest/_raw/hermes-evelyne.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts hermes-evelyne-tpm hermes-evelyne-pm hermes-evelyne-gm`
- **Sizes:** ⬜ TPM · ⬜ PM · ⬜ GM

### `coach-models` — Coach Tabby + Coach Pillow Tabby + Coach Rogue + Coach Brooklyn + Coach Willow
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Coach" "Tabby" 12 20 26 Standard --write`
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Coach" "Pillow Tabby" 18 26 Standard --write`
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Coach" "Rogue" 17 25 30 39 Standard --write`
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Coach" "Brooklyn" 28 39 Standard --write`
- **Scaffold:** `npx tsx supabase/seed/scaffold-variants.ts "Coach" "Willow" Small Standard --write`
- **TRR search:** `keywords=Coach`  → save to `data/ingest/_raw/coach-models.json`
- **Adapt:** `npx tsx supabase/ingest/sources/trr-jsonld.ts coach-tabby-12 coach-tabby-20 coach-tabby-26 coach-tabby-standard coach-pillow-tabby-18 coach-pillow-tabby-26 coach-pillow-tabby-standard coach-rogue-17 coach-rogue-25 coach-rogue-30 coach-rogue-39 coach-rogue-standard coach-brooklyn-28 coach-brooklyn-39 coach-brooklyn-standard coach-willow-small coach-willow-standard`
- **Sizes:** ⬜ 12 · ⬜ 20 · ⬜ 26 · ⬜ Standard · ⬜ 18 · ⬜ 26 · ⬜ Standard · ⬜ 17 · ⬜ 25 · ⬜ 30 · ⬜ 39 · ⬜ Standard · ⬜ 28 · ⬜ 39 · ⬜ Standard · ⬜ Small · ⬜ Standard

