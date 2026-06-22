# UX Research Brief — Best-Practice Canon + Competitor Teardowns

> **Purpose & status.** This is the *informational appendix* for the Luxury
> Catalog UX evaluation. It exists to **ground** the recommendations in
> `ux-evaluation.md` — it is not the headline deliverable. Part 1 is the
> best-practice canon (Nielsen Norman Group–led, the team's preferred source,
> plus Baymard, Stanford/Fogg, and peer-reviewed work). Part 2 is the competitor
> teardown of the eight named/selected experiences, each defended. Part 3 is the
> consolidated **"options for new additions"** list the evaluation draws from.
>
> **Sourcing caveat (be honest about it).** nngroup.com, Baymard, arXiv, and most
> resale sites (Fragrantica, WatchCharts, Chrono24, StockX, GOAT, Fashionphile,
> TRR, Vestiaire) return HTTP 403 to automated fetchers. Findings below were
> corroborated from search-indexed page content, official help-center text, and
> multiple secondary sources rather than byte-for-byte page renders. Canonical
> URLs are cited; before quoting anything *verbatim* in external-facing material,
> confirm wording in a browser. Items most worth eyeballing: Baymard percentages,
> NN/g's "under one second" instant-filter threshold, the exact StockX/WatchCharts
> stat formulas. The mechanics themselves are cross-corroborated.

---

## Part 1 — Best-practice canon (principle → guideline → source)

### 1. Faceted search & filtering
**Principle.** Filters *remove* non-matching items; facets *turn search into
navigation* by surfacing attributes users wouldn't think to ask for — the right
model for a deep catalog (brand, model, material, hardware, size, era, price band,
condition).
**Guidelines.** Show **result counts per facet value** (prevents zero-result dead
ends). Offer a filter for **every attribute you display** in a list item, and
promote the most important ones. On mobile, use a **push-out tray overlay** (keep
results partly visible) with a **sticky "Filter & Sort"** trigger; **batch-apply**
unless results return in <1s. Make applied filters visible as **one-tap removable
chips**.
**Sources:** nngroup.com/articles/filters-vs-facets/ · /applying-filters/ ·
/mobile-faceted-search/ · /filter-categories-values/ · baymard.com/learn/ecommerce-filter-ui

### 2. Information scent, discoverability & navigation
**Principle.** Information-foraging: users follow the link whose label/context best
predicts the destination. Low-scent or hidden features are effectively invisible —
*"discoverability is cut almost in half by hiding a website's main navigation."*
**Guidelines.** Labels must be **descriptive, specific, mutually exclusive**; avoid
vague verbs ("Explore," "Discover") and internal jargon. **Don't bury** primary
features behind menus or footers. Treat **every page as a gateway** (first
impressions land on internal pages). Kill **pogo-sticking** by surfacing
differentiating detail on list/category pages.
**Sources:** nngroup.com/articles/information-scent/ · /information-foraging/ ·
/wrong-information-scent-costs-sales/ · /menu-design/ · /category-names-suck/ · /pogo-sticking/

### 3. Detail-page anatomy (reference + commerce)
**Principle.** A high-intent buyer should be able to decide **without leaving the
page**; layer dense data so essentials are up front and specs/provenance are
on-demand.
**Guidelines.** **Above the fold:** identity, primary image, price/price-intelligence,
availability, and the **primary action** (here: where-to-buy/sell + Save). If
critical content is below the fold, **add a visual cue it exists**. Use
**progressive disclosure** for exhaustive specs/provenance. Galleries need
**multiple angles + detail shots** (hardware, stitching, interior) with tap/pinch
zoom. Mark data **verified**; show reviewer context. "Get right to the gist" — no
marketing fluff.
**Sources:** nngroup.com/articles/ecommerce-product-pages/ · /progressive-disclosure/ ·
/reports/ecommerce-ux-trust-and-credibility/ · baymard.com/research/product-page

### 4. Onboarding & the cold-start problem
**Principle.** Deliver value **before** asking for investment; minimize onboarding.
**Guidelines.** Keep it **skippable, contextual, short** (3-step tours ~72%
completion vs. ~16% for 7-step). **Don't wall value behind an ambiguous "Get
Started."** For quizzes, apply **reciprocity** — give useful results first, explain
why each question matters. **Never default to totally empty states**: state status,
then offer a path (seed a sample, "take the style quiz").
**Sources:** nngroup.com/articles/mobile-app-onboarding/ · /get-started/ ·
/empty-state-interface-design/ · /reciprocity-principle/

### 5. Social proof & trust / credibility
**Principle.** Social proof works *only* when the numbers are strong; weak counts
are **negative** social proof. Nielsen's four credibility factors: design quality,
up-front disclosure, comprehensive/current content, connection to the rest of the
web.
**Guidelines.** **Hide low counts.** Reviews: show average + **star-distribution
histogram** + filters; **sort by weighted volume, not raw average**. Signal
credibility via polished design, **citing external sources** (a confidence signal),
verified/authentication badges. **Hierarchy of trust** — don't demand high
commitment before establishing baseline credibility. Stanford/Fogg: show the real
org, real people, real expertise; make accuracy verifiable.
**Sources:** nngroup.com/articles/social-proof-ux/ · /trustworthy-design/ ·
/commitment-levels/ · credibility.stanford.edu/guidelines/index.html

### 6. Decision-point & conversion clarity
**Principle.** A primary CTA must set an expectation met the instant it's clicked;
more similarly-weighted choices slow decisions (Hick's Law).
**Guidelines.** **One distinct primary CTA** per decision (unique styling);
de-emphasize secondary actions. Labels should be **Specific, Sincere, Substantial,
Succinct** — "Where to Buy," "Sell This Bag," "Save to Collection" beat "Continue."
**Proximity:** place the CTA adjacent to the object it acts on. When offering
several options (e.g., resale platforms), **state the explicit differences** so
users compare instead of deferring.
**Sources:** nngroup.com/articles/get-started/ · /better-link-labels/ ·
/closeness-of-actions-and-objects-gui/ · /simplicity-vs-choice/ · /explicit-differences/

### 7. Recommendation-system UX
**Principle.** Recs succeed when users understand **why** an item was suggested, can
**act** on it, and can **find** it. Cold-start must degrade gracefully.
**Guidelines.** **Explain the basis** ("Because you saved…," "Popular with
collectors like you"). **Place recs high** — recs below generic content are far less
discoverable; beware carousel blindness; don't auto-advance. Offer **feedback
controls** (not interested / show fewer). **Never render an empty rail** — fall back
to popular/trending/content-based. A few relevant items beat long weak lists —
*"poor recommendations are worse than none."*
**Sources:** nngroup.com/articles/recommendation-guidelines/ · /personalization/ ·
/designing-effective-carousels/ · arxiv.org/abs/1804.11192 (explainable rec survey) ·
dl.acm.org/doi/10.1145/564376.564421 (cold-start, SIGIR)

### 8. Gamification & contribution loops
**Principle.** Mechanics must tie to **genuine value**, not vanity. Two levers:
**Zeigarnik** (unfinished tasks nag) and **goal-gradient** (motivation rises near
the goal).
**Guidelines.** **Progress meters** ("collection 60% documented — add 3 more"), but
always allow opt-out. **Never start a progress bar at 0%** (endowed progress).
**Leaderboards relative, not global** — show rank "among people like you," reset
periodically (a global top-100 motivates ~100 people and disengages the rest).
**XP for meaningful actions** (verified data, helpful reviews, quality photos), not
logins. Expect **90-9-1** participation inequality; show contribution impact ("your
data helped 240 collectors").
**Sources:** nngroup.com/videos/zeigarnik-effect/ · /articles/progress-indicators/ ·
/participation-inequality/ · journals.sagepub.com/doi/10.1509/jmkr.43.1.39 (goal-gradient,
Kivetz) · ieeexplore.ieee.org/document/6758978 (Does Gamification Work?, Hamari)

### 9. Mobile-first (375px, thumb zones, camera-first)
**Principle.** Mobile demands stricter, scaled-back design; prioritize content over
chrome.
**Guidelines.** **Touch targets ≥ 1cm × 1cm** (NN/g physical minimum). **Thumb
zones:** the screen *middle* is most tappable; put primary CTAs in easy reach,
reserve top corners for rare actions. **Front-load value** (users scroll only if
the top looks promising); use mini-TOC/accordions/sticky nav/back-to-top.
**Responsive ≠ done.** Make **camera/scan a first-class entry**, not a buried tool.
**Sources:** nngroup.com/articles/touch-target-size/ · /mobile-ux/ ·
/defer-secondary-content-for-mobile/ · /qr-code-guidelines/

### 10. Nielsen's 10 usability heuristics (the scoring rubric)
Canonical: **nngroup.com/articles/ten-usability-heuristics/**
1. Visibility of system status — 2. Match between system & real world —
3. User control & freedom (undo/exit) — 4. Consistency & standards —
5. Error prevention — 6. Recognition rather than recall —
7. Flexibility & efficiency (accelerators) — 8. Aesthetic & minimalist design —
9. Help users recognize/diagnose/recover from errors — 10. Help & documentation.

---

## Part 2 — Competitor teardowns (and why each was chosen)

### A. Goodreads — *why:* the canonical status-shelf + low-moderation social feed; direct analog of the closet + activity feed (the engagement-strategy doc already cites it).
- **Status shelves + one-tap "Want"** on every card (want/have/had = our closet).
- **A "want" backlog** that doubles as wishlist and re-entry point (retention asset).
- **Custom shelves** layered on fixed statuses (system-state vs. personal taxonomy).
- **Atomic micro-updates** posted as small feed events (near-zero moderation).
- **Friend "updates" feed** of low-effort actions you can react to (a *consumption*
  loop independent of contribution).
- **5-star rating decoupled from the written review** (captures the 90% who won't write).
- **Self-tagged disclosure markup** (spoiler tags → "shows wear/flaws/price") =
  candid UGC at near-zero moderation cost.
- **Listopia:** user-generated, upvoted ranked lists ("Best Bags Under $2k") =
  evergreen, SEO-friendly curation with no editorial staff.
- **Annual Reading Challenge:** self-set goal + auto-count + progress bar + scarce
  badges = commitment device + recurring return trigger.
- *Caveat:* borrow the mechanics, **not** the dated UI.
**Sources:** help.goodreads.com (shelves, challenges, progress, spoiler tags) ·
goodreads.com/blog (Listopia, recommendations) · trophy.so/blog/goodreads-gamification-case-study

### B. StoryGraph — *why:* best-in-class **taste-profiling + stats**; the model for the quiz + Taste Map.
- **Structured completion survey** instead of a free-text box (moods, pace,
  character-vs-plot) → machine-readable signal at the highest-engagement moment.
- **Mood/vibe as first-class tags** (our equivalent: "quiet luxury / bold / vintage
  / minimalist / office / going-out") capturing the axis people actually choose by.
- **One taxonomy serving capture + filter facets + rec inputs** (no orphaned
  metadata — every tag compounds).
- **"What are you in the mood for?"** intent-first rec entry (present context, not
  just historical average).
- **Named rec buckets with a reroll** ("More of what you just saved," "similar
  taste") — legible provenance + agency.
- **Onboarding captures likes AND explicit dislikes/avoids** (high-signal, rarely
  collected; solves cold start).
- **Stats dashboard from the same taxonomy** → tagging *is* analytics (the Taste Map
  should be generated this way).
- **Big-visual, individual-first layout** (calm, self-focused) — its clearest
  differentiator from Goodreads' noisy feed.
**Sources:** thestorygraph.com · app.thestorygraph.com/reading_preferences ·
roadmap.thestorygraph.com (stats v4/v5) · astropad.com/blog/storygraph-vs-goodreads/

### C. Letterboxd — *why:* "Goodreads done right"; the model for **shareable identity + viral loops** on an intensely visual catalog.
- **Single "Log" sheet** (date + rating + heart + optional review/tags in one
  action) — captures the high-intent moment before motivation decays.
- **Dated "diary" logging distinct from a passive "have"** — the dated entry powers
  stats (make the stats-generating action visually primary).
- **"Four Favorites"** pinned to every profile — a fixed-scarcity, poster-driven
  taste badge ("My Four Grails"); the constraint makes it debate-worthy/shareable.
- **Two review registers** — earnest long-form *and* the one-line meme, both
  first-class, no minimum length, **no downvotes** (low posting floor).
- **Poster-grid visual system** — every surface is **screenshot-ready by default**
  (the UI *is* the off-platform marketing asset). Bags are intensely visual → huge.
- **Lists as first-class objects** (public/private, ranked, fan-rankable).
- **Annual "Year in Review"** recap, gated behind real usage, built for one-tap
  social export → synchronized viral wave.
- **Frictionless watchlist that auto-graduates** (logging removes it) — self-maintaining.
- **Social graph stripped of vanity metrics** (chronological feed; the *item* anchors
  every interaction) — keeps the community non-toxic.
**Sources:** medium.com/design-bootcamp/how-ux-design-concepts-shape-the-letterboxd-interface ·
letterboxd.com/about/faq/ · /year-in-review/ · indiewire.com (Four Favorites) ·
ypulse.com (Gen-Z virality)

### D. IMDb — *why:* the brief's stated north star ("IMDb for bags"); the model for an **authoritative reference page**.
- **Every factual attribute is a hyperlink** to a filtered index of all entities
  sharing it (brand/material/designer/year/hardware) → an infinite, no-dead-ends
  browse graph and the authority moat.
- **Bidirectional credit linking** (designer ↔ all their works).
- **A canonical, stable, opaque ID** per entity (independent of marketing name).
- **Layered depth:** concise primary page expanding into exhaustive sub-pages
  (Specs / Variants / Price History / Authentication).
- **A "fun facts" layer** (history, celebrity carries, "as seen in," design lineage)
  atop dry specs — the screenshot/citation bait.
- **Typed "Connections"** ("reissue of," "successor to," "collab variant of") —
  richer than generic "related"; a hard-to-replicate knowledge graph.
- **Weighted (not raw) ratings + vote count + distribution histogram**, with
  undisclosed anti-gaming weighting — credibility through transparency + integrity.
- **"More Like This" from the page's own structured attributes** (explainable).
- **Moderated open contribution:** evidence requirements, staff approval, **lockable
  verified fields** — Wikipedia-scale breadth with a quality floor.
**Sources:** help.imdb.com (weighted ratings, connections, trivia, contribution) ·
developer.imdb.com/documentation/key-concepts · en.wikipedia.org/wiki/IMDb

### E. Discogs — *why:* the closest **collector-DB + price-guide + condition-grading** structural analog.
- **Goldmine-standard condition grading**, with **components graded separately**
  (media vs. sleeve → bag body vs. hardware vs. interior) — precise, comparable.
- **Collection + Wantlist** as first-class objects; **Wantlist filterable by
  condition/format/price** with **real-time alerts / daily digest** when a wanted
  item is for sale.
- **Per-item value + whole-collection estimated value** (our portfolio analog).
- **Collection/Wantlist notes** (personal annotation per release).
- **Price guide from real sales data** (low/median/high) feeding listing prices.
- **Marketplace "Items I Want" filter** — a personalized view of your wantlist
  currently for sale (the wishlist→buy bridge).
**Sources:** discogs.com/about/features/wantlist/ ·
discogs.com/digs/collecting/vinyl-record-price-guide/ ·
support.discogs.com (How To Grade Items) · discogs.com/selling/resources/how-to-price-items/

### F. Fragrantica — *why:* the brief's *other* stated model; how to make an **intangible, subjective product browsable** via a fixed schema + community voting.
- **Derived "character bars"** (proportional, ranked) summarizing a dense attribute
  list into ~5-8 at-a-glance traits ("Structured / Everyday / Statement / Vintage").
- **Multi-axis community voting on subjective performance** (decouple what a single
  star mashes together): for bags → **Build quality, Everyday wearability,
  Holds-its-value, Roomy↔compact, Comfort, Versatility, Worth-the-price**.
- **Ownership states (have/had/want)** as one-tap signals → demand + **churn**
  ("had it" = soft negative) + recommendation co-occurrence.
- **Voting on the attributes themselves** — crowd-corrects seller/marketing claims
  toward lived experience while keeping a controlled vocabulary (editors add terms).
- **Recommendations from co-occurrence + attribute similarity** ("Perfume Map").
- **Deliberate negativity** (love/like/dislike) with a **published rating formula**,
  plus **context tags** (occasion/season/day-night) — "good *for what*," not just good.
**Sources:** fragrantica.com (accords, finder, map) · alphaaromatics.com/blog/fragrance-pyramid/ ·
fragrantica.com/board (voting mechanics, rating formula)

### G. WatchCharts / Chrono24 — *why:* luxury-collectible **price intelligence**; the model for the collector/flipper "is this a good position?" mindset.
- **A named market index** (ChronoPulse = "Dow Jones for watches"; points-based,
  fixed epoch, rebalanced) → turns a category into a trackable **asset class**.
- **A hierarchy of indexes** (overall / brand / group / price-range) so everyone
  finds *their* trend line (also multiplies SEO landing pages).
- **Three labeled price tiers** (Retail / Market / Dealer) + always a **range, not a
  point** — pre-empts "but I saw it cheaper."
- **Price-history chart with range toggles (1Y/3Y/5Y/All) + a bold % delta** and a
  retail reference line. The chart is the emotional payload; the % is the decision.
- **"Value Retention"** as a single sortable metric → a **leaderboard** ("Bags Above
  Retail," "Top Performers") — true for bags (Birkins appreciate) and addictive.
- **Recent-sales + live-listings feed with a per-listing fairness verdict**
  ("X% below market").
- **Portfolio/collection tracking** with cost basis + gain/loss + **weekly digest
  email** — the retention engine.
- **One-click "track this" bell** for price/listing alerts.
- **Trust/escrow framing** (Buyer Protection, certified + QR digital certificate)
  wrapped around the data.
**Sources:** watchcharts.com/watches/index_methodology · /market/vr (value retention) ·
chrono24.com/chronopulse.htm · /info/valuation.htm

### H. StockX / GOAT — *why:* the two buyer fears answered — **"is it real?"** and **"am I overpaying?"** — for the authentication-paranoid + thrift personas.
- **Two-price market frame** (Lowest Ask / Highest Bid + spread) → price reads as
  market consensus, not a seller's demand; "Buy Now" vs. "Place Bid."
- **"Last Sale"** as the anchor stat — a *settled transaction*, not an asking price.
- **12-month price-history chart + 52-week high/low + trade range** → buyers
  self-locate ("near the 12-mo low = deal").
- **Named, formula-backed stats** (Price Premium over retail, Volatility, Number of
  Sales) — naming + a formula signals objectivity; premium-over-retail doubles as an
  investment pitch.
- **Physical scannable verification tag** (green "Verified Authentic" + QR/NFC →
  hosted verification page) = trust you can hold; the post-purchase scan reassures
  when anxiety peaks.
- **Visible, enumerated authentication process** (named multi-point steps:
  construction, materials, labeling, accessories, condition) — *specificity is the
  trust mechanic.*
- **Standardized named condition tiers + mandatory real photos of the actual item**
  (the strongest antidote to bait-and-switch).
- **A named, badged guarantee** — *but the GOAT $2M FTC penalty (Dec 2024) is the
  cautionary tale:* never imply "full refund" if you mean store credit; honor the
  words operationally.
**Sources:** stockx.com/help (ask/bid, how to bid) · stockx.com/news (stats defined) ·
goat.com/verification · ftc.gov (GOAT 2024 order) · legitcheck.app (StockX tag)

### I. Fashionphile / TheRealReal / Vestiaire — *why:* **direct-domain incumbents** — the exact authentication, condition, and where-to-sell flows for pre-owned luxury bags.
- **Fixed grade word + a free-text "notable flaws" override** on every listing
  (clean filterable baseline + radical per-item honesty → kills "not as described").
- **Category-specific grade rubrics** (a handbag's "Very Good" ≠ a shoe's) — author
  grades in **bag-native language** (corner abrasion, handle patina, hardware
  tarnish, lining, sag).
- **Visual condition guide with real photos per grade + a named defect vocabulary**
  (discoloration, oxidation, pulled threads…) — doubles as SEO/education content.
- **Lifetime-backed Certificate of Authenticity + scannable QR / unique ID** — a
  transferable, verifiable artifact that protects future resale value.
- **Named, humanized authenticators + branded ™ tooling** (GIA gemologists, "TRR
  Vision," microscopic comparison) — evidence, not a bare badge.
- **A structured "Comes With" accessories block** (dust bag / box / card / lock /
  keys / receipt) — completeness materially drives value; make it explicit, not prose.
- **Buyout vs. consignment "where to sell" fork** with **transparent published
  commission splits** (Fashionphile 70%→85% above $3k; TRR tiered to 80%+), payout
  **Wallet + store-credit bonus**, and **loyalty tiers** for repeat consignors.
- **Optional paid "verified before it ships" tier** (Vestiaire $15) — turns the
  guarantee into an affirmative buyer action.
**Sources:** blog.fashionphile.com/fashionphile-condition-ratings/ ·
fashionphile.com/pages/sell-with-us · therealreal.com/authentication · /seller/commissions ·
faq.vestiairecollective.com (visual condition guide, buyer authentication fees)

### J. Kelley Blue Book — *why:* the user-named **valuation-as-hero** model; the template for "what's this bag worth?" (esp. the thrift 60-second use case).
- **Valuation is the hero** — the entire site organizes around one guided "What's My
  Car Worth?" flow.
- **A short guided intake** (vehicle → mileage → options → **condition**) that ends
  in a number — the funnel *is* the product.
- **Plain-English condition tiers** (Fair / Good / Very Good / Excellent) with an
  **honesty nudge** ("only 3% are truly Excellent") that calibrates self-assessment.
- **A "Fair Market Range," not a single price** — communicates uncertainty honestly
  and pre-empts disputes.
- **Multiple value types for multiple intents** — **Trade-In Range** (sell fast to a
  dealer) vs. **Private Party Value** (sell for more) vs. instant cash offer →
  directly maps to our **buy / sell-fast / consign** fork.
- **Authority framing** ("the trusted resource since 1926") — the brand *is* the
  trust.
**Sources:** kbb.com/whats-my-car-worth/ · kbb.com/car-values/ · kbb.com/faq/values/

---

## Part 3 — Consolidated "Options for new additions" (sourced shortlist)

Ranked roughly by leverage; full prioritization (impact × effort, revenue arrow)
lives in `ux-evaluation.md` §Backlog. Each option names its origin.

**Discovery & navigation**
1. **Faceted search/filter on results** — facets w/ counts, mobile tray, applied-chip
   removal (NN/g, Baymard; Discogs Wantlist filters). *Currently absent.*
2. **Every attribute is a link to a filtered index** (IMDb) — brand/material/
   hardware/year as browse entry points; the authority moat.
3. **Persona-legible entry points** on home + nav (KBB valuation-as-hero;
   info-scent) — make the five use cases "plain as day."

**Decision point (bag page)**
4. **Valuation/price summary above the fold** — a "Fair Market Range," not a buried
   list (KBB; WatchCharts 3-tier; StockX Last Sale). Serves collector/flipper/thrift.
5. **Price-history chart with range toggles + % delta + retail reference line**
   (WatchCharts/StockX). *PriceTrend exists but is buried with no range/% framing.*
6. **"Where to sell" fork next to "Where to buy"** — buyout vs. consign, transparent
   splits (Fashionphile/TRR; KBB value types). *The highest-upside revenue stream has
   zero UX surface today.*
7. **Sticky primary-action bar** (Save / Watch / Buy / Sell) — 4-Ss labels, thumb-zone
   placement (NN/g decision-point + mobile).
8. **Structured "Comes With" + condition block** with a visual condition guide &
   defect taxonomy (Fashionphile/Vestiaire) — for resale-condition data as it grows.

**Trust & authority**
9. **Weighted ratings + distribution histogram** (IMDb; NN/g social proof) — hide
   weak counts.
10. **Scannable authenticity record + enumerated "how we authenticate"** (StockX/GOAT,
    Fashionphile) — *specificity is the trust mechanic*; honor it operationally (GOAT/FTC).
11. **Multi-axis subjective voting** (build quality / holds value / wearability /
    worth-it) on top of fixed specs (Fragrantica) — honest data + filter signal.

**Personalization & engagement**
12. **Make the quiz a front-door** (home + nav) and **hand off from onboarding**
    (StoryGraph; cold-start). *Quiz is currently orphaned.*
13. **Capture dislikes/avoids at onboarding** (StoryGraph) — high-signal cold-start.
14. **Taste Map as a completeness-meter progress system** (Zeigarnik/goal-gradient;
    StoryGraph stats) — never start at 0%.
15. **Explainable recs ("Because you saved…") placed high, never an empty rail**
    (NN/g; IMDb "More Like This"). *Recs exist but cold-start/placement need work.*
16. **One-tap status from any card + frictionless watchlist that auto-graduates**
    want→have (Goodreads/Letterboxd).

**Identity, social & virality**
17. **"My Four Grails" scarcity badge** on profiles + **"Year in Bags" exportable
    recap** (Letterboxd) — viral, screenshot-ready.
18. **Poster-grid, screenshot-ready surfaces** (Letterboxd) — bags are visual.
19. **Crowd-upvoted user lists / Listopia** ("Best Bags Under $2k") (Goodreads) —
    evergreen SEO + zero-staff curation.
20. **Relative, resettable leaderboards + XP for value** (NN/g gamification; Goodreads
    challenge) — extend the existing "Coveted Closets."

**Price intelligence & retention**
21. **Wantlist/watchlist price-drop alerts + collection value + weekly digest**
    (WatchCharts portfolio; Discogs alerts). *Watchlist exists; alerting/value framing
    can deepen.*
22. **"Resale-Retention" / "Bags Above Retail" leaderboard** (WatchCharts Value
    Retention) — editorial/GEO gold.
23. **Durability / "Ages-Well" signal** — observed resale **condition × age** by
    material, confidence-rated (user-proposed; Fragrantica character-bar + WatchCharts
    value-retention framing; honors never-invent). *Has a data-pipeline dependency.*
