# Review axis evidence — do the 7 `bag_axis` values match what people compare on?

*Started 2026-07-25. Owner challenge: the 7 axes in migration 0012 were an
a-priori adaptation of Fragrantica's model (§F of `ux/ux-research-brief.md`),
never checked against real handbag discussion. This doc collects dimension-discovery
passes across bags spanning tiers, then derives a recommended axis set from evidence.*

**Why now:** `bag_axis_vote` has **0 rows** (prod probe, 2026-07-25). Changing the
enum is free today. Once votes exist, `alter type ... add value` is easy but
removing or renaming an axis orphans data.

**The current 7:** `build_quality`, `everyday_wearability`, `holds_value`,
`roomy_vs_compact`, `comfort`, `versatility`, `worth_the_price`.

**Classification rule used in every pass** (honors the locked "a thing we can
measure from data is never a subjective vote"):
- `SUBJECTIVE` — lived opinion, worth a 1-5 vote
- `MEASURABLE` — objective catalog fact, store it, never vote on it
- `CATEGORICAL` — a descriptor, not a scale (vibe, colourway, carry mode)

Also flagged per dimension: **polar/bipolar** (neither end better, e.g.
dressy↔casual) vs **unipolar** (more is better, e.g. build quality).

---

## Pass 1 — Dior Lady Dior (structured, formal icon) · 2026-07-25

**Corpus:** 11 primary sources (4 YouTube owner reviews with full transcripts,
5 Reddit threads / 163 comments, 2 PurseForum threads), + 1 Dior Saddle thread for
contrast + a ~15-title YouTube survey. Reddit required the Apify actor
(`fatihtahta/reddit-scraper-search-fast`, 278 items, ~$0.39) since it blocks
Firecrawl and WebFetch.

### Top dimensions by frequency

| Dimension | Freq | Polarity | Type | Gist |
|---|---|---|---|---|
| **Ease of access** ("the flap", "the opening") | **11/11** | unipolar | SUBJECTIVE | Loudest practical complaint. Non-removable interior flap must be rolled aside one-handed; narrow stiff opening; rings catch. Explicitly not grab-and-go. |
| **Usable capacity / "playing Tetris"** | 11/11 | polar | SUBJECTIVE (+ measurable twin) | Complaint is *usable* space, not volume: large footprint, narrow depth, flap eats room, removing one item means restacking. "Tetris" is independent community vocabulary. |
| **Worth the price / cost per wear** | 11/11 | unipolar | SUBJECTIVE | Literally the title of most sources. Sub-threads: annual increases as buying pressure, VAT arbitrage, CPW math, percent-of-salary discipline. |
| **Sizes / interior dimensions** | 11/11 | n/a | **MEASURABLE** | Micro/mini/small/medium/large drives every other answer. |
| **Handle comfort + handle behaviour** | 9/11 | unipolar | SUBJECTIVE | Squared (not rolled) handles bite; handles won't stay upright when set down. Workaround (twillies, bracing the strap) appears in 3 sources. |
| **Durability / how it wears** | 9/11 | unipolar | SUBJECTIVE | Distinct from build quality. Corners scuff first, then handle wear/peeling, then hardware scratching. Divided on lambskin toughness. |
| **Formality / occasion** | 8/11 (+Saddle) | **polar** | SUBJECTIVE | Constantly negotiated, never resolved. PurseForum's canonical question since 2014: special-occasion or everyday? |
| **Beauty / object desirability** | 8/11 | unipolar | SUBJECTIVE | The dominant emotional axis; overrides everything. "Buy it because you love looking at it and forgive the rest." **No home in the current set.** |
| **Carry mode (top handle/shoulder/crossbody)** | 8/11 | n/a | CATEGORICAL + subjective per mode | Near-consensus it's hand-carried and a poor crossbody. Divided on the mini. |
| **Holds value / resale** | 7/11 | unipolar | SUBJECTIVE (we own the measurable version) | Unusually consensual: it does not hold value; buy preloved. Several reject the investment frame outright. |
| **Build quality / finishing** | 6/11 | unipolar | SUBJECTIVE | Genuinely divided. Confounded by material, age, authenticity. |
| **Structure / holds its shape** | 6/11 | polar + unipolar over time | SUBJECTIVE | Most contested in the corpus. Same bag called impeccably rigid and sagging. Polarity flips by bag: here structure is *wanted*, so slouch reads as failure. |
| **Weight** | 6/11 | unipolar (minority: heft = luxury) | **MEASURABLE** + subjective read | "Heavy for its size." Store grams; vote the fatigue, not the mass. |
| **Strap drop / adjustability** | 6/11 | n/a | **MEASURABLE** | Varies by size/generation; wrong for both short and tall. Store it. |
| **Timeless ↔ trend-dependent** | 6/11 | unipolar as used | SUBJECTIVE | Used *separately* from versatility and from resale. |
| **Noise (the charms)** | 6/11 | polar, unresolvable | CATEGORICAL feature flag | Wind chime vs favourite detail. Non-removable, which is why it matters. |
| **Loud ↔ quiet (logo/attention)** | 5/11 | **polar** | SUBJECTIVE | Rising 2026 buying axis: recognisable by shape without a logo across the front. |
| **Fuss factor / babying anxiety** | 5/11 | unipolar | SUBJECTIVE | "Can I relax carrying this." Distinct from wearability: worry, not fit-for-purpose. |
| **Colour practicality** | 4/11 | polar | CATEGORICAL + subjective | Neutral = wear-with-everything; light colours dirty; ombré reads seasonal. |
| **Standing up / setting it down** | 4/11 | unipolar | SUBJECTIVE | Tips on rounded feet; handles splay; clunky on a chair back. Specific to structured bags. |
| **Personalisation availability** | 4/11 | n/a | CATEGORICAL | ABC charms, twillies, exotics, artist editions. |

### Verdict on the current 7

**Well-supported:** `worth_the_price` (11/11, strongest in the set) ·
`build_quality` (6/11 and genuinely contested, which is what makes a good vote) ·
`comfort` (9/11 **but needs scoping** — here it means handle bite in the hand, not
shoulder comfort) · `roomy_vs_compact` (supported, correctly polar, but relabel to
*usable* capacity).

**Weak / ambiguous:**
- **`versatility` is the weakest.** Used for three unrelated things (carry modes,
  dress-up-or-down, colour-goes-with-wardrobe). Raters cannot mean the same thing.
  It is also the word people reach for when they actually mean **formality**.
- **`holds_value`** is well-discussed (7/11) but nearly unanimous in direction, so a
  1-5 vote returns almost no information. And we already hold the measurable version.
- **`everyday_wearability`** does double duty: fit-for-daily-use *and* anxiety.

**Missing entirely, ranked by evidence:**
1. **Formality / occasion** (8/11, polar) — the dimension a formal bag exposes that
   the set cannot express. The Saddle thread is clean proof: an owner loves her Lady
   Dior, finds it too formal daily, and shops a second Dior for the casual slot.
2. **Ease of access** (11/11) — most-discussed practical property in the corpus,
   maps to nothing.
3. **Beauty / object desirability** (8/11) — loudest emotional theme; distinct from
   worth-the-price (price-not-worth-it + object-is-stunning coexist constantly).
4. **Durability over time** (9/11) — how well it was *made* is not how well it *survives*.
5. **Loud ↔ quiet** (5/11, polar, rising).
6. Optional: **fuss factor / anxiety** (5/11) if not folded into wearability.

**Redundant:** `versatility` → collapses into `everyday_wearability` here; spend the
slot on formality. · `worth_the_price` + `holds_value` partially collapse in how
raters answer. · **Weight is being absorbed by both `comfort` and `roomy_vs_compact`**;
pulling it out as stored grams cleans both.

### Structured/formal bags surface dimensions slouchy ones never do
- **Rigidity promotes access to a top axis.** A soft bag stretches and forgives; this
  one doesn't, so "can I get into it" outranked quality and resale. Rigidity also makes
  *usable* capacity diverge from *apparent* capacity (hence "Tetris"); on a slouchy bag
  those converge and the complaint vanishes.
- **Formality forces an occasion question casual bags hide.** Nobody asks whether a
  Neverfull is too dressy. Every Lady Dior thread asks the reverse.
- **Comfort relocates from strap to hardware, and anxiety becomes its own axis.**
  Handle geometry, not strap width. Plus a delicate-leather worry dimension a beat-up
  tote never raises.

---

## ⚠️ Code correction found mid-research (2026-07-25)

`src/lib/axes.ts` shows the **votable set is already only 5**, not 7. The DB enum
has 7 but the app deliberately excludes two:
- `holds_value` — "a market fact from `price_history`, not an opinion"
- `worth_the_price` — "duplicates the review `worth_it` boolean"

**Live votable axes:** `build_quality`, `everyday_wearability`, `roomy_vs_compact`,
`comfort`, `versatility`. With display copy in `AXIS_META` (e.g. comfort =
"Awkward ↔ Effortless").

The evidence below independently confirms both exclusions were correct calls. So
the real question is: are these **5** the right 5, and what should fill the space?

---

## Pass 2 — Bottega Veneta Jodie (design-led, logo-free contemporary) · 2026-07-25

**Corpus:** 13 sources (4 YouTube owner reviews w/ transcripts, 2 PurseForum
threads, 4 Reddit, 3 blogs). Two Reddit rows are title+snippet only (blocked).

**Top dimensions:** shoulder-stay/armhole (~8/13, the loudest complaint) ·
what-fits (~8/13, polar) · ease of access (~6/13) · leather feel + weave craft
(~6/13) · timeless↔of-the-moment (~6/13, contested) · colour choice (~6/13,
CATEGORICAL, shopped by house colour name) · how it ages (~5/13) · slouch↔structure
(~5/13, polar) · dress up↔down (~5/13, polar) · loud↔quiet (~4/13, polar) ·
care burden (~4/13) · weight (~4/13, MEASURABLE).

**Verdict on the current axes:**
- `comfort` is the most-discussed property **but under-resolved**: crook-of-arm
  comfort is excellent and shoulder comfort is poor on the *same bag*, so a single
  1-5 averages to a meaningless 3.
- `build_quality` **collects two opposite signals**: craft-at-purchase (uniformly
  high) vs how-it-holds-up (uniformly anxious). Split it.
- `versatility` again doing three unrelated jobs (carry modes / occasion range /
  outfit matching). Unreadable.
- `roomy_vs_compact` and `everyday_wearability` both strong keeps.
- Confirms excluding `worth_the_price` (almost nobody paid retail; preloved,
  50%-off markdowns, rentals, three currencies) and `holds_value` (a market fact,
  and here a *negative buyers treat as a positive*: BV doesn't hold value → buy preloved).

**Tier note:** craft vocabulary replaces logo vocabulary (weave tension, knot
construction, raw-cut edges, leather vs fabric lining). Recognisability is a live
**polar** debate, never a prestige score. Dupe saturation is a first-class topic
here and irrelevant on Hermès.

**Catalog hazard:** BV renamed the sizes (Teen→Small, Small→Classic); owners have
returned the wrong bag and third-party dimension tables now disagree. An alias
problem to resolve before aggregating per-size scores.

---

## Pass 3 — Hermès Birkin (top tier, exclusivity) · 2026-07-25

**Corpus:** 14 sources (4 YouTube owner reviews, 3 PurseForum threads, 6 Reddit
threads via Apify `clearpath/reddit-post-comments-bulk-scraper`, 224 items ~$0.24,
1 affiliate blog flagged as biased).

**Top dimensions:** size designation (14/14, MEASURABLE) · worth-the-price (12/14) ·
capacity (12/14, polar, loudly divided *on the same size*) · weight (11/14,
MEASURABLE ~800g-1.2lb) · build quality (9/14) · holds value (9/14) · handle drop
(9/14, MEASURABLE, the most-argued spec) · acquisition friction / pre-spend (9/14) ·
ease of opening (8/14) · formality (8/14, polar) · structure↔slouch (7/14, polar,
driven by leather) · attention drawn (7/14, polar) · carry comfort / arm pinch
(7/14) · babying (6/14) · repairability "the spa" (5/14).

**Verdict on the current axes:**
- **`build_quality` has a ceiling effect here.** Even people who call the bag ugly
  concede best-in-class craft. A 1-5 everyone scores 5 carries no signal. It *would*
  discriminate mid-tier. **So axis usefulness is tier-dependent.**
- `comfort`, `everyday_wearability`, `roomy_vs_compact` all well-supported, but
  `comfort` and `everyday_wearability` **collapse hard** here (the reason it isn't
  everyday *is* the weight + handheld-only carry).
- `versatility` ambiguous for the third time, same three meanings.

**Two structural warnings (important):**
1. **Rate the VARIANT, not the model.** The 25/30/35 diverge so sharply on capacity,
   comfort, formality and resale that owners of two sizes call them different bags.
   Leather drives structure, weight and scratch behaviour. ✅ Our schema already does
   this: `bag_axis_vote.variant_id` references `variant`, not `style`.
2. **Non-owners vote loudest.** The two highest-engagement threads are from people who
   don't own and don't want the bag; their objections are aesthetic/moral, not
   functional. **Pooling owner and onlooker votes would measure brand sentiment, not
   ownership experience.** Gate or tag votes by ownership (we already have the
   verified-owner badge from `have`/`had`).

**Tier note:** roughly half the conversation isn't about the object at all (pre-spend
ritual, SA relationship). That energy will contaminate `worth_the_price` if there's
nowhere else to put it. Repairability is named by owners as the actual price
justification, and it is brand-level, not bag-level.

**GEO lead banked:** "handle drop by Birkin size" is asked in 9/14 sources and
answered authoritatively nowhere. A sourced size-by-size table of handle drop, empty
weight and viable carry positions is citable spec content.

---

## Pass 4 — Polène Numéro Un + Telfar Shopping Bag (mid-tier) · 2026-07-25

**Corpus:** 15-16 sources (6 Reddit, PurseBlog piece + 169 comments, 4 YouTube owner
reviews incl. a leather-expert teardown, 3 blogs + comment threads). ~20 Firecrawl
credits + ~$0.51 Apify.

**Finding worth flagging: there is no retail star-review surface for these bags at
all.** Polène sells direct, Telfar via timed drops; neither has a first-party review
widget, and Trustpilot carries only service-level reviews. **So our review system is
additive here, not duplicative.**

**Top dimensions:** capacity vs footprint (12/15) · material honesty (10/15) ·
quality consistency / "is it still the same bag" (9/15) · closure friction (8/15) ·
weight (8/15) · strap detachability/drop (8/15) · worth-the-price time-indexed
(8/15) · **buying experience: service, returns, shipping fees, duties (8/15)** ·
ubiquity/saturation (7/15, polar) · structure (7/15, polar) · wear pattern (7/15) ·
upkeep baby-it↔beat-it (6/15, polar) · cost per wear (6/15) · vibe (6/15,
CATEGORICAL) · brand values (6/15, CATEGORICAL, decisive for Telfar).

**Verdict:** `holds_value` is **near-dead weight** here. Resale appears only as exit
liquidity and hassle cost, never appreciation; most owners have never sold and can't
rate it. `roomy_vs_compact` weak as a vote (people ask whether a *specific object*
fits, not abstract roominess). `everyday_wearability` is the **outcome** axis, not a
peer of the others. `versatility` ambiguous for the fourth time, same three meanings.

**Tier inversion:** luxury asks whether a bag holds value; mid-tier asks whether
you'll use it enough to justify the spend, and whether you can exit near what you
paid. **Cost per wear is the native metric.** Brand risk (QC lottery, price
trajectory, will anyone help when a strap snaps, surprise duties) replaces
authentication risk. Function is judged harshly and the comparison set is horizontal
(Strathberry, DeMellier, Manu Atelier named in the same breath).

---

## Pass 5 — Chanel Classic Flap (the icon) · 2026-07-25

**Corpus:** 13 primary owner-voice sources (5 Reddit via Apify with comment trees,
3 PurseForum threads, 5 YouTube reviews with transcripts) + 2 retailer guides + a
short-form check.

**Top dimensions:** worth-it-at-today's-price (**13/13**) · usable capacity (11/13,
the second flap eats the interior) · wear and tear (11/13) · which size / suits my
frame (11/13) · caviar vs lambskin (10/13, CATEGORICAL driving two axes) · occasion
range (10/13) · **how it makes me feel carrying it (9/13)** · babying needed (9/13) ·
chain comfort + weight (9/13) · strap drop (9/13, the most concrete regret driver) ·
resale (9/13) · timelessness (9/13) · build quality/QC on arrival (8/13) · colour
(8/13) · interior organisation (8/13) · era vintage-vs-current (8/13, CATEGORICAL
modifier on every other axis) · ease of access (7/13) · structure (7/13).

**The standout addition this pass surfaced:** **"How it makes you feel carrying it"**
ranks #1 among missing axes, second only to price in volume. Both directions are
strong: elevates the outfit / makes you look fly, *and* feeling cringe at what it now
costs, assuming onlookers think it's a rep, not carrying it in certain areas. **This
is where the emotional payoff and the emotional cost both live, and nothing in the
current set touches it.**

**Tier note — price colonises the other axes.** Nearly every thread converts into a
price argument, and forum members say outright that scrutiny scales with cost. So a
`build_quality` score here is partly measuring **price resentment**, not workmanship.
Reported retail ran ~$2,000-3,900 a decade ago to ~$10,300-10,800 today, which splits
raters into **two incompatible pools**: a vintage buyer and a boutique-today buyer
rate the identical model completely differently. **Capture purchase year + channel or
the average is noise.**

**Brand-level, not bag-level:** quotas, appointment-only entry, SA attitude,
authentication anxiety. Attach to brand/retailer or they pollute every Chanel model.

---

## Pass 6 — LV Neverfull (accessible-luxury workhorse) · 2026-07-25

**Corpus: 24 sources** — the deepest pass (11 YouTube owner reviews with transcripts
incl. 12-year, 10-year, 7-year and 5-year wear reviews; 8 Reddit threads; 5 PurseForum
threads; 2 blogs).

**Top dimensions:** canvas choice (22/24, CATEGORICAL) · versatility (21/24) ·
capacity (21/24, polar) · size PM/MM/GM (~20/24) · strap comfort (18/24 discussed,
**12/24 report pain**) · canvas durability (18/24) · price trajectory (18/24,
MEASURABLE) · resale (18/24) · **ubiquity (15/24 explicit, 18/24 incl. status
judgment)** · structure↔slouch (15/24) · organisation "bottomless pit" (15/24) ·
vachetta patina + staining anxiety (17/24) · "people will think it's fake" (14/24) ·
casual↔dressy (11/24) · proportion on the frame (10/24) · glazing wear (10/24) ·
weather worry (10/24) · open top / no zipper (7/24 named as a con).

**The headline finding: ubiquity replaces scarcity as the status axis.** At
Hermès/Chanel tier the social conversation is about *access* (waitlists, who can get
one). Here it inverts completely: the anxiety is that **everyone already has one**.
Two-thirds of sources spend real word count on whether the bag still feels special.
**No axis set built for top-tier bags catches this.**

**Also tier-specific:** counterfeit density is a live ownership variable (14/24 report
being assumed to carry a fake, a real cost with nothing to do with construction). The
value frame is **retail escalation, not resale appreciation** — owners quote retail
history to the dollar (~$700 in 2007-08 → ~$2,240 now) and say "buy before the next
increase," while actual resale evidence in the same threads is weak (a reported top
offer of $800 against $1,400 paid). Those are two different questions wearing one word.

**On `versatility`:** this is the one bag where it reads clean, 21/24 and near-unanimous
positive. But near-unanimous means **ceiling effect** = almost no signal, and it is a
near-twin of `everyday_wearability` here ("I use it for work, the gym, travel and as a
diaper bag" codes as both). So even its best case doesn't rescue it.

**`roomy_vs_compact` again measures the variant the voter bought**, not the model.
Three people voting from PM, MM and GM produce noise.

**New polarity insight:** on an open-top bag, **access and security are a tradeoff**,
so "ease of access" is genuinely **polar** here (secure ↔ grab-and-go), not unipolar.
The mid-tier pass independently said the same. This reframes the axis.

---

# CROSS-BAG SYNTHESIS (all 6 passes)

## The six dimensions missing from the live 5, by cross-bag support

| Candidate | Lady Dior | Jodie | Birkin | Mid-tier | Classic Flap | Polarity |
|---|---|---|---|---|---|---|
| **Ease of access** | 11/11 | 6/13 | 8/14 | 8/15 | 7/13 | unipolar |
| **How it ages** (≠ build quality) | 9/11 | 5/13 | 6/14 | 7/15 | 11/13 | unipolar |
| **Care burden** (baby ↔ beat) | 5/11 | 4/13 | 6/14 | 6/15 | 9/13 | **polar** |
| **Structure ↔ slouch** | 6/11 | 5/13 | 7/14 | 7/15 | 7/13 | **polar** |
| **Formality** (casual ↔ dressy) | 8/11 | 5/13 | 8/14 | — | 10/13 | **polar** |
| **Quiet ↔ recognisable** / how it makes you feel | 5/11 | 4/13 | 7/14 | 7/15 | 9/13 | **polar** |

**All six appear in every pass.** Not one is captured by the current axes.

## Unanimous verdicts on the existing axes

- 🔴 **`versatility`: DROP.** Flagged ambiguous by **all five passes with the identical
  diagnosis** — it means (a) carry modes, (b) occasion range, (c) outfit matching, and
  raters cannot mean the same thing. Two passes independently note it's the word people
  reach for when they mean **formality**. Its jobs are better served by: formality (new
  axis), carry modes (stored data), colour (categorical).
- 🟡 **`comfort`: RESCOPE.** Every pass says it's well-supported but under-resolved.
  The Jodie is the clearest proof: crook-of-arm comfort excellent, shoulder comfort
  poor, *same bag*, so one 1-5 averages to a meaningless 3. Scope it to
  **on-the-body carry** and pull weight out as stored grams.
- 🟡 **`build_quality`: SPLIT.** Four passes say it silently merges *craft on arrival*
  (QC, stitching, hardware alignment) with *how it survives years*. Split into
  build quality (as it arrived) + how it ages.
- 🟡 **`roomy_vs_compact`: weak as a vote.** People never rate roominess abstractly;
  they ask whether a specific object fits (16" laptop, water bottle, paperback). Largely
  determined by which variant you bought. Better as stored dimensions + a "what fits"
  list, keeping the polar descriptor for display only.
- 🟢 **`everyday_wearability`: KEEP, but reframe as the OUTCOME axis** ("do you still
  reach for it"), not a peer of the others. Its drivers are the specific axes.
- ✅ **`holds_value` + `worth_the_price` exclusions were correct.** Evidence backs both
  independently. `holds_value` is a market fact we already own and is near-dead weight
  mid-tier (most owners never sold). `worth_the_price` is real but channel- and
  year-dependent, and at icon tier it colonises the other axes.

## Three cross-cutting design findings

**1. Rate the VARIANT, not the model.** (Birkin + Classic Flap, independently.) A
Birkin 25 and 30 are described as different bags; a Flap runs square-mini to maxi.
✅ Our schema already does this: `bag_axis_vote.variant_id` → `variant`.

**2. Capture context with the vote, or the average is noise.**
- **Purchase year + channel** — a vintage Flap buyer (~$2k) and a boutique-today buyer
  (~$10.8k) rate the same bag completely differently.
- **Owner height** — cited alongside fit in three passes; petite vs tall flips the verdict.
- **Ownership status** — Birkin's two highest-engagement threads are from people who
  don't own and don't want the bag, with aesthetic/moral objections. **Pooling owner
  and onlooker votes measures brand sentiment, not ownership experience.** We already
  have the verified-owner signal from `have`/`had`.

**3. Some dimensions belong to the BRAND, not the bag.** Acquisition friction and
pre-spend (Birkin), quotas and SA attitude (Chanel), returns/shipping/duties and
"will anyone help me" (mid-tier), repairability and lifetime service (Hermès, BV).
These drive real decisions but attaching them per-bag pollutes every model a house
makes. **They need a brand-level home.**

**4. Axis usefulness is tier-dependent.** `build_quality` has a **ceiling effect** at
Hermès (everyone scores 5, no signal) but discriminates sharply mid-tier where the QC
lottery is the main anxiety. `holds_value` is headline at Chanel/Hermès and dead
weight at Polène/Telfar. **Status inverts**: scarcity/access at the top, ubiquity/
saturation at the accessible end. A single fixed set is partly wasted at both ends,
but the *polar* axes below travel across tiers because they describe rather than judge.

---

# ⭐ THE RECOMMENDATION

## The structural insight

The six passes split cleanly into **two kinds of dimension**, and they want different
UI, different framing, and carry different confidence:

| | **Rate it** (unipolar) | **Describe it** (polar) |
|---|---|---|
| Question | How good is it? | What kind of bag is it? |
| Has a better end | Yes | **No** |
| Cognitive cost | High (a judgment) | Low (a description) |
| Posting floor | Higher | **Very low** |
| Travels across tiers | Poorly (ceiling effects) | **Well** |
| Web-synthesis can seed it | Weakly (evaluative) | **Strongly (descriptive)** |

**Why this matters most:** the polar "describe it" axes are exactly the ones the
Reputation layer (§2A of the workstream) can defensibly populate from web synthesis.
Saying *"the consensus reads this as dressy rather than casual"* is a fair summary of
what people wrote. Saying *"the web scores build quality 4/5"* is an invention. **So
the polar axes are the honest bridge between scraped consensus and first-party votes,
on one shared scale.** That is the owner's "same axes" goal, made defensible.

Low posting floor also follows the Letterboxd principle already in the swipe file
(no downvotes, no minimum): a description has no wrong answer, so it invites the 90%
who will never write a review.

## Recommended axis set

### Rate it — 4 unipolar (down from 5)

| Axis | Status | Scale | Why |
|---|---|---|---|
| `comfort` | **KEEP, rescope** to on-the-body carry | Awkward ↔ Effortless | 6/6 passes, highest-signal axis on several bags. Pull weight out to stored grams. |
| `build_quality` | **KEEP, rescope** to *as it arrived* | Flimsy ↔ Tank-like | 6/6. Rescoping fixes the merge with ageing. Ceiling at top tier, discriminates mid-tier. |
| `wears_well` | **NEW** (split from build_quality) | Shows every mark ↔ Ages beautifully | 6/6. The entire "X years later" review genre exists for this. |
| `everyday_wearability` | **KEEP**, reframe as the **outcome** axis | Occasion-only ↔ Daily driver | 6/6. "Do you still reach for it." Its drivers are the axes below. |

### Describe it — 5 polar (all NEW except one)

| Axis | Status | Scale | Support |
|---|---|---|---|
| `structure` | **NEW** | Slouchy ↔ Structured | 6/6. People disagree on the *fact*, not just preference. |
| `formality` | **NEW** | Casual ↔ Dressy | 5/6. Named cause of at least two documented sales. Absorbs what `versatility` was gesturing at. |
| `access` | **NEW** | Locked down ↔ Reach right in | 6/6. Top functional complaint overall. **Polar**, because security is the tradeoff. |
| `upkeep` | **NEW** | Baby it ↔ Beat it | 6/6. What the caviar-vs-lambskin and vachetta debates are actually about. |
| `presence` | **NEW** | Quiet ↔ Everyone knows it | 6/6. Travels across tiers: recognisability at the top, **ubiquity** at the accessible end. |

### Dropped

- 🔴 **`versatility` — DROP.** Flagged ambiguous by 5 of 6 passes with an identical
  diagnosis (carry modes / occasion range / outfit matching). The 6th (Neverfull) is
  its best case and still shows a ceiling effect plus near-twin overlap with
  `everyday_wearability`. Its three jobs are now served by `formality` (occasion),
  stored carry-modes (data), and colour (categorical).
- 🔴 **`roomy_vs_compact` — DROP as a vote, keep as data.** Every pass says it measures
  *which variant the voter bought*, and that people never rate roominess abstractly —
  they ask whether a specific object fits. Replace with stored dimensions + a "what
  fits" list (16" laptop, water bottle, paperback). Keep the polar descriptor for display.

**Net: 9 votable axes** (4 rate + 5 describe), from 5 today.

## Vote-fatigue guardrail

9 is too many to ask at once. Design implications, not yet decided:
- Never present all 9 as one wall. The **5 describe axes are fast taps** (no wrong
  answer) and should come first, since they warm people up.
- Seed the describe axes from the Reputation layer, then invite correction
  ("owners here say dressier than the web consensus") — a far stronger prompt than a
  blank form.
- Let partial input count. One tap is a contribution.

## Required context to store WITH each vote

Without these the aggregate is noise (all evidence-backed):
- **Ownership status** — owner vs onlooker. Birkin's two highest-engagement threads are
  from people who don't own and don't want the bag. Pooling them measures brand
  sentiment, not experience. (We have `have`/`had` already.)
- **Purchase year + channel** — a vintage Flap buyer (~$2k) and a boutique-today buyer
  (~$10.8k) rate the identical bag differently.
- **Owner height** — cited alongside fit in four passes.

## Needs a brand-level home (not per-bag)

Acquisition friction and pre-spend (Hermès), quotas and SA attitude (Chanel), returns/
shipping/duties and "will anyone help me" (mid-tier), repairability and lifetime
service, authentication anxiety and counterfeit density. All drive real decisions;
attaching them per-bag pollutes every model a house makes.

## Migration note

`bag_axis` currently holds 7 values with **0 votes**. Postgres cannot drop an enum
value in place, so the clean path while the table is empty is to define the new enum
outright rather than `alter type ... add value`. Free today; not free later.

---

## Cross-bag synthesis + recommended axis set
*(to be written once all 6 passes are in)*
