# Content Strategy — the canonical spine

*Created 2026-06-24. The single source of truth for what we publish and why. Pairs with
`docs/voice-and-tone.md` (how it sounds), `docs/social-content-calendar.md` (where it
runs), `docs/data-collection-handoff.md` §11 (affiliate plumbing), and the content
gap map in `docs/handoff.md`.*

## The strategy in one line
**Be the trusted reference at each buying decision, then hand off to the commissionable
action.** Content earns the trust and the search traffic; the post→bag **money-moment CTA
block** (`src/app/articles/[slug]/PostBagCTA.tsx`) converts it into a buy / sell / rent
referral, with buy surfaced first (buyer affiliate is the revenue backbone).

## What we're going for, and why
- **Decision-moment reference.** Readers arrive *mid-decision*: "is it real / what's it
  worth / which one / where do I buy, sell, or rent." Every post maps 1:1 to one of those.
- **Compare-and-hand-off monetization.** We don't sell; we inform then route to partners.
  Every post ends in the CTA block. **Buyer affiliate is the revenue backbone**, so buy is
  surfaced first; sell/consign is a lighter secondary fork on an owner signal; rent is the
  third fork (the "want" intent). The high-payout consignor lever was ruled out 2026-06-30
  (TRR Real Partners declined), which is why buy now leads.
- **Two moats.** (1) **Real resale data** nobody else publishes (original, defensible,
  AI-citable). (2) **Authentication authority** (the "is it real" brand position).
- **GEO/SEO is the channel.** Fact-dense, specific pages get cited by AI and Google. The
  voice guide *is* the SEO strategy as prose.

**The consistent rule for every post:** it answers one real decision question AND ends in a
commissionable hand-off.

## Prioritization lens
Score each piece on **$ (monetization, buyer-affiliate-weighted) · Reach (search + AI-citation +
shareability) · Ready (can we write it *credibly now*) · Effort (solo-operator).** Honest
constraint from the 2026-06-24 data audit: **high-end value/comparison is ready now;
authentication needs sourcing; mid-tier needs data capture.**

## The prioritized roadmap
| Post | $ | Reach | Ready | Effort | Tier |
|---|---|---|---|---|---|
| **Value pieces, hero high-end bags** (Chanel Flap ✅ drafted, LV Neverfull, Hermès Birkin, Gucci Marmont) | H | H | ✅ data | Low | **1** |
| **"Where to sell your [bag] for the most"** (seller lever, direct) | H+ | M | ✅ | Low | **1** |
| **Comparisons** (Caviar vs Lambskin · Neverfull vs Speedy · Birkin vs Kelly) | H | H | ✅ | Med | **1** |
| **"Which [Birkin/Kelly] size holds value best"** (data-led) | M | H | ✅ | Low | 2 |
| **Coach authentication** (brand/SEO wedge) | M | H+ | ❌ needs sourcing | Med | 2 |
| **Market/trend** (most coveted / appreciating / best deals) → `/coveted`, `/deals` | M | M | ✅ | Low | 2 |
| **Mid-tier value** (Coach/MK) | M | M | ❌ needs eBay/Poshmark capture | Med | 3 |
| **"Buy vs rent a [bag]"** (rental fork) | M | M | ✅ write as framework now (owner 2026-06-26: Vivrelle approval does NOT block useful content; wire affiliate when a code lands) | Med | 2 |

## The comparison / "worth it" value bar (locked 2026-06-26)

"X vs Y" and "is it worth it" pieces match high-intent search, but **do NOT farm thin ones.**
A piece ships only if it gives the reader a **real decision aid on at least one meaningful axis**,
not just a number gap. Meaningful axes (locked 2026-06-26, owner pushback):
- **price** (a non-obvious finding, e.g. Birkin = Kelly size-for-size; the small-size premium), OR
- **fit / capacity** (what actually fits, day-to-day usability), OR
- **durability / wear** (how each ages and holds up), OR
- **use-case / who it suits**, OR
- it is a **genuinely high-stakes or high-volume decision** where even a clear answer helps a lot.

**Strong comparison type to mine: two closely-priced bags, often across brands, that serve the
same purpose** (e.g. similar-price totes or flaps from different houses). Same price, different
trade-offs is exactly the decision a buyer agonizes over.

What fails: a piece whose only content is "two numbers that are close" with nothing on fit, wear,
or use. That is a **data point, not an article.** (So small-vs-same-size pieces need a real
fit/use finding to clear the bar; Marmont small vs medium only ships if it genuinely covers what
each fits and suits, not just price.) Reason: our moat is being the cited original-data authority;
thin near-duplicate pages get downweighted by Google's helpful-content system and AI search and
dilute that authority. A few deep pieces beat dozens of shallow ones. The self-updating +
shoppable north star makes substantive comparisons compound; it does not rescue thin ones.

## Future: rental-market intelligence (Vivrelle) — recorded 2026-06-26

Owner idea, not now. Subscribe to Vivrelle and **pull their catalog on a schedule** to measure
**availability depth and rental velocity**, not just whether a bag is listed but whether it is
ever actually available (a listed-but-never-available Birkin is the example). Output: original
"findings" articles + an evaluative tool for prospective subscribers (nobody else publishes this).
**Owner's hypothesis to TEST, not assert:** Vivrelle's selection skews cast-offs (older / less
desirable) and the marquee bags are rarely available; she is a longtime user and *wants data that
could prove her wrong.* Frame any finding as evidence, never a verdict, and never disparage
without the data. Needs: a paid subscription + a scheduled catalog pull (browser or API).

## Mined article ideas + the keyword-data reality (2026-06-26)

**Keyword tooling honesty:** we have NO search-volume tool. WebSearch returns results, not
volume; never quote a volume we can't source. **Real demand data = Google Search Console**
(the queries already driving impressions to the live site; owner has it, submitted the sitemap)
and **Google Trends** (relative interest only). **Operator action to unlock real targeting:**
export the GSC "Performance → Queries" report and hand it over, then we write to actual demand.
What we can do without it: qualitative intent-mining (competitor headlines + question patterns).

Mined from intent (all must respect never-invent: NO appreciation/retention/"investment return"
claims, NO unsourced retail; lean on current-asking data + authentication authority):
- **⭐ "Are designer bags actually a good investment? The honest answer."** Huge crowded category,
  but rivals recycle appreciation stats ("retains 136%", "+93% since 2020", "14.2% annual return")
  we cannot make. Our wedge = honesty + real current prices: classics hold up better than most
  fashion, but treat value as buy-what-you-love, not a guaranteed return (estimate-not-appraisal;
  aligns with the no-investment-framing compliance stance). Standout next piece.
- **Cross-brand entry matchup** (the owner's "closely-priced across brands" type): e.g. Gucci
  Marmont vs LV Neverfull vs LV Speedy, ~$900–$1,600 entry tier, decided on fit/use/durability,
  not price. Clears the value bar on multiple axes.
- **"The cheapest way into each luxury house on resale"** — entry points by brand, current asking
  data (Neverfull/Speedy/Marmont + entry Chanel/Dior). Data the listicles lack.

## Operating rules
- **Lead with Tier 1** (overlap of highest monetization × ready today — our data moat,
  monetizes immediately through the CTA block).
- **Authentication runs in parallel as the reach/brand play**, gated on sourcing (mid-tier
  Coach first; lower stakes). Text-first + schematic SVG diagrams, never licensed photos
  (see `docs/preferences.md` image rule). Never assert an unsourced auth marker.
  **ALL authentication content (articles, bag-page sections, diagrams, the Identify tool +
  any authenticity score, marketplace copy) is bound by `docs/authentication-standard.md` —
  the hard pre-publish gate. If a piece can't pass that gate, it does not ship. No exceptions.**
- **Tier 3 is genuinely blocked** (mid-tier capture, Vivrelle approval) — don't force it.
- **Every post is topic-tagged** to its brand/style so the CTA block can render the
  hand-off. Body is plain-text paragraphs (no inline links); monetization lives in the CTA.
- **All copy passes `docs/voice-and-tone.md`** §8 slop sweep + the review checklist (incl. the AI-tell blacklist).
- **Visuals are required, catalog-wide (locked 2026-06-25).** If a piece states numbers, it gets a **data visualization** (the distribution, comparison, or trend). If it describes a bag's shape or markers, it gets an **original schematic** (`docs/authentication-standard.md` §3). Numbers and shapes are shown, not just told. Applies to articles and the catalog UI.
- **Control for confounders, and show the work (locked 2026-06-25).** Before claiming a value gap is caused by one factor (e.g. caviar > lambskin), control for what we can (year, color, platform) and **state plainly what we cannot** (condition is usually unrecorded). Put the controlled finding and its limits in the article, framed as a leaning when it is one. A raw median gap is not a causal claim. **Full method (significance tests, bootstrap CIs, stratification, the publish bar): `docs/data-analysis-standard.md`.**

## North star: self-updating, shoppable data-viz (recorded 2026-06-26)

The end state for every data-backed article. Three goals, all serving the real objective:
**affiliate monetization.** Not built yet; this is the target a future build aims at. Until
then, articles ship with dated snapshot numbers and the CTA block carries the affiliate links.

1. **Self-updating from regular pulls.** Article figures and charts read **live** from captured
   data (`price_history`), not baked-in constants, so they refresh as the scheduled asking/sold
   pulls land. The chart components become data-driven (query at render, cached) instead of
   hard-coded numbers; the "Last updated" date reflects the data date. Foundation already in
   place: the scheduled captures, the sold loader (`supabase/ingest/load-sold.ts`), and the
   quarterly freshness routine. Factuality rules still hold (live numbers stay dated, n-stated,
   framed as estimate-not-appraisal).
2. **Diagrams link to individual for-sale bags.** Each data point ties to a real **live
   listing**. On hover, a popup shows that specific bag at its price (photo where licensed),
   linking out through the affiliate wrapper (Awin tracking). The data-viz becomes shoppable,
   not just illustrative, so every chart is a monetization surface on top of its editorial job.
3. **Dense-cluster fallback.** When points are too tight to hover individually (box plots,
   dense scatters), surface listings another way: click a bar or region → a side panel or list
   of matching live, affiliate-linked listings ("shop these"). The point is always to route the
   reader to a buyable bag.

**Dependencies (so a future build is grounded):** solve the browser→repo capture transport
(currently CSP-blocked, see `docs/research-drafts/poshmark-ebay-sold-capture.md`); refactor
diagrams from baked constants to live queries; make listing-level data queryable per data point
(`source_url` + affiliate-wrapped link + licensed photo); keep the never-AI-images rule
(diagrams stay original schematics, now data-bound). Sequence it **after** the sold/asking
pipeline runs regularly.
