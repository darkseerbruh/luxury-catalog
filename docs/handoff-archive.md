# Luxury Catalog — Handoff ARCHIVE (historical session recaps)

## TL;DR — SLG-vs-bag taxonomy sweep: 13 mis-catalogued SLGs retired + Multi-Pochette hyphen bug fixed (2026-07-11, on `main`)

**Follow-up to the two Chanel SLG retires (styles 171/141). A full `style`-table scan flagged 20 more bag-catalogued styles reading as SLGs; owner made the taxonomy call on each.** All green (827 tests), landed (commit `d51e77c`, merge `631fa35`).
- 🗑️ **Retired 13 confirmed SLGs** via `supabase/ingest/retire-slg-styles-2026-07-11.ts` (batch sibling of `retire-nonbag-styles.ts`, multi-brand `brand_guess` per style): LV wallets 180/183/177, LV Toiletry 694 / Cosmetic 688, Chanel Cosmetic Case 744, Goyard Vendôme 763 / Jouvence 764, LV Daily 905, SL Bill 929, Dior Caro Pouch 888, SL Uptown 932 / Gaby 933. **308 price observations preserved to `discovered_listing` (unresolved_reason='non_bag') before deletion — fully reversible.** 16 variants + 13 styles deleted, MV refreshed (timed out once under load, retried ok).
- ✅ **Kept as bags (owner call):** 47/46/536/690 Pochette Accessoires, **59 Multi Pochette** (rescued by the fix below), **887 Dior Saddle Chain Pouch** (chain-carried), **950 Loewe Scarf Bag** (a real bag; `scarf` false positive). Two brief corrections: 46 is a *single* Multicolore pouch (not the Multi Pochette); only 59 was the bag to rescue.
- 🐛 **Multi-Pochette hyphen bug fixed** (`src/lib/ingest/model-normalize.ts`): the `BAG_OVERRIDES` check was a literal substring match, so a hyphenated "Multi-Pochette" escaped the spaced "multi pochette" override → `isNonBagAccessory` wrongly SLG-gated the ranked LV bag and the deals/listings read guards dropped its listings. New `hasBagOverride()` normalizes separators (hyphen/dot/slash → space) on both sides; all 3 call sites route through it. Regression test added (hyphenated Multi-Pochette = bag vs single Multicolore Pochette = SLG).
- 🧭 **Taxonomy rule logged** to `preferences.md` (scope section): judge each "pouch", never blanket-drop on the word.
- ⬜ **YOUR TURN:** new code goes live on next prod build (auto if Vercel auto-deploys `main`, else `vercel --prod`). Nothing else pending — retirement + fix are done and verified.

---

## TL;DR — Chanel flap-lines module + shop index + the 4 parked flap-followups closed (2026-07-11, on `main`)

**Off "go" then "all": worked the four parked flap/shop threads to done.** All green (824 tests), landed each step.
- 🧭 **Cross-line "four Chanel flap lines" module** (`FlapLines` + `flap-lines.ts`): on the Classic Flap, 2.55 Reissue, Boy, and Wallet on Chain pages (keyed by `style_family`, so it also fires on the mini pages under the Classic Flap line). Each line shows its tell (closure + structure), a "pick this if", intro year, and a representative median. Reissue/Boy are single-model size-runs so the sibling-family module can't render for them; this line-level module is the fix. Tells + years **archivist-sourced** (cited per line); WOC year held null. **Taxonomy locked:** a WOC is a bag and gets its own line; a fold wallet is an SLG and stays out (curated map, future lines = one-line add).
- ⚡ **Precomputed shop index** (`listings.ts`): the ~120k-row → ~1.6k-group grouping is filter-independent, now memoized once per rows-cache generation (was re-grouped every request). Output identical; warm call 82ms. Durable next step (DB summary table + cron so cold instances skip the ~20s read) needs a migration → owner-gated.
- 🔎 **"Missing sizes" thread = mostly a non-issue** (`docs/size-normalization-audit.md`, read-only): the "~3,400" premise doesn't hold. 72/981 styles bake size into the name but only **2** null-size variants have comps; the sole comp-bearing un-normalized clusters are Hermès Jypsière (274) + YSL Cassandre Envelope (217). Clusters mix distinct sub-models (Birkin vs Birkin Touch, Kelly vs Kelly Pochette), so normalization stays a reviewed per-family split, owner-gated.
- 🎨 **Color Phase 2 scoped** (`docs/color-phase2-plan.md`): color data is clean (91% of listings have a colorway, ~38 families) and the selector auto-derives a color axis, so the UI is near-free. The work is a mass (style,size,color) variant expansion + re-point + index migration → owner-gated; doc has the rollup steps + a one-style pilot.
- ✅ **Size-label A/B = settled:** format **B** ("Jumbo (Large) · 30 cm") is shipped AND locked in `preferences.md`; no change.
- ⬜ **YOUR TURN:** (1) new code goes live on next prod build (auto if Vercel auto-deploys `main`, else `vercel --prod`). (2) To advance color/normalization: greenlight a one-family pilot and I'll build the dry-run + hand you the migration. (3) Flag the two mislabeled Chanel SLGs (style 171 Boy Wallet, 141 coin purse) — spawned as a separate task.

---

## TL;DR — Brands UX overhaul + brand ranking + house→brand sweep + brand data fill (2026-07-11, on `main`)

**Homepage brands module and `/brands` reworked, brand ranking is now a real surface, "house"→"brand" swept, every brand's origin + founding year filled.** All green (824 tests), landed each step.
- 🏠 **Homepage brands module = breadth flex** (was a full duplicate of `/brands`, many screens of scroll): every brand as a NAME only, tier-grouped, ~one screen (669px), "All brands, sortable →" to `/brands`. (`src/app/page.tsx`)
- 🗂️ **`/brands` = sortable directory** with a client view switcher: **A–Z (default)** · Ranking · Tier · Origin · Heritage (`src/app/brands/BrandsExplorer.tsx`); `?view=` deep-links a view. Origin/Heritage use new `country_of_origin`/`founded_year` on `getBrandsOverview`.
- 🏆 **Brand ranking 1→N is NEW** (`getHouseStandings` in `queries.ts`): the House Standing 0–100 score computed live on the read path (it was discarded after tier-bucketing), same pure formula (`house-standing.ts`). Shown on `/brands` Ranking view + a **companion board on `/rankings`** (top 10, bags stay hero) with its own ItemList JSON-LD (GEO). 38 of 49 brands placed; n<30 stay "Not yet ranked."
- ✍️ **"house" → "brand" default:** swept ~55 incidental UI strings across 24 files + BagDNA "House"→"Brand" node + "House founded"→"Brand founded". KEPT: **House Standing** (feature name) + editorial `house-stories`/`bag-stories` voice (owner call). Pref (voice section) + memory logged.
- 🌍 **Data fill:** all 49 brands now carry `country_of_origin` + `founded_year` (archivist-sourced, 35 filled this pass, 0 missing). Convention: commonly-attributed house nationality, not strict founding country.
- ⬜ **YOUR TURN:** (1) all code is on `main` → next prod build ships it (auto if Vercel auto-deploys `main`, else `vercel --prod`); the data fill shows after the catalog cache refreshes. (2) OPEN: Balenciaga `country_of_origin` is **France** (house convention); flip to **Spain** (1919 founding country) if you prefer — a one-field DB edit.

---

## TL;DR — Deals integrity + Chanel flap taxonomy + family module + shop UX (2026-07-11, on `main`)

**Long session off the owner's "the deals module is showing garbage" report. All landed, green each time, verified live.**
- 🎯 **Deals grade LIKE-FOR-LIKE now (spec-coherent):** a listing is graded only against comps sharing its **size + material family + single/double structure**, needing ≥5 or the deal is skipped (a "$2,715 Small Classic Flap 68% under" was a Mini Rectangular single flap vs double-flap comps). Card shows **"% below median", not the chart** (owner: chart = noise). Foreign items (accessory / wrong-model / size-mismatch) dropped via shared `classifyListingAttachment`; card shows the real descriptor (`listingQualifier`: "· Micro Mini", "· Clutch"). Code: `deals.ts`, `deal-descriptor.ts`, `listings.ts`.
- 🧹 **Data cleanup (reversible, dry-run-first scripts):** ~105 accessories re-pointed off bag variants (`detect-listing-discrepancies.ts`), ~13.8k rows re-pointed to their correct-size variant (`resize-variants.ts`), ingest guards added in `load-prices.ts` (accessory + size coherence), + data-health sentinels `scoreMisattachment` / `scoreSizeMismatch`. Migration `0053` (`price_history.item_class`) written, **human-gated (owner applies)**.
- 🏗️ **Chanel Classic Flap SPLIT into house-accurate styles** (`split-chanel-flaps.ts`): Classic Flap = doubles only (Small/Medium/Jumbo/Maxi); new styles **Mini Rectangular Flap #1284, Mini Square Flap #1285, Micro Mini Flap #1286, East-West Flap #1287** (disc 2010); Large→Jumbo, plain "Mini" split by title; `style_family='Chanel Flap'`.
- 🧭 **Bag-page family module** (`FlapFamily`): siblings + single/double + status + median+n + "pick this if" + collapsed "why the names confuse everyone". **Size chips carry cm + alias** ("Jumbo (Large) · 30 cm") via `measuredSizeLabel`.
- 📝 **Decoder article #39 PUBLISHED** `chanel-flap-names-decoded`, era-honest. Sourced verdict: the "dated shift" is Chanel's **2024-03-26** relabel of the Medium to "Classic 11.12 Handbag" (dropped "Medium"); the size-word mismatch is gradual drift; **style code A01112 is the reliable anchor**. Minis/East-West are technically seasonal, not true Classic Flaps.
- 🛒 **/shop fixes:** Add-a-photo/Compare overlap; always-visible rail scrollbar (`.shop-scroll`); loading spinner on filter/sort (`useTransition`); **deterministic complete grid** (was silently 1000-row-capped → flaky 0/3/4/6 counts; now in-memory stale-while-revalidate full read).
- 💡 **6 flap content ideas banked** in Notion Content Pipeline hopper (Spark), incl. the size-decoder GEO article. Nothing published.
- ⬜ **YOUR TURN:** (1) new code (family module, cm labels, taxonomy split, shop reads) goes live on next prod build (auto if Vercel auto-deploys `main`, else `vercel --prod`). (2) Optional: apply migration `0053` via GitHub Actions → then `detect-listing-discrepancies.ts --tag`. (3) Publish/film the hopper content when ready. (4) Format tweak available: size labels shipped as "Jumbo (Large) · 30 cm" (B), not your "Large/Jumbo (30cm)" (A) — one-line switch. (5) Parked: color as its own variant/URL (Phase 2), the ~3,400 missing-size variants, precomputed shop index, family pattern for Reissue/Boy.

---

## TL;DR — Where to Sell system SHIPPED end-to-end + venue-terms refresh engine (2026-07-11, on `main`)

**Full sell-side surface + a never-stale refresh engine for the fee data.** Sister to `/where-to-buy`, seller economics instead of buyer protection. All green (824 tests), verified live.
- 🏷️ **Hub + profiles:** `/where-to-sell` + `/where-to-sell/[slug]` for 9 venues by sell model — sells-for-you (Fashionphile, TRR, Rebag, TLC) · marketplace (eBay, Vestiaire, Poshmark, Mercari) · p2p (Facebook). Nav + sitemap + FAQ/ItemList JSON-LD + two-way cross-links with where-to-buy. Spec `docs/ux/where-to-sell-spec.md`.
- ⚡ **Net-payout estimator (the signature):** `estimateNet` in `src/lib/where-to-sell.ts` (band/marginal/flat shapes; TLC's flat $30 + eBay's marginal fee handled). Two entry paths: **search your bag** (reuses `BagFinder` → `getStyleResaleEstimate`, value = median of REALIZED prices: fixed-price listed counts as the sale price, eBay uses its sold rows, deduped by listing_ref) OR **type a value**. Matrix "what they take" shows the cut taken (e.g. "They take ~30%").
- 🔗 **Every sell surface routes into the estimator:** bag page (deep-linked `?bag=<styleId>`), identify result, thrift-find, closet, brand page, article CTA. Outbound buyout/consign links kept as honest utility.
- 💸 **NO sell-side affiliate revenue (owner-confirmed 2026-07-11):** resellers don't pay for referring sellers. Plumbing kept dormant + self-activating (`sellLinksAffiliated` in affiliate.ts); disclosures gated on it so we never claim commission we don't earn. Sell = engagement/GEO, not revenue.
- 📝 **Companion article DRAFT #40** `what-every-resale-site-actually-pays-you` (owner publishes). Hard numbers, dated, `[diagram: where-to-sell-tradeoff]` + `[diagram: where-to-sell-estimator-cta]`.
- 🔄 **Venue-terms refresh engine (NEW, owner-directed):** seller fees + buyer protections are HARD dated facts, kept fresh monthly. `venue-terms-freshness.ts` (pure backbone, flags cells past a 30-day cadence) + `scripts/venue-terms-refresh.ts` (report) + `.github/workflows/venue-terms-refresh.yml` (monthly report + `venue-terms` issue) + scheduled agent `venue-terms-refresh-monthly` (re-verifies pages → PR she merges, never auto-merges a figure). Standard `docs/venue-terms-refresh.md`; in `automation-map.md`.
- 📐 **Fee-copy rule reversed:** hard fees stated exact + dated, never softened (pref line updated; the old "don't publish perishable fees" stance is retired).
- ⬜ **YOUR TURN:** (1) review + publish article #40 at `/articles/what-every-resale-site-actually-pays-you` (shows a "Draft, only you can see this" banner). (2) Click **Run now** on `venue-terms-refresh-monthly` in the Scheduled sidebar to pre-approve its web/gh tools before Aug 1. (3) Merge its monthly PR when it opens. (4) Routes go live on the next prod build (auto if Vercel auto-deploys `main`, else `vercel --prod`). (5) Optional: the paired social post (needs Metricool authorized + the social agent).

---

## TL;DR — Data health routine SHIPPED + first live run (2026-07-10, on `main`, workflow proven)

**New standing engine: a daily data-health scorecard now watches the whole data layer.** Owner-locked: daily → graduates to weekly after 7 straight greens (red demotes back), report + deduped GitHub issue on red, findings feed the worklist, safe auto-fixes only.
- 🩺 **What it checks:** per-source freshness vs each cron's own promise, capture sanity (0-row day = red), LC-Index ranking-floor count, attribute-coverage deltas (condition/region/year/hardware/descriptions/images — delta-scored, drops flag, levels don't), discovered-backlog growth, contamination sentinels (TRR non-bag leak-back via `isTrrHandbagListing` + same-day dupes), summary-matview staleness (the ONLY auto-fix), and an owner-requested **cadence audit** (30-day listing lifetimes vs configured refresh interval; recommendations are estimates, cron changes stay yours).
- 🔧 **Pieces:** `src/lib/data-health-core.ts` (pure, 37 tests) + `scripts/data-health.ts` (`npm run health:check`, `--write`) + `.github/workflows/data-health.yml` (10:47 UTC daily + manual). Registered in `automation-map.md`; findings section lives between markers at the end of `data-content-worklist.md`.
- ✅ **Proven live:** dispatch run succeeded end-to-end; report + state committed (`5a25e8d`). First score: **YELLOW** — (1) no `lc_index_snapshot` exists yet, (2) 7 TRR non-bag leak-backs last week, (3) ~26 same-day duplicate rows. 311 styles clear the ranking floor. Cadence audit: TRR/FP cadences look right; TLC churns same-day (accepted loss at the daily floor).
- ✅ **Snapshot yellow root-caused (correction, same day): CRON_SECRET is NOT missing** — verified set in Vercel prod (20 days old, `vercel env ls`). The snapshot cron (`0 7 1 * *`) simply hasn't had its first firing since the route shipped ~07-08; it auto-runs Aug 1 and the yellow self-clears. Optional early backfill (captures July so movement pills start Aug instead of Sep): any session with the secret curls `/api/cron/lc-index-snapshot` with `Authorization: Bearer $CRON_SECRET` (idempotent upsert). Pulling the secret needs an interactive session (`vercel env pull` dumps the whole prod env; auto-mode blocks it).
- ⬜ **YOUR TURN (optional):** if you want July's Index baseline now rather than Aug 1, run the backfill curl above from an interactive chat, or just wait. The two data yellows (TRR leak-back, same-day dupes) are queued in the worklist for any working session.

---

## TL;DR — McQueen catalog cleanup + Jacquemus coverage + LV Alma article PUBLISHED (2026-07-10, on `main`)

**Catalog-integrity + content lane. All landed, green gate each time.**
- 🧹 **Alexander McQueen 17 → 11 real styles.** (a) DEDUP: merged 5 short-name duplicate style rows into their 4 real bags (`merge-mcqueen-dups.ts`, explicit **name-guarded** pairs, dry-run first; 10 ph rows re-pointed) — Knuckle/Knuckle Clutch→The Knuckle, Peak→The Peak, The Bow→The Bow Tote, De Manta→Manta. (b) RE-TRIAGE: split the Skull `#600` catch-all (`retriage-mcqueen-skull.ts`, row-level) — moved 25 rows to their real models (11 Padlock, 10 Skull Chain, 4 Skull Box Clutch), deleted 4 non-bags mis-ingested onto a bag style (tank top, phone cover, 2 slippers), left 13 generic skull-motif bags on `#600`, deleted empty dup `#879`. **Technique note:** `merge-style-dupes.ts` only auto-merges VERBOSE junk names (≥4 words); SHORT near-synonym dups need a hand-rolled name-guarded pair list like these two scripts.
- 📊 **/data house-pricing coverage:** verified 5 of 8 thin houses now MEET the ≥20-priced-variant bar (The Row 47, Goyard 50, Valentino 32, **Jacquemus wired 14→20** via 6 existing-but-untargeted styles). Off-White/Telfar are micro-catalog (bar unreachable, honest scoping stays). **Miu Miu is thin/micro too** — after the FP data cleanup (below) it sits at **12 CLEAN priced variants** (the earlier "20" was inflated by ∅/Standard/size twins now folded); integrity, not coverage, and honest "bags we track" scoping applies.
- 🧹 **Miu Miu FP data cleanup DONE 2026-07-10** (`cleanup-miu-miu-fp-variants.ts`, dry-run-first, reviewed, idempotent; on `main` `c03386c`). DB-only follow-up to the FP size-bug fix — cleaned rows the code fix couldn't touch. **111 rows re-pointed** same-style to the sized variant the fixed adapter now targets (Wander→Mini/Small, Aventure→Regular/Medium, Arcadie→single Large), **6 dup scaffold-gen variants folded + deleted** (Aventure Mini, Arcadie Small, Ivy/Beau/Coffer ∅-twins), **Matelassé mislabels** re-pointed by explicit reviewed token (7 coffer→Coffer, 3 bucket→Bucket, 2 sandals deleted as footwear, 7 pouches→discovered_listing, 1 eBay "Arcadie Matelassé" sold→Arcadie). Variant list now clean, no twins. Worklist "(b)" ✅. **Gotcha logged:** `listing_ref` format drifts across capture generations (full-slug vs numeric SKU for the same listing) — a listing_ref-keyed dedup won't collapse them across generations.
- 📝 **LV Alma value article PUBLISHED** (owner said "just post it") — post **#38** `louis-vuitton-alma-what-its-worth`, `status=published`, topic→Alma(434). Copywriter-drafted (voice canon), data bar deduped by listing_ref (BB $1,565/n197, PM $895/n179, GM $1,033, MM $928, Nano $1,695, Mini $1,381), framed asking-not-sold + estimate-not-appraisal. Also fixed the Alma page depth (real description + year 1934) and wired `AlmaSizeChart` (`[diagram: alma-size-chart]`). Draft archived `docs/research-drafts/lv-alma-value-draft.md`.
- ⬜ **YOUR TURN:** (a) the Alma **chart is new code** — it surfaces on the next prod build (auto if Vercel auto-deploys `main`, else a `vercel --prod` promote is yours); the article body is already live (`force-dynamic`). (b) Optional: the Alma **"Mini" size** (n=130) is a market label, not an official LV size — edit on-site to fold/drop if you want (DB body is canon now). (c) Two background tasks I spun off finished: apparel-ingest filter (landed) and FP size-bug (landed, Miu Miu→20).

---

## TL;DR — Mid-tier DEALS blocker cleared + eBay coverage extended (2026-07-10, on `main`)

**The eBay realized-comp coverage widened, and the colour+material blocker that kept mid-tier bags off the deals surface is now solved with data (no new spend on the metered Firecrawl item-page scrape).**
- 💰 **eBay coverage extended:** 2nd auction pull (premium: Chloé/Valentino/Givenchy/Burberry/The Row/Miu Miu/McQueen/MJ/Jacquemus… → 233 onto pages) + 3rd (mid-tier: Coach/Kate Spade/Longchamp/MK/Tory Burch, floor $25 → 145 onto pages). `ebay-sold-apify.ts` gained a JUNK/replica filter. eBay 2,876 → **3,918 rows**; multi-source styles 569 → **611**.
- 🎨 **Deals-basis unlock (the U-DEALS-MIDTIER ask):** `isConfidentBasis` needs comps with material+colour. Backfilled them from eBay TITLES via `enrich-specs.ts --platform=eBay` (Haiku, guardrailed "only what's stated", **non-null-only writes so structured values are never wiped**). eBay colorway 3 → 689, material → 1,149; **290 mid-tier LIVE listings now deals-ready** (Coach 188, KS 35, Longchamp 27, MK 35, TB 5). Naive regex title-colour parsing was deliberately NOT used (repo's own "wrong backfill is worse than null" rule).
- ✅ **eBay-live mid-tier refresh WIRED (owner said "wire it" 2026-07-10, proven green in CI):** `.github/workflows/ebay-midtier-refresh.yml` (weekly Mon 05:11 UTC) → `apify-ebay-refresh.ts` (Apify `memo23/ebay-search-scraper-ppe`, mode=active — eBay blocks active scraping harder than sold, this actor gets past it) → `ebay-sold-apify.ts --live` (new mode, price_type listed, $25 floor) → load → best-effort colour/material enrich → `reconcile:sold --platform=eBay --age-days=21` (AGE-based, aborts on zero-in-window) → summary. Cost bounded to ~$0.90/run (~$3.60/mo) via Apify `?maxItems=` (the actor's own `maxResults` is NOT a hard cap). Proving CI run: 4,051 live obs loaded, 1,682 mapped, 0 falsely retired. ⚠️ That proving run cost **~$15** (hit the maxResults bug before the maxItems fix landed) — one-time, now capped.

---

## TL;DR — Fashionphile adapter size-bucketing fixed (Miu Miu → 20 priced variants) (2026-07-10, on `main`)

**Two code-only FP-adapter bugs that mis-sized/mis-styled multi-size bags — fixed with regression tests; DB-row cleanup spun off to its own session.**
- 🎯 **Most-specific target match** (`sources/fashionphile.ts` new exported `selectTarget()`): matching went from `Array.find` (FIRST match) to most-specific (total require-token length). A size-less inline generic (Miu Miu `Wander` `["wander"]`, `Aventure` `["aventure"]`) sat before the appended sweep-targets and collapsed every sized handle onto one "Standard" bucket. Now `small-wander` beats `wander`. General across all brands; other multi-size styles were already size-anchored so unaffected. **Miu Miu reached 20 priced variants.**
- 🧵 **Matelassé target tightened**: `"matelasse"` is a MATERIAL token, so the Matelassé STYLE target was swallowing matelassé Coffer/Bucket (other styles), sandals (non-bag), pouches (SLG). Added excludes coffer/bucket/softy/beau/ivy/sandal/pouch → live dump 16→10 rows, all genuine bags.
- ✅ Regression tests `src/lib/__tests__/fashionphile-select-target.test.ts` (22 cases inc. Hermès/LV spot-checks); green gate 757 tests. Commits `b2f6f83`, `3aeceb8` (+ worklist `e922cc4`).
- ⬜ **YOUR TURN:** none. A **chip is running in its own session** for the DB-only follow-up (stranded Wander/Aventure/Arcadie Standard rows + duplicate ∅/Standard/size variants + existing Matelassé-mislabeled rows) — SAME-STYLE-ONLY re-point/dedup, reviewed. McQueen Skull #600 re-triage was handled by a parallel chat (stood down to avoid collision).

---

## TL;DR — TRR PROMOTED non-bag contamination cleaned: 48 price rows off 15 bag variants (2026-07-10, on `main`)

**The mis-map sweeps re-triaged wrong TITLES on a style; this clears the other class — apparel/accessories that shared a model token with a real bag and got PROMOTED onto its variant, writing cheap asking prices into `price_history` and deflating the bag's comps.**
- 🧹 **New `supabase/ingest/cleanup-trr-promoted-nonbag.ts`** (sibling to `cleanup-trr-nonbag.ts`, which only purges *unpromoted* non-bags and left the promoted ones "for review"). Deletes non-bag TRR price rows by URL department + un-promotes the source `discovered_listing` rows; preserves any orphan (no discovered backup) first. **Removed 48 rows across 15 variants** (Celine Triomphe 20, Hermès Constance 6, Gucci Sylvie 3-of-5…); false floors lifted (Hermès Bolide Mini resale-low $409→$4,631; Constance-18 $1,795→$2,677).
- ⚠️ **Gotcha now in code + memory:** `isTrrHandbagListing(url, title)` MUST be called WITH the title — carried pouches the catalog ranks (WOC / vanity / belt bag) live under `/accessories/` but ARE bags. A title-blind first pass over-deleted 3 legit vanity pouches (Chanel Vanity Case, Celine Macadam); all 3 restored. See `trr_nonbag_dept_sweep` memory.
- 🤝 **Reconciled with a parallel chat** that landed the canonical title-aware `isTrrHandbagListing` + its sibling script mid-session — adopted their helper, kept my promoted-contamination pass as the complement. Green gate: tsc, eslint, 735 tests, next build.
- ⬜ **YOUR TURN:** none. Re-run is idempotent (reports 0). Note the sibling script *deletes* unpromoted apparel from `discovered_listing` (the other lane's call) rather than archiving it — flag me if you'd rather keep that raw data.

---

## TL;DR — Apify-vs-Firecrawl cost review + priority-reseller runbook; reconciled with the cloud-Apify capture that landed the same day (2026-07-10, on `main`, merge `b759e9d`)

**She hit the Apify usage cap and asked: buy Scale or add limits? Answer: raise the Starter cap, don't buy Scale — which she'd ALREADY done (paid Starter + cap raised; see the capture TL;DR below).** Mid-session a parallel chat landed the cloud-Apify capture engine, so my earlier "Apify isn't wired in" framing went stale; corrected here + in the runbook.
- ✅ **Ground truth (per the capture TL;DR below):** TheRealReal + eBay-sold run on **cloud Apify actors** (`trr-apify.ts` + `trr-refresh.yml` 2-day cron; `ebay-sold-apify.ts`, auction-only so best-offer masking can't occur). Apify IS the daily engine for those two; free Shopify feeds (Fashionphile) + Firecrawl carry the rest; **"sold" for consignment resellers is derived** (`reconcile-sold.ts`), not scraped.
- 💳 **Billing call (stands):** on an Apify spike, raise the Starter cap + diagnose the burn (Insights); don't jump to Scale ($199/mo) unless sustained ~$180+/mo. Her ~$60/mo standing TRR refresh sits well inside Starter.
- 📓 **New blueprint:** `docs/priority-reseller-capture-runbook.md` — per-source routing map + cost per lane, CORRECTED to match the cloud-Apify reality (Apify = TRR + eBay-sold engine; free feeds + Firecrawl for the rest).
- 🛠️ **Firecrawl eBay `--sold` FALLBACK built** (`firecrawl-ebay.ts --sold`, dispatch-only): a manual backup for when Apify is capped. **Secondary to `ebay-sold-apify.ts`**, which is cleaner (auction-only = no masking). Weekly schedule dropped to avoid a redundant Firecrawl credit burn.
- 🟢 **FREE-SOURCE SPRINT (2026-07-10, all landed + verified):** built 4 new free Shopify feed lanes on the same pattern (crawl → `canonicalModel` named + **discovered-bank the unnamable** via `--discovered-only` → `reconcile:sold` → daily workflow): **Redeluxe** (175/2pg), **Couture USA** (208, +footwear filter + colour tags), **Ann's Fabulous Finds** (156), **myGemma** (364, richest: condition GRADE + write-up; was a *paid* Firecrawl source). Now **6 free lanes** (+ Fashionphile + TLC). Plural-`product_type` regex bug caught + fixed across all. Rejected: ShopWorn (dropship/niche), Yoogi's (empty), Rebag (no open feed → its CJ feed once approved). Canonical: `docs/priority-reseller-capture-runbook.md`.
- 🔁 **Dictionary-gap engine scheduled** (`dictionary-gap-report`, Wed 9am, in `automation-map.md`): weekly ranked "missing models" report from the `discovered_listing` backlog → `docs/dictionary-gap-report.md`; report-only, adding models stays her gate.
- ⬜ **YOUR TURN:** (a) hit **"Run now"** on the `dictionary-gap-report` scheduled task once to pre-approve its tools (then hands-off). (b) Rebag stays gated on its CJ approval; Vestiaire/1stDibs need a Firecrawl budget (your spend call).

---

## TL;DR — Durable multi-source capture + backlog promotion (2026-07-08→10, on `main`)

**Solved the "capture the WHOLE catalogue" directive durably and grew the market surface: dictionary + promotion hardened, TheRealReal + eBay capture moved to cloud Apify actors (bot-block + session-drop proof), catalog now ~994 styles / ~95k price rows / ~569 styles with 2+ sources.**
- 🧠 **Promotion engine:** `model-normalize.ts` dictionary expanded (evidence-verified real models only); `promote-safe.ts --create-new` resolves a cluster to its canonical model and CREATES the clean style when truly new (bag-gated, never forks a raw title) AND lands the comps; `promote-discovered.ts` junk-fork fallback removed. Thousands of banked listings rolled onto pages across passes.
- 🏬 **TheRealReal capture = cloud Apify, not our browser** (TRR kicks the login constantly + the Chrome classifier was flaky). Adapter `sources/trr-apify.ts`. Breadth actor `lulzasaur/therealreal-scraper` (120/category) for the standing 2-day refresh; **depth actor `piotrv1001/…` paginates ~2k/URL**. ~2,400+ handbags captured over the sweeps.
- 💰 **eBay deeper pull DONE:** `automation-lab/ebay-sold-scraper` auction-only + $500 AG floor → **718 realized sold comps, 676 onto pages** (auction finals can't be best-offer masked). New BROAD `sources/ebay-sold-apify.ts` (catch-all) complements the SCOPED `ebay-sold-sweep.ts`.
- 🧹 **Cleanup batch (2026-07-10):** platform names de-split (`TheRealReal`→`The RealReal`, `ebay`→`eBay`); +4 brands (Tumi/Proenza Schouler/Mansur Gavriel/Furla) + models; **migration 0038 applied** (region/condition_detail/enrichment on `discovered_listing` — CI push had a tracking mismatch, applied the DDL directly via the management API + verified).
- 💳 **Apify is now PAID Starter** (owner upgraded + raised the usage limit). Keep it while the `trr-refresh` cron is live; don't downgrade to Free. Standing spend ~$60/mo TRR refresh + small on-demand pulls.
- ⬜ **YOUR TURN (nothing blocking):** optionally widen eBay via Firecrawl Buy-It-Now on your allowance; the ~40k still-banked `discovered_listing` rows keep promoting as the dictionary grows.

---

## TL;DR — Promotion pass off the swept backlog: 11 new styles + 154 comps re-pointed (2026-07-10, on `main`)

**Ran `promote-safe` on the 41k-row discovered backlog after the sweep. Every created style hand-verified against its cluster's titles (pipeline rule: no blind bulk-create).**
- 🆕 **11 new curated styles** (all real, correctly-named bags with sane asking-comp medians): LV Cartouchière ($635/n17), Iéna (PM $1,250 / MM $1,195), Évasion ($795/n14), Alizé ($1,095/n13), Surène (MM $2,095 / BB $1,135), Randonnée (PM $680 / GM $625 / Standard $845), Uzès ($1,095), Vivacité ($1,950), Odyssée ($2,995), Hermès Sac à Dépêches ($4,995/n7), SL Bea ($2,940/n16). 15 variants, 149 asking rows re-pointed into price_history; +5 real jumbo/medium Classic Flap comps into the existing icon style (v873).
- 🔚 **Promotion vein now worked out:** after this, every remaining ≥5-row discovered cluster is non-bag (t-shirts, blazers, sneakers, sunglasses, wallets, belt kits) the SLG/apparel gate correctly refuses to give a bag style — no more clean dictionary-gap promotions here. SL Bea was the last real-bag gap (token broadened "bea tote" → word-bounded "bea").
- 🛠️ **New `--exclude=Brand::Model` veto on `promote-safe`** (mirrors the mismap groups-file): skips clusters the auto-gate resolves wrong. Used it to hold back **Chanel Classic Flap "Mini"** — 6 seasonal *Hollywood Boulevard mini flap w/ star coin purse* novelty rows that `canonicalModel` maps onto the Classic Flap icon (the exact seasonal-on-icon pollution the owner flagged). They stay in discovered for a seasonal-aware pass.
- 📖 **Dictionary: Le Grand Bambino split from Le Bambino** (Grand Chiquito precedent) — matches the catalog, which already had both styles.
- ⚠️ **Size precision caveat:** numbered LV clusters (Cartouchière 22/26/17) bucketed to one "Standard" variant because the size token wasn't parsed — style is right, size mixed; fine for now, a size-parse pass would split them.
- ⬜ **YOUR TURN / next:** (a) the 10 new pages are BARE (name + comps only) — they join the PAGE-DEPTH queue in `docs/data-content-worklist.md` (sourced descriptions + intro years via the archivist); (b) Jacquemus discovered rows are messy (raw-title `style_guess`, one style_guess = "unmatched-model") — a normalization pass would promote the Bambino/Grand-Bambino colorways properly.

---

## TL;DR — Page-depth: 74 sourced style descriptions + migration 0038 (2026-07-10, on `main`, applied to prod)

**The 229 styles promoted 2026-07-09/10 landed name-only (descriptions had dropped to 30%). Backfilled the real-traffic set with SOURCED depth, no fabrication.** Method is now durable: `page_depth_method` memory + `docs/data-content-worklist.md` PAGE-DEPTH section.
- 📝 **74 style descriptions + 14 debut years live on prod** across 3 archivist batches covering the ENTIRE ≥20-comp set (every new style with real traffic). Coverage 30% → **37%**, years 8 → **22**. Every fact archivist-sourced + spot-checked; unsourced years held null (Marc Jacobs Tote ~2020, Chelsea "1998", Brea ~2010 stay in prose, not the field — new factuality rule #8).
- 🛠️ **New tooling:** `supabase/ingest/apply-style-depth.ts` (review-gated: writes only spot-checked JSON drafts, never generates prose). Drafts archived at `supabase/ingest/data/style-depth-batch{1,2,3}.json`. Detail page renders description as PLAIN TEXT, so bold stripped + accents kept.
- 🗂️ **Catalog-integrity find:** the ingest tokenizer created CATEGORY/MOTIF "styles" that aren't single models. Review list at `docs/style-bucket-audit.md`: strongest calls = fold the 3 overlapping Gucci GG-Supreme entries (Neo Vintage / Emblem / Retro Interlocking G) + **remove "Chanel Uniform" (1056)** — it's the staff-uniform program, not a retail bag. NO auto-merges (style dups need spot-check).
- 🗄️ **Migration 0038 APPLIED** (owner-triggered the Action; verified `region`/`condition_detail`/`enrichment` columns now exist on `discovered_listing`). Future promotions carry region + condition detail instead of dropping them.
- ⬜ **YOUR TURN:** (a) optional — review `docs/style-bucket-audit.md` and say whether to merge the Gucci GG-Supreme trio + remove Chanel Uniform (one script run once you decide). (b) The thin tail (~76 new styles < 10 comps) is DEFERRED by design — same method (archivist → apply-style-depth.ts) if you ever want them.

---

## TL;DR — Unified market surface + UX fixes SHIPPED (2026-07-10, on `main`, deploying)

**The `/shop` page is now one surface: search + browse + everything-for-sale + deals compose.** Grew out of the owner's nav-legibility question (Fragrantica screenshot) → "put it all in one place, done well." Spec: `docs/ux/unified-market-spec.md`. Two mockup artifacts drove the design (menu-options, then the unified-market page).
- 🔎 **Search into the market grid:** `resolveMarketSearch` (`src/lib/market-search.ts`) reuses the SAME engine `/search` uses to resolve a query → matched styleIds; `getShopProducts` gained a `styleIds` filter, so the text box narrows the grid and every existing facet + the deals toggle compose. Matched styles with no live listing show in an "in the catalog, not for sale" strip; article hits + video pin + request-a-bag ported so `/search` parity holds.
- 🔀 **`/search` + `/deals` are clean 307 config redirects into `/shop`** (`next.config.ts`), so the ~15 existing `/search?q=` links (identify, bag pages, era, social) keep working untouched. Home hero + nav search point straight at `/shop`.
- 🎛️ **Left-rail filter layout:** `ShopControls` rewritten — sticky left rail (desktop) / bottom tray (mobile), deals toggle at top, sort + facets as counted option rows (selection carries a check, never colour alone), removable chips + clear-all. Server grid passes through as `children`; all URL-driven.
- 🧵 **Earlier UX fixes in the same lane (commit `ae4fda2`):** route-level loading skeletons (`app/loading.tsx` + `shop`) + `next/form` client nav (no dead clicks); `/search` mobile-overflow fix (`min-w-0`); bag names wrap not truncate (shop grid, deals, coveted); footer regrouped (added LC Index + Where to buy); "Style read" → "Style quiz" sitewide.
- ✅ **Landed to `main` via `land-to-main.sh` (merge `85610ac`); green gate: tsc, eslint, next build, 723 tests.** Vercel auto-deploys `main`.
- ⬜ **YOUR TURN (nothing blocking):** eyeball live `/shop` on desktop + mobile — this container has no live DB (dummy build gate), so the real search-narrows-the-grid behavior is the one thing unverified. If a facet order or the rail width reads wrong, it's one component to adjust. Deferred by design: shape/carry filter (sparse variant-level data, hides until attribute-capture fills it).

---

## TL;DR — TRR ALL-brands mis-map sweep: 981 verified rows re-triaged + matcher fixes (2026-07-10, on `main`)

**Finishes the TRR class the Chanel sweep opened: every brand on the platform, 213 flagged groups hand-verified (incl. a mid-sweep TRR refresh that added ~270 rows). TRR price_history 9,401 → 8,420; 970 rows banked in `discovered_listing` (`style_guess` where recomputable) for the next promotion pass.**
- 🛠️ **Sweep script now verifies against the REAL listing title:** TRR slugs are lossier than titles (slug "gucci-leather-shoulder-bag" for "Leather Marmont Medium") — a slug mismatch gets a second chance against `price_history.notes` (where the loader stores the title) before a row is flagged. Killed ~65 false positives.
- 🛠️ **`model-normalize.ts` root fixes (regression-tested):** (a) accent-blind matching both ways — ASCII slugs never hit accented dictionary tokens, and a trailing-accent token ("noé") could NEVER match under a non-unicode \b; (b) bundled extras after "w/ …" (tags/pouch/strap/belt/twilly…) no longer trip the SLG gate ("herbag zip 31 w/ pouch", "cabas phantom w/ belt") nor donate a model word ("w/ kelly charm") — anchored to an extras vocabulary because a bare " w " is also slugged E/W ("e w shopping tote"); (c) Blondie veto on Horsebit 1955/Bamboo 1947 (hardware token swallowed the model word, Diana precedent) + Maxi Horsebit Chain as its own def.
- 📖 **Dictionary coverage added (evidence-backed, feeds every future TRR refresh):** Jacquemus block (Chiquito family/Bambino/Bisou/Filet), Mulberry (Alexa, Bayswater), Telfar (Shopping Bag), Longchamp (Le Pliage), Alexander McQueen (Skull/Skull Box), Mansur Gavriel (Bucket Bag), Proenza Schouler (PS1), Balenciaga Velo, Goyard Petit Flot, SL Voltaire, The Row Astra/Marlo + 90's spelling variants, Hermès Jypsière ASCII token.
- 🧹 **Moved 981** (preserve-then-delete): generic-title dumps stacked on one style per brand (Coach Tabby 81 "leather shoulder bag"-class, GG Marmont 90 "gg canvas" items, LV men's bags on title-verbatim styles, Prada Double 34, BV Loop 20, MJ The Tote 19), apparel/shoes/jewelry wearing a line name (Horsebit loafers 33, Sylvie/Hysteria apparel, Triomphe belts+jackets, Kelly/Constance belts+bracelets — wristwatch precedent), and cross-model mismaps (Luggage↔Phantom 14, Triomphe↔Cabas 12, Horsebit Chain 8, Trim/Kelly on Birkin, new Chanel arrivals: jumbo double flaps on Rectangular Mini 5, "timeless" items on Classic Flap 7).
- ✋ **124 flagged rows deliberately KEPT** (title names the style it sits on — the documented false positives; they re-flag on every run by design): LV Pochette Accessoires verbatim 23+6, Chanel keeps re-confirmed (Travel Ligne 14, Boy family 11, Reissue WOC 3, mini-square/rect-mini variants, Vintage Timeless Shopping Tote 3, Sea Hit line item), SL Cassandre Envelope 5, Celine Triomphe line SLGs 4 + 16-line 3, epi porte-documents 2, Constance wallet, Cinhetic boxy, Broadway, Zucca Shoulder verbatim, Mélie verbatim, Bloomsbury verbatim (2 groups), Quilted Shopping Tote 2, Hermès In-The-Loop/Fourre-Tout pouches. Keep-rules: line SLGs stay (boy-card-holder precedent), worn accessories/apparel move (wristwatch precedent), Chanel seasonal keeps need silhouette AND line to match.
- ⚠️ **The TRR refresh runs every 2 days and co-edits this table mid-sweep** — regenerate the report right before `--write` (this sweep absorbed one refresh delta: +45 groups / +271 rows, all adjudicated before the write).
- ⬜ **YOUR TURN / next:** (a) promotion pass over the 970 banked rows (many carry a clean `style_guess`: Jackie 1961, Phantom, Cabas, Dauphine, Maxi Horsebit Chain, Randonnée, Chanel 19/22/31…); (b) icon comps read cleaner (Birkin/Kelly/Constance had belts, bracelets and watches priced in; Classic Flap dropped 7 more "timeless" totes); (c) task chip for this sweep is DONE — no per-brand residue queued.

---

## TL;DR — TRR Chanel mis-map sweep: 213 verified rows re-triaged (2026-07-10, on `main`)

**Clears the round-3 "~6 TRR rows on Boy" residue and the whole Chanel×TRR class behind it (TRR-side ingest mis-maps — wrong TITLES on a style, not slug collisions).**
- 🛠️ **`clean-timeless-mismap.ts` generalized:** `--platform` flag (default still TLC; TRR slugs end in a random 5-char token, parsed per-platform), non-TLC runs require `--all`, `--groups-file` entries now take row-level keeps (`{group, exclude_ids}`), and a groups-file dry-run previews the exact move set.
- 🧹 **Moved 213 verified rows** (price_history → `discovered_listing`, preserve-then-delete; TRR 9,020 → 8,807), incl. all 6 flagged Boy rows (#2362 unparsable "chanel-uk0xx", NY tweed classic double flap → Classic Flap guess, filigree flap, chain-around hobo, O-case, patent 3 bag). Big buckets: seasonal flaps/totes/SLGs stacked on title-verbatim styles (Mini Square Flap 21, Fuchsia Coin Purse 18, Chesterfield 13) + 20 medium/jumbo classic double flaps priced into the **Rectangular Mini** page + TRR "timeless" line items on Classic Flap.
- ✋ **48 flagged rows deliberately KEPT** (title matches the style it sits on): Boy WOC 7 / Boy camera 2 / boy card holders 2 (Boy-line items stay), Travel Ligne Tote 12, Deauville 4, Reissue WOC 3, mini-square + rectangular-mini word-order variants, "be cc tote", "mini kelly handle bag". Verification rule: a "(no model)" recompute is a dictionary GAP, not proof of mis-map — every group's titles were checked against the style name before moving.
- ⬜ **YOUR TURN / next:** (a) the 213 rows sit in `discovered_listing` (`style_guess` where recomputable) — next promotion pass re-places the real bags; (b) **non-Chanel TRR sweep — DONE same day** (see the all-brands TL;DR above); (c) Rectangular Mini / Classic Flap comps read cleaner now (the mini's median was carrying medium/jumbo prices).

---

## TL;DR — Style-dup cleanup: 89 redundant style rows collapsed (2026-07-09/10, on `main`)

**The `load-handbag-breadth` residue (full-sentence one-off style names) folded into their clean canonical siblings; intentional silhouette buckets protected.**
- 🧹 **`supabase/ingest/merge-style-dupes.ts`** (dry-run default, `--write`, idempotent) clusters `style` on `(brand_id, canonicalModel())` past the 1000-row cap, merges ONLY verbose junk (≥4 words + material/colour/year/brand/"Bag" token) into the SINGLE clean sibling; re-points variants + `price_history` (dedup on `platform|listing_ref|price_type|observed_on`), deletes the emptied style. **Result: 87 merged, style −87, price_history −8 (only exact-key dups, 0 unique lost), signals −26.** `bb9097c`.
- 🛡️ **PROTECTED, never merged** (denylist + short-name silhouette-qualifier guard, so the 2026-06-30 collision can't repeat): Gucci Ophidia/Soho, Celine Triomphe Oval/Boston/Shoulder, Valentino Rockstud Spike/Tote, Coach Pillow Tabby, Chanel CC Filigree / Top Handle Vanity Case, GG Marmont Chain/Bucket.
- 🏷️ **Ambiguous pairs resolved by OFFICIAL HOUSE NAME** (`merge-style-pairs.ts`): Hermès "In The Loop" → **"In-The-Loop"** (hermes.com); Burberry "Knight Bag" + "The Knight" → renamed **"The Knight Bag"** (FW23 launch PR). `c887d87`.
- ⬜ **YOUR TURN / next:** the ~130 shorter material+size rows are HELD for a reviewed pass — a MIX of pure size/material rows that SHOULD fold in (e.g. "Togo Birkin 35", "Monogram Speedy 30") and genuine sub-models that MUST stay (Kelly Pochette, Speedy Soft, Musette Tango/Salsa, Boîte Chapeau Souple). Needs round-1-style name review before `--write`. Logged in `docs/data-content-worklist.md`.

---

## TL;DR — Merchant sweep #2: Dallas Designer Handbags applied, ALB skipped (2026-07-09, docs on `main`)

**Owner asked "can we list Atlanta Luxury Bags? who else?" → two-agent sweep of ~20 merchants; full verdicts + evidence in `docs/data-collection-handoff.md` §11** (commits `896194f`/`c2f8bd2`/`d44448a`).
- 🟡 **Dallas Designer Handbags APPLIED 2026-07-09** (Awin merchant 91683, 5% / 15-day cookie, ShopWindow feed 1,446 products): owner clicked Join; Awin confirmed "request sent to the advertiser." **GATE: wire NOTHING until their Link status = online AND the "Exposure Level 5" unfunded-payments flag clears** (both red in the logged-in dashboard 2026-07-09). On approval + green gate: wire the Awin feed TLC-style (`listing_image` auto-flows through `getVariantImages`).
- ❌ **Atlanta Luxury Bags skipped** (no affiliate rail or feed, ~302 live listings, mixed online-buyer reviews). ❌ **WGACA avoided** (lost Chanel v. WGACA, willful infringement). 🅿️ Parked: Farfetch Pre-Owned (email application, hers) + Luxe Du Jour (15%, gated on live socials, no feed). Keeks (≥7.5k products, no program) flagged for a future direct-outreach batch.
- **Your turn: none pending.** Watch arielle@luxurycatalog.com (Workspace) for the DDH approval email.

## TL;DR — Style faces now match the variant spec: hero + card pickers (2026-07-09/10, on `main`, DEPLOYED to prod)

**Round 4 (2026-07-10, owner calls locked): one face per bag everywhere + clean header, commits `9c7da14` + `a36e027`, deployed:**
- `getHeroListing(variantId, faceImageUrl)` now resolves the live listing BEHIND the face `getVariantImages` chose (identity by construction — it no longer re-picks with its own scoring pass).
- Bag-page header: NO marketplace caption/price band; contain-fit on white (cover-crop was cutting studio shots at the clasp); image stays quietly CJ-linked (rights tether + click revenue). Platform context lives in the for-sale rail below.
- Pre-existing bug found + fixed: the multi-card candidate pool was silently truncated to 1,000 rows (PostgREST cap) — real Chanel-page pool is 5,856 rows; now paginated via `fetchAllRows` + chunked `listing_image` reads. Verified live: bag/513 hero == brand-card Boy image (p1310692), no "Available now" text.

**Round 3 (same day, owner report: Boy page fronted by a camera case, then a zip pouch), commit `2cd866b`, deployed:**
- Dictionary: WOC + camera vetoes on Boy / Chanel 19 / Trendy CC (line token must not swallow the shape); 46 verified rows re-triaged via the `--groups-file` flow.
- Picker: `faceLowPricePenalty` (-3 under 0.65x the variant's FULL live-ask median, hero candidates deduped per listing at cheapest ask) — catches accessories whose titles carry no shape word (the "boy mini crossbody" zip case). Verified live: bag/513 hero = studded black Boy flap $2,628.
- **Non-Chanel collision residue CLEARED (same day, follow-up session):** vetoes + regression tests in `model-normalize.ts` (Bamboo 1947 `!diana`; Marmont/Ophidia `!belt bag` — shape beats line when the shape is its own ranked style, chain wallets still roll into the parent line; Luggage `!phantom`; Triomphe `!cabas`; Multi Pochette `!new wave`; `wristwatch` SLG token). 136 verified rows re-triaged to `discovered_listing` via the `--groups-file` flow: 92 Gucci, 24 Celine, 12 LV New Wave, 2 Fendi wristwatches, 6 FP Balenciaga-on-Boy (Rodeo/Bel Air in "tan **cowboy**" — an old substring "boy" match; today's word-bounded matcher is immune, rows moved by one-off). Fendi "Selleria" Peekaboo/Baguette rows verified CORRECT and kept (Selleria = construction, not a model). Known residue: ~6 TRR rows on Boy are flaps/hobos/O-case (TRR-side mismaps, different class) — **CLEARED 2026-07-10** (see the TRR Chanel sweep TL;DR above). Next promotion pass re-places the moved bags.

**Owner flagged the Classic Flap page/card fronted by wrong bags twice (handcuff clutch $966, then a green micro mini + a charm edition). Two fixes, both live:**
- **Data (`c21cae1`):** bare "timeless" no longer blanket-maps to Classic Flap (`timeless&flap` + shape vetoes in `model-normalize.ts`); 44 mis-mapped TLC rows moved to `discovered_listing`.
- **Picker (`4a546a9`):** `scoreListingFace` in `listings-core.ts` (colour +4, size +2/-2, hardware +1, novelty editions -3) now drives BOTH `getAffiliateListingImages` (best match, ties newest) and `getHeroListing` (cheapest within best-matching tier). Verified live: bag/199 hero = black lambskin flap $2,600; brand card = black lambskin medium double flap.
- **Deploy note:** `vercel deploy --prod` from a worktree needs `vercel link --yes --project luxury-catalog` FIRST — a bare `link --yes` creates a junk project named after the folder (one named `luxury-catalog-heropick` may still exist in the dashboard; deleting it needs the interactive prompt).

---

## TL;DR — TLC mis-map re-triage, unscoped: 259 rows moved + matcher hardened (2026-07-09, on `main`, applied to prod)

**Follow-up to the "Timeless" fix (`c21cae1`): recomputed EVERY TLC price_history row against the dictionary, hand-verified every flagged group, moved only verified mis-maps.**
- 🔤 **Root cause of the over-flagging was slug lossiness, two ways:** URL slugs flatten punctuation to spaces ("d-lite" → "d lite") AND drop it between digits ("2.55" → "255", "24/24" → "2424"). Token matching in `model-normalize.ts` is now separator-tolerant (space/hyphen/dot/slash interchangeable, optional between digit parts only, word-bounded). This killed ~270 false flags (Lady D-Lite 56, Reissue/24-24 digit groups) at the source — it also makes the LIVE ingest recognize these titles from now on.
- 🚨 **The owner-reported "Reissue ← Chanel 25 (31 rows)" group was itself a matcher artifact:** those titles are vintage "chanel-255-…" (2.55) slugs that substring-matched "chanel 25" pre-fix. DB probe confirms: all `chanel-255-*` sit correctly on Reissue; real `chanel-25-*` hobos already sit on Chanel 25. Nothing needed moving there. The real Reissue mis-maps were **13 Wallet-on-Chain rows** (found after adding a WOC veto to the Reissue def — "2.55 WOC" titles are WOCs, not flaps).
- 🧹 **Moved 259 verified rows** (price_history → `discovered_listing`, preserve-then-delete, TLC 14,163 → 13,904): mostly non-bags that name-matched bag styles (Rockstud flats/jackets 32, Marmont belts 28, Kelly Dog bracelets/belts 25, Reva flats 25, VLogo 18, Horsebit apparel 16, Constance belts/bracelets 8, season-code confusions "25B/22A/25K…" → Vanity/Coco Handle/Duma, PST 2, Be Dior 2, HAC 1…). 6 rows deliberately KEPT (verified real or ambiguous: "petite mallee" typo, "rose ballerina" colour tripping the shoe token, belt Pochette Métis, Diorama pouch, Moon Cutout hobo).
- 📖 **Dictionary fixes from the verification pass:** `c22` → Chanel 22, `roman studded` → Roman Stud, `double sense` → Double Sens (TLC misspelling), `lock it` → Lockit, BAG_OVERRIDES + `multi pochette` (SLG gate was eating Multi Pochette Accessoires), `teen pouch`, `bumbag`.
- 🛡️ **Script upgrades (`clean-timeless-mismap.ts`):** `--all` (unscoped sweep), `--report <json>` (per-group titles for spot-checking), `--groups-file <json>` allowlist — REQUIRED with `--all --write`, so unverified groups can never bulk-move.
- ⬜ **YOUR TURN / notes:** (a) the 259 moved rows are in `discovered_listing` with `style_guess` where recomputable — the next promotion pass re-places the real bags (WOC 13, Vanity/Coco Handle/Duma, Be Dior, HAC, Lockit). (b) Non-bag rows (belts/flats/bracelets) stay banked as evidence; they'll never promote (SLG-gated) — that's correct. (c) Matching is stricter now: if a future capture looks under-matched, check the new word-boundary behavior first.

---

## TL;DR — /where-to-buy trust hub SHIPPED + scoped eBay pull: ranked styles 269 → 304 (2026-07-09, on `main`)

**Two owner-greenlit builds in one session (the "is eBay trustworthy" chat).**
- 🛡️ **`/where-to-buy` — the venue trust hub** (sister to `/rankings`; spec `docs/ux/where-to-buy-spec.md`). Protection matrix (authentication / returns / fake remedy / payment) × 10 venues, **price-aware toggle** (eBay+Poshmark physically inspect only from $500 — at $300 the checkmark people picture does not exist), per-venue profile pages with **every cell sourced to the venue's own policy + date checked (all 2026-07-09)**, and the signature **"Buying here anyway?"** gap-to-remedy section (we don't judge, we equip). Registry `src/lib/where-to-buy.ts` (16 tests), JSON-LD + sitemap, bag-page WhereToBuy links in. **Found + fixed two stale facts in `platforms.ts`:** Fashionphile returns are 15 days (we said 30); TRR **handbags are final sale** (we said "some items").
- 📉 **eBay scoped pull (the 49 one-source styles): 497 exact-price sold rows loaded, 0 unresolved → 304 styles now rank** (was 269 this morning, 151 at the 7/08 source-gate ship). Dual engine: Firecrawl sold-search (masked-flag per listing) + Apify **auction-only** runs (~$3.10; bid-settled finals cannot be masked). **Probe result for the owner's "we never know the sold price" concern: 18% of on-target eBay solds are best-offer masked (n=698)** — bad up-tier (one Bottega style: 14/15), nearly clean mid-tier. Policy locked in preferences.md: masked rows are counted, never loaded into a median.
- 🔁 **TRR live-refresh SCHEDULED every 2 days + PROVEN in write mode** (`trr-refresh.yml`, Apify actor → load → age-reconcile → summary; ~$60/mo, owner-greenlit; APIFY_TOKEN secret added 2026-07-09). Fixes the freshness gap: TRR was a daily 1-style pilot (now manual). **The dry-run surfaced a real problem + its fix:** TRR caps ~120/category so one sweep sees ~840 live but the DB showed 7,841 "live" (~7,050 unseen since the Jun 23-24 sweep = stale/sold). Snapshot-diff can't work (the 50% guard rightly aborted); switched to **age-based retirement** (`reconcile:sold --age-days=14`, uses existing `observed_on`, no migration). **First write run retired 7,693 stale TRR rows; available dropped ~8,584 → 1,332.** Fashionphile every-3h + TLC daily unchanged; eBay stays manual (permanent sold comps).
- ⬜ **YOUR TURN (nothing blocking):** (a) eyeball `/where-to-buy` after your next `vercel --prod` promote — venue tier labels are my take, veto any that read wrong; (b) Poshmark as a third mid-tier source = my take is SKIP for now (ranking lever already pulled by eBay, no Poshmark affiliate, browser-gated); (c) Firecrawl free tier is near its monthly edge (one transient insufficient-credits error mid-sweep).

## TL;DR — Alias fix + dictionary extension: 764 → 993 styles, 30 → 45 houses (2026-07-09, on `main`, applied to prod)

**Coverage audit found the promotion bottleneck was largely a MATCHING bug, not missing data. Fixed it at the source, extended the dictionary from the residue, promoted.**
- 🐛 **The accent bug:** `norm()` deleted accents instead of folding them, so catalog "Chloé" normalised to `chlo` while feed "Chloe" normalised to `chloe` — accented brands could NEVER match. Fixed (NFKD fold in `image-import-core.ts`); all brand matching now routes through `canonicalBrand` (was `normalizeDesigner`, which only knew Hermes→Hermès), so "Christian Dior"→Dior, "Valentino Garavani"→Valentino etc. resolve. 6 catalog brands were also missing from `BRAND_ALIASES` entirely (Mulberry, McQueen, Jacquemus, Off-White, Longchamp, Telfar) — added.
- 🔓 **The WOC gate bug:** the SLG token "wallet" dead-ended EVERY Wallet on Chain listing before the "Wallet on Chain" model could match (same for "pouch" killing BV's The Pouch, "belt" would kill belt bags). New `BAG_OVERRIDES` whitelist (checked before the SLG gate) + decision: chain-carry formats are bags (WOC precedent) — Dionysus/Marmont/Félicie chain wallets roll into their parent style.
- 📖 **Dictionary extension from the residue audit:** exported all 750 unmatched clusters ≥5 (new `export-residue-clusters.ts`), adjudicated in-session. ~150 model entries added across LV (Artsy, Eva, Trouville, Geronimos, vintage Damier/Monogram lines…), Chanel (mini rectangular/square flap → Classic Flap, Kelly Flap, Pearl Crush, Urban Essentials, Uniform), SL (Triquilt, Le 37, Rive Gauche…), Gucci (Neo Vintage, Belt Bag, Luce…), Hermès (Kelly To Go, Constance To Go, Hac à Dos…), Balenciaga (First, Town, City tokens), Fendi (Spy), + garment tokens in the SLG gate (TRR apparel rows no longer cluster as bags).
- 🏠 **6 new houses created** (recurring backlog demand): Bulgari (Serpenti), MCM (Liz, Stark), Khaite (Olivia, Lotus), Salvatore Ferragamo (Ginny, Hug, Studio), Christian Louboutin (Cabata), Loro Piana (Extra Pocket) — provisional tiers, House Standing re-tiers from data. New `create-missing-brands.ts` (idempotent).
- 📈 **Promotion results (three promote-safe runs, min 5 then min 3):** styles 764 → **993**, variants 1,585 → **2,114**, price_history 79,320 → **94,390** (incl. live ingest), brands 30 → **45**; 7,487 backlog rows promoted today. Dictionary detection went 4% → 19% on the pre-capture backlog.
- 🏠 **Round-2 houses (9 more, token-frequency evidence from titled rows):** Versace (La Medusa, Virtus, Greca Goddess), Marc Jacobs (The Tote Bag, Snapshot, Traveler, Sack, Teddy), Stella McCartney (Falabella, Ryder), Jimmy Choo (Bon Bon, Varenne, Callie, Candy), Moynat (Réjane, Gabrielle), Alaïa (Le Teckel, Le Click, Le Coeur, Louise), Delvaux (Brillant, Tempête, Pin, Lingot, Cool Box), Alexander Wang (Rocco, Rockie, Attica, Roxy, Marti), Judith Leiber (Minaudière). Dupe reconcile merged 1 variant; summary refreshed.
- ✅ Gate green (tsc, eslint, 679 tests incl. new alias/WOC coverage, build via land script).
- ⬜ **YOUR TURN / next levers:** (a) remaining 32.7k unpromoted rows: ~400 clusters ≥5 still lack a confident model (mostly Chanel seasonal + one-off vintage) + long tail <5 — next dictionary sweep or seasonal-archive route. (b) DKNY/Furla/Tod's/Tumi/Margiela/Zadig rows are mostly PLACEHOLDER titles ("unmatched-model…") — they need a re-capture of real titles from source_url before any dictionary can classify them. (c) `ingest-tlc` daily Action will place live offers on the new variants automatically (or trigger manually to accelerate). (d) Style-page depth unchanged: descriptions 39%, `year_introduced` 1% — the attribute-capture pass is still the depth lever.

---

## TL;DR — Affiliate capture + full-spectrum promotion + House Standing tiers (2026-07-08, all on `main`, applied to prod)

**The chain: affiliate data was being DROPPED → now captured → promoted into the catalogue → and brand tiers became our own formula.**
- 🧲 **Stopped discarding affiliate evidence.** The TLC ingest dropped any in-stock bag it couldn't name from the dictionary (telemetry only). Now unknown-model BAGS (bag-gated, garments/shoes still excluded) land in `discovered_listing` for triage. Wired into the daily `ingest-tlc` Action. Commit `eeb6279`.
- 🏗️ **Built + RAN the discovered→catalogue promotion.** `promote-discovered --write` was a stub; implemented idempotent find-or-create brand→style→variant + re-point, bag-gated (`canonicalModel`), new brands get a tier. Ran `normalize:discovered --write` (3,383 titles → canonical models) then `promote:discovered --write`: **+2 brands, +32 styles, +164 variants**, 4,143 discovered rows re-pointed. Then triggered `ingest-tlc` → **1,439 live offers placed on the new variants**. New standing Action `catalog-promote.yml` (weekly dry-run report; manual `write=true` persists).
- 🏅 **Brand tiers = our own formula now (House Standing), numbered Tier 1→5.** Replaces the industry Ultra-luxury/Luxury/Premium/Contemporary scheme. Score = resale median 55% + p90 ceiling 25% + trade volume 20% → percentile blend → cutoffs 90/75/55/30, n-gate ≥30. Spec `docs/ux/tier-formula-spec.md`, pure core `src/lib/house-standing.ts` (6 tests), report `npm run house-standing`, explainer page `/how-we-tier` (live). Migration `0052` APPLIED + backfill run: all **30 brands set to Tier 1-5**. Tier 1 = Hermès, Chanel; Tier 5 = Coach, MK, Tory Burch, etc.
- 🩹 **Caught + fixed a live regression the backfill caused:** `/brands`, the nav mega-menu, and the homepage brand section rendered ZERO brands (grouping keyed old string tiers). Re-keyed `BRAND_TIERS`/`BRAND_TIER_RANK` to Tier 1-5; verified `/brands` shows 30 brands under Tier 1-5 headings on prod. Commit `36232be`.
- ✅ **Circularity RESOLVED (2026-07-10, commit `35b2f56`):** dropped the house-tier input from the LC Index (was 15%); it now ranks the bag on price 47 / trade 29 / scarcity 24 only. The two indices are independent: LC Index ranks the bag, House Standing ranks the house. Live on prod.
- ⬜ **YOUR TURN (all optional, nothing blocking):** (a) tier **weights (55/25/20) + band cutoffs are v1** — tune if the placement feels off (one edit in `house-standing.ts`, rerun the backfill). (b) Contemporary houses (Tory Burch, Michael Kors, D&G) are now IN the catalog at Tier 4-5 per the full-spectrum call. (c) The `catalog-promote` Action defaults to dry-run; run it with `write=true` to promote the next backlog batch — **note a live chat ("Pull full TRR + eBay… promote the discovered backlog") is already actively running this, so it's covered.**

---

## TL;DR — "Pull them all": full-catalog capture is now the standing method (2026-07-08, on `main`)

**Owner directive: stop pulling specific bags from our sources, pull the ENTIRE catalog.** Acted on it.
- 🕸️ **Ran the full Fashionphile pull:** the master crawler (`fashionphile-crawl.ts handbags`) captured all **20,242 live listings**. Loaded **13,498 curated prices** (refreshes every known style to today) + banked **6,254 unmatched listings** to `discovered_listing`. price_history 63k → **77k rows**; the RPC now returns **607 styles** (was 526) as dormant styles gained fresh prices.
- 🔧 **Fixed the loader's statement-timeout bug:** `load-prices.ts` upserted 10k+ rows in ONE statement (57014 rollback → nothing persisted). Now batched at 500/upsert. This is what made a full-catalogue load possible at all.
- 🔁 **Made it the standing cadence:** `market-refresh.yml` already crawled the full catalogue every 3h but by old design only retired sold bags ("bulk-loading would flood"). Now it ALSO loads the whole catalogue's prices ONCE DAILY (the 05:xx UTC run; gated to bound row growth ~13.5k/day). The old "sold-only" scope is retired.
- 🧭 **The real reframe — capture is solved, PROMOTION is the lever.** The catch-all already banks every unmatched listing: `discovered_listing` holds **51,006 rows** right now (Fashionphile + RealReal + …). They aren't becoming catalog pages because promotion needs name-clustering (auto-promote would fork junk styles like "Monogram Multicolor Alma White" off the real "Alma"). Held promotion this session on the quality bar.
- ⬜ **YOUR TURN / next levers:** (a) TheRealReal + eBay full catalogue pulls still need a browser session / Firecrawl credits (not headless-CI-able) — the TRR runbook exists. (b) A **promotion pass** over the 51k discovered backlog with proper name normalization is the highest-value catalog-growth work (turns banked listings into real bag pages). (c) Consider applying migration **0038** so discovered listings keep region/condition columns. (d) Tune the daily-load cadence / add a prune of superseded same-listing snapshots if price_history growth needs trimming.

---

## TL;DR — LC Index accuracy fix: contaminated medians + floor + why-notes (2026-07-08, on `main`, migration 0050 PENDING)

**You spotted the live `/rankings` was wrong (Kelly Pochette #1, impossible). Diagnosed against the live DB and fixed all three at the source.** Spec updated: `docs/ux/lc-index-spec.md` → "v2 accuracy fix".
- 🔎 **Root cause was NOT currency (the brief's guess).** Prod is 100% USD. The real bug: `price_history` records the **same live listing many times** (re-scraped over days). The median and counts were computed over every raw row, so listings re-observed more often dominated. Kelly Pochette's "53 prices" were only **15 real listings**, its pricey exotic ones over-counted → a $20,995 median above the Birkin.
- 🧮 **Fix (migration `0050_style_index_signals_v2.sql`):** dedupe to **one row per listing** (latest observation) before the median + counts; dominant-currency guard added for future non-USD ingest (no-op today). Never edits 0048.
- 📏 **Floor 8 → 20** (from the real deduped distribution): drops the thin contaminated styles (Kelly Pochette at 15) while keeping ~220 legit styles. Demand-first gate: prove market activity, THEN scarcity is measured among survivors.
- ⚖️ **Scarcity stays inverted-live-count.** Tested sell-through pressure and rejected it: it ranked the **Birkin #11** behind fast movers like a Wallet on Chain (grails sell slowly precisely because they cost most). Weights unchanged.
- ✍️ **Why-notes:** the repeated "Priced above most of the catalog" is gone; `whyNote` now writes one short line per bag from its own signal profile + house. **0 adjacent duplicates, 0 em-dash/verdict violations across all 222 rows.**
- ✅ **Corrected real top 5:** Birkin, Kelly, Constance, Chanel 25, Classic Flap. Kelly Pochette now unranked. Gate green: tsc, eslint, 668 tests, build.
- 🔗 **Source gate added (you flagged single-source styles).** ~33-42 listings all from ONE reseller (Coco Base Shopping Bag, Souplissimo) is one merchant's price, not the market's. Migration `0051` returns a distinct-source count; the engine now needs **≥ 2 platforms** to rank. Effect: 229 → 151 ranked, grail top unchanged, **Chanel 19 rises to #8**. (0050 + 0051 both applied 2026-07-08.)
- 🧭 **Collection hole noted + queued:** the 1,000-vs-300 gap (Birkin/Kelly vs Chanel 19) is mostly real (two Hermès bags soak up ~43% of the house's resale volume) but partly a capture miss: the **Chanel 19 has zero RealReal** while the Classic Flap pulls 178 there. A targeted RealReal + eBay pull for undercounted mid-tier styles is queued (see task chip).
- ⬜ **YOUR TURN:** reload `/rankings` on the live site once the code deploys (your manual `vercel --prod` promote) and confirm Birkin #1 with no single-source styles up top. The RPC (0050 + 0051) is already live and verified.

---

## TL;DR — The LC Index: bag-ranking module + Index page SHIPPED (2026-07-08, on `main`)

**Owner's concept: help a layperson see where a bag stands (Marc Jacobs vs Louis Vuitton) at a glance.** Design converged over 5 chat rounds; spec `docs/ux/lc-index-spec.md`. Built, landed to `main` (3 lands: `87041cf`, `c331835`, + engine), both migrations applied to prod.
- 🧮 **The formula (the LC Index):** one rank per style blending resale **price 40% + trade volume 25% + scarcity 20% + house tier 15%**, each a percentile across all styles. Pure engine `src/lib/lc-index.ts` (`computeLcIndex`), 19 unit tests. n-gate: a style needs ≥8 recorded prices or it stays unranked (never a fake rank). Framed **"our index, not a verdict"** with a live `/rankings/how-we-rank` page publishing the weights from the code constant.
- 📊 **The standing module (`StandingCard`):** big rank headline + the three measures as side-by-side mini-leaderboards. On the bag page at the value moment. **The why-meter (`StandingGlyph`):** three bars (Price/Trade/Scarcity, lead brightened) so a row explains its own rank. Owner-loved after iterating away from spectrums/stat-tiles.
- 📜 **The Index page (`/rankings`):** numbered list, affiliate photo + why-meter + resale-median column; ItemList JSON-LD + sitemap entries (GEO). **Concept C** inline rank link (`IndexRankLink`) live on the shop grid (stretched-link card, real sibling link).
- 📈 **Movement pills:** `lc_index_snapshot` (migration 0049) + monthly cron `/api/cron/lc-index-snapshot`; `MovementPill` shows ▲/▼ vs last month, hidden until a prior month exists.
- 🗄️ **Migrations 0048 (`style_index_signals()` RPC) + 0049 APPLIED to prod 2026-07-08** (db-migrate runs 27 + 28, logs confirm). Everything degrades gracefully (empty index → module hides).
- ⬜ **YOUR TURN:** (a) **eyeball `/rankings` on the live site and gut-check the order** (real data; tell me if a bag sits wrong and I'll trace data vs weights, it's one constant). (b) **Nav placement for `/rankings`** is your call (nav is protected); it's linked from the bag card, not the menu. (c) Optional: trigger `/api/cron/lc-index-snapshot` once (needs CRON_SECRET) to capture July now, else it auto-runs Aug 1 and pills start Sep. (d) Concept C can extend to search/recs/closet cards on your word.

---

## TL;DR — Camera identify v2: video in, live capture feedback, haul mode, logo pass (2026-07-08, on `main`)

**`/identify` (Spot the Fake) went from single-photo to the thrift-flipper tool.** Grew out of the owner's Goodwill field test: Claude chat read her bags one at a time, choked on her 13 `.mov` files, and gave overconfident verdicts; we prototyped on her real footage in-chat (rack scan + 5-bag haul + native-res logo crops) and she greenlit the build. Strategic frame she locked: **being a thrift flippers' resource is gold**.
- 🎥 **Video in:** videos never upload raw. Frames are sampled in-browser, scored for sharpness (Laplacian variance, `src/lib/identify/frame-picking.ts`, 11 unit tests), best 4 upload as JPEGs capped at the vision ceiling (`extract.ts`).
- 📷 **Live capture with real-time feedback (owner's favorite):** `CameraCapture.tsx` viewfinder shows chips that REACT instead of instructing (QR-scanner model): Sharp/Hold-steady, frames n/4, and "Read: 'the sak'" the moment a stamp is legible (throttled Haiku pings to new `/api/identify/live-read`, stop on first success, ≤12/session, 40/5min rate limit).
- 🔍 **The logo pass:** first pass returns `logoHints` (normalized regions of stamps/labels/tags/medallions + legible flag). Unread hints get re-cropped CLIENT-side at native resolution (re-seek the video / re-decode the photo) and sent once more with the prior JSON (`prior` field → refine prompt). Proven manually on her footage: turned "navy crossbody, unknown" into a legible "liz claiborne" disc and flipped a wrong Brahmin read.
- 🧺 **Haul mode:** multiple files queue as one list; each VIDEO = its own bag, photos in one selection = angles of ONE bag; runs sequentially (rate-limit + phone-memory kind). Rate limit bumped 6→12/5min for the multi-bag session.
- 🏷️ **Price-tag OCR:** `priceTagText` read off store stickers (worked on both Savers tags in her footage); shown as a Sticker spec row + weighed next to the resale range copy (no computed margin % claims).
- 🛒 **Off-catalog fallback (the strategic one):** thrift racks are mall brands; when a read has no catalog style match, the card says so honestly, links **eBay SOLD comps** (`buildEbaySoldCompsLink`, EPN attribution built-in, fires `outbound_resale_clicked` source=identify_offcatalog), and the miss logs to `searched_not_found` (`[camera]` prefix) = the demand sensor for which thrift-tier brands earn catalog coverage next.
- 📊 **New events:** `identify_scan_started` (kind: photo|video|live|haul) + `identify_scan_completed` (matched/confidence/brand/refined). Result card extracted to `ScanResult.tsx` (all flows share it; calibration copy unchanged: markers not verdicts, value only "if genuine").
- 🧪 **Gates:** tsc/eslint/tests(642)/next build all green. ⚠️ Container gotcha: this env ships NO `NEXT_PUBLIC_SUPABASE_ANON_KEY`; build-time queries fail gracefully, so a `.env.local` with a labeled dummy value gates compile+render (real key would come from the env store; egress to the live site is proxy-blocked here).
- ⬜ **YOUR TURN:** (a) open `/identify` on your phone against prod and run the live camera on a real bag (needs https + camera permission; verify the chips tick). (b) The rack-scan mode (pan a whole shelf → pinned flags) is validated on your footage but NOT built; say the word next session. (c) Optional: drop the real anon key into the cloud env store so future build gates run against live data.

---

## TL;DR — Camera identify v2 verified end-to-end on the LIVE site + 429 resume fix landed (2026-07-08, on `main`, NOT yet deployed)

**Ran the full v2 verification against `www.luxurycatalog.com/identify` on her real thrift `.mov`s. All 5 checks PASS.**
- ✅ **Upload/haul + reads:** each item renders its own **Bag n** card, stepper runs, results show the **"We read:"** chips. Reads are calibrated, NOT overconfident: rack pans returned brand/style `null` ("Couldn't place this one"); a held bag read **Liz Claiborne** (medium) one call, `null` the next (model is non-deterministic and hedges to null when unsure — good).
- ✅ **Off-catalog + eBay:** Liz Claiborne had no catalog match → off-catalog card + eBay SOLD button; live href carries `LH_Sold=1`, `LH_Complete=1`, `campid=5339158071`, `customid=identify-offcatalog`.
- ✅ **Live camera chips:** all three tick — **Sharp**, **Frames n/4** (counts up), **Read: $24.99** (flipped via real `/api/identify/live-read`; blank frame → `readable:false`). Webcam prompt + physical bag are hers to do live.
- ✅ **Data trail:** PostHog got `identify_scan_started` + `identify_scan_completed`; Supabase `searched_not_found` gained `[camera] Liz Claiborne`.
- 🔧 **Rate-limit finding + fix:** the limiter is **in-memory PER serverless instance** (by design, `rate-limit.ts`), so `12/5min` is soft — a **concurrent** burst fans across instances and does NOT trip (14/14 → 200); a **sequential** haul sticks to one warm instance and DOES (calls 10–16 → 429, `Retry-After` ~198s). Old UI dead-ended every later bag on "Too many requests." **Fixed** (`postIdentify` now waits out `Retry-After`, shows a "holding your spot" status, retries bounded ×2; commit `b744849`). ⚠️ On `main`, **awaiting a manual `vercel --prod`** — not live yet, so not live-verified. Follow-up worth considering: shorten the window or add a per-user token so hauls rarely wait ~3–5 min.
- 📌 **Verification method note:** the browser file-picker is sandboxed in this harness (no OS-picker uploads), so the front-end was driven by in-page injection (canvas `File` + a captured real prod response) and the backend by direct `curl` to prod `/api/identify`. Genuine, but a true phone-upload pass on her device is still the gold check.

---

## TL;DR — Article engine weekly run + red-`main` build fix + 2 articles PUBLISHED (2026-07-07/08, on `main`)

**Article engine `article-engine-weekly` ran; 2 GEO articles now LIVE.**
- 📝 **Two flagship reference articles PUBLISHED LIVE 2026-07-08** (owner "do all your recs" go-ahead, via `supabase/ingest/publish-articles.ts`; both return 200 on prod, bodies render as bullet beats): **"The Chanel date-code decoder"** (`post_id 36`, `/articles/chanel-date-code-decoder`) and **"Hermès color codes, decoded"** (`post_id 37`, `/articles/hermes-color-codes`). Demand: search "chanel 25" ×5 + "Chanel in 2026" top-viewed ×2 (Chanel); Hermès #1 brand 30d n=15 + "Hermès authentication" top-viewed ×2 (Hermès). Bodies from the sourced seasonal-archive drafts via `copywriter`, tables converted to renderer-safe bullet beats, calibrated dating/availability hedges, no invented prices. Now measurable — next `article-engine-weekly` run reads their performance per §6.
- ⛔→✅ **Prior "11 drafts awaiting publish" note was STALE** — all 35 articles are published; 0 were draft before this run. Backlog rescored (`docs/article-backlog.md`); Goyard `search_not_found` + LV "alma" demand pointed to `docs/data-content-worklist.md`.
- 🔧 **Fixed red `main`:** the `/about` founder page imported `framer-motion` + `lenis` with the manifest entries present but never install-verified. Clean `npm ci` + full gate (tsc/eslint/next build/**593 tests**) now green; landed the reproducible seed script (`00882ad`). Docs landed at `c98fbfe`.
- 📌 Durable learnings captured in `docs/article-engine.md`: article renderer supports only `## `/`- `/`> `/paragraph/`**bold**`/registered `[diagram:]` (NO tables, NO `---`); use `seed-archive-reference-articles.ts` as the clean seed template (status on INSERT only).
- ✅ **DONE (both prior "your turn" items):** the 2 drafts are published (above); `framer-motion` + `lenis` are now declared + installed in the working folder, so local dev on `/about` works. Nothing outstanding.

---

## TL;DR — iOS zoom + shop-grid trust fixes (badge saturation, contrast, overlap, placeholder images), SHIPPED (2026-07-08, on `main`)

**Owner reported 4 issues from her phone (screenshots, 2026-07-08); all four fixed:**
- 📵 **iOS zoom on the menu search killed.** iOS Safari auto-zooms any focused input with font-size < 16px. Fix: `BagFinder` input is `text-base sm:text-sm`, PLUS a global guard in `globals.css` (`@media (max-width: 639px)`: every text input/select/textarea `font-size: max(16px, 1em) !important`) so no future input regresses. Verified: menu search, hero search, newsletter all compute 16px at 393px.
- 🏷️ **"Great deal" badge saturation fixed, then REMOVED from the grid entirely (owner ruled, same day).** Root cause of saturation: the tile badged the BEST band across ALL its listings — with 50-113 listings/tile, one is always ≥10% under its bucket median, so every tile badged. First fix rated the tile's "from" price instead; owner overruled: a rollup tile is a category representative (photo + from-price included), NOT an item for sale, so NO price verdict belongs on it however computed. Grid now shows no deal chip; verdicts stay at LISTING level (bag-page rail, homepage Best deals). `ShopProduct.dealBand` (from-price semantics) survives as the INTERNAL signal for the `deals=1` filter + best-deal sort only.
- 🎨 **Badge legible everywhere:** solid dark pill (`bg-emerald-950/90` + `text-emerald-200`), moved to the image's BOTTOM-left; "+ Compare" stays top-right, so they can never collide on narrow 2-col mobile cards (they overlapped before).
- 🖼️ **Shop placeholder tiles (e.g. Neverfulls) fixed.** The tile's image was keyed ONLY to the cheapest listing's variant; a photo-less eBay-only cheapest (only TLC writes `listing_image`) blanked tiles whose siblings have photos. Now: cheapest's variant → other listed variants (`ShopProduct.imageVariantIds`) → ANY catalog photo on the style (`getStyleHeroImages`, new in queries.ts).
- ✅ Verified end-to-end against a local mock PostgREST (deterministic comps: fair from-price tile shows NO badge even with a 20%-under listing in another bucket; great from-price tile badges; both image fallbacks hit) + Playwright at 393×852 (no overlap, computed styles). Gates green (tsc/eslint/642 tests + build via land script). ⚠️ Couldn't verify against prod data: this container's `SUPABASE_SERVICE_ROLE_KEY` is rejected ("Invalid API key") — worth checking that env secret.

---

## TL;DR — Mobile menu: search collapsed until tapped (follow-up fix), SHIPPED (2026-07-08, on `main`)

**Owner reported the mobile menu STILL buried under an uncapped grid** (screenshot showed 6+ tiles, no View-all — i.e. the pre-fix bundle, but the 4-cap alone also left the menu links below the fold on a 393px phone). Structural fix:
- 📱 **Menu first:** `BagFinder` gained `collapsedUntilFocus` — in the mobile menu, ONLY the search field renders until it's tapped (no grid, no "Ask us to add it"), so opening the hamburger shows the whole menu instantly. Once tapped: capped **4** suggestions + "View all results →" (unchanged). Engagement is sticky (no collapse on blur — a blur-collapse would yank tiles out from under the tap). Desktop + closet-add unchanged.
- 🎨 **Ghosting fixed:** the mobile panel is now opaque `bg-bg` (was `bg-bg/95` + blur), so page copy can't bleed through it (visible in her screenshot).
- ✅ Verified end-to-end with Playwright at 393×852 (menu-open: 0 tiles + all links visible; engaged: exactly 4 tiles + CTA; typing: cap holds). Gates green (tsc/eslint/642 tests + build via land script).
- ℹ️ If she STILL sees the old behavior after this deploy: hard-refresh / clear Safari cache — her screenshot predated the 14:41 UTC deploy of the first fix.

---

## TL;DR — Affiliate photos as bag headers + capped mobile menu search, SHIPPED (2026-07-08, on `main`)

**Two owner asks, both landed + deploying.**
- 🖼️ **Affiliate photos fill image gaps everywhere.** `getVariantImages` (`src/lib/queries.ts`) now resolves in tiers: catalog `image_url` → **affiliate listing photo** (`listing_image` joined to a live for-sale `price_history` row by the composite `(platform, listing_ref)` key; newest listing with a photo wins) → community `bag_photo`. Affiliate beats community on purpose (studio-shot vs social-style); community is the floor. Source-agnostic: The Luxury Closet is the only feed writing `listing_image` today, but any affiliate feed that populates it is picked up automatically. One resolver, so it lands on grids, search, recs, AND the bag-page header. Resilient (pre-0047 or any error → placeholder). No migration needed (0047 already applied on prod).
- 📱 **Mobile menu search no longer buries the menu.** `BagFinder` gained `maxModels` (cap suggestions) + `onViewAll` (a "View all results →" CTA to `/search`). Mobile nav caps to **4** suggestions with the CTA, and the panel is now scrollable (`max-h`/`overflow-y-auto`), so the rest of the menu is reachable. Desktop search unchanged.
- ✅ Full green gate (tsc/eslint/next build/**631 tests**); landed via `land-to-main.sh` (`3996f5a`). Deploy auto-triggers on the push to `main` (Vercel Git integration).
- ⬜ **YOUR TURN:** eyeball the live deploy (affiliate header crops across a few bags; mobile menu 4-cap + scroll). **Optional:** greenlight a prod read and I'll measure real before/after image coverage (validates the "nearly every bag has a TLC listing" assumption with n + date).

---

## TL;DR — Unified bag-finder + closet-add-is-review, SHIPPED (2026-07-08, on `main`)

**One search component now powers the nav (desktop + mobile) and adding a bag to your closet; adding a Have/Had bag IS the review.** Spec: `docs/ux/unified-search-and-review-spec.md`. Grew out of the owner's founder-first-reviews idea (she wants to be the first reviewer on every bag she has carried; recruit founding reviewers into a working flow).
- 🔎 **`BagFinder` (`src/components/BagFinder.tsx`) + `/api/bag-finder` (`src/lib/bag-finder.ts`, 12 unit tests):** click into search and a popular-first grid is ALREADY there (populate on focus, never a blank box); typing narrows live; a query that resolves to one model, or tapping a model, shows that model in its COLOURWAYS so a fuzzy owner picks by sight, plus a "Not sure" tile that always completes. Only the click DIFFERS by context: nav opens `/bag/[variantId]`, closet opens the Want/Have/Had fork.
- 📝 **Closet-add-is-review (`src/components/ClosetAddFlow.tsx`, `/closet/add`):** Have/Had opens the review inline in one sheet, wired to existing `submitReview` + `saveToCloset`: stars + words + worth-it + occasion + durability + the 5 opinion axes as optional 1-5 pips (`castAxisVote`). Reviews are PER-VARIANT (the chosen colour's rep variant; "Not sure" uses the model hero). All fields past the star rating are optional so the founding-reviewer floor stays low.
- 🧩 **Refactor:** `AXES`/`AXIS_META` moved to server-free `src/lib/axes.ts` (votes.ts re-exports) so the client sheet imports them without server code. `holds_value` + `worth_the_price` stay app-layer-excluded (facts, not votes).
- ✅ **Correction:** migration 0012 was ALREADY applied (verified live: `bag_axis_vote` responds 200 + has data; `<AxisVotes>` renders on bag pages). Fixed the stale "not yet applied" notes in `review-data-leaderboards.md`.
- 🧪 **Gates green each land** (tsc/eslint/next build/605→628 tests). API verified vs REAL data on the Vercel preview (populate-on-focus, `q=lady`, colourways all returned real bags). Landed via `scripts/land-to-main.sh` (commits incl. `237ec44`); PR #15 merged.
- ⬜ **YOUR TURN:** (a) eyeball the UI on the live site (nav search grid + `/closet/add` behind login) if you want a human pass. (b) The **founding-reviewer recruiting copy is drafted** (Chanel-group post + DM + alt hook) in this chat, ready to post when you are (outward-facing, so yours). Recruit only once you are happy with the live flow.
- 🔧 **Follow-up (optional):** richer photo-fallback that maps an uploaded photo to the exact catalog bag (today the fallback reuses `requestBag`: "ask us to add it", never a dead end). Mobile nav now uses the same finder.

---

## TL;DR — Bag-page contribution slots: "Have this in hand?" (2026-07-08, on `main`)

**The "give us your stuff" surface for bag pages, all 3 phases LIVE (migration applied 2026-07-08).** A gap-aware banner (`ContributionSlots.tsx` + `SlotChip.tsx`) reads what the signed-in user already gave for a bag and shows only the OPEN slots, each one tap/photo, with an "added X of Y" pull and a thank-you when done. Locked copy (owner-approved 2026-07-07): headline *"Have this in hand? Show us how it really carries."* + sub *"Takes a second. Add what you've got. Skip the rest."* Spec + status: `docs/ux/review-data-leaderboards.md` (Build status 2026-07-07).
- **Phase 1 LIVE now** (no migration): photo / review / axis-bars slots, anchored to the existing controls.
- **Phases 2+3 NOW LIVE:** carry + weight-feel taps + a short "what fits inside" note on table `bag_wear`. **`0046` APPLIED to prod 2026-07-08** (db-migrate run `28920858437`; it was the only pending migration, clean; verified `bag_wear` + `fits_note` respond 200 via REST). `getWear` still returns `available:false` if the table is ever absent, so the page degrades safely. Measured dimensions intentionally NOT a slot (catalog data → Suggest-an-edit).
- **Instrumentation:** open-slot clicks fire `contribution_slot_clicked` (`slot`+`variant_id`) = funnel START; completion read from the rows. Gates green each land (tsc/eslint/next build/tests); verified pre-migration render on `/bag/1002`.

---

## TL;DR — Founder-face b-roll bank + face-vs-faceless test staged (2026-07-07, on `main`)

**Owner filmed 16 own-face desk clips (bag wall behind); built a reusable bank + a face-vs-faceless test.**
- 🎥 **Bank:** `~/Documents/handbag-campaign-images/founder-broll` (16 originals + silent 1080x1920 vertical cuts; TV background audio stripped). Catalog + ratings: `tools/video-pipeline/founder-broll-manifest.json`. These are a VISUAL BED for existing text/voiceover posts, not standalone clips.
- 🛠️ **Tools:** `scripts/montage-vo.mjs` (lay an existing voiceover + its captions over a founder bed) and `scripts/montage-card.mjs` with `pos:top` (text hook over a founder bed, clears her face). Founder variants of all 21 text posts + 1 VO pilot built (`output/*-founder.mp4`).
- 🧪 **The test (face vs faceless):** 12 matched pairs staged as Metricool **drafts** (blogId 6480195, `draft:true`, `autoPublish:false`), each B-arm mirroring its faceless twin's exact caption/hook, ~7 days after the twin (Jul 15–Aug 4). Plain-language tracker: `docs/social-experiments.md` (front door to the ledger). Post ids in `tools/video-pipeline/reels-log.md`.
- 🧠 **Rules locked:** Metricool = source of truth (if a post isn't there it isn't real); when the tested variable is the visual, reuse existing text verbatim (both in `preferences.md`).
- ⬜ **YOUR TURN (2026-07-07):** (a) **These 12 are DRAFTS**, which conflicts with the locked "scheduled + autoPublish ON" default — decide per pair whether to flip them to auto-publish (Metricool auto-picks sound) or keep as review-drafts; auto-publishing 12 test posts is outward-facing, so left to you. (b) **Re-confirm the 12 faceless twin ids** in `social-experiments.md` (paired by title; least-sure = `still-thinking` #346293447). (c) 9 statement/`kw2-the-day` founder renders are **shelved** (no Metricool twin = not real).
- 🔧 **Follow-up:** `docs/social-experiments.md` (plain) overlaps the engine's `social-performance-ledger.md`; kept as the friendly front door pointing to the ledger. The engine's backfill (pull `getScheduledPosts` + `reels-log.md`) will log the 12 pairs as ledger rows automatically.

---

## TL;DR — De-AI / anti-slop audit: site is CLEAN; 2 small fixes pending owner greenlight (2026-07-08, audit only, nothing landed)

**Audited the whole site (design + copy, read from the real source) against the impeccable.style "de-AI"/anti-slop checklist.** Source of the checklist = the open-source repo `pbakaus/impeccable` (`.agents/skills/impeccable/reference/{craft,typeset,critique,brand}.md` on raw.githubusercontent); the live `impeccable.style/slop/` page 403s our proxy and firecrawl was not mounted, so the repo is the recovery path if we need it again.
- 🎨 **Design: clean, ONE tell.** We use **Playfair Display** (serif), named on their "reflex serif" avoid-list — and our own `voice-and-tone.md` §0 warns against exactly this heritage-hush serif cliché. Everything else passed: zero purple/blue "make-it-pop" gradients (our 8 are gold/surface tones), zero gradient text, 9 shadows total site-wide, no side-tab-border cards, no icon-tile-per-heading, zero emoji.
- ✍️ **Copy: clean.** Full editorial read (20+ seed articles, ~30 bag + ~35 house stories, HomeHero, AboutStory). Filler-phrase sweep and "not just X, but Y" sweep = zero in shipped prose. Only 3 one-word hype nits: "ultimate" (`src/lib/bag-stories/data.ts:1303`), "iconic" (`supabase/seed/seed-archive-reference-articles.ts:171`), "vibrant" (same file:177).
- ⬜ **PENDING (owner did NOT greenlight — do NOT do unasked):** (a) swap Playfair → distinctive serif, recommended **Newsreader** (keep Poppins for sans); (b) fix the 3 hype words above; (c) optional — vary the compliance closer "an estimate, not an appraisal" (repeated verbatim across many data articles) so a binge-reader doesn't clock the identical sentence; keep the hedge itself (locked). All low-effort, one build pass.
- ⚠️ **Coverage caveat:** 100% of repo-seeded content was read. Any article typed straight into the LIVE site editor (`/articles/new`) exists only in the DB and was NOT audited — owner never confirmed whether any such DB-only content exists. If it does, needs Chrome/desktop or DB read access to check.

---

## TL;DR — Vivrelle rent-and-shoot content-needs engine (2026-07-08, on `main`)

**Built a self-reranking tool that says which bag to photograph next for the site, tracks what's shot, and schedules against her Vivrelle plan.** Source of truth: `docs/content-needs.md` (regenerate `npm run content:needs`; logic in `scripts/content-needs/` — `catalog.ts` = what the site needs + the plan + logged decisions, `captured.csv` = what's shot).
- **Plan decided: Classique+ (2 items/mo).** No Couture (in-hand Classic Flap was its last job), no Réservé/Privée (Birkin/Kelly already shot via the Fashionphile showroom, so ~0 image gain for ~$800/mo invite-only), no Premier add-on (owner live check 2026-07-08: Premier only has mini/belt Marmont + Cassette; the real full-size ones are Classique).
- **Ranking = site-surface value per rental dollar:** homepage canon (`queries.ts HERO_STYLES`) + slideshow cutouts + protective-feet/seeded-auth heroes + About cutouts + live search demand, minus a **partial-credit discount** when a variant already covers the silhouette (Epi Neverfull in hand demotes the Monogram twin from ~6 to 1.5).
- **Queue (11 Classique, ~6 months at 2/mo):** Speedy → Lady Dior → Alma → Goyard Saint Louis → Marmont → Jackie → Cassette → Neverfull(mono) → Goyard Artois/Pochette Métis/OnTheGo. **In hand now:** black caviar Classic Flap + Epi Neverfull (per-bag shot lists in the doc; shoot before returning).
- **Vivrelle mechanics learned (archivist, 2026-07-08):** 30-day min hold per item + 1 swap/cycle, so a slot = ~1 bag/month (fast-swapping does NOT add throughput); Classique+ ~$249 = 2 items = best $/bag (~$124.50); Premier add-on ~$49/mo recurring (not one-time), Premier closet only.

**Your turn:** (1) shoot the two bags in hand + tell me so I mark them captured and the queue advances; (2) switch the Vivrelle plan to Classique+ in-app when ready. Work is on branch `claude/vivrelle-rental-bags-4j80zx`, landing to `main` this wrap-up.

---

## TL;DR — Metricool calendar re-timed to clean 2/day; migrations confirmed live; stale branches cleaned (2026-07-07, on `main`)

**Calendar (blogId 6480195) re-shaped to a crisp cadence, no collisions.** Supersedes the prior "1/day Jul 8–Sep 8" note for the Jul 7–Aug 20 window.
- 📅 **Jul 7–26 = 2/day, alternating:** value/data post at **12:00**, lighter keep-warm/reflection reel at **18:00**.
- 📅 **Jul 27–Aug 20 = 1/day** at **12:00** (value, a few reflection reels mixed). Content only supports ~1/day past the launch fortnight; not forcing 2/day with filler.
- 🧹 Fixed 3 collisions (value/founder posts double-stacked at 18:00 → moved to open noon slots), un-jammed the overloaded Jul 15–18 (moved 4 orphan engagement reels 10:00 → 18:00 on sparse Jul 23–26), and **emptied the awkward 10:00 lane entirely**.
- ⚠️ **Co-editing is live:** this Metricool is edited by several concurrent chats (with her consulting). Make **surgical diffs, never blind full-calendar rewrites**. Metricool ops gotchas: `getScheduledPosts` needs a full ISO offset (`...T00:00:00.000-04:00`), `updateScheduledPost` echoes the WHOLE payload and returns a NEW `id` each save (uuid is the stable key).

**Migrations 0044 + 0045 CONFIRMED APPLIED to the DB** — closes the older "your turn: apply 0044" item. Run `28824249861` (`db-migrate.yml`, 2026-07-06 21:24 UTC, success) log shows `Applying migration 0044_style_protective_feet.sql` + `0045_newsletter_subscriber.sql`. Protective-feet + newsletter table are live (project `pewmdztviyrtbhtebcct`). `db-migrate` is manual-dispatch only; future migrations need her to run the Action.

**Stale branch cleanup (both were already full ancestors of `main`, nothing to merge):** deleted `feat/about-founder-editorial` (local + remote) and `feat/protective-feet` (local); removed their 2 idle agent worktrees (verified 0 uncommitted first). Their deliverables (About editorial, migration 0044) shipped on `main` days ago.

**Face-rule corrected in `preferences.md`:** there is **NO faceless rule** — her face is welcome when it's purpose-shot and looks good; the bar is QUALITY, not a ban. Old candid captures come down; new talking-head is a pacing choice, never a blocker. (Memory `social-content-tiers` already held this; preferences now matches.)

**⚠️ YOUR TURN (outward-facing only):** (1) publish the notification carousels as their phone pings land (auto-publish reels fire on their own; the love-language reel already has its music); (2) add trending sounds in-app where you want them; (3) upgrade Metricool to paid to lift the Free 20-posts/month cap.

---

## TL;DR — Monetization sprint: strategy asked, ALL greenlit, shipped + verified same day (2026-07-06, on `main`)

**Owner asked "make the most money"; greenlit every lever; every build item landed, deployed, and verified live.**
- **Shipped to `main` (merge `fe4bb29`, full gate green, 593/593 tests):** newsletter opt-in (footer + `/articles`; **migration 0045 APPLIED** via the Action, run success + table verified live, 0 rows; capture-only, sending/unsubscribe build with the first send) · **"Deal alerts Pro" fake-door** firing `monetization_interest` (watchlist card + bag-page bell moment; copy option A shipped) · pulse now reads `article_viewed`/`bags_compared`/`attribute_object_viewed`, dead `style_viewed` deleted · **monthly "State of the Resale Market" generator** (`scripts/market-report.ts`, n-gated per the factuality protocol; July draft at `docs/research-drafts/market-reports/2026-07.md`) + scheduled task `market-report-monthly` (1st, 7am) = **loop 7** in `automation-map.md`.
- **Plan of record: `docs/monetization-sprint-2026-07-06.md`** (owner vs build checklists; affiliate board as of 07-05: eBay ACTIVE, TRR awaiting Impact activation, Fashionphile declined → ShopMy route gated on social posts, Skimlinks locked to ~09-25, CJ/Awin/Redeluxe pending, Amazon deferred by her 07-05 call).
- **GSC: connected since 06-22 (docs corrected, `3e09cd1`); D3+D4 dashboard checks DONE 07-06 via her Chrome (`64eed1f`):** product-snippets validation **PASSED on its own** (Invalid 0 / Valid 1, GSC update 7/4) → bag pages rich-results eligible; redirect list = expected canonicalization + `/watchlist` (signed-in redirect, verified NOT in sitemap). **297 pages indexed** (update 6/29) of 1,376 sitemap URLs — healthy week-2 pace; GEO check-in 2026-08-10 stands.
- **CTA audit: NO gap** (buy/sell sits under the value card; mobile sticky bar covers first paint) — the analyst's zero-outbound read stays explained by first-party traffic.
- **Deploy verified on the live site:** the newsletter form renders on the www footer (checked post-deploy, not just the build).

**YOUR TURN (2026-07-06):** (1) **publish the staged Metricool posts → then apply to ShopMy** (reopens the Fashionphile line; ShopMy judges public socials, IG/TikTok were 0 posts as of 07-05); (2) watch **arielle@luxurycatalog.com** for the **TRR Impact activation email** → paste the tracking ID (goes into `NEXT_PUBLIC_AFFILIATE_THEREALREAL`); (3) optional 2 min: click **Run now** on `market-report-monthly` in the Scheduled sidebar to pre-approve its tools.

---

## TL;DR — The business is now CIRCULAR: 6 closed loops + cross-feed flywheel (2026-07-06, on `main`)

**Owner: "I want everything circular, self-updating" → built the full loop registry, `docs/automation-map.md` (read it first for any automation question).** New this pass: (1) **Analyst implementer** (`analyst-standard.md` §6): every decision now carries `Class: AUTO` (in-repo, reversible, non-outward, gate-passable) or `Class: OWNER`; the Monday brief run implements ≤3 AUTO decisions/week in a temp worktree via `land-to-main.sh`, flips them to `DECIDED (auto-implemented, commit X)`, and lists them in the email under "Implemented this week" — recommendations stop rotting in the feed (4 sat OPEN as of 2026-07-06). (2) **Article engine** (`docs/article-engine.md` + backlog/ledger `docs/article-backlog.md`; scheduled task `article-engine-weekly`, Tue 9am): demand signals (search_not_found, social winners, archivist slate, trend terms) → scored backlog → ≤2 articles/week by the `copywriter` to the full §3 bar → staged as DB `draft` rows (seed-script pattern, status never set on update) → **she publishes** (author UI / publish-articles.yml) → performance feeds the next cycle. (3) **Archivist standing pull** (`archivist-monthly-pull`, 1st + 15th @ 9:30am, owner bumped to twice-monthly 2026-07-06): works the seasonal-archive worklist, lands sourced findings, cross-feeds ideas to both content backlogs. (4) **Cross-feed rules** (automation-map §2, binding): social winner→article item; article winner→social series; search_not_found→data-capture target; archivist→both; analyst→everything; every loop leaves a dated n-carrying ledger trail. Safety line (§3): publishing, migrations, spend, published numbers stay hers, always. Also new: the social engine's **playground posture** (`social-performance.md` §6b: every post = a logged hypothesis, ~1/3 of each batch = exploratory novel combos of cleared ingredients) + the **ingredient scorecard** (§5b: promote n≥3 ≥1.5x winners, retire repeat losers only after a clean one-variable test). **(5) The SUPER-ANALYST (owner-locked: one analyst, never separate UX/marketer agents):** every weekly brief walks three mandatory lenses (analyst / marketer / UX reviewer) + a persona walk on the month's first brief (`analyst-standard.md` §7). Still open (her setup): comment-engagement pipe (Apify path); the GSC queries→article-engine pipe. (Newsletter opt-in SHIPPED + GSC already connected — see the monetization-sprint TL;DR above.)

## TL;DR — AUTOMATED social engine: closed loop analyze → iterate → backlog → create → draft (2026-07-06, on `main`)

**The social pipeline now runs itself to the draft line; publishing stays hers in Metricool.** New standard **`docs/social-performance.md`** (binding on engine runs): Metricool analytics (field IDs verified live 2026-07-06) + PostHog search-key entries → per-post verdicts vs segment baselines with small-n honesty → the §4 decision tree spawns **ONE-variable experiments** (same messaging × new visuals, same visuals × new messaging, new CTA, new hashtags, new timing) → written to the **Notion Content Pipeline** (Source: Analyst; auto-greenlight only for faceless variants of solid-or-better parents) → faceless creation (video pipeline, slideshow rules, cleared libraries) → **Metricool drafts (`draft:true`), never published**. Append-only memory: `docs/social-performance-ledger.md`. Anything needing her face/voice/footage = a **FILM ASK** (Notion item + push notification), never a blocker. **Orchestrators:** scheduled tasks `social-engine-weekly` (Thu 9am, full loop) + `social-engine-pulse` (Mon 8:30am, breakout fast-follow + 7-day runway top-up), both running the `social` agent in the new dedicated worktree `~/Documents/luxury-catalog-social-engine` (branch `social-engine`, resets to origin/main each run). Agent def updated: third run added, publish-gate vs draft-gate split, Metricool + Notion MCP tools added to its allowlist, campaign/b-roll libraries added to media sources. **⚠️ Your turn (one-time, ~2 min): click "Run now" on `social-engine-weekly` in the Scheduled sidebar and approve its tool prompts once — approvals stick to the task and future runs never pause. Note the Metricool Free plan's 20-post/month cap paces the engine until upgraded.**

---

## TL;DR — B-roll review + week-2 content sprint staged (2026-07-06, on `main`)

**Reviewed the whole b-roll bank, then stocked 9 posts across all 3 tiers as Metricool drafts.**
- **B-roll usage manifest:** `tools/video-pipeline/broll-manifest.json` = owner's per-clip in/out windows, tags, rejects (2588/2578/2606 = too much movement), hold (3053 waterfall) from a full review of the ~92-clip bank. Un-annotated clips = full clip. READ IT before pulling any keep-warm clip. Ready 6s vertical cuts from the trimmed windows are in gitignored `output/broll-cuts/`.
- **Publish-time default locked:** 10:00 ET (peak on both IG + TikTok, Metricool best-time 2026-07-06), then 18:00, then 12:00; one post per slot per day. Canon: `docs/social-content-calendar.md` §3.5; also in preferences.
- **Staged as Metricool drafts (blogId 6480195, autoPublish false):** love-language reel (today 18:00); 6 keep-warm reflective reels 10:00 Jul 7-12; 6 more keep-warm 10:00 Jul 13-18; **Hero** Chanel-flap leather/hardware data carousel (Jul 15 18:00); **Signature** her-real-bags carousel (Jul 17 18:00). Specs `examples/kw-*.json` + `kw2-*.json`; slides via new `scripts/make-slides.py` (Georgia serif, ink+gold). Full ids in `tools/video-pipeline/reels-log.md`.
- **Media-host workflow (zero-setup):** render → temp GitHub release → Metricool ingests the public URL to its CDN → delete the release. Confirmed working this session for video + image carousels.
- **NEW Hero format — data-comparison SLIDESHOW (2026-07-07):** `scripts/make-compare-slideshow.py` builds a 5-slide 1080x1350 same-world two-bag value carousel (config-driven pairings + a "reversal" mode). **4 staged as Metricool drafts** (IG carousel + TikTok slideshow, rolling Wed 10:00 ET Jul 22-Aug 12): Neverfull-vs-Speedy 346218934 · Flap-vs-Birkin 346219038 · Birkin-vs-Kelly 346219069 · Flap-vs-Kelly 346219094. Two locked rules this drove: **a slideshow ships as slides, never a fake-motion mp4**; **compare same-tier bags only** (both now in preferences). Numbers all traced/dated/hedged.

**YOUR TURN (2026-07-06/07):** (1) add a trending sound in-app to each staged reel + the 4 compare slideshows, then publish from the Metricool planner (all draft, none auto-publish); (2) **refresh the Hero carousel's two figures** (~$7,200 / ~$4,700, Chanel Classic Flap caviar+gold vs lambskin+silver; source TheRealReal June 2026 n=116) against live data before publishing; (3) optional: tell me the exact models of the Signature bags and I'll add accurate names.

---

## TL;DR — TikTok swipe file + batch 1 reels (text-card format) (2026-07-06, on `main`)

**From her saved TikTok DMs → a hook bank + 8 post-ready reels + a locked video format.**
- `docs/tiktok-swipe-file.md`: her saved inspo (creators + which sounds), verbatim caption bank, hook→payoff, the full rule-filtered hook bank, and **§9 = copy + per-post-type rules**. Sound finding: coaching videos use original/voiceover; the reusable trends are "how my brain sounds when…" + "girls will be like I needed this".
- **Text-card reels** (new pipeline mode, `tools/video-pipeline/scripts/montage-card.mjs`): one held clip + the hook shown STATICALLY on screen, Playfair serif, brand footer. 8 rendered (aff-deserve, value-fendi, doc-flight, first-bag, hermes-game, macbook-fit, junkie, hills) in `tools/video-pipeline/output/` (local, silent by design).
- **Accessibility enforced in code** (`src/brand.ts`, `CardStack.tsx`): min 46px text (headline ≥56), dark backing behind cream text, no pop-in. Rules: `docs/video-accessibility.md`. Locked in `docs/preferences.md` → "Short-form video + social content".
- **Post package** (caption + sound direction per reel): `docs/social-batch-2026-07-06.md`.
- **Owner rule reinforced:** keep her hooks verbatim (never trim the TikTok opener).

**YOUR TURN (2026-07-06):** per reel, pick + add a trending sound in-app, wire link + UTM (`utm_campaign=2026-07-swipe-batch-1`), publish; refresh the Fendi resale figures the day you post. NOTE: Metricool IS connected (see next TL;DR) — no reconnect needed to stage as drafts.

---

## TL;DR — Creator-study video rubric + on-screen follow-CTA shipped (2026-07-06, on `main`)

**Studied two TikTok coaches for transferable CRAFT (not their topics), turned it into a rubric, applied it, and shipped the highest-leverage fix.**
- **Studies (per-video, not averaged):** `docs/social-study-personalbrandlaunch.md` + `docs/social-study-lana-k-social.md`. Method locked in memory: extract technique, per-video, never adjacent topics.
- **Rubric:** `docs/script-requirements.md` rules 24-31 (layered hook, reason-to-stay, one follow trigger, categorization keyword, low-fi, one-topic-many-angles) + 4 pre-record checklist items.
- **Follow-CTA = first-class pipeline feature** (`FollowCta.tsx`; `headline.json` gains a `"follow"` line, auto-timed to the CTA phrase). Verified rendering; every future reel gets it with one line.
- **Alma PM comps FILLED** (was Ep 7 repo-only) from tracked comps (Fashionphile + The RealReal, US, 2026-06-23..07-02): monogram canvas ~$795 (n=148), Epi ~$1,040 (n=110); reframed the draft's wrong "Epi is cheaper" line. LV-nine series now record-ready.
- **3 Chanel reel drafts SWAPPED in Metricool** to the follow-card cut (ids 346158025 / 346158158 / 346158698, still `draft:true`, schedules kept). Metricool IS connected (a startup "needs auth" note was stale; swap workflow = temp GitHub release host → `updateScheduledPost` → delete release).

**YOUR TURN (2026-07-06):** review + publish the 3 follow-card Chanel drafts from the Metricool planner (blogId 6480195) when ready; they only go live on your publish.
---

## TL;DR — Social content engine + founder About page + protective-feet feature (2026-07-05, on `main`, merge `75c38a1`, all gates green: tsc/eslint/build/573 tests; keep-warm blend swapped 2026-07-06)

Built a faceless social content engine plus two features, merged same day. **Content: 60 Metricool DRAFTS staged (Jul 8 to Sep 5, ~1/day)** = data slideshows + history decks + opinion posts (overrated Chanel Flap, modern-usage thesis, auth myths, why-I-built, first-buyer, etc.) + persona posts + mobile-walkthrough reels + **20 keep-warm b-roll reels (Aug 2 to Sep 5)**. All FACELESS: owner can't film talking-head (blocker), but VOICEOVER is fine. **Design v4 locked:** question-hook covers, two-bag vs covers, NO spotlight circle (solid bg contrasting the bag), worth-it framing not negotiation, high bag/bg contrast. Hosted via GitHub-release then Metricool ingest. **New content types:** the mobile walkthrough (faceless, dynamic, VO-ready screen-recording of the live site; 3 built = worth/quiz/compare), the 3-tier system (Hero/Signature/Keep-warm), the b-roll bank (91 clips at `~/Documents/handbag-campaign-images/broll`). **Founder About page** (`/about`, editorial, framer-motion + lenis scroll motion): her real story (bag-feet origin to data democratization), feature-pivoting, quiz CTA, search key "the founder". **Protective-feet feature** (her origin made real): `has_protective_feet` attribute + Shop filter + review-report field + 13 hero styles seeded; **migration `0044`**. Source of truth: `docs/founder-story.md`. Many social/founder rules locked into `preferences.md`.

**Keep-warm blend (2026-07-06):** all 20 keep-warm drafts swapped in place to the final blended template — floating gold bag icon + `luxurycatalog.com` footer + a "know the facts on every bag" FOLLOW cue on every one; copy alternates aspirational ("You. This <mood>. And your dream bag.") on odd dates with the approved reflective lines on even. Same footage per date, overlay only. Count stays 60. Rule locked in memory `feedback-keepwarm-register`.

**Scheduling + sound setup (2026-07-06):** all 63 drafts rescheduled to **1/day, Jul 8 to Sep 8**, alternating **data/value → founder-voice → keep-warm** (no two keep-warms adjacent, no 3-in-a-row). Split by how sound gets added:
- **37 photo carousels → notification posts** (`draft:false`, `autoPublish:false`). Metricool auto-downloads the slides + copies the caption to her phone at each date; she selects photos, pastes, **adds a sound, shares**. First ping Jul 9. Needs the **Metricool app + notifications on**. (Why notification: Metricool's music feature is Reels-only, so carousels can't get a scheduler-added sound; she rejected silent carousels and converting slideshows to video.)
- **26 video reels → still drafts**; her step: in **Metricool web** add a **Top-100 trending song** (TikTok presets / IG Reel audio) to each + set live (auto-publishes). Silent until she does.
- **Sound facts:** TikTok Business account = Top-100 commercial trending only (fine, auto-publishes via Metricool). Non-commercial/viral songs need a **Personal account + native posting** and lose the clickable bio link, so avoid except a rare hero one-off.
- **Bios verified live (2026-07-06):** IG `@luxurycatalog_` → `www.luxurycatalog.com/social/instagram`, TikTok `@luxurycatalog_` → `.../social/tiktok` (both set + clickable); both landing pages render (per-platform grids exist on `origin/main`, currently show the same 3 cards until more content is registered).

**⚠️ Your turn:** (1) apply `supabase/migrations/0044_style_protective_feet.sql` via the db-migrate Action, then run `npx tsx supabase/seed/seed-protective-feet.ts --write`; (2) **finish the reels:** add Top-100 sounds in Metricool web + set them live (carousels are already notification-scheduled); (3) drop a founder photo at `public/about/founder.jpg`; (4) record VOs for the walkthroughs if wanted (scripts in chat).

## TL;DR — Persona/flow review IMPLEMENTED: every rec built same day (2026-07-05, branch `ops/ux-persona-review-0705`, owner said "do all your recs")

**Full findings + status: `docs/ux/persona-flow-review-2026-07-05.md`.** Highlights, all gates green (tsc/eslint/next build/573 tests): **P0 trust bugs** fixed (brand-gated bag stories: LV pages no longer tell Bottega's lore; alert cron retail_msrp filter + never fires on sold rows; median-based price verdicts; provenance flags translated to reader hedges; strategy doc G2 reconciled). **Conversion spine:** search puts matched styles above brand dumps; compare tray clears the mobile sticky bar + compact compare toggles on shop/search cards; /compare gained auth + live-price hand-off rows (tracked); live-listing clicks finally fire outbound_resale_clicked; landed-cost estimates surfaced (platforms.ts estimateLandedCost was built-but-unused). **Top of funnel:** quiz results + heart-saves now survive signup (lc_pending_quiz was read but never written; new PendingSaveFlusher). **Collector core:** ONE resale-median value engine across homepage tile + /closet + /closet/report (was retail sums; gain/loss never computes against retail; per-currency totals; CSV disclaimer; sold/asking badges; honest scope pill; jargon gloss line). **New events:** closet_value_viewed, alert_updated, report_viewed/exported, auth_section_engaged on guide reads, bags_compared sources. **Owner reversal recorded:** rent links ship pre-approval (Vivrelle still pending). **⚠️ Owner action: run the db-migrate Action for `0043_closet_value_snapshot.sql`** (value-over-time sparkline + weekly closet-snapshots cron; degrades gracefully until applied). **Deferred to data lane:** U-DEALS-MIDTIER in the worklist (Coach deals need eBay colour/material specs). **Proposal awaiting owner (nav is protected):** rename the nav "Deals" door "Shop the market" → /shop with Deals as the toggle.

## TL;DR — Owner UX-vision review: bag-page declutter + quiz example deck (2026-07-05, on `main`)

**Owner asked for a full site review against her documented vision; the drift was concentrated on the bag page, all fixed + merged same day** (merges `8a64828` + `cb8fd5d`). (1) **Bag page was ~48,000px tall:** price-history rendered all 426 rows and For-sale all 105 listings; both now cap (12 / 8) with zero-JS `<details>` expanders, all rows still served for GEO. (2) **Variant selector:** the per-chip save hearts (the confusion she flagged) collapsed to ONE heart on the "Choose your X" header saving the viewed combination. (3) **Voice gate:** 20+ em dashes swept from bag-page copy/titles/footer; "on ebay" → "on eBay" via `PLATFORMS`. (4) **BagImage placeholder** chip/wordmark now container-query-gated (roomy tiles only; the "+ Add a photo" recruiting invite is unchanged where it fits). (5) **It-bags low** now uses the deals-style 70%-under-median guard (a stray $280 row printed as "Kelly low $280"). (6) **geo.ts "Authentication:" lead** must contain auth vocabulary (seeds led with popularity fluff). **Data fixes on prod** (old values in commit `1cbb918`): 7 production_record rows nulled (dimensions duplicated 1:1 in structured columns), Neverfull 217/218/219 marker leads de-fluffed, variants 203/214 em dashes replaced. (7) **Quiz module visual (owner pick):** the words-only callout gained the **example-read deck** (see the new locked preference; canon in `docs/ux/home-use-case-value-props.md`); watch `quiz_started` vs the old words-only baseline in PostHog. **Gotcha for worktree chats:** the preview harness reads the ORIGINAL repo's `.claude/launch.json`, so the default `web` config serves the wrong tree. FIX (proven 2026-07-05): add a config entry in the ORIGINAL repo's launch.json that runs `npm run dev --prefix <your-worktree> -- -p <free port>` (the `bagimg`/`social-routing`/`closeout` entries are the pattern), then preview_start that name — full browser verification works from any worktree.

## TL;DR — Chat close-out audit: 49 idle chats harvested + archived; the loose threads (2026-07-05)

**All idle chats were mined for unstored preferences (now in preferences.md) and unfinished work, then archived.** **Audit worked 2026-07-05 (close-out session): all 5 agent-side threads CLOSED, on `main`.** Outcomes, then what's still open:
- ✅ **Fashionphile enrichment CI FIXED + backlog drained (2026-07-05).** Root cause: grading 4,000 rows at ~0.9 rows/s ≈ 70 min vs the job's 55-min timeout → GitHub cancelled daily AND skipped the backfill/summary steps (per-row writes DID persist, so fill was 41.6% by 07-05, not the 8.3% the dead chat last saw). Grader now takes `--max-minutes` (clean exit, rest resumes next run); workflow passes `--max-minutes=40`. Remaining ~3,972-row backlog graded in-session: **live-listing condition fill = 99.9% (21,322/21,334, prod 2026-07-05; 12 permanent misses)**. Total FP fill = 49.9%: the other half is 24,047 SOLD rows whose product pages are gone — ungradeable by any refetch, so the old "~90% overall" target was never reachable. The cron's job now = keep new listings graded.
- ✅ **AuthEngageTracker: STALE ITEM, nothing to do** — it already landed on `main` via `87fb089` + fix `f38bb48` (not only branch `b2ab316`), is mounted on the current post-declutter bag page (`page.tsx:599`), both anchor ids intact, verified firing to PostHog 06-30.
- ✅ **"Authentication by house" fixed (on `main`):** `/authentication` renders a compact house-card grid — label = title minus the shared "…authentication: the markers worth checking" formula (NOT the topic tag, which over-narrows house guides to their flagship style); non-house guides (red-flags) list under "Beyond the houses". Browser-verified. Alternates offered: de-boilerplated list, monogram tiles; grid shipped as the default, swap on her word.
- ✅ **TRR rejection disambiguated (Gmail audit 2026-07-05): NO TRR rejection email exists.** The only rejection *email* is **Skimlinks, 06-25**; Fashionphile's decline (07-02) shows in the Impact dashboard only. So "rejected by TRR" was a mix-up — TRR is in fact the furthest along (invite **accepted 07-05, awaiting activation**, per the dashboard-verified board in `data-collection-handoff.md` §11, where this finding is folded in).
- ✅ **Impact.com brand intro recovered + fixed:** the 3 A/B/C drafts (recovered from the dead 06-30 chat's transcript) live at `docs/research-drafts/impact-partner-intro.md`, openings corrected to "Luxury Catalog". `/privacy` already named Impact; `/disclosure` now names the networks (Impact, CJ, Awin, Skimlinks, EPN) and links `/privacy`. **Her turn: pick A/B/C and paste into the impact.com profile.**
- **Owner decision, still open — TRR daily Firecrawl cron (`firecrawl-capture.yml`, 06:23 UTC):** new evidence 2026-07-05: that day's run landed **10 observations for 11 credits** (the search-page path still yields rows; not pure 403 waste). So the call is spend policy, not a dead pipe: keep (~11 credits/day for a trickle of TRR asks) vs pause. My take: pause and rely on the monthly recapture unless she's reading TRR asks weekly.
- **Social lane:** the @goldst.ai trend-series enumeration (Apify, 57 videos) died mid-pull; redo when wanted. The Aug 14 2026 "auspicious launch day" candidate lives only in a dead chat — record it as the target if she confirms.
- **Known her-turn items still standing:** re-film the watermarked diaper reel; record kit 1; supply the 2 Chanel model names (stills manifest — two Signature-carousel bags shown with generic labels until she names the exact models). ~~paste the TikTok bio URL~~ DONE 2026-07-10; ~~confirm/kill the Miu Miu hold~~ RELEASED 2026-07-10 (catalog-of-all). **Affiliate (07-05):** publish social content BEFORE applying to ShopMy (IG/TikTok both 0 posts = likely rejection; ShopMy is the route back to Fashionphile+TRR+Rebag); reapply to Skimlinks after ~2026-09-25 (90-day lockout); apply to Amazon Associates ~2-4 weeks pre-launch (180-day/3-sale rule); watch for Redeluxe approval reply.

## TL;DR — Parallel-chat collisions FIXED: one landing script + edit blocking (2026-07-05, on `main`)

**Owner hit chat-clobbering + failed merges + CPU spikes again (six live chats shared the primary checkout and switched each other's branch mid-turn).** Root cause: AGENTS.md/wrap-up prescribed `git checkout main && git merge` which ALWAYS fails outside the analyst worktree (it holds `main`), so chats improvised and work got stranded; the worktree guard only warned. Fixes, all live: **(1) `scripts/land-to-main.sh`** is now the ONLY way to land on main (merge origin/main into your branch → green gate, docs-only diffs skip it → shared lock so two chats never `next build` at once → `push origin HEAD:main` with retry) — AGENTS.md §2a + wrap-up skill rewritten to use it; **(2) `worktree-collision-block.sh`** (PreToolUse) hard-BLOCKS file edits in a folder where another chat was active <15 min, keyed on the edited file's path so moving to a fresh worktree unblocks immediately; **(3)** the SessionStart guard now also lists live chats in OTHER folders + the rule **one live chat per lane — never duplicate a running task** (duplicates burn the shared Claude limit). Mechanics: `docs/parallel-sessions.md`.

## TL;DR — GSC "Page with redirect" alert: diagnosed, one real fix (2026-07-03, on `main`)

**Owner got the GSC email (2026-07-03) "New reason preventing your pages from being indexed: Page with redirect" for the `luxurycatalog.com` domain property.** Diagnosis: (1) the one self-inflicted case — `/deals` was listed in `sitemap.ts` but is a redirect stub to `/shop?deals=1` → **removed from the sitemap** (nav links to it are fine, it just shouldn't be submitted for indexing); (2) everything else is *expected* canonicalization Google is recrawling after recent changes: old `/posts/*` + `/closets` URLs 308 to `/articles/*` + `/coveted-closets` (intentional, keep), and apex + `*.vercel.app` hosts 308 to the canonical `https://www.luxurycatalog.com` (Vercel primary, per desktop-todo B1/B5). **Defense-in-depth:** `SITE_URL` fallback in `src/lib/geo.ts` (+ the auth-actions origin fallback) flipped from the vercel.app URL to `https://www.luxurycatalog.com` so a missing env var can never advertise a redirecting host in sitemap/JSON-LD (prod env var already correct since B5). Rule: **never list a redirecting URL in the sitemap.** Owner check queued as desktop-todo **D3** (confirm the GSC report lists only the expected URL families). **Same session, the 2026-06-23 Product-snippets email also dug into + FIXED:** the critical issue was "Either `offers`, `review`, or `aggregateRating` should be specified" — `productJsonLd` (src/lib/geo.ts) emitted Product markup with none of the three, so every bag page was ineligible for product rich results. Fix: bag pages now pass an **AggregateOffer built from the page's own `listed` resale rows** (low/high/offerCount/currency — the exact comps rendered on-page; sold rows excluded as they're history not offers; block **omitted when no listings/currency** per never-invent) + the variant image into the JSON-LD. Unit-tested (`geo-product-jsonld.test.ts`). Owner validate-fix step queued as desktop-todo **D4**.

---

## TL;DR — Bag-detail declutter: compact hero + honest selector axes (2026-07-02, on `main`)

**Owner flagged the bag page fold + weird selector labels; both fixed same day.** Hero image (photo or placeholder) capped at 320×240 centered (was full-column ~575px tall) so the value module sits above the fold. Variant data normalized (styles 218/3/200/2): size chips = size code only (PM/MM/GM/BB), colour chips = canonical canvas/colour name (Monogram, Damier Ebene), "varies by season" junk nulled; originals preserved in commit `3e8161c`'s message. **New rule (locked in preferences): every per-variant detail = own DB column + selector dimension** — selector now derives axes from ALL captured fields via `src/lib/variant-dims.ts` (shows an axis only when it varies AND isn't implied 1:1 by an earlier axis; unit-tested). **✅ Migration 0041 APPLIED (2026-07-05, run 28748985331):** `variant.trim_material` is live on remote + Neverfull backfill verified (Vachetta on Monogram/Azur, smooth dark leather on Ebene). Two snags cleared en route, both logged: the blocked run needed the duplicate 0038 renumbered — `0038_variant_price_summary_fn.sql` (unapplied) → `0042` (the recorded 0038 = `discovered_listing_full_spec`, left untouched per the locked lesson); the migrate Action also gained an optional **`include_all`** boolean input for genuine out-of-order (unique-version) cases. **Full-catalog audit done same day (1,404 variants / 758 styles):** Hermès Birkin/Kelly sizes stripped to bare numbers, Swagger cleaned, 6 scrape-artifact numeric sizes (235/236/237) nulled; legit oddballs kept (My ABCDior, Reissue 224-227, Mini (Rectangular)). Selector polish: numeric sizes sort ascending ahead of named ones; "Standard" (the ingest catch-all — load-bearing, keeps its price rows) never renders as a size chip beside real sizes. **Then owner challenged "Standard" itself → stripped at the display boundary SITEWIDE** (`src/lib/variant-label.ts` + `displaySizeLabel` applied at every render/mapping site incl. titles + GEO lead answers + embeddings; bucket pages now honestly read "Hermès Kelly" with no fake size; DB keys untouched). MSRP reference data (`src/lib/ingest/msrp-data.ts`) re-canonized to the new bare-size labels (+ colourway pin for Neverfull MM); msrp dry-run re-verified: 18/18 resolved, 0 unresolved, ambiguous cases land on the right variants. **Then the crawler end-state (2026-07-03):** "Standard" bucket variants that have sized siblings are now (a) dropped from `sitemap.xml` and (b) `canonical`-pointed at their first sized sibling in `generateMetadata`, so they stop competing as indexable near-duplicates (bucket `/bag/845` → canonical `/bag/214`; sized pages self-canonical; verified). Also fixed `getSitemapTargets` to page via `fetchAllRows` (was silently capped at PostgREST's 1000-row ceiling — sitemap now emits ~1,303 bag URLs, not ≤1000). Bucket DB rows + their price history untouched.

---

## TL;DR — CATALOGUE: full sweep + completion run (2026-07-02, all on `main`)

**Owner greenlit "do them all"; finish line A (resale-complete) substantially closed in one day.** End state: **price_history 57,165 (+14,818 today) · 761 styles · 1,388 variants · 28 brands.**
- **Method (repeatable):** per-brand `sweep-mine.ts` → curate `supabase/ingest/sweep-targets/<slug>.json` → `scaffold-from-spec.ts --write` → `fashionphile.ts --raw` → `load:prices --write` → `summary:refresh`. ~470 curated targets committed; monthly re-capture refreshes them all automatically.
- **Coverage (measured 2026-07-02, live FP listings vs catalog):** LV 60.0% → **80.5%**, Chanel **96.3%** (gap = out-of-scope SLGs). Gaps closed along the way: LV CarryAll (never targeted, 44 live listings), Birkin 40 + Mini Kelly 20, SL Jamie, Gucci Sylvie, Balenciaga First; Speedy Soft/Murakami contamination cleaned (93 rows) + excluded.
- **FP-zero brands:** Coach 311 eBay live-ask rows (Tabby/Pillow/Willow/Brooklyn/Rogue/Swinger) + Kate Spade/Longchamp/Michael Kors first-ever data, via Firecrawl-MCP search pages (9 credits; local FIRECRAWL_API_KEY doesn't exist, MCP route needs none). eBay targets committed in firecrawl-ebay.ts.
- **Vestiaire second source:** 99 rows on thin-brand single-variant styles (colour/material/region from slugs), incl. **8 SOLD Peggy rows = first realized The Row data**.
- **Current-line (B) prototype PROVEN on loewe.com** (1 cr/page, line name in URL path): found + created 8 current lines resale doesn't carry (Scarf Bag, Amazona 180, Cala, Bilbao Bucket, Braid Basket, Punch Hole Hobo, Hammock Flip). Rollout runbook in the worklist.
- **Open (worklist):** SLG expansion (owner: LATER, not now); Vestiaire remainder (Darling/Fendigraphy/First/Loco/Bow); eBay item-specifics enrichment (metered); B rollout per house; C (30-yr archive) = archivist standing pull.


*Split out of `docs/handoff.md` on 2026-06-25 to keep the live handoff lean. These are PAST session recaps (newest first): value module, operator launch, personalization phases, photo/auth, monetization audit, voice rewrite, finance/legal, UX overhaul (PR #3), engagement/social, expert posts. Read here for the build history of any shipped feature.*

> ⚠️ **Do not trust the dated 'not yet applied' notes below as current.** They were true as of each session (2026-06-22/23). The live, re-verify pending list is in `docs/handoff.md`; confirm applied-state in Supabase before acting on anything here.

---

## TL;DR — background strategy-analyst agent + first run + wiring fix (2026-06-28)

Built the always-on **product-strategy analyst** (the judgment layer above `analytics-pulse`/`digest`). All on `main`, gates green (tsc/eslint/next build/448 tests).
- **The brain:** `analyst` subagent ([.claude/agents/analyst.md](../.claude/agents/analyst.md)) + canon [analyst-standard.md](analyst-standard.md) (metric tree → 5 revenue lanes → funnel; strategy-assumption register; urgent-push thresholds; decision format; escalation ladder). It surfaces *decisions* (options + recommendation + metric moved), not dashboards, into [analyst-decisions.md](analyst-decisions.md).
- **The body:** two scheduled cloud runs in `~/.claude/scheduled-tasks/` — `analyst-daily-scan` (08:12, push-to-phone only if an urgent threshold trips) and `analyst-weekly-brief` (Mon 08:41, emails the digest). They run from a dedicated worktree **`~/Documents/luxury-catalog-analyst` kept on `main`** (real `node_modules`, symlinked `.env.local`), so they never touch lane worktrees. Notification model locked in preferences: chat-surface always, email weekly, push urgent-only.
- **First run (2026-06-28):** mostly first-party/dev traffic, history starts ~06-20, so no strategy bet is callable yet. One real fix shipped: **`auth_section_engaged` was defined but never fired** despite the bag page's auth disclosures, so added [AuthEngagementTracker.tsx](../src/app/bag/[variantId]/AuthEngagementTracker.tsx) (fires on the "How to authenticate" checklist scrolling into view + the "Serial & authentication tags" expander opening). Revenue-backbone proxy `outbound_resale_clicked` confirmed already wired (its 0 is just thin traffic).
- **Open:** add `outbound_rental_clicked` when the rental CTA ships; consider deleting the dead `style_viewed`. **Your turn:** open a `/bag/...` page + scroll to the auth section to confirm the event lands; optionally "Run now" the daily task once to pre-approve its push/email perms.
## TL;DR — analytics: live dashboards + persona-journey instrumentation (2026-06-28)

Built the analytics layer the owner asked for ("dashboards I can read"), worked **persona → outcome → journey → flow gap → instrument last** (canon: new `docs/analytics-strategy.md`; method also in `preferences.md`). PostHog read key (`phx_…`, project `478100`, US cloud) stored in `.env.local`; `npm run analytics:pulse` pulls live numbers any chat can render. First live read (30d): ~216 visitors, deep-read healthy (23 opened a bag → ~20 read value), but intent actions were **0** (saves/outbound/inquiry) and four taxonomy events were dead.

**UPDATE 2026-06-29: all five landed to `main`** (PRs #5/#6/#8 merged, #9 bag-compare merged earlier, #10 instrument-journeys closed because its commits were already an ancestor of `main`). The migration file `0035_persona_model.sql` is now on `main`; the **owner still applies it to the DB via the db-migrate Action** to activate G1's `motivations`/`maturity_stage` columns (onboarding degrades gracefully until then). Original branch list:
1. `analytics/pulse-dashboards` — `analytics:pulse` + refreshed 3-dashboard `setup-posthog.mjs`. No migration.
2. `analytics/persona-model` — **G1**: onboarding motivation multi-select + behavior-derived `maturity_stage`; legacy `persona` kept populated. **Needs migration `0035_persona_model.sql` (apply FIRST).**
3. `ux/bag-compare` — **G2**: `/compare` side-by-side + add-to-compare tray (`CompareControls`). No migration.
4. `analytics/instrument-journeys` (stacked on G2) — wires `catalog_filtered` on `/shop`, revives `auth_section_engaged`, adds `article_viewed` + `attribute_object_viewed` + `bags_compared`. No migration.
5. `feat/premium-fake-door` — premium-tools fake-door on `/watchlist` giving `monetization_interest` a home (~$40/yr M9, grounded in monetization-moments-audit). No migration.

Gates per branch: tsc, **eslint src** (the AGENTS gate; whole-repo `npm run lint` has pre-existing `any` errors in `supabase/ingest/*` from the data lane, not these branches), next build, npm test. **Still open (deliberate):** `inquiry_submitted` has no UI home (needs a lead form — a product decision); `style_viewed` has no style route (retire or repurpose). **DONE 2026-06-29: merged in order #6, #8, #5; #9 already in; #10 closed. The persona migration was renumbered `0035`→`0037_persona_model.sql` (0035 collided with the already-applied `0035_closet_want_spec`). Remaining owner action: run the db-migrate Action to apply `0037`.**

---

## TL;DR — data expansion: first p2p sold + 349 new priced variants (2026-06-26)

Data/capture session against the measured gap (high-end deep, mid-tier + realized prices absent). All on `main`, gates green (tsc/eslint/next build/439 tests).
- **First peer-to-peer SOLD data in the catalog (421 rows).** Coach Tabby 20/26/Standard + Rogue all sizes, captured from eBay completed-sales (recency-windowed), loaded via `load-sold.ts` as `price_type='sold'`. Coach Tabby 26 sells ~**$198 median** (range $60–$1,650). Every prior sold row was Fashionphile (premium, fixed-price); these are the first true realized comps. Variants already existed (no new variants needed — the gap was sold, not models).
- **Catalog 401→750 priced variants, 19.2k→23.1k asking rows.** New `promote-safe.ts` promoted **3,855 stranded `discovered_listing` asking rows → 85 new curated size-variants of EXISTING clean styles** (Celine Triomphe, Gucci Horsebit 1955/Ophidia/Jackie 1961, Chanel Vanity Case/Chanel 22/19, Hermès Evelyne/Constance/Picotin/Herbag/Garden Party/Bolide, Dior Lady Dior/Saddle/30 Montaigne, LV Multi Pochette/Keepall/Félicie/Speedy, YSL Le 5 à 7/Kate/Loulou, Fendi Baguette/Fendigraphy…). NO new style rows = no junk-style risk. Deduped by listing_ref.
- **`promote-discovered --write` stays the owner-gated stub** (it would mass-CREATE styles). **28 promotable clusters (≥20) need a NEW style → owner greenlight** before creation: run `npx tsx supabase/ingest/promote-safe.ts --min=20` to list them. New tool `audit-coverage.ts` = the per-brand/per-variant gap auditor (run anytime; the owner keeps asking "what are we slim on").
- **Transport solved + documented:** browser→repo uses **`get_page_text` body-transport** (write JSON to a `<pre>`, read it back). The localhost sink is **CSP-blocked on eBay/Poshmark/TRR**, and Chrome gates every blob-download after the FIRST per origin. All three sources are live + logged-in (TRR, Poshmark, eBay). Full method: `docs/research-drafts/poshmark-ebay-sold-capture.md` + `data-collection-handoff.md` §12.
- **Hero p2p SOLD (586 realized rows total now):** Chanel Classic Flap Medium +78 (v199, median $3,846, corroborates prior $3,897) and **Neverfull MM +87 (v218, median $770 vs our $1,245 asking)** loaded from eBay. So p2p sold exists for Coach (421), Flap (78), Neverfull MM (87). The Neverfull ask-vs-sold gap ($1,245→$770) + the Trends fading-icon read = a ready angle for the Content lane's Speedy-vs-Neverfull piece. Still queued: LV Speedy/Hermès heroes, mid-tier breadth (MK/Kate Spade/Longchamp/Mulberry — absent), Poshmark cross-source, the 28 new-style promotions.
- **2 data articles are LIVE as DRAFTS (wired, not just markdown):** post #15 `what-a-coach-tabby-actually-sells-for` + #16 `does-a-smaller-bag-cost-more`, with new charts `CoachResaleRealityChart` + `SizePriceCurveChart` (registered in `posts/[slug]/page.tsx`), seeded via `supabase/seed/seed-data-articles.ts`. Gates green; owner publishes.
- **Data-integrity fix:** `promote-safe` had created 12 duplicate size-variants where hero variants carried verbose `size_label`s (e.g. "Neverfull MM (Monogram)", "Medium (M/L)"). `reconcile-promoted-dupes.ts` merged them back (584 rows re-pointed, 12 variants deleted). **Corrected count: 401→738 priced variants** (not 750). One ambiguous case (Neverfull MM across canvases) left for review.
- **Google Trends pull DONE (7 sets, US):** findings in `docs/research-drafts/trends-keyword-pull.md`. Read via Trends' own `widgetdata/multiline` API (exact series, not eyeballed). Surprises: Kelly≈Birkin, **Classic Flap is the lowest-searched icon**, **Speedy out-searches Neverfull** (which fades 5y), Polène the breakout riser, "real vs fake Chanel" dominates auth intent.
- **Article pipeline from the data (Content lane to wire/chart/seed):** ranked idea slate `docs/research-drafts/article-ideas-from-data.md` + two publish-ready drafts: `coach-resale-reality-draft.md` (Tabby sells ~$198 vs ~$365 ask; Rogue holds 2.5-3x) and `size-price-paradox-draft.md` (Lady Dior/Constance invert by size; Triomphe doesn't). Every figure traced to prod with n + 2026-06-26 date. Left as drafts (not seeded/wired) to avoid colliding with the live Content chat on `src/app/posts/[slug]/page.tsx`.

## TL;DR — trusted-reseller evaluation + data-lane to-dos (2026-06-25)

Researched smaller, vetted luxury resellers beyond Fashionphile + TheRealReal (the owner's
data sources) for two uses: ingest their prices + hand off (revenue + data moat), and feature
them editorially (trust). All trust/price/affiliate signals dated 2026-06-25; trust framed as
reputation signals, not verdicts. **Full evaluation: `docs/trusted-resellers.md`.**
- **Flagged DO-NOT-REFER: Julia Rose Boston** (owner had cited it positively) — PurseForum
  complaints + BBB-listed-not-accredited. Recorded so a future session does not re-add it.
- **Flagship = Redeluxe** (5★ Trustpilot, money-back, mid-tier coverage the giants miss, and
  already the chosen creator partner). Open Shopify `products.json` feed verified, same path as
  Fashionphile. **Couture USA** also has an open feed (no affiliate; data/trust only).
- **Data lane:** appended an **"Incoming to-dos" block** to `docs/market-sweep-worklist.md`
  (Redeluxe priority + open-feed details, Couture USA, a reusable `shopify-products` adapter,
  source_url-for-affiliate). The data chat picks these up on its next `git merge origin/main`.
- **Metric:** these move **engagement + GEO** (denser comps + mid-tier coverage the moat lacks)
  and **set up revenue** (each captured listing becomes an affiliate hand-off once codes land).
- Code landed docs-only on `main` (`630d06f`).

### ⬜ Owner-gated to-dos — affiliate applications (recorded 2026-06-25)
Affiliate signups are outward-facing/paid, so they stay with the owner. Apply, then drop codes
into the env per `docs/data-collection-handoff.md` §11. Priority order:
- ⬜ **Redeluxe (priority, DIRECT)** — apply at `partners.redeluxe.com`; **confirm the rate**
  (the one number not verifiable without applying). Highest fit (flagship + creator partner).
- ⬜ **Rebag** — Impact (~7%, 3% over $2,500; confirm at signup).
- ⬜ **Yoogi's Closet** — own affiliate program.
- ⬜ **The Luxury Closet** — CJ (~5%).
- ⬜ **Vestiaire Collective** — CJ (~6 to 10%).
- ⬜ **Sellier Knightsbridge** (UK), **Luxe Du Jour**, **Luxe Collective** (Impact ~4%) — gap-fill.
- ✅ **Madison Avenue Couture** — MadAve Collective already applied (per data-collection-handoff).
- Before referring the unverified set (HER Authentic, Mightychic, FashioNica, CODOGIRL, Dallas
  Designer Handbags, The Luxury Savvy, Handbag Sense): run a reputation check first.

**⬜ Engineering follow-on (the real freshness fix) — unblocks once any code lands:** build a
per-network **feed ingester** (CJ / Impact / Awin product feeds), extending the existing
`supabase/ingest/sources/*` adapter pattern. Feeds deliver live inventory + prices + images
server-side with no browser and no rate limit, so they **retire the manual monthly re-capture**
(`docs/monthly-recapture-task.md`) and make both the ShopThisBag cards and the chart medians
self-fresh. Moves the metric twice: fresher listings (engagement/GEO) **and** commissioned clicks
(monetization), since the feed links carry our affiliate ID. Gated only on the approvals above —
first code in unblocks the first adapter. Detail: `docs/freshness-runbook.md` "the real fix".

## TL;DR — overnight article batch + sold-transport solved (2026-06-26 late)

Autonomous batch (owner asleep, bypass perms). All seeded as DRAFTS; **publishing left to owner.**
- **5 new review-ready DRAFTS:** `post_id 5` LV authentication (brand-neutral `LVAuthDiagram`, the 2021 date-code→microchip hook), `post_id 6` Birkin vs Kelly (`BirkinKellyChart`, the small-size premium, asking data re-verified), `post_id 7` how to spot a fake Gucci Marmont (`GucciMarmontAuthDiagram`, sourced), `post_id 8` Neverfull MM vs PM (`NeverfullSizeChart`, both ~$1,200), `post_id 9` "what the icons cost on resale" roundup (`IconicPricesChart`, $911→$18,000). Plus `post_id 4` where-to-sell still drafted. Research foundations: `docs/research-drafts/lv-authentication-guide-draft.md`. All data is **current asking** (date-clean); gates green; on `main`.
- **Two PUBLISHED articles corrected for the date-confound** (see below): Flap `post_id 1` (removed wrong $4k venue spread + box plot) and caviar `post_id 3` (subordinated sold to date-clean asking). Locked the **date-control rule** in `docs/data-analysis-standard.md`.
- **Sold transport SOLVED:** blob-download bypasses the CSP-blocked sink (writes to ~/Downloads; Chrome rate-limits multiple auto-downloads). Sold loader built (`supabase/ingest/load-sold.ts`); reads already sold-safe. **Sold data still needs recency-filtered re-capture before it's article-ready** (peer-to-peer recent samples are thin). See `docs/research-drafts/poshmark-ebay-sold-capture.md`.
- **Open for owner:** review/publish the 6 drafts (`post_id 1` Flap is published; `3` caviar published; `4,5,6,7,8,9` are drafts). Retail-anchored "worth it" pieces (Neverfull/Marmont vs retail) are **deferred** because LV/Gucci block price fetch (never-invent: no retail from memory).

## TL;DR — Flap sold-by-venue + sold-data pipeline (2026-06-26)

- **PUBLISHED:** "Is the Chanel Classic Flap worth it" (`post_id 1`) and "Caviar vs lambskin" (`post_id 3`). The Flap piece now carries a **sold-by-venue box plot** (`FlapVenueChart.tsx`): authenticated realized prices eBay $3,897 (n=76) / Poshmark $4,292 (n=78) / Fashionphile $7,995 (n=229) vs $6,000 ask vs $11,700 retail. Insight: realized price swings ~$4k peer-to-peer → ~$8k premium reseller, mostly because Fashionphile curates the top tier (rarely sells under $4k) + fixed-price (no below-ask offers). Trimmed the redundant new-vs-preowned panel from `FlapValueCharts` (retail-by-year only). **"Last updated" date** now shows on posts; quarterly freshness routine scheduled.
- **Sold-data facts (verified 2026-06-26):** all 12,215 `listing_status='sold'` rows are **Fashionphile** (fixed-price, so list≈sale: FP v199 sold $7,995 ≈ ask $8,195). TRR (4,729) + Vestiaire (15) are **asking-only, 0 sold** (browser-gated; TRR has no public sold archive). eBay/Poshmark sold are browser-capturable (proven). eBay dev API was **rejected** → eBay goes browser-pull (Browse API only gave asking anyway). Method + figures: `docs/research-drafts/poshmark-ebay-sold-capture.md`.
- **Sold loader BUILT:** `supabase/ingest/load-sold.ts` writes `price_type='sold'`+`listing_status='sold'`. Reads are already **sold-safe** (isListed excludes sold; specComp flags sold as realized for fair value; deals asking median keys on 'listed') — no read changes needed. **GATING BLOCKER:** browser→repo transport is **CSP-blocked on Poshmark/eBay** (localhost sink fails, like TRR). Loader ready; transport is the next step (get_page_text body-transport or ref-transform batches).
- **Open content:** where-to-sell (`post_id 4`) still review-ready DRAFT; then #4 LV auth / #5 Birkin vs Kelly.
- **⭐ NORTH STAR recorded (2026-06-26):** articles should be **self-updating** (charts read live from the regular pulls, not baked constants) and the **diagrams should be shoppable** — each data point links to an individual for-sale bag, on-hover popup shows that bag at its price (affiliate-linked); where clusters are too tight to hover individually, surface matching listings another way (click → "shop these" panel). End goal = **affiliate monetization**. Full spec + dependencies (transport, diagram refactor to live queries): `docs/content-strategy.md` "North star" section. Build AFTER the sold/asking pipeline runs regularly.

## TL;DR — article #2 Caviar vs Lambskin drafted (2026-06-25 pm)

- **#2 review-ready DRAFT:** "Caviar vs lambskin: which Chanel Flap holds value better?" (`post_id 3`, slug `caviar-vs-lambskin-chanel-flap`). Third person, de-AI'd, topic-tagged Chanel + Classic Flap so the CTA renders. **Two visuals, both in-body:** data-viz `src/app/posts/[slug]/CaviarVsLambskinCharts.tsx` (`[diagram: caviar-vs-lambskin-charts]`) = median price by leather across 4 marketplaces + the caviar premium with 95% bootstrap CIs; original schematic `src/app/posts/[slug]/LeatherComparisonDiagram.tsx` (`[diagram: caviar-vs-lambskin-leather]`, placed under "The two leathers") = same quilted flap bag rendered caviar-pebbled vs lambskin-smooth, both bags + captions in ONE svg (one coordinate system) so they can't render at different sizes, card capped to the bag-pair width. Texture not color alone (lambskin striped on the chart; pebbled vs smooth on the schematic). Asking medians (TheRealReal + Fashionphile) **re-confirmed against prod 2026-06-25** (TRR caviar $7,063/n26 vs lambskin $4,821/n33, p=0.0002; FP $8,550/n17 vs $6,843/n10, p=0.024); sold medians (eBay + Poshmark) from the verified `docs/research-drafts/caviar-vs-lambskin-analysis.md`. Condition unrecorded = the one stated limit. Gates green (`tsc`/`eslint`/`next build`/439 tests); code on `main` (`2d0eaf6`). **Owner reviews + publishes.**
- **#2 PUBLISHED 2026-06-26** (`post_id 3`); leather schematic placed in-body.
- **#1 Where to sell = review-ready DRAFT** (`post_id 4`, slug `where-to-sell-your-designer-bag`, topic-tagged Chanel Classic Flap). Written **framework-only on purpose**: NO fee percentages (owner nervous about staleness + legal exposure on third-party fee data, 2026-06-25). Teaches the three routes (peer-to-peer / authenticated-marketplace+consignment / buyout) + money-vs-effort tradeoff diagram (`WhereToSellDiagram.tsx`), tells readers to verify current terms, carries "general information, not financial advice." New durable rule in `preferences.md` calibrated-hedge frames (third-party fees). Verified seller-economics research (TRR/FP/Rebag/Vestiaire/eBay/Poshmark, sourced+dated) is in this chat if exact rates are ever wanted in a quarantined box.
- **TWO drafts now await owner review/publish:** `post_id 1` (Chanel Flap "is it worth it") + `post_id 4` (where to sell).
- **Freshness mechanism shipped:** posts now show a **"Last updated" date** in the byline (byline + JSON-LD `dateModified`, `src/app/posts/[slug]/page.tsx`) whenever edited on a later day than published. Plus a **quarterly scheduled routine** `quarterly-content-freshness-review` (`~/.claude/scheduled-tasks/`, next run 2026-09-01, every 3 months) that re-verifies the where-to-sell framework + re-runs prod price queries behind the value posts and **reports drift for owner approval (never auto-publishes numbers)**. Fully-automatic fee scraping was rejected: TheRealReal 403-blocks fetch, Fashionphile help is JS-rendered, and auto-publishing an unverified fee is the exact risk the owner flagged. Operator note: click **"Run now"** once in the Scheduled sidebar to pre-approve the routine's tools (WebSearch/WebFetch + DB) so future runs don't pause on permissions.
- **Next content:** #4 LV auth (needs web sourcing like Coach) / #5 Birkin vs Kelly; re-apply Skimlinks once a few are live.

## TL;DR — content engine: standards, first articles, authorship (2026-06-25 pm)

Built the content production system and the first pieces. All on `main`.

- **Published:** Coach authentication guide (`post_id 2`). Original schematic diagram component (`src/app/posts/[slug]/CoachAuthDiagram.tsx`); accessibility (check/X, not color alone); curated markers, **no confidence badge** (auth-standard §1#5/§7 updated); sourced (Fashionphile/PurseForum/Thanks It's Vintage).
- **Authorship fixed + built:** the post author embed (`profile!fk`) never resolved (FK points to auth.users, not profile) so every byline fell back to the env name. Now fetched by id (`src/lib/posts.ts` `attachAuthors`). Added `AuthorCard.tsx`; byline reads **"By Arielle, Founder and Editor of The Luxury Catalog"** (verified badge, photo, bio) via `AUTHOR_ROLE` in `geo.ts`. Profile set in DB (display_name Arielle, is_verified, bio, avatar at `bag-photos/avatars/arielle.jpg`).
- **#3 review-ready DRAFT:** "Is the Chanel Classic Flap worth it" (`post_id 1`). Third-person, de-AI'd, charts (`FlapValueCharts.tsx`), sourced. Owner reviews + publishes (publish = her step).
- **#2 IN FLIGHT (write next):** Caviar vs Lambskin. Evidence done in `docs/research-drafts/caviar-vs-lambskin-analysis.md` — caviar premium **significant across 4 marketplaces** (TheRealReal + Fashionphile asking; **eBay + Poshmark sold**), Mann-Whitney + bootstrap CIs, condition unrecorded is the one limit. Write it approachably with its own chart, seed as draft.
- **New binding rules:** AI-tell blacklist (`voice-and-tone.md` §8); articles are third person; **visuals required catalog-wide** (numbers→data viz, bag shape→schematic; `content-strategy.md`); **`docs/data-analysis-standard.md`** (non-parametric tests for skewed prices, bootstrap CIs, stratify confounders, state what we can't measure, explain in plain language for non-researchers).
- **Post system:** body renders `## ` headings, `- ` bullets, `> ` callouts, `**bold**`, and `[diagram: <id>]` tokens (registry = `coachDiagramRegistry` + `flapChartsRegistry`, merged in `posts/[slug]/page.tsx`). No inline links (monetization stays in the CTA block).
- **Lane model + presentation prefs (early this session):** the 🧭 registry above replaced colliding pasted prompts; lanes are context labels, not file-fences. Decision tables rate each option vs stored preferences, in plain language, no coded shorthand.
- **UX/auth (shipped):** 3 auth-UX trims; the Learn-vs-Check balance (homepage tile "Read the markers" + `/identify`→`/authenticate` escalation + cross-links).
- **Open content suite:** #1 Where to sell (top revenue lever; some seller affiliate codes pending), #4 LV authentication (needs sourcing like Coach), #5 Birkin vs Kelly; then re-apply to Skimlinks.
- **STILL OPEN from the start of the chat (not content):** the **site-load / performance investigation** (`docs/desktop-todo.md` §J) was never started. Operator follow-ups: update Vercel `NEXT_PUBLIC_AUTHOR_NAME`→"Arielle"; submit `/sitemap.xml` to Search Console + Bing; work the migration re-verify list below.

## TL;DR — preference-governance system + docs cleanup (2026-06-25)

Goal of the session: make Claude's behavior match the owner's priorities without her re-reminding it. **No app code or DB touched** (docs + `.claude/` hooks only). All on `main`, commit `86c7fd8`.

- **Always-on rules = single source of truth.** The `ENFORCED:start..ENFORCED:end` block at the top of `docs/preferences.md` holds the 8 standing rules; `.claude/hooks/operating-rules.sh` (UserPromptSubmit) re-injects them **every turn**; `AGENTS.md` points at the block (no duplicate copy). To change an always-on rule, edit only that block. New this session: rule **#8 calibrated hedging** + the **Content factuality protocol** + a **Calibrated-hedge frames** list ("X, not Y").
- **The Preference Bar** (`AGENTS.md`): stored preferences must be short, decisive, clear, one decision per line, and **decisive about nuance** (prescribe the hedge, don't drop it). Wired into the wrap-up workflow; every added line must pass it.
- **Anti-bloat guard** `.claude/hooks/doc-budget.sh` (SessionStart): warns once per session if the ENFORCED block / `preferences.md` / `handoff.md` drift over budget or use hedge words in priorities. Budgets in the script; raise deliberately.
- **Docs cleanup:** `handoff.md` slimmed 698→233 lines (old recaps → `docs/handoff-archive.md`, nothing lost; pending operator items surfaced with a **re-verify** caveat). Added `docs/README.md` (the map: canonical vs archived). Archived 10 stale first-day/completed-handoff docs → `docs/archive/`. Removed a stale duplicate git worktree.
- **Activation:** hooks load at session start, so the per-turn injection + guard take effect in a **fresh session** (no action needed).
- **Open:** site-load/perf investigation (`docs/desktop-todo.md` §J) — the one new to-do; nothing is blocking.

## TL;DR — content development is the current unlock (2026-06-24)

**Why now:** the affiliate monetization stack is wired up (eBay EPN approved + links live in code; myGemma/Rebag/TLC/TRR/Fashionphile/MadAve applied — see `docs/data-collection-handoff.md` §11), but **Skimlinks REJECTED the site 2026-06-24** as "not suitable" — their criteria point to **insufficient original content** for a reviewer to determine the site's purpose/value. (NOT the fake-door/"coming soon" surfaces — those are fine and stay; owner confirmed real sites use them.) So the highest-leverage work shifts from *more signups* to **making the site content-rich + review-ready**, which also de-risks the pending manual-review approvals and is the real SEO/traffic engine.

**Content plan — lean on the two moats: real resale DATA + authentication authority. Prioritized pillars:**
1. ⭐ **Authentication guides** — "How to authenticate a Chanel Classic Flap / Birkin / Neverfull / Marmont." Brand-defining ("is it real"), high-intent SEO, obviously-original content, pure de-gatekeeping voice.
2. ⭐ **Value & price guides** — "[Bag] resale value & price history 2026", "Which Birkin sizes hold value best", "Is the Classic Flap worth it?" Built on OUR captured data (original/defensible), commerce-relevant (buy/sell links), feeds the value module.
3. **Buy/sell guides** — "Where to sell your [bag] for the most" (seller-side = top revenue lever), "Best entry luxury bags that hold value."
4. **Comparisons** — Neverfull vs Speedy, Classic Flap vs Reissue, Caviar vs Lambskin (high-intent, links both options).
5. **Market/trend** — most coveted now / what's appreciating / best deals under median (ties to `/coveted` + `/deals` + demand data; recurring).

**Data-readiness audit (run 2026-06-24, read-only against prod) — refines the plan:**
- price_history = **19,241 listing prices / 401 variants / 0 sold** (all "listing for"; owner confirmed asking-price framing is fine + we describe TODAY's market, not history).
- **Coverage is heavily HIGH-END:** LV 4,240/46 · Chanel 3,768/66 · Hermès 3,530/58 · Gucci 2,618/35 · Dior · YSL · Celine … **Coach only 200 rows/16 variants; Michael Kors / Kate Spade / Tory Burch / Longchamp = 0.** Cause: our only price sources (Fashionphile, TheRealReal) are **premium** resale — they barely carry mid-tier, so scraping them more won't fix it. (24k `discovered_listing` catch-all is premium-skewed too.)
- **Implication — split the strategy:**
  - **Value/market content → strong for high-end** (155 variants have 30+ listings). Write these on LV/Chanel/Hermès/Gucci now.
  - **Authentication wedge → mid-tier (Coach etc.)** per owner: lower stakes, more credible than pretending Chanel/Hermès auth expertise. Research + reference-image driven (does NOT need our price data) — can start now; needs detail images sourced first-party/licensed (NOT eBay — off-limits).
  - **Mid-tier VALUE content needs data we don't have → collect it first**, and from the RIGHT source: mid-tier bags live on **eBay + Poshmark**, not Fashionphile/TRR. Capture via the §5 Claude-in-Chrome method (data only; eBay images stay off-limits). Then mid-tier value content becomes credible.

**Recommended next:** (1) draft the **Coach authentication** article (credibility wedge, mid-tier); (2) start an **eBay/Poshmark mid-tier data capture** (Coach first) via Claude-in-Chrome to grow coverage; high-end value/market pieces can run anytime off existing data. Then **re-apply to Skimlinks**. All copy against `docs/voice-and-tone.md`. **Status: audit done 2026-06-24; owner choosing first action (Coach article / mid-tier capture / both).**

**Content-execution gap map (2026-06-24) — what content needs to actually earn + travel:**
- **EARN (keystone):** ⭐ **post→bag "money-moment" CTA block** — renders from a post's `topic_brand_id`/`topic_style_id`, surfaces seller-weighted buy/sell (later rent) affiliate links + a link to the bag page. **Articles are monetary dead-ends without it** (post body is plain text, no inline links; the affiliate money-moments live on the bag page). Plus **conversion instrumentation** (article→CTA→outbound click). Affiliate coverage to point at: eBay✅, myGemma/Rebag/TLC/TRR/FP pending, Skimlinks rejected (Vestiaire/1stDibs/RtR uncovered), Vivrelle pending.
- **PRODUCE:** article backlog (Chanel value ready; pick next 5–8); authentication **sourcing** (authoritative/cited — the real gap); **mid-tier data capture** (eBay/Poshmark, Coach first); **schematic SVG diagram component** (auth visual, decided not built).
- **TRAVEL:** internal linking (article↔bag↔/deals,/coveted,/quiz); **newsletter opt-in** (known unbuilt dependency); social repurpose per `social-content-calendar.md`; re-apply Skimlinks after content ships.
- **Critical path:** build the CTA block → push the Chanel value article through it end-to-end → then scale (backlog + diagram component + mid-tier capture + auth sourcing). Everything plugs into the CTA block. **Status: building the CTA block 2026-06-24.**

## TL;DR — real resale data + fidelity + parallel features (2026-06-23)

Two prior chats (value-module UI + data-collection pipeline) were reconciled and their stranded work landed; then a real data + feature push. **Companion briefs: `docs/data-collection-handoff.md` and `docs/archive/value-module-handoff.md` (both current).**

- **Listings now retire when they sell — live-vs-sold status (2026-06-24).** The Shop aggregates live marketplace listings but never dropped one once it sold/was pulled, so sold bags lingered forever and (with re-crawling) every re-sighting would inflate counts. New: **migration `0030`** adds `price_history.listing_status` ('available'|'sold') + `delisted_on`; the loader stamps new `listed` rows `available`; **`reconcile-sold.ts`** (`npm run reconcile:sold`) diffs a platform's fresh-crawl LIVE SNAPSHOT against what we show and marks the vanished ones sold. `getShopProducts`/`getListingsForVariant` now **dedup by `listing_ref` (keep latest observation)** and hide `sold`. **Why a snapshot, not DB dates:** the FP crawler's raw dump *accumulates* (preserves old captures), so a sold listing keeps re-loading with a fresh date — "newest date" can't tell live from sold; `fashionphile-crawl.ts` therefore also writes `data/ingest/_raw/fashionphile-live.json` (current run only, full-crawl only). **Safety:** reconcile aborts if the snapshot is empty or it would retire >50% of a platform's available listings (`--force` to override) — a partial crawl must not mass-retire. **Automation:** new scheduled GitHub Action `market-refresh.yml` (daily 06:00 UTC + manual) runs **crawl→reconcile** for Fashionphile (the only headless-crawlable source today; TRR/Vestiaire reconciled manually). **Scope deliberately = retire-sold only, NOT load:** bulk-loading the full 20k catalogue nightly via `--raw` flooded `discovered_listing` and tripped loader fragilities on messy records; loading new prices stays the existing manual curated pipeline. Reconcile treats listed rows with `listing_status` **null OR 'available'** as candidates (so the pre-0030 backlog reconciles too), excluding only 'sold'. **Loader hardening shipped alongside:** `normalizeDesigner` is null-safe and `fashionphile-crawl.ts` mkdir's the gitignored `_raw` dir before writing (it crashed in clean CI). **NOT YET DONE on prod:** (1) apply `0030` via the db-migrate Action — until then the Shop read returns empty (its select references the new columns), so apply 0030 with this deploy; (2) add `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as repo secrets for the Action.
- **Market-wide price capture started — "every bag" (2026-06-24).** New goal: price data for every bag on the secondary market (Fashionphile, TheRealReal, Vestiaire). **Phase 1 (Fashionphile) DONE:** new server-side master crawler `supabase/ingest/sources/fashionphile-crawl.ts` paginates `/collections/handbags/products.json` to exhaustion (polite pacing + 503 backoff) → raw dump 18,617 listings. New FP `--catch-all` adapter mode + new loader flag `load:prices --discovered-only` capture EVERY listing without force-matching: **7,477 curated → `price_history` (326 FP variants), 10,937 → `discovered_listing`.** Prod now: price_history 19,234 (FP 14,462 / TRR 4,729), discovered_listing 11,148. **Integrity rule locked:** catch-all rows go to `discovered_listing`, never auto-onto curated variants (`pickVariant` returns the first variant at score 0 → would stamp wrong prices). **Phase 2 (promote→curated) GATED:** `promote-discovered` currently yields junk clusters because the catch-all `style_guess` is the full FP title — needs a model-name normalizer before `--write`. **Phases 3–4 (TRR/Vestiaire) in progress:** browser capture validated (120 Chanel listings extracted), but bulk transport is the bottleneck (TRR CSP blocks the localhost sink; JS-return ~1KB cap; chunked `get_page_text` works but slow) + ~120-fetch rate limit → dedicated multi-session work. **Full resumable plan + per-brand loop: `docs/market-sweep-worklist.md`.**
- **TheRealReal resale data — full catalog loaded & verified (2026-06-24).** Prod holds the complete TRR resale set: **~225 distinct variants** carry `listed` rows (4,461 on the 2026-06-23 snapshot + the 116-row Chanel hero on 06-22 + 152 newly-surfaced listings on 06-24). All 165 size-variant targets adapt+load cleanly from the raw captures already in `data/ingest/_raw/` (no fresh browser capture needed to reload). **Fixed a real bug** in `supabase/ingest/sources/trr-jsonld.ts`: a captured record with no `name` crashed the whole adapt run (`name.toLowerCase()` on undefined) — now guarded, which also let ~152 previously-dropped listings through. **Cautionary note for whoever loads resale next:** the dedup index keys on `observed_on`, so re-adapting an *unchanged* raw file under a new date inserts near-duplicate rows that skew per-variant median/range. A 06-24 re-run did exactly that (4,063 exact dups); they were deleted by `price_id`, keeping only the 152 genuinely-new rows. Run a fresh capture+load only when you actually want a new-day snapshot. **When checking coverage, never trust an ad-hoc Supabase `select` count — it silently caps at 1000 rows; paginate with `.range()`.** See `docs/capture-runbook.md` (progress header refreshed).
- **Homepage UX rework shipped to prod (2026-06-23).** The "What brings you in?" section is now 6 value-SHOWING tiles (Is it real / Collect & invest / What's it worth / Find the bag for me / Best deals / Most coveted bags), search consolidated to a single hero input, plus a new "What the community knows" review-leaderboard section. New pages: **`/deals`** (listings under resale median) and **`/coveted`** (most-wanted bags by want-count). Tile 4 seeds `/quiz` with the first answer. All DB-backed pieces are resilient (graceful empty states until data/migrations exist). **Design + decisions: `docs/ux/homepage-experiments.md` + `docs/ux/review-data-leaderboards.md`.** Open items: structure `review.occasion` into an enum (unlocks night-out/work/travel boards); fix the `0012` axis vocab (drop `holds_value` — a price-data fact, not a vote) before applying; wire live top rows into the deals/coveted tiles. **Voice: em dashes now banned (`docs/voice-and-tone.md`); the tagline keeps its dash by exception.** **Migration `0027`** (clears variant 199's image so `/bag/199` shows the branded placeholder again) is on `main` but NOT yet applied — run the db-migrate Action to activate it.
- **Real resale data live** — captured **116 TheRealReal listings** for the Chanel Classic Flap Medium (variant 199) via Claude-in-Chrome (same-origin JSON-LD), parsed through the canonical `parseTrrDescription`, loaded to prod: fair-market range **$1,975–$11,000**, median $5,700, retention 87.7%, full per-listing colour/leather/hardware/year. Spec spread is real (Caviar/gold ~$7,200 vs Lambskin/silver ~$4,700).
- **True per-listing fidelity** — migrations **0024** (`listing_ref` in the dedup index) + **0025** (legacy backfill), applied to prod; loader writes `listing_ref ?? source_url`. Distinct same-price listings no longer collapse (94→116).
- **Three features shipped via parallel background agents** (worktree-isolated, then merged): per-listing dedup + **reusable `trr-jsonld.ts` adapter** (hero scaffolds), **resale-by-era lens** on the bag page, **Vestiaire + Fashionphile** parsers/adapters. 266 tests green.
- **Multi-brand parser** (branch `claude/multibrand-parser`, awaiting merge) — Hermès leathers/colours + `-Plated` hardware + LV/Gucci canvases; Birkin 30 coverage colour 5%→74%, material/hardware →100%. **Hermès Birkin 30 (102 rows) captured & ready to load** once merged.
- **Secrets rotated + consolidated + 2FA pass — DONE 2026-06-26 (A6 closed).** Every secret regenerated and repointed across local `.env.local` + Vercel + GitHub Actions, then the old ones revoked. **Anthropic key:** 7 sprawled keys collapsed to 1 fresh (`luxury-catalog-prod-2026-06`); also fixed a Vercel env typo `ANTHROPIC_API_KEY2` that had left `/identify` + personalization keyless in prod (now `ANTHROPIC_API_KEY`, redeployed). **Supabase `service_role`:** `sb_secret_9Lim`→new `sb_secret_l6uo`. **Supabase access token:** 4 tokens collapsed to 1. **DB password:** reset. `.env.local` locked to `600`. Anthropic **spend cap = $100/mo**. **2FA:** GitHub (on, + password + passkey) and Google 2SV (on) are the two identity providers; Vercel + Supabase log in via GitHub and Anthropic via Google, so all inherit it. *(Condition-enrichment pass still needs `condition_detail` captured from TRR product pages (browser) before it can run.)*

**Next:** merge `claude/multibrand-parser` → load Birkin 30 → capture remaining heroes (Kelly/Neverfull/Marmont) + condition_detail + first Vestiaire/Fashionphile dumps → run enrichment → era×condition matrix gets its condition axis.


---

## TL;DR — adaptive value module (M0–M2) on the bag page (2026-06-22)

Reworked the bag page's "What it's worth" block into an **adaptive value module**, synthesizing inspiration from Google Shopping (merchant rows + "best price"), KBB (good/great grade), and Google Flights (timing verdict, best-vs-cheapest, flex grid). All `tsc`/`eslint`/`next build`/`199 tests` green.

**Architecture decision:** every complex price viz is *one primitive* — `CompScale` (`src/app/bag/[variantId]/CompScale.tsx`): comps on a shared price axis, optionally grouped into rows. Gauge = ungrouped; condition ladder = grouped by tier; year lens / flex grid = later groupings. The `ValueModule` (`ValueModule.tsx`) is one skeleton reframed by closet state (want/have/had → buyer/owner/collector); only headline/verdict/CTA change. Fires `value_module_viewed` (framing + comp counts + demand level) so usage data — not a guess — picks which user type is most common/monetizable.

**Shipped (all from data we already have — no migration):**
- **M0** — `CompScale` gauge + adaptive `ValueModule` + instrumentation. *On `main` (merge `732f59c`).*
- **M1** — demand signal (`getVariantDemand`, wants/watchers) + retail-hike catalyst (`retailChange`) → a descriptive, framing-aware **timing note** ("waiting hasn't paid off lately"). Never advice.
- **M2** — **condition ladder**: groups recorded resale into the canonical `sale_condition` tiers (already enum-typed at the DB; eBay already normalizes via `normalizeEbayCondition`), grading *within* tier so a cheaper-but-worn bag can't masquerade as a deal. Shows when ≥2 tiers have data, else falls back to the gauge.
- **Year (era context)** — a `Vintage`/`Discontinued` chip + a neutral note in the module, from the variant's `year_start/year_end`. This is the *honest* year signal we have today: per-listing era (the era×condition matrix) is **deferred** because no resale feed carries a reliable item year — `price_history.production_year` (migration `0022`) exists but no adapter populates it. The matrix activates once the LLM date-code extraction pass lands (`CompScale` already supports the grouping).
- **Item-spec extraction pass** (`src/lib/ingest/spec-extract.ts` + `supabase/ingest/enrich-specs.ts`) — the unlock for the era×condition matrix + attribute (inclusions/hardware/material) grading. Mirrors the proven condition-enrichment pass: pure prompt + validated parser (5 tests), Claude Haiku runner, strict "only what's stated / never invent." Reads listing text (`notes`/`condition_detail`), writes the migration-0022 spec columns (`production_year`, `season`, `colorway`, `material`, `hardware_color`). **Runtime-inert** (CLI tool — no app or migration change). **HUMAN-GATED to activate:** apply migrations `0022`+`0023`, run a capture, then `npx tsx supabase/ingest/enrich-specs.ts --write` (needs `ANTHROPIC_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY`). Then the only UI step left is wiring `production_year` into the bag-page read behind a guarded select + rendering the matrix.

**Honesty rails (locked):** every number is a real recorded price; copy is descriptive + dated, never an appraisal/advice; degrades to "no recorded resale data yet" when empty. Thin-data posture chosen = **broaden scope, clearly labeled** (the scope chip is in place; cross-variant broadening is a later data step).

**Caveats:** listing dots only render where `price_type='listed'` rows exist — today only the eBay adapter produces those (6 hero targets), and only once migration `0021` (the `price_type` column) is applied. Until then the range/verdict still render; dots are simply absent. Resilient — nothing 404s.

**Roadmap for the value module (next):**
- **M3 — ingestion breadth:** live `listed` rows from TRR/Fashionphile/Vestiaire (currently search-links only) → the multi-site merchant grid + the colorway × condition **flex grid** become real.
- **M4 — gated/premium:** realized **sold** prices (eBay Marketplace Insights API — gated), condition-adjusted "effective price," FX/region normalization.
- **Data gaps to chase** (highest leverage first): broaden live listings beyond eBay; wire per-listing structured attributes via an LLM extraction pass (inclusions/hardware/year — `ObservationAttrs` already has the fields); then sold prices. Full analysis lives in this session's chat + `docs/data-sourcing-research.md`.

## TL;DR — operator LAUNCH session + photo/auth fixes (2026-06-22)

A parallel, operator-driven session (ran alongside the Personalization work below). **The app is now LIVE in production on the real domain.** Code changes are on `main` (`tsc`/`eslint`/`next build`/tests green at each merge).

**Operator milestones (done today, see `docs/desktop-todo.md`):**
- 🌐 **Live on `https://www.luxurycatalog.com`** (DNS validated; `NEXT_PUBLIC_SITE_URL` updated; redeployed).
- 📊 **PostHog analytics live** (`NEXT_PUBLIC_POSTHOG_KEY`, US region; verified). *Events are eaten by ad-blockers in everyday browsers — test in incognito + PostHog "Live" tab.*
- 🔍 **Sitemap submitted to Google Search Console + Bing** (indexing clock started; ~8–16 wks).
- 🖼️ Operator applied migrations **0015/0016/0017**, set self `is_admin`, and **runtime-tested the photo flow end-to-end (works).**
- 💰 **Affiliate apps in flight:** ~~TRR Real Partners (consignor)~~ **❌ ruled out 2026-06-24** (call: relationship-based, no trackable links for a digital aggregator — see `data-collection-handoff.md` §11; the `$1,250` seller lever is down-weighted to ~$250 in `monetization-projections.md`). Still in flight: **TRR buyer-side affiliate** (direct) + Fashionphile (Impact) + CJ (Rebag, Luxury Closet) + eBay EPN + Awin (myGemma) + Skimlinks catch-all. **New 2026-06-24:** owner applied to **Vivrelle** (rental, Awin) + **BriteCo** (insurance, Awin). **Amazon Associates — BACKLOG (paused mid-signup 2026-06-24 at the Amazon login gate; needs owner login → then Claude can fill the profile fields; tax/bank/submit are owner-only).** When codes arrive → wire `NEXT_PUBLIC_AFFILIATE_*`.

**Code shipped this session:**
1. **Photo gallery byline bugfix** — `getApprovedPhotos`/`getPhotosForReview` (and the auth-request reads) used a PostgREST embed `profile:user_id(...)` that can't resolve (the tables FK to `auth.users`, not `profile`), so they errored → empty gallery even though photos published. Fixed with a **separate profile lookup** merged in JS (`src/lib/photos.ts`, `authentication.ts`). Also `router.refresh()` after a photo upload.
2. **Authentication marketplace = coming-soon fake door** until real authenticators exist. `hasActiveAuthenticators()` gates it: 0 authenticators → a **"Notify me when it's live"** demand-capture (analytics `authentication_interest` for everyone + a saved `authentication_request` row for signed-in users = warm launch list). Flips to the real request form automatically once any `is_authenticator` exists. Doors on **bag page, thrift `/found` success, and `/closet`** (shared `src/components/AuthInterestButton.tsx`). New **`/admin/authentication`** demand dashboard. *(To SEE the coming-soon state, the operator should drop their own test `is_authenticator` flag.)*

**Deferred / flagged:** 🔒 key rotation (A6 — plan saved, do before full public launch); ⚠️ **`/identify` camera tool isn't real yet** — make it work or give it the coming-soon treatment before public launch (desktop-todo H6); DMCA agent before promoting UGC widely (G2). **New backlog idea:** multi-source verification evidence (listing URLs + guided photos) — see Open backlog.

---

> **Latest session (2026-06-22):** Personalization Phase 2 — precomputed recs + PostHog flag gate
> (migration `0019`). See TL;DR immediately below. Phase 1 (migration `0018`) is the block below that.

## TL;DR — Personalization Phase 2: server-side recs + PostHog flag gate (latest session)

Branch `claude/intelligent-lamport-7dazm6` → merged to `main`.
`tsc --noEmit`, `eslint src`, `next build`, **144/144 tests** green.
**HUMAN-GATED:** apply migration `0019`; create the `personalized_home` flag in PostHog (see below).

### What was built

**Spec:** Phase 2 of `docs/personalization-best-practices.md` (A14, B9–B15, C16–C21).

1. **Migration `0019_user_recs.sql`** — `user_recs` precomputed recs table:
   - `(user_id, variant_id)` PK; `rank`, `score`, `why`, `algo` (affinity/popularity/explore).
   - RLS: users read own rows. Service role writes.
   - Index on `(user_id, rank)` for fast per-user reads ordered by rank.

2. **`src/lib/personalization/ranker.ts`** — pure Phase-2 ranking pipeline (34 unit tests):
   - **Affinity score**: brand (40%) + silhouette (25%) + material (15%) + hardware (12%) + size (8%) against Phase-1 profile.
   - **Bayesian popularity prior**: `count/(count+10)` — handles cold-start without raw counts.
   - **Combined score**: 70% affinity + 30% popularity.
   - **Epsilon-greedy exploration**: ε=0.1 → 1 explore slot per 10 recs (prevents filter bubble).
   - **MMR diversity re-rank**: λ=0.7 — prevents one dominant brand filling all slots.

3. **`src/lib/personalization/recs.ts`** — DB layer:
   - `computeAndStoreRecs(userId)` — full pipeline (candidates from catalog, popularity counts, Phase-1 profile → rank → upsert into `user_recs`).
   - `getPersonalizedRecs(userId, limit)` — read stored recs; synchronous first-access compute if empty.
   - Both degrade gracefully when table/key absent.

4. **`src/lib/analytics/flags.ts`** — PostHog server-side flag layer:
   - `identifyUserToPostHog(userId, {persona, budget_band, intent})` — writes persona as a PostHog **PERSON PROPERTY** (the targeting surface). Called at login via `auth-actions.ts` to stitch anonymous→identified.
   - `evaluatePersonalizationFlag(userId, personProps)` — server-side eval of `personalized_home` flag via posthog-node (`flushAt:1`, `await shutdown`), passing `personProperties` explicitly.
   - `getBootstrapFlags(userId, personProps)` — evaluates ALL flags server-side for client bootstrap.

5. **Home page (`src/app/page.tsx`)** — flag gate on the recommendations rail:
   - Server-side: evaluates `personalized_home` flag → renders `<PersonalizedRecs>` (test variant) or existing `<Recommendations>` (control). Decision baked into SSR HTML — no flicker.
   - `<PostHogFlagBootstrap flags={...} />` — client component that calls `posthog.featureFlags.override()` on mount, keeping the client SDK in sync for experiment event tracking.

6. **`src/components/PersonalizedRecs.tsx`** — personalized rail (reads from `user_recs`; falls back to quiz CTA). Same `RecommendationCard` as control.

7. **`/api/cron/rebuild-recs`** — nightly batch at 04:00 UTC (after profiles rebuild at 03:00). Added to `vercel.json`.

### Human-gated steps

1. **Apply `0019_user_recs.sql`** in Supabase SQL editor. Safe after 0018.

2. **Create `personalized_home` flag in PostHog** (app.posthog.com → Feature Flags → New):
   - Key: `personalized_home`
   - Rollout: **Multi-variant experiment** — variant `control` (50%) and `test` (50%).
   - Targeting condition: `persona IS SET` (person property, not a cohort).
   - Guardrail metrics: `recommendation_clicked` (CTR) and `item_saved` (conversion).
   - Leave at 0% rollout until you're ready to experiment; the code degrades to the control (existing recs) when the flag returns false.

3. **Trigger first recs rebuild** (optional but recommended — otherwise waits for 04:00 cron):
   ```
   curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.vercel.app/api/cron/rebuild-recs
   ```
   Or hit it from Vercel's cron dashboard.

4. **Experiment is self-contained**: if PostHog key is unset or the flag doesn't exist, the home page falls through to the existing content-based `<Recommendations>` — nothing breaks.

### Next: Phase 3
Phase 3 is: Voyage embeddings + hybrid search (BM25 + dense vector + RRF rerank). Enables semantic search ("something for evening", "very structured, minimal hardware") and replaces the attribute ranker with a learned embedding space. Requires enabling pgvector, a VOYAGE_API_KEY, and a backfill job.

---

> **Prior session (2026-06-22):** Personalization Phase 1 — `user_profile` feature store +
> deterministic aggregation (migration `0018`). See TL;DR immediately below.
> Earlier: photo-contributions + contributor-tier system; monetization-moment audit;
> voice & tone rewrite; finance/money compliance.

## TL;DR — Personalization Phase 1: feature store + deterministic aggregation (latest session)

Branch `claude/intelligent-lamport-7dazm6` → merged to `main`.
`tsc --noEmit`, `eslint src`, `next build`, **110/110 tests** green.
**HUMAN-GATED:** apply migration `0018` (see below); set `SUPABASE_SERVICE_ROLE_KEY` for the cron.

### What was built

**Spec:** Phase 1 of `docs/personalization-best-practices.md` (A4–A7, B8).

1. **Migration `0018_user_profile_feature_store.sql`** — `user_profile` feature table:
   - Typed columns: `persona` (synced from profile), `budget_band` (entry/mid/grail/mixed),
     `intent` (buying/selling/collecting/browsing/both), `top_affinities` jsonb (top-10 brands).
   - JSONB columns: `brand_affinities` (full brand→score map), `attribute_affinities`
     (dimension→{value:score}), `signal_counts` (want/have/had/watchlist/review counts + quiz
     completeness), `taste_vector_snapshot` (quiz+closet TasteVector — Phase 3 adds pgvector here).
   - RLS: users read own row only. Service role writes all (no service_role policy — it bypasses
     RLS by design). `user_id` is the PK (implicitly indexed).
   - SQL functions for pg_cron: `rebuild_user_profile(uuid)` (one user, same decay/weight logic
     as TypeScript) and `rebuild_all_user_profiles()` (batch, error-per-user, safe).
   - pg_cron schedule (apply manually in Supabase): `select cron.schedule('rebuild-profiles', '0 3 * * *', 'select rebuild_all_user_profiles()');`

2. **`src/lib/personalization/`** — the TypeScript feature-store layer:
   - `types.ts` — `PersonalizationProfile`, `RawUserSignals`, `ClosetSignal`, `WatchlistSignal`, etc.
   - `aggregation-core.ts` — pure functions (no DB): `decayWeight`, `itemWeight`, `inferBudgetBand`,
     `inferIntent`, `computeBrandAffinities`, `topAffinities`, `computeAttributeAffinities`,
     `aggregateSignals`. Status weights: have=3.0, want=1.5, had=1.0. Decay: ≤7d→1.0, ≤30d→0.8,
     ≤90d→0.6, ≤365d→0.4, older→0.2. Budget band: 60%+ in one bin wins, else 'mixed'.
   - `aggregation.ts` — DB read layer (closet_item JOIN variant attrs, watchlist, review count,
     profile taste_vector snapshot) → calls aggregation-core.
   - `user-profile.ts` — `getUserProfile(userId)` (fast read from `user_profile`; triggers
     synchronous rebuild on first access if no row) + `rebuildUserProfile(userId)` (compute +
     upsert). Both degrade gracefully (return null) if migration absent or service-role key unset.

3. **`/api/cron/rebuild-profiles`** — Vercel cron endpoint (CRON_SECRET-gated); iterates all
   profile rows, calls `rebuildUserProfile()`, returns `{total, rebuilt, failed}`. Scheduled at
   03:00 UTC daily in `vercel.json`.

4. **38 new unit tests** (`src/lib/__tests__/personalization.test.ts`) covering every pure function
   and the full `aggregateSignals` integration (cold-start, normal, grail buyer, seller, collector).

### Human-gated steps
- **Apply migration `0018_user_profile_feature_store.sql`** in Supabase SQL editor (or CLI).
  Depends on nothing new — safe to apply right after 0017. Degrades gracefully if absent
  (all helpers return null, no app surface broken).
- **Set `SUPABASE_SERVICE_ROLE_KEY`** — required for the cron and first-access rebuild; no-ops without it.
- **Optional pg_cron:** `select cron.schedule('rebuild-profiles', '0 3 * * *', 'select rebuild_all_user_profiles()');` — an alternative to the Vercel cron for in-DB scheduling.

### Next: Phase 2
Phase 2 is: server-side personalization gated by PostHog — precompute per-user recs table,
attribute/affinity ranker + Bayesian cold-start + epsilon-greedy + MMR diversity, PostHog flag
evaluated server-side targeting a persona *person property*, bootstrapped to client (no flicker),
wrapped in an Experiment. Apply to 1–2 real surfaces (home "bags you might like", search ranking).
Spec: `docs/personalization-best-practices.md` A14, B9–B15, C16–C21.

---

## TL;DR — photo contributions + contributor tiers (latest session)

Branch `claude/daily-review-planning-hqj3hg`. The queued UGC engine from "▶ QUEUED NEXT BUILD" (below)
is now built. `tsc`, `eslint src`, `next build`, **72/72 tests** green. **HUMAN-GATED:** migration
**`0016`** + a Storage bucket + the service-role key (see checklist). File upload could not be
runtime-tested here (no creds); everything degrades gracefully if 0016/bucket/key are absent.

1. **Migration `0016_photo_contributions.sql`** — `bag_photo` table (variant_id, user_id,
   storage_path, caption, status [pending/approved/featured/rejected], owner_attested, points_awarded)
   + RLS (public read published; insert own as pending+attested; delete own; admin update);
   `profile.contribution_points int` (UPDATE revoked from clients — anti-gaming); **Storage bucket
   `bag-photos`** (public read) + storage RLS. No `ALTER TYPE` caveat (fresh enum).
2. **Tiers are DERIVED, not stored** — `src/lib/contributions-core.ts` (pure, 12 unit tests):
   Aficionado → Collector (has closet) → Connoisseur (approved photo) → **Authenticator**
   (`is_authenticator`, admin-granted → **auto-publish**) → Curator (Authenticator + ≥500 pts). XP is
   rarity-weighted (first photo of an uncovered bag = most) with reversal on removal.
3. **Hybrid moderation** — trusted tiers (Authenticator/admin) auto-publish via service-role;
   everyone else is queued. `src/lib/photo-actions.ts` (`submitPhoto` upload+insert, `reviewPhoto`
   approve/feature/reject with XP + hero promotion + `notifyPhotoFeatured`, `deleteOwnPhoto`);
   `src/lib/photos.ts` (resilient reads). Featuring promotes the shot to `variant.image_url`
   (`image_source:'ugc'`), demoting any prior featured (one-featured-per-variant unique index).
4. **UI** — bag page `PhotoContributions` (gallery w/ byline + rare-find empty state + attested
   upload, on `#photos` + jump-nav); admin `/admin/photos` moderation queue (+ admin index link);
   `/photos/most-wanted` board (demand-ranked photoless bags; needs service role); profile
   `ContributorCard` (tier + points + next-tier hint). New event `photo_submitted`.

**Follow-ups:** grant `is_authenticator` to vetted contributors so they auto-publish; **register a
DMCA agent before promoting UGC widely** (`docs/desktop-todo.md` G2); the "Most Wanted" board is
demand-ranked only with the service-role key (else empty state).

## TL;DR — authentication-marketplace on-ramp, v1 (latest session)

Branch `claude/daily-review-planning-hqj3hg`. The marketplace was **PAUSED**; resumed this session
at the **lead-capture scope (Recommended)** — explicitly **money-free**, so it stays out of
`finance-compliance.md` **Phase C** (on-platform payments = a separate, attorney-gated build).
`tsc`, `eslint src`, `next build`, **72/72 tests** green. **HUMAN-GATED:** migration **`0017`**.

1. **Migration `0017_authentication_requests.sql`** — `authentication_request` (variant_id,
   requester user_id, contact_email, details, status [open/claimed/closed], claimed_by) + RLS:
   requester insert/read own; **verified Authenticators** (`is_authenticator`) read the open queue +
   their claims and may claim/close; admins read all. Contact email is withheld from the open queue
   (revealed only on claim).
2. **Flow:** bag page → **"Want a pro to check it?"** (`RequestAuthentication`, in the How-to-
   authenticate area, always rendered) → lead row. **`/authenticate` hub** shows the requester their
   requests and gives Authenticators the **claim queue** + their claimed requests (with contact). The
   two arrange pricing/service **off-platform** (no custody → no money-transmitter burden). Profile
   gets an "Authentication / Authenticator queue" link. New event `authentication_requested`.
3. **Ties to the tier ladder:** the `is_authenticator` tier (auto-publish on photos) is the same
   verified cohort that staffs this queue — the contributor pipeline now has a destination.

**Follow-ups / deferred to Phase C (needs your go-ahead + an attorney):** on-platform quoting threads,
Stripe Connect payments, the 25% platform take, 1099-K/OFAC. v1 deliberately stops short of all of it.
**Operator:** apply `0017`; grant `is_authenticator` to vetted pros (same flag as photo auto-publish).

## TL;DR — monetization-moment placement audit (this session, earlier — MERGED to `main`)

Merged to `main`. Code + docs; **no DB migrations, env vars, or seed changes.**
`tsc`, `eslint src`, `next build`, **60/60 tests** green.

1. **New doc `docs/monetization-moments-audit.md`** — maps each of the 4 revenue streams to the
   feature/moment that triggers it, audits placement, records the changes. Key finding: the
   **consignor referral is a high-value seller lever, and its triggers — closet
   `had`/`have` + the thrift `/found` log — did nothing with that intent.** *(Update 2026-06-24: the
   `$1,250`/seller figure assumed TRR Real Partners, now ruled out for a digital aggregator; the lever
   is down-weighted to ~$250 — see `monetization-projections.md`. The UX changes below still stand —
   surfacing "where to sell" remains good UX regardless of per-referral value.)*
2. **Bag page (`/bag/[variantId]`):** rebuilt `BagActions` into an **above-the-fold decision cluster**
   placed under the "What it's worth" value card — want/have/had + watch **and** the Buy/Sell CTAs,
   with contextual bridges (`had` → leads with Sell; `want` → watch price). Was buried ~600 lines down,
   order Buy→Sell→Save. Detailed `WhereToBuy`/`WhereToSell` stay near price history; jump-nav Buy/Sell
   now gate on whether links resolve.
3. **Thrift `/found`:** the success screen now surfaces a **"Flipping it?"** consignor CTA (buyout +
   consign links from the logged brand/style, FTC disclosure, `outbound_consign_clicked` w/
   `source:"thrift_find"`) — the literal consignor-referral moment.
4. **Closet `/closet`:** light sell-routing nudge on the **have** group (consignor supply).
5. **Housekeeping:** renamed duplicate migration `0012_instagram_resources.sql` → **`0015`** (collided
   with `0012_bag_axis_votes.sql`; was never applied, so safe). Closed stale **PR #1** (review-only
   snapshot; code long since shipped).

**Follow-ups:** validate via PostHog (`outbound_consign_clicked` esp. `thrift_find`, `item_saved` by
status); add a desktop sticky bar only if desktop buy/sell CTR lags mobile. **Photo-contributions build
(the big queued feature) is still open** — not started this session.

## TL;DR — voice & tone rewrite (latest session)

Merged to `main`. **Copy-only** — no DB migrations, env vars, seed, schema, or logic changes; 46 files,
display strings only.

1. **Applied `docs/voice-and-tone.md`** across every user-facing surface: home/landing + global
   layout/footer, bag detail (incl. GEO/auth/price captions), search, identify, thrift `/found`,
   browse, brand pages, closet/watchlist/feed/notifications, quiz/recommendations,
   auth/onboarding/profile/settings, posts & social, the legal pages, and admin. The voice flexes by
   register (voice guide §4) — warmer in discovery & empty states, tightest at the money &
   authentication moments.
2. **Guardrails honored:** no invented facts (prices, date codes, markers, dimensions, stats); every
   hedge and legal disclosure preserved verbatim in substance; no hype superlatives, gatekeeping, or
   AI-slop; code/routes/classNames/JSX structure/analytics events/enum values untouched.
3. **Notable calls:** home hero now leads with the manifesto tagline (*"Know what it's worth — and what
   it's worth to you."*); the `/identify` intro **dropped the "what it's worth" overpromise** (the
   tool returns no value field — never-invent). Updated one taste-tagline unit test to match new copy.
4. **Verification:** `tsc --noEmit`, `next build`, `eslint src`, and **50/50 vitest tests** all green.
   No runtime test (no DB creds) — but changes are display-string-only, so no runtime behavior changed.

**Follow-ups left open:** none functional. If/when brand voice evolves, the spec is
`docs/voice-and-tone.md`; this pass already touched everything user-facing.

---

## TL;DR — finance/money compliance + Phase A legal UX (prior session, same date)

Merged to `main`. No DB migrations, no env vars, no seed changes — all additive docs + UI.

1. **New doc `docs/finance-compliance.md`** — plain-language guide to the entire "money" side of the
   app: what handles money today vs. what's planned, and the requirements + cautions per phase. The
   core mental model is a **burden ladder keyed to one question: do you ever take custody of other
   people's money?**
   - **Phase A — today (LOW):** affiliate/referral links + price data. Obligations = FTC disclosure,
     honest pricing, a privacy policy. *You are not handling anyone's money today.*
   - **Phase B — subscriptions (MEDIUM):** Stripe merchant. PCI-via-Stripe (SAQ A), auto-renewal law
     (build to **ROSCA + California ARL**; the FTC "Click-to-Cancel" rule was **vacated** July 2025),
     SaaS sales tax.
   - **Phase C — authentication marketplace (HIGH, avoidable):** the "people's money" line. **Use
     Stripe Connect and never custody funds** → Stripe is the money transmitter, not you. 1099-K
     (OBBBA restored the **$20K / 200-txn** threshold), marketplace-facilitator sales tax, OFAC is
     *your* duty.
   - **Phase D — collection-as-investment / insurance / tax (the feature the user actually asked
     about):** three sub-features, different risk. **Value tracking** = fine (not securities advice).
     **Insurance** = inventory-export + flat-fee referral, **never act as an agent** (would need a
     producer license). **Tax** = a cost-basis/holding-period **records export**, **not** a calculator
     or advice (handbags are **collectibles → max 28%**; "dealer vs. investor" trap). Across all: your
     value is an **estimate, not an appraisal**, and the data is a theft-target → extra security.
   - **Caveat in the doc:** some citations rest on cross-corroborated search summaries (several .gov/
     Stripe pages couldn't be fetched directly); time-sensitive items flagged. Not legal/tax advice —
     get one attorney + CPA review before any money feature.

2. **Phase A compliance UX shipped** (the gaps the doc found in the live build):
   - **Footer** (`layout.tsx`): site-wide affiliate + price-estimate disclaimer line + links to the
     three legal pages.
   - **`WhereToBuy.tsx`**: inline "affiliate links — we may earn a commission" notice next to the
     resale links (FTC clear-and-conspicuous; the old `rel="sponsored"` is technical-only).
   - **`PriceTrend.tsx`**: "estimate, not an appraisal or forecast" caption.
   - **New pages** `/privacy`, `/disclosure`, `/disclaimer` (Privacy grounded in what the app actually
     stores; points to `/settings` for access/delete; mentions GPC). **`next build` green; routes
     render.**

**Follow-ups left open:** (a) swap the placeholder `hello@luxurycatalog.com` in the legal pages for the
real address once email forwarding is live; (b) **Terms of Service page is still needed before the
first payment** (deferred to Phase B/C — not required while no money moves); (c) honor GPC in the
actual analytics flow (copy claims it; verify `ConsentNotice`/PostHog wiring); (d) Phase B/C/D feature
work itself is unbuilt — `docs/finance-compliance.md` is the spec.

---

## ⭐ LATEST SESSION — UX evaluation + full overhaul (PR #3) — READ FIRST

**Branch:** `claude/luxury-catalog-ux-eval-uxrubk` → **PR #3** into `main` (open, ~33 commits, clean fast-forward, no conflicts). **Unlike prior sessions, the key flows were runtime smoke-tested against the live DB this session.**

**Migrations: the live DB is now CURRENT through 0014** (operator applied 0008–0014 this session; 0011/0012/0013/0014 confirmed). New this session: `0011_four_grails`, `0012_bag_axis_votes`, `0013_variant_image` (variant.image_url + image_source), `0014_closet_purchase_price` (closet_item.purchase_price/currency/date). All new queries are **resilient** (`getVariantImages`, `getPurchaseInfo`, `getBrandResaleStats` return empty on a missing column) so nothing breaks pre-migration.

**Shipped (grounded in `docs/ux/ux-evaluation.md` + `ux-research-brief.md`; teardowns of Goodreads/StoryGraph/Letterboxd/IMDb/Discogs/Fragrantica/WatchCharts/StockX/Fashionphile-TRR-Vestiaire/KBB):**
- **Docs:** `docs/ux/ux-evaluation.md`, `ux-research-brief.md`, `sitemap-and-user-flows.md`, `ux-remaining-backlog-plan.md`.
- **Discoverability/IA:** persona router + Explore strip on home; Quiz/Watchlist in nav; "It bags" + brand items link into the bag page (not search).
- **Bag page:** Fair-Market-Range + Last-Sold, sticky action bar, **Where-to-sell** fork, jump-nav/accordions, price chart range toggles + %Δ, **resale-vs-retail split**, "How to authenticate" checklist, attribute cross-links, **dimensional Size/Colour/Hardware variant selector** (prefetch swap; instant in prod — `npm run dev` recompiles so it only *feels* like a reload in dev).
- **Search:** colour/hardware/size facets + chips + mobile tray; fixed keyword→material matching and a name-fallback so catalogued bags never dead-end.
- **Identify** monetization; **explainable recs** + cold-start fallback; **Four Grails**; **multi-axis owner voting**; **quiz pre-signup growth loop** (results free, save-on-signup via `TasteFlusher`); **Google/Facebook OAuth + usernames**; collection value; **Collection report** (`/closet/report` — insurance/estate + cost-basis/gain-loss); **Year-in-Bags recap**.
- **Visuals:** `BagImage` (branded placeholder everywhere + resilient real-photo pipeline; falls back to placeholder on load error). Populate `variant.image_url` from a **licensed** source to show real photos.
- **Brand hub:** `/brand/[id]` revamped — heritage, at-a-glance (retail ladder, highest recorded resale), "{brand} signatures" (top colours/materials/hardware/silhouettes), culture/buying-experience editorial slot, brand-level buy/sell links.

**NEXT SESSION — pick up here (confirmed wants, not yet built):**
1. ~~**Real-photo sourcing**~~ **DONE (this session).** Import tooling: `supabase/seed/import-variant-images.ts` (`npm run import:images`) bulk-populates `variant.image_url` + `image_source` from a CSV / reseller feed. Two auto-detected modes: **direct** (curated `variant_id,image_url[,image_source]`) and **feed** (reseller export — `Designer`/`Bag name`/`Photos`/`Url` like `data/raw/*.csv`; resolves brand→style→best-variant, takes the first photo, records the listing URL as `image_source` for link-back). **Licensing enforced at the tool boundary:** default is a no-write **dry run**; persisting needs `--write --licensed` (asserts display rights — see `docs/image-strategy-research.md`). Idempotent (fills blanks unless `--overwrite`); preflight aborts loudly on a bad key or a missing 0013 column. Pure matching logic in `src/lib/image-import-core.ts` (10 unit tests). `BagImage` already consumes `image_url`. *Build/test-verified; not runtime-run here (sandbox key is invalid — operator's live DB is current through 0014).*
2. **Auth-marketplace on-ramp (Rev 3) — v1 BUILT (2026-06-22).** Resumed at the **lead-capture** scope (the recommended, money-free slice): bag-page "Want a pro to check it?" → `authentication_request` → `/authenticate` hub where verified Authenticators claim from a queue and arrange the service **off-platform**. See the auth-marketplace TL;DR up top + migration `0017`. **Deferred to Phase C (PAUSED, needs a fresh go-ahead + an attorney):** on-platform quoting threads, Stripe-Connect payments, the platform take, 1099-K/OFAC.
3. **OAuth provider config (operator, human-gated):** enable Google/Facebook in Supabase Auth (client id/secret + `/auth/v1/callback`) or the buttons error.

**Deferred / data-gated (honest):** brand price **index/ticker**, **most-coveted-by-demand** (needs a `want`-demand query; private per RLS), **trending** (PostHog proxy), **upcoming releases** (news feed); Tier 4 **Durability/Ages-Well** + **Resale-Retention index** (need resale condition/age data — see `ux-remaining-backlog-plan.md`); loose thread: **brand-name-search faceting** (a design call — compact overview vs. faceted style list).

---

> **Branch:** the prior session's work is on **`claude/adoring-mccarthy-0dnhvn`**, forked from the active app lineage `claude/desktop-display-test-d621oc`. See "Lineage fork." The **latest additive session** (GEO, embedded video, social/expert layer, closet-model simplification, reviews decoupling, LV/Gucci research) is on **`claude/port-geo-video-social-onto-main`** → **PR #2** into `main`. See "Latest session" immediately below.

---

## TL;DR — where things stand

The full catalog app (search, identify/camera, browse, admin, bag detail) now has, added this session:
- **User accounts** (Supabase Auth), **closet**, **watchlist + price-trend**, **price-alert delivery**, **feedback write-side** (request-a-bag, thrift-log), **reviews & ratings**, **affiliate "where to buy"**, and **PostHog analytics** (ported from the other lineage).
- **Build health:** `next build`, `tsc --noEmit`, `eslint` all green.
- **Big caveat:** none of the DB-backed features were runtime-tested — the cloud session has **no Supabase credentials**. Everything is verified by compile/build only. The auth → save → review → alert path must be smoke-tested after setup.

**Decided this session:** image strategy (see "Images"). **Queued to build next:** the photo-contribution + contributor-tier system (fully spec'd below — start here).

---

## TL;DR — latest additive session (PR #2: GEO + UGC depth)

On top of the above, branch `claude/port-geo-video-social-onto-main` (→ **PR #2**) adds work `main` lacked. All verified by `tsc` / `eslint` / `next build`; **none runtime-tested** (no DB creds), and the new migrations are **not yet applied**.

- **Breadth research:** **Louis Vuitton Neverfull** + **Gucci GG Marmont** added (beyond the 5 hero styles).
- **GEO layer** (the marketing plan's #1 channel — see `docs/marketing-plan.md`): per-bag front-loaded fact-dense answer + FAQ (composed deterministically from real data, no LLM → honors "never invent"); dimensions in **cm + inches**; named-author byline + catalogued date; cited **Sources**; **JSON-LD** (Product/FAQPage/BreadcrumbList); `generateMetadata` (canonical/OG); **`/sitemap.xml`** + **`/robots.txt`**.
- **Embedded video reviews + curated creators** (the visual layer for a text-first v1; embedding sidesteps image copyright): migration `0004`, `creator` + `resource` tables, a click-to-load YouTube facade on bag pages with a "trusted reviewer" badge.
- **Closet model simplified to `want` / `have` / `had`** (migration `0005`): collapses the old `researching`/`wishlist`/`owned` enum (researching+wishlist → want, owned → have) and adds **had** (previously-owned).
- **Reviews decoupled from the closet:** review any bag (rented/borrowed/tried in-store); a post-review prompt offers to add it to the closet; new **`/profile/reviews`** ("My reviews").
- **Social / expert layer — schema only** (migration `0006`, UI is the next build): extends `profile` (handle, bio, `closet_public` opt-in, admin-granted `is_verified`/`is_expert`/`is_authenticator`); `closet_favorite` (follow a closet); `post` (expert blog); `closet_stats` view = "most coveted closets" (want-demand inverted + favorites). Full design + operator actions in **`docs/archive/additive-features-port.md`**.

---

## TL;DR — engagement / social + recommendations track (this session)

Branch `claude/lucid-archimedes-1cyi21`. Implements `docs/engagement-strategy.md` §3
build order 1–7. All verified by `tsc --noEmit`, `eslint`, and `next build` (green);
**none runtime-tested** (no DB creds). Migration **0007 is human-gated** (see checklist).

1. **Social UI** — `/u/[handle]` public profile (curated `have` closet, tier/trust
   badges, `rel="nofollow ugc"` social links, Follow-closet button); `/closets`
   "Most Coveted Closets" leaderboard from `closet_stats`; verified-owner badge on
   reviews (derived from `closet_item` have/had); profile-edit flow `/profile/edit`
   (handle, bio, avatar, `closet_public`, socials). Files: `src/lib/social.ts`,
   `social-actions.ts`, `src/components/TrustBadges.tsx`, `src/app/u/[handle]/*`,
   `src/app/closets/page.tsx`, `src/app/profile/edit/*`; `getProfile` extended in `auth.ts`.
2. **Activity feed** — `src/lib/feed.ts` (structured events from followed closets,
   honoring 0006 privacy: only public `have` adds, plus reviews & published posts);
   `/feed` route + logged-in home Activity strip + header link; `src/components/FeedItem.tsx`.
3. **Taste quiz** — `src/lib/taste.ts` (model/questions/named-taste over real
   catalogued attributes only), `taste-data.ts` (blends quiz+closet+watchlist),
   `taste-actions.ts` (persists `profile.taste_vector`/`taste_completeness`);
   `/quiz` + `QuizClient` either/or + shareable card.
4. **Bags you might like** — `src/lib/recommendations.ts` content-based attribute
   scoring with deterministic "why" string, cold-start stub; surfaced on home,
   profile, and bag pages (`getSimilarBags`). `src/components/Recommendation*.tsx`.
5. **Taste Map** — `src/components/TasteMap.tsx` + `TasteMapSection.tsx`: visual
   region grid + completeness meter + "answer N more" on the profile.
6. **Re-engagement notifications** — `notifications.ts` gains `notifyFollowersOfActivity`
   (service-role fan-out) + `notifyClosetActivity`/`notifyPhotoFeatured`; wired into
   `saveToCloset` (have), `submitReview`, and `favoriteCloset`. `photo_featured` helper
   is the ready hook for the future photo system (no event point exists yet).
7. **Collaborative recs** — item-item co-occurrence ("collectors who have X also want
   Y") in `recommendations.ts`, blended BEHIND content-based; needs the service-role
   key (degrades to content-only otherwise).

Analytics: new events in `src/lib/analytics/events.ts` — `quiz_started`, `quiz_completed`,
`recommendation_clicked`, `closet_favorited`, `taste_map_viewed`.

**Launch-hardening session (this one):** (1) admin auth gate (above + checklist 1);
(2) `/auth/confirm` now handles the default free-tier PKCE `?code=` flow too
(checklist 3); (3) quality pass on the engagement code — reviewed clean (privacy
enforced server-side via RLS + filters, empty states handled, Next 16 params
awaited), and the pure logic was extracted into no-DB cores (`taste-core.ts`,
`recommendations-core.ts`, plus `buildVectorFromAnswers` in `taste.ts` and
`sortFeedEvents`/`bagFrom` in `feed.ts`); (4) **unit tests added** — `vitest`
devDependency + `vitest.config.ts` + `npm test`; 38 tests in `src/lib/__tests__/`
covering taste-vector/folding/completeness, recommendation scoring + "why", and
feed assembly/sort. All of `tsc`, `eslint`, `next build`, `npm test` green.

**Human-gated for this track:** apply migration **0007** (see the note + the
`ALTER TYPE` transaction caveat in the checklist); set `SUPABASE_SERVICE_ROLE_KEY`
to enable follower notifications + collaborative recs (both no-op without it). No new
env vars or Storage buckets otherwise. Smoke-test: handle/closet-public opt-in →
public `/u/[handle]` → follow → feed → quiz → recs → notifications.

---

## TL;DR — expert posts + corrections + settings session (this one)

Branch `claude/lucid-archimedes-1cyi21` (continues the engagement track). All verified
by `tsc --noEmit`, `eslint src`, `next build`, `npm test` (62 tests now); **none
runtime-tested** (no DB creds). Two new migrations are **human-gated**.

1. **Expert editorial posts** (Task 1) — uses the existing 0006 `post` table (NO
   migration). Public `/posts` (list) + `/posts/[slug]` (Article JSON-LD with named
   author byline + datePublished, `generateMetadata`/canonical/OG, related-catalog
   "Sources" from topic_brand/topic_style). Authoring gated by `profile.is_expert`
   server-side in every action AND hidden in UI: `/posts/new`, `/posts/[slug]/edit`,
   `/profile/posts` dashboard. Draft→publish sets `published_at`; slug auto-generated
   + de-duped (`posts-core.ts`, unit-tested). Files: `src/lib/posts.ts`,
   `posts-core.ts`, `post-actions.ts`, `src/app/posts/*`, `src/app/profile/posts/*`.
   "Articles" in header nav; author's posts on `/u/[handle]`; posts in sitemap;
   `post_published` event.
2. **Suggest-an-edit / corrections** (Task 2) — migration **`0009_corrections.sql`**
   (`correction` table; RLS: authed INSERT/SELECT own, admin SELECT all + UPDATE
   status, public can't read). "Suggest an edit" widget on `/bag/[variantId]`
   (auth-gated); admin review queue `/admin/corrections` (accept/reject — accept does
   NOT auto-write the catalog, applying is manual). Files: `correction-actions.ts`,
   `corrections.ts`, `src/app/admin/corrections/*`, `SuggestEdit.tsx`;
   `correction_submitted` event.
3. **Settings & account** (Task 3) — `/settings`: email/password via the user's own
   session; notification prefs (migration **`0010_notification_prefs.sql`** adds
   `profile.notification_prefs jsonb`, default-on; wired into `insertNotificationFor`,
   `notifyFollowersOfActivity`, and the price-alert cron via `isOptedIn()`); delete
   account via service-role `admin.deleteUser` after email confirm (degrades clearly
   without the key). Files: `settings-actions.ts`, `src/app/settings/*`; `getProfile`
   extended with `notificationPrefs`.
4. **Hero-research re-verification** (Task 4) — Hermès blind-stamp + Chanel serial
   era systems re-verified; system-level facts raised medium→high with cited sources,
   per-year tables left unasserted. JSON only; **re-run `seed-hero-styles.ts`**.
5. **Video creator seed** (Task 5) — `supabase/seed/research/creators.json` +
   `seed-creators.ts` (idempotent; real channels + real video IDs verified from web
   search; 9 resources across the 5 hero styles). **Run `seed-creators.ts`** (needs
   service-role key; 0004 + hero styles first).

**Human-gated for this session:** apply **`0009_corrections.sql`** and
**`0010_notification_prefs.sql`** (both degrade gracefully if absent). Set
`SUPABASE_SERVICE_ROLE_KEY` for account deletion + cross-user notification opt-outs.
Grant `profile.is_expert` (service role) to anyone who should author posts. Re-run
`seed-hero-styles.ts` (corrected research) and `seed-creators.ts` (video resources).
**Migration numbering note:** the future photo-contributions migration becomes
**`0011`** (0009 = corrections, 0010 = notification_prefs).

---



<!-- Archived 2026-07-02 by wrap-up -->

## TL;DR — Authentication section + nav IA rework (2026-06-30, all on `main`)

**Authentication is now a primary nav section, and the whole primary nav was reshaped.** Shipped, gated green, merged:
- **14 per-house auth guides LIVE** (`{House} authentication: The markers worth checking`): Coach/LV/Gucci (renamed) + Chanel/Hermès/Dior/Prada/Goyard/Saint Laurent/Bottega/Celine/Balenciaga/Fendi/Loewe. Each tagged to its most-faked style so the post→bag money-moment CTA fires; each carries an original `BrandAuthDiagram`; a "More authentication guides" cross-link rail at each foot. Sourced from `docs/research-drafts/authentication-markers-brief.md` (Entrupy 2026 + reseller-authenticators, 2026-06-30). `/articles` lead spread now uses a designed `CoverPlate` (no placeholder).
- **New `/authentication` hub** (Learn/Check/Verify ladder + guides-by-house grid). Homepage "Is it real?" tile points there.
- **Nav A (protected nav, owner-approved this session):** row = **Authentication ▾ · Style Read · Articles ▾ · Profile · Search (rightmost)**. Shop/Brands/Discover dissolved: Deals + brands (by tier, truncated 5 + All brands) live in the **Search hover dropdown**; Identify moved under Authentication; Style Read + Articles promoted. Articles nav label kept; on-page heading is "The Journal".
- **Unified search:** `/search` returns bags + a "From Articles" section; nav search has **autocomplete** (`/api/search-suggest`, brands/bags/articles).
- **Closet consolidation:** Have/Want/Had stay stacked sections; Want rows show a read-only **alert bell** (state from watchlist); Watchlist off-nav (alert editor is a Closet sub-surface); `photo_featured` is Notifications-only (feed = what others do, notifications = about you).

**Thrift Find tool (the reframed photo `/identify`) — SPEC ONLY, not built:** `docs/ux/thrift-find-tool-spec.md`. Non-verdict: resemblance+confidence ID, resale estimate gated on "if genuine", silhouette-match red flag, three-tier authenticity voice (consistent / soft flag / hard house-confirmed dealbreaker). **Naming LOCKED (search-evidenced, `docs/research-drafts/tool-name-search-demand.md`):** tool = **"Spot the Fake"**, section = **Authentication**, H1 = "Spot the Fake: {Brand} authentication", GEO tagline = "Is it real? Let's check the markers." Placement: value/discovery funnel INTO Authentication, never a rung that authenticates.

**Spot the Fake — BUILT (2026-06-30).** `/identify` reframed to "Spot the Fake" (tagline "Is it real? Let's check the markers"): resemblance+confidence ID, value-if-genuine (median/n/date via `getStyleShopData`, gated on match + not-low confidence + no hard flag), calibrated no-match copy, and the **hard country-of-origin dealbreaker** (`HOUSE_ORIGINS` in `src/app/api/identify/route.ts`; Coach/mass-market excluded; value suppressed on a hard flag). Naming/spec: `docs/ux/thrift-find-tool-spec.md`. **Pending on this tool:** logo-geometry/misspelling dealbreakers + a true silhouette-existence check (vision can't reliably read logo geometry yet, held rather than over-claim); a clean `/spot-the-fake` URL (currently still `/identify`).

**Listing red-flag checker — BUILT (2026-06-30):** `/authentication/check` (server component, deterministic, no AI/scraping). Guided form (brand/style/price/platform + card/photos/pressure one-taps) → readout of the Red Flags signals, with a **price sanity check against our resale median** (style resolved by exact-or-shortest name match, `getStyleShopData`). Three tones (flag/note/ok), "N things to scrutinize" header, routes to guides + pro, "red flags to weigh, not a verdict." Wired into the Authentication hub ladder (now Learn / Spot the Fake / Check a listing / Verify) + nav.

**Open follow-ups (net-new, flagged not built):** (1) **"someone followed you"** notification type (does not exist); (2) `/browse` decision — it is NOT a dumb grid, it is a carry-type/fits **taxonomy** (`/browse/carry/[type]`, `/browse/fits/[item]`, from `browse-taxonomy.ts`, still linked in footer + homepage + sitemap) and those sub-pages are real GEO surfaces. Do NOT blind-301 it. Owner to decide: keep the taxonomy (just off primary nav, already done) or retire the sub-pages too; (4) the Spot-the-Fake pending items above. Balenciaga + Celine auth guides carry lower-confidence hedges in-body.

---


## TL;DR — /data page + homepage speed + handbag-breadth capture (2026-06-30, all on `main`)

- **Homepage load speed fixed.** Cached the near-static homepage queries (`src/lib/cache.ts`; brands/hero/deals/leaderboards/gates) and made `fetchAllRows` page in PARALLEL (was sequential = ~9s on every uncached load). Warm loads ~9s → ~0.23s.
- **New `/data` page = "the data behind every page"** (reached from a homepage PersonaRouter tile; the "What brings you in?" heading was removed). Mission copy up top ("The numbers they keep behind glass"), stat cards, a **Typical resale price by house** chart + a **Where our data runs deepest** depth chart (serious zone), then a warm-tinted **"Just for fun"** zone (Named after icons, Bag math, Gold or silver, Colors, Leathers). 2-col tile grid. Data via `getMarketPulse` / `getFunFacts` / `getAttributeStats` (all cached). Attribute data (colour/material/hardware) lives on `price_history`, NOT the sparse variant columns.
- **Representative per-house pricing (handbag-breadth capture).** Captured every current Fashionphile handbag for the 8 thin houses via archivist-authoritative model clustering: The Row $1,895 (was $4,045), Goyard $2,785, Miu Miu $2,000, Valentino $1,075, McQueen $845, Jacquemus $650, Off-White $385, Telfar $120. Loader `supabase/ingest/load-handbag-breadth.ts` (guarded, idempotent). **Big houses (Hermès/Chanel/LV) left icon-scoped** (owner's call; chart honestly labeled "the bags we track, our read, not an appraisal").
- **⚠️ Collision + reconciliation (lesson).** My capture ran in parallel with the active data-lane per-size pass and clobbered iconic size variants (dumped all sizes onto one). Reconciled: re-ran the per-size pipeline, deleted the mixed rows on managed size variants, reloaded clean, verified (Soft Margaux ascends 10<12<15<17). **`load-handbag-breadth.ts` now GUARDED to only ADD new styles.** Rule: before running any capture, check `docs/data-content-worklist.md` for an active parallel capture on the same brands.
- **Value-retention board** fixed (RPC over ALL price data + n>=20 floor + dedupe-by-style); lives in the review-gated CommunityLeaderboards.

---


## TL;DR — social media agent + 9-post launch batch (2026-06-30)

Built the `social` agent + connected Metricool (brand `luxurycatalog_`, blogId 6480195; IG+Pinterest+TikTok linked; plan Free→Starter). Reviewed and **approved 9 launch posts** in the owner's voice (each sourced, one idea, 2-3 rotating hooks, a jewel-style chart or type-card): small-bag / Birkin-vs-Kelly / Coach-Tabby / thrift-Coach / **Chanel-vs-Hermès** / rent-first / investment / where-to-shop / Flap-overrated. Wired the first-party still library (`scripts/handbag-stills`). **Hardened the social voice rules** (hook+POV+one-idea, model-name recognition, brand rename to "Luxury Catalog" **sitewide**, no naive "should", value-first, every-post-links-to-a-live-page, n out of prose) in `docs/voice-and-tone.md` §7b + preferences. Command Center = a Google Sheet + `docs/social-calendar.csv`. Also: **monetization docs updated** (high-payout TRR consignor lever confirmed dead 2026-06-30). All on `main` (`feat/social-agent` merged). Details + your-turn items: the **Social / content** lane row above. Spun-off tasks: dedicated Chanel-vs-Hermès article, CTA buy-first reorder, article naive-"should" audit.


## TL;DR — homepage overhaul finished + brand 4-tier + auth-guide sprint (2026-06-29, later session)

Large UX session, all on `main` (`5454b82..ee49337`), gates green throughout (tsc / eslint src / next build / 488 tests). Builds on the rail+canon TL;DR below.
- **Homepage reordered + unstacked:** hero → what brings you in → quiz → it bags → from the Journal → priced well today → brands → your closet → sign up. The rail + It-bags ⅓-sidebar pairing was **cut**; every module is full-width, stacked. Section "see all / all brands / read the Journal" links → **full-width buttons at the bottom** of their module. It-bags grid = 2-col mobile / 3-col desktop.
- **PersonaRouter tiles reworked** (grounded in `docs/personas.md` — lead with the largest/aspirer base's value): Collect & invest is **want-led** ("Save the bags you love", contained heart+bags visual, overflow fixed); What's it worth = the **price-story demo**; "Is it real?" → magnifier icon + single "Read the authentication guides" link (scan-a-bag cut → backlog; "point you to a human" line cut until a human-auth partner exists); the "find the bag" tile was removed (it duplicated the style-read quiz).
- **Style-read quiz:** the "your bags" headline (assumes ownership) was cut; now a live **V1/V2 headline A/B** (`src/lib/experiments/quiz-headline.ts` + `StyleReadCallout.tsx`, metric `quiz_started`).
- **Brand tiers → four: Ultra-luxury / Luxury / Premium / Contemporary** (sourced: LePrix hierarchy + Rebag 2025 Clair Report). Gucci mistag thrift→Premium corrected (live DB + seed). **Premium needs migrations `0039` (add enum value) + `0040` (re-tier 7 houses) — OWNER applies; code ships degrading gracefully (empty Premium group until applied).**
- **Auth-guide sprint:** Chanel guide drafted + its schematic **diagram component built & registered** (`ChanelAuthDiagram`, `[diagram: chanel-authentication]`, trade-dress kept abstract); Gucci / Hermès / Dior guides drafted (Coach style, markers-not-verdicts, Hermès hedges hardest). Slate priority (sourced demand): Chanel → Gucci → Hermès → Dior → Goyard → Prada → YSL. Also drafted: the it-bags-canon article + "How we sort the houses" tiering article. **All 6 drafts in `docs/research-drafts/**` are PENDING OWNER REVIEW — source URLs must be confirmed before publish; publishing is owner-gated; per-article diagram components get built at wiring.**
- **Data:** loaded **Balenciaga City / Mulberry Bayswater / Telfar Shopping Bag** (eBay sold + Fashionphile, multi-source) to close the canon's bag-page CTA gaps; created Telfar brand + 2 styles. Found + fixed the **PostgREST 1000-row cap** (every read silently truncated to 1000; `fetchAllRows` pager in `supabase.ts`). Migration **`0038` `variant_price_summary()`** + spec to retire the per-render full-table scan (OWNER applies, then rewire `getDeals`/`getHeroCarousel` to the RPC — note name clash with the 0021 matview).
- **OWNER ACTION LIST:** apply migrations **`0038`, `0039`, `0040`**; **review + publish** the 6 article drafts (confirm sources first); after `0038` applies, rewire deals/hero to the RPC; provide a quiz *image*-test direction when one lands (image variants were parked, none clicked).


## TL;DR — homepage redesign: "Priced well today" rail + "It bags of all time" canon (2026-06-29)

UX-lane design session, all landed on `main` (`5454b82..5b48d05`, 8 commits, gates green: tsc/eslint src/next build/482 tests). Developed in worktree `…/luxury-catalog-priced-well` (branch `ux/priced-well-rail`), fast-forwarded to `main`.

- **"Priced well today" rail** (replaces the old Best-deals image carousel): a ⅓-width sidebar beside It bags, image-free, glanceable. Each row = bag name → **big price + "great price"/"good price"** verdict (gated n≥5) → a labeled range bar (**"this listing"** dot vs **"median $X"** tick) → a **"View on <platform>"** outbound button firing `outbound_resale_clicked` (affiliate-attributed via `affiliateListingUrl`). Verdict is a read on **price, not condition** (condition recorded on ~0% of listings — subhead says so). `deals.ts` exposes low/median/high/sampleSize/verdict; **guard drops listings >70% under median** (accessory/mis-grouped noise, e.g. a "$370 Hermès Kelly"). Code: `BestDeals.tsx`, `DealBuyButton.tsx`, `deals.ts`.
- **"It bags of all time"** rebuilt as a **ranked top-6, image-free, price-led canon** (archivist-validated, **blend lens** = heritage + recognition): Birkin · Kelly · Classic Flap · Speedy · Lady Dior · Neverfull (dropped Coach Tabby/Swagger). Each cell = big gold numeral + house + bag + **typical resale (median) big** + low/high text + sourced hook. `getHeroCarousel` now returns live resale stats per style. Paired with the rail in one two-column section (stacks on mobile).
- **Bug found + fixed (affected both + any whole-table read): PostgREST caps every response at 1000 rows regardless of `.limit()`.** Both reads were silently computing on a 1000-row slice of ~33.5k. Added `fetchAllRows()` pager (`src/lib/supabase.ts`); true counts jumped (e.g. Birkin resale n 995→1404). **Follow-up spec to retire the per-render full-table scan: [docs/ux/deals-hero-aggregate-spec.md](ux/deals-hero-aggregate-spec.md)** (owner-gated migration: a `variant_price_summary()` SQL function).
- **Queued (on the slate/worklist):** the **"Why are these the it bags of all time?"** article (archivist top-20 backbone, [content-ideas.md](research-drafts/seasonal-archive/content-ideas.md)) + **3 catalog data-pull gaps** (Balenciaga City, Mulberry Bayswater, Telfar Shopping Bag) in [data-content-worklist.md](data-content-worklist.md), plus a `condition` backfill (chip) so the verdict can become condition-aware.
- **Your turn (owner-gated):** apply the `variant_price_summary()` migration when you want the perf fix; the article draft + the 3 data pulls are Content/Data-lane jobs.


---

## TL;DR — The care shelf: OWN-state surface + dormant Amazon Associates channel (2026-07-13, PR-ready; SUPERSEDED by the landed "Care shelf polish" entry)

**Off the owner's "Amazon list of bag-adjacent products" idea. Built Option A: a `/care` hub + a material-aware bag-page module.** Serves the OWN state, which had no surface (the site covered want/buy/sell). Activates the parked Amazon Associates care/accessories revenue line from `docs/monetization-projections.md`.
- 🧴 **`/care` hub** (`src/app/care/page.tsx`): 18 curated products grouped by job, jump-nav, ItemList JSON-LD for GEO. Registry + material helpers in `src/lib/bag-care.ts`.
- 👜 **Material-aware `CareModule`** on the bag page: reads `exteriorMaterial`, shows the 2-3 items that fit that finish, routes to the hub.
- 💰 **Amazon Associates, dormant + self-activating**: each product deep-links an Amazon SEARCH; plain until `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` is set, then commission-tagged. `outbound_care_clicked` is the proxy event.
- 📝 Companion article drafted: `docs/research-drafts/how-to-care-for-a-designer-bag-draft.md`.
