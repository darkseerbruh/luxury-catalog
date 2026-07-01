# Luxury Catalog — Handoff ARCHIVE (historical session recaps)

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

