# The never-built dimensions — where they came from and what to do with them

*Created 2026-07-25. The research surfaced ~17 dimensions that exist in owner
conversation but have never been a field in our product. This walks each one:
what it is, where the evidence came from, why it was never built, the case for
building it, and how it would land in the UX. Companion to
`review-ask-inventory.md`; evidence in `research-drafts/axis-evidence-2026-07.md`.*

**Owner constraint (2026-07-25): scales, not selectable chips.** She is "definitely
partial to scales where appropriate." Chips only where a thing is genuinely
categorical and unordered. This reverses the tag-cloud direction and means some
dimensions that were combined split back out.

---

## A. The ones that should be built

### 1. Usable capacity vs apparent capacity
**What:** not litres. Whether the bag holds more or less than its size suggests.

**Where it came from:** the single most-discussed dimension overall (~83% of sources).
The Lady Dior pass found "Tetris" used independently on Reddit and PurseForum as
community vocabulary for restacking everything to retrieve one item. Chanel's second
flap "eats the interior." The Jodie's round shape fights a 13-inch laptop even when
the volume exists. Conversely several bags "hold more than they look."

**Why never built:** we had `roomy_vs_compact`, which measured the wrong thing (it
tracks which size variant the voter bought). And capacity was classified as derivable
from dimensions.

**Why it should be:** dimensions genuinely do not predict this. Opening shape, depth,
and internal flaps drive it, and the gap between spec and reality is exactly the
information a buyer cannot get anywhere else.

**UX:** a scale. *Holds less than it looks ↔ Holds more than it looks.* Replaces
both `roomy_vs_compact` and the free-text fits note.

### 2. Getting in (access vs security)
**What:** can you reach your things when you need them, and is it as secure as you
want? Includes outside-pocket access, not just the main closure.

**Where it came from:** the top functional complaint in the whole corpus, present in
all six passes (11 of 11 Lady Dior sources). The Birkin's hardware means most owners
carry it hanging open. The Neverfull's open top is named as both its best feature and
its worst. Chanel's double flap is "annoying one-handed."

**Why never built:** simply absent from the 0012 vocabulary.

**Why it should be:** it is the thing owners complain about most and it maps to
nothing we hold. It is also the clearest example of a genuine trade-off rather than a
quality score, which is why it must be a scale with two legitimate ends.

**UX:** a scale. *Locked down ↔ Grab it instantly.* Neither end is better.

### 3. Structure (how it behaves on the body)
**What:** does it stand on its own, does it jut out from you, does it conform when
held, does it go flat over time.

**Where it came from:** all six passes. The Lady Dior pass called it "the most
contested dimension in the corpus" — the same bag described as impeccably rigid and
as sagging. Birkin owners split it entirely by leather (Clemence collapses, Epsom
holds). Neverfull owners disagree on the observable fact and reconcile it with base
shapers.

**Why never built:** absent from 0012. I then wrongly classified it as derivable from
construction and material.

**Why that was wrong:** owners of the same bag disagree, which means it is not a spec.
It also absorbs the "standing up / setting it down" complaint (tips on its feet,
handles splay, clunky on a chair back) and the spatial-social experience of a rigid
bag catching on people and shelves.

**UX:** a scale. *Conforms to me ↔ Stands on its own.*

### 4. How it ages
**What:** how it has held up over years. Corner rub, creasing, glazing wear, hardware
scratching, handle darkening.

**Where it came from:** all six passes, and the entire "X years later" review genre
exists for it. Strongest on the Classic Flap (11 of 13) and Neverfull (18 of 24, with
owners at 10, 12, 14 and 15 years).

**Why never built:** it existed as `review.durability_rating`, a second star-rating in
a different table from every other scale. Structurally present, badly placed.

**Why it should be:** the single most defensible ask in the set. Purely longitudinal
and unknowable without years of ownership.

**UX:** a scale. *Shows every mark ↔ Ages beautifully.* Absorbs `durability_rating`.

### 5. Upkeep
**What:** how careful you have to be. Rain, colour transfer, delicate leather, the
worry of carrying something expensive.

**Where it came from:** all six passes. 17 of 24 Neverfull sources via vachetta
anxiety; 9 of 13 Classic Flap. It is what the caviar-versus-lambskin debate is
actually about.

**Why never built:** absent from 0012.

**Note on merging with #4:** related but genuinely distinct. Upkeep is the effort you
put in; ageing is the result. A babied bag can age beautifully *because* it was
babied. Merging them loses the causal information a buyer wants.

**UX:** a scale. *Baby it ↔ Live in it.*

### 6. Comfort to carry
**What:** on a real body, with real weight in it.

**Where it came from:** the highest-frequency lived dimension (~65%). Neverfull straps
(18 of 24 discuss, 12 report pain). Chanel's chain edge. The Lady Dior's squared
handles biting. The Jodie's shallow armhole.

**Why never built:** it exists in 0012 and stays.

**UX:** a scale. *Awkward ↔ Effortless.* Weight in grams stays catalog data; the vote
captures the fatigue, not the mass.

### 7. Dress code
**What:** where the bag feels right, errands through evening.

**Where it came from:** 5 of 6 passes. Never resolved in any of them. PurseForum has
asked it of the Lady Dior since 2014. A Neverfull owner sold hers in five months
because "it was a tote, not a purse."

**Why never built:** `versatility` was gesturing at it but conflated three meanings.

**UX:** a scale. *Casual ↔ Dressy.* Replaces the `occasion` chips.

---

## B. Worth considering, your call

### 8. Timelessness
**What:** will this look dated in two years?

**Where it came from:** 6 of 6 passes, and it is the stated justification for the
spend. Undercut in the same threads by the size-cycle discussion and, for the Jodie,
by reviewers saying its moment has passed.

**Why never built:** never proposed.

**Case for:** it is the reason people buy, and it is honestly contested, which makes
it high-engagement. **Case against:** partly derivable (production span, LC Index
trajectory), and it asks owners to predict the future rather than report experience,
which sits awkwardly with the never-invent rule.

**UX if built:** a scale, *Of the moment ↔ Timeless*. My lean is to hold it: it is
prediction, not lived experience, and the rest of the set is deliberately experiential.

### 9. Interior organisation
**What:** pockets, and whether things float in a void.

**Where it came from:** 15 of 24 Neverfull ("a bottomless pit"), 8 of 13 Classic Flap.
The aftermarket organiser is treated as near-mandatory, which is itself the finding.

**Why never built:** classified as a spec (pocket count).

**Case for:** pocket *count* is a spec, but pocket *usefulness* is not. Chanel's Mona
Lisa back pocket is near-universally loved while its lipstick pocket is near-universally
unused, and the two have identical spec representation.

**UX if built:** most of it folds into **Getting in** (#2), since an accessible outside
pocket is exactly the access question. My lean: fold, do not add a field.

### 10. Proportion on the wearer
**What:** does it overwhelm you, or disappear on you.

**Where it came from:** cited alongside fit in four passes. Every Jodie review opens
with the reviewer's height. A whole Neverfull return thread turned on the bag
overwhelming its owner.

**Why never built:** never proposed.

**UX:** **context, not a question.** Capture height once on the profile, then let a
reader filter comfort and structure votes by people near their own height. This is
the highest-value context field in the set.

---

## C. Belongs to the brand, not the bag

These drive real purchase decisions but attaching them per-bag would repeat the same
answer across every model a house makes.

| Dimension | Evidence | Where it belongs |
|---|---|---|
| **Buying experience** (service, returns, shipping, duties) | 8 of 15 mid-tier sources. $20 per-item shipping, surprise DHL duties, a snapped strap met with "your fault" | Brand page |
| **Acquisition friction / pre-spend** | 9 of 14 Birkin sources. Ratios of 1:1 to 3:1 quoted as normal | Brand page |
| **Repairability / lifetime service** | 5 of 14 Birkin ("the spa"), cited twice on Reddit as the Bottega-versus-Loewe tie-breaker | Brand page |
| **Quality consistency by year** | 9 of 15 mid-tier. Owners date their bag like a vintage; pre-2022 reads as the good era | Brand page, plus purchase-year context |

**UX:** a brand-level equivalent of the bag-page owner panel. Worth its own lane, not
part of this one.

---

## D. Derive, do not ask

| Dimension | Why it is derivable |
|---|---|
| **Recognisability** (loud logo ↔ quiet) | Logo presence and icon status are catalog facts |
| **Ubiquity** ("everyone has one") | Our own listing volume and closet counts |
| **Counterfeit density** ("people assume mine is fake") | Follows from how copied a bag is, which we can see |
| **Colour practicality** | Colourway is catalog; "light shows dirt" is a material fact |
| **Weather resilience** | A material property |
| **Hardware noise** (Lady Dior charms) | A design fact, and it applies to a handful of bags |
| **Carry modes** (hand/shoulder/crossbody) | Handle drop and strap presence |
| **Weight in grams** | A spec. The *felt* burden is captured by Comfort (#6) |

## E. Cut

| Dimension | Why |
|---|---|
| **Beauty / object desirability** | The Lady Dior's loudest emotional theme (8 of 11), but the star rating already is this in practice |
| **Material honesty** ("does it feel like it claims") | The mid-tier's loudest argument, but it collapses into build quality, which ceilings out at the luxury end |
| **Compliments / "what bag is that?"** | Recognisability again, which we derive |
| **Standing up / setting it down** | Real, but it folds into Structure (#3) |
| **Worth the price** | Owner call: a stand-in for the stars, contaminated by purchase channel and year |
| **Build quality** | Ceilings out at the top tier and partly measures price resentment at Chanel |
