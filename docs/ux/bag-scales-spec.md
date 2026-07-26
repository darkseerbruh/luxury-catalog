# Bag scales — one unified read of every data point

*Spec, 2026-07-26. Owner-directed. Supersedes the separate "owner ratings" module
concept. Evidence: `research-drafts/axis-evidence-2026-07.md` (6 bags, ~100
owner-voice sources). Field-by-field decisions: `review-ask-inventory.md`.*

---

## 0. The idea

> **To a reader they are all just data points about the bag.** Present them
> together, in one visual language. Distinguish where each came from, and make the
> ones we need from the community visibly askable, without breaking them out into
> a separate module.

Three things used to live in three places: catalog specs, synthesized reputation,
and owner votes. They become **one list of scales**, differing only in provenance
and in whether we are inviting input.

**The unlock:** a derived number becomes a scale by positioning it against
comparable bags, with the raw value still shown. "780g" becomes *heavier than most
its size*, and the reader gets both.

**The second unlock: the ask is the empty state.** An owner scale with no votes
renders in the same row style with an invitation instead of a marker. No separate
form, no wall of fields.

---

## 1. The three provenance tiers

| Tier | Source | Mark | Label |
|---|---|---|---|
| 📐 **Measured** | Catalog data | Solid marker, precise | The raw value: "780g", "24cm wide" |
| 🌐 **The wider web** | Synthesized public sources | **Hollow band showing spread** | "our read from 11 sources, Jul 2026" |
| 👜 **Owners here** | Our community votes | Solid marker + count | "34 owners" |

Rules that keep it honest:

1. **A band, never a point, for synthesized reads.** Tight band = sources agree.
   Wide band = they genuinely disagree. This makes false precision unrenderable
   and turns "where owners disagree" into a visual.
2. **Measured scales always show the raw number.** The scale position is a
   convenience; the figure is the fact.
3. **Never synthesize a measured scale.** If we do not hold the number, the row is
   absent. No estimated weights.
4. **Owners and the web coexist.** Where both exist on a scale, show both. Their
   divergence is content (see §5).

---

## 2. The scale inventory

### 📐 Measured (derived, never asked)

| Scale | Ends | Computed from | Data status |
|---|---|---|---|
| Weight | Light for its size ↔ Heavy for its size | grams ÷ volume, percentile vs comparable bags | ⚠️ `weight_g` column to add |
| Capacity | Compact ↔ Roomy | `dimensions_h/w/d_cm`, percentile within size category | ⚠️ columns exist, 0% filled |
| Opening | Narrow ↔ Wide | `opening_width_cm` | ⚠️ column exists, 0% filled |
| Strap drop | Short ↔ Long, plus "clears a coat" | `strap_drop_length_cm` | ⚠️ column exists, 0% filled |
| Built structure | Soft ↔ Rigid | `rigidity` | ⚠️ 0.4% filled |
| **Recognisability** | **Quiet ↔ Loud** | logo prominence + icon status | ⚠️ needs a source pass |
| Ubiquity | Rare ↔ Everywhere | our listing volume + closet counts | ✅ computable today |
| Value retention | Falls ↔ Holds | `price_history` vs original retail | ✅ computable today |

Recognisability is **quiet ↔ loud**, deliberately non-judgmental: buyers actively
choose both ends. It is derived, not asked, because it barely varies by owner.

### 👜 Owner scales (asked, and seeded by the web)

The four that survived the "only ask what we cannot learn elsewhere" filter.

| Scale | Ends | Why only an owner knows |
|---|---|---|
| Getting in | Fussy to get into ↔ Easy in and out | Top functional complaint across all six passes. Security is measured separately from closure type. |
| Holds its shape | Slouches ↔ Holds its shape | Owners of the same bag disagree, which is the proof it is not a spec. |
| How it holds up | **Baby it ↔ Live in it** | Longitudinal. Absorbs upkeep, weather anxiety, colour transfer. |
| Dress code | Casual ↔ Dressy | Contested in every pass and never resolved. |

Each carries a one-line hint so two raters mean the same thing.

---

## 3. Chips

Chips are for **unordered categorical** facts, where "more" is meaningless.

**Displayed, derived:** carry modes (hand / shoulder / crossbody, from strap type
and drop) · closure type (zip / flap / turnlock / open) · exterior material ·
hardware colour · interior pockets.

**Asked, exactly one: Occasion.** Everyday · Work · Evening · Travel · Special
occasion.

**Why occasion survives and is the only ask-chip:** it is multi-dimensional, so the
dress-code scale cannot replace it ("travel" is not a point on casual↔dressy). It
is one tap, and it powers five "Best for X" boards. And where someone actually
takes a bag is behavioural, so only an owner knows it.

No other chip is requested. Everything else categorical is derivable.

---

## 4. Layout

One list. Grouped by what a reader is asking, not by where the data came from.

> ### On this bag
>
> **Carrying it**
> 📐 Weight · 780g · Light ————●—— Heavy *for its size*
> 📐 Strap drop · 21cm, clears a coat · Short ——●———— Long
> 🏷 Carried by the handles or on the shoulder
>
> **Getting in**
> 📐 Opening · 24cm wide · Narrow ———●——— Wide
> 🏷 Double flap with a turnlock
> 👜 Fussy ●———— Easy · **34 owners**
> 🌐 Fussy ⟨——●——⟩ Easy · *our read from 11 sources, Jul 2026*
>
> **How it holds up**
> 👜 Baby it ——●—— Live in it · **31 owners**
> 🌐 Baby it ⟨●———⟩ Live in it · *11 sources*
> 📐 Lambskin. Scratches more readily than caviar. Pale shades pick up denim dye.
>
> **Holds its shape**
> 📐 Built rigid · Soft ————● Rigid
> 👜 Slouches ——●—— Holds its shape · **28 owners**
> ⚠️ *Built rigid, but owners say it softens after about a year.*
>
> **Where it fits**
> 👜 Casual ———●— Dressy · **26 owners**
> 🏷 Taken to: work · everyday · travel
>
> **How it reads**
> 📐 Quiet ————● Loud · interlocking CCs, prominent
> 📐 Rare ———●— Everywhere · 412 listings tracked

Empty owner scales render identically, with an invitation in place of the marker:

> 👜 Fussy ·  ·  ·  ·  · Easy · **Carried this one? Add your read** →

---

## 5. Divergence is the product

Where a measured scale and an owner scale describe the same property, **surface the
gap**:

- *"Built rigid, but owners say it softens after about a year."*
- *"Listed at 780g, and owners still call it heavy for what it holds."*
- *"The web reads this as fussy. Owners here are split."*

No spec sheet and no price aggregator can write those sentences. They need both
halves, which is precisely the thing a competitor cannot copy.

**Rule:** only call out a divergence when the owner sample clears a minimum
(proposed: 5 votes) and the gap is real, not noise. Never manufacture tension.

---

## 6. How the web read seeds the scales

The Reputation layer (proved on the Chanel 19, 11 sources, `research-drafts/
reputation-poc-chanel-19.md`) publishes onto **the same four owner scales**, as a
band, so a bag page is useful before a single member has voted.

Guardrails, all carried over from the proof of concept:
1. Synthesis only, never republication. Attribute and link out.
2. Tag each source `community` (unpaid) or `commercial` (earns from the bag), and
   weight criticism toward community, or every bag reads glowing.
3. A wide band where sources genuinely disagree. Never smooth it.
4. Date every read. Reputation drifts.
5. **Owners here always render above the web read.** As member votes accumulate,
   the web band stays as context, and our own data becomes the headline.

---

## 7. Data dependencies

Blocking, approved 2026-07-26:
- ⬜ **Spec backfill:** parse dimensions, opening, strap drop from reseller listing
  text we already ingest. Currently 0% populated across 4,409 variants.
- ⬜ **Three new columns:** `weight_g`, `closure_type`, `pocket_count`.
- ⬜ **Quality by production year:** condition grades × `production_year`, both
  already stored. Ship as an observation with n and date, not a verdict.

Not blocking:
- Recognisability needs a sourcing method (archivist pass or editorial).
- Ubiquity and value retention are computable from data we hold.

**Held by the owner:** build quality has no derived source and was cut as an ask.
Revisit.

---

## 8. What this replaces

The standalone "How owners rate it" module is retired. Its scales move into this
unified list. `AxisVotes.tsx` becomes a renderer for owner-tier rows inside the
list rather than its own section.
