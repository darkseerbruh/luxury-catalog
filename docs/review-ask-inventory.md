# The review ask — full inventory

*Created 2026-07-25. Every field we have ever built, proposed, or considered asking a
reviewer to fill in, with a current recommendation for each. Built because the ask had
crept to 13 fields and it was no longer clear what had been cut, combined, or quietly
dropped. Evidence behind the dimensions: `research-drafts/axis-evidence-2026-07.md`.*

## The filter (owner, 2026-07-25)

> **Ask reviewers only what we cannot learn anywhere else.** Treat it as qualitative
> data. Something can be important to ANSWER on the bag page without being important
> to ASK a reviewer. Those are different lenses.

So a dimension earns a place in the ask only if it is **longitudinal** (needs years of
ownership), **bodily** (depends on the person), **behavioural** (what they actually
did), or **social** (how people reacted). Anything that is a property of the object,
or that we already hold, gets derived instead.

**Verdict key:** `ASK` keep as a field · `COMBINE` folded into another ask ·
`DERIVE` we compute or store it, never ask · `CUT` drop it · `BRAND` belongs on the
house, not the bag · `CONTEXT` captured silently, never a question.

---

## 1. Fields live in the product today

| # | Field | Where | Input | Verdict | Reasoning |
|---|---|---|---|---|---|
| 1 | Overall rating | `review.rating` | ★ 1-5 | **ASK** | The headline summary. Also absorbs "beauty / how much I love looking at it", which was the loudest emotional theme on the Lady Dior (8/11) and had no other home. |
| 2 | Title | `review.title` | text | **ASK** | Optional one-liner. Letterboxd's two registers: the one-line take is as valid as the essay. |
| 3 | Review text | `review.body` | textarea | **ASK** | Irreplaceable. The thing no structured field can capture. |
| 4 | Worth it | `review.worth_it` | yes/no | **CUT** ✅ owner-approved | In practice a stand-in for the stars, and contaminated by purchase channel and year (a vintage Flap buyer at ~$2k and a boutique buyer at ~$10.8k answer different questions). |
| 5 | Occasion | `review.occasion` | chips | **COMBINE** → *Where it fits* | Same question as dress code, and the tag set covers it with more range. |
| 6 | Durability rating | `review.durability_rating` | ★ 1-5 | **COMBINE** → *How it holds up* | Was a second star-rating in a different table. Folded into the ageing signal. |
| 7 | How you carry it | `bag_wear.carry` | chips | **DERIVE** | Handle drop and strap presence already determine this. Not an opinion. |
| 8 | How heavy it feels | `bag_wear.weight_feel` | chips | **COMBINE** → *Living with it* | Grams are derivable, but "heavy once loaded" is lived. Survives as a tag, not a field. |
| 9 | What fits inside | `bag_wear.fits_note` | text ≤140 | **ASK** | Cheap, concrete, and genuinely useful. The one capacity input worth requesting, because "my 16in laptop fits" is lived, not spec. |
| 10 | Photo | `bag_photo` | upload | **ASK** | Separate surface, not part of the review form. Unchanged. |
| 11 | Suggest an edit | `correction` | structured | **ASK** | Separate surface. Unchanged. |
| 12 | Want / Have / Had | `closet_item.status` | chips | **ASK** | The entry action itself. Adding a bag IS reviewing it. Also gives us ownership status free. |

## 2. The original 0012 axes

| # | Axis | Verdict | Reasoning |
|---|---|---|---|
| 13 | `build_quality` | **CUT** | Ceiling effect at the top tier (everyone scores a Birkin 5, so no signal), and the Flap evidence showed it partly measures price resentment, not workmanship. |
| 14 | `everyday_wearability` | **COMBINE** → *Where it fits* | The outcome of the others, not a peer. |
| 15 | `holds_value` | **DERIVE** | Market fact from `price_history`. Already excluded in code. Near-meaningless mid-tier, where most owners never sold. |
| 16 | `roomy_vs_compact` | **DERIVE** | Measures which variant the voter bought. Dimensions plus the what-fits note cover it. |
| 17 | `comfort` | **COMBINE** → *Living with it* | Body-dependent, so genuinely un-derivable. Survives as tags. |
| 18 | `versatility` | **CUT** | Flagged ambiguous by 5 of 6 passes: it means carry-modes AND occasion-range AND outfit-matching at once. |
| 19 | `worth_the_price` | **CUT** | Duplicates the stars. Already excluded in code. |

## 3. The axes I proposed in 0059

| # | Axis | Verdict | Reasoning |
|---|---|---|---|
| 20 | `structure` (slouchy ↔ structured) | **DERIVE** | A property of construction and material, near-identical across every unit of a variant. A fact, not lived experience. |
| 21 | `formality` / dress code | **COMBINE** → *Where it fits* | Genuinely contested, so worth capturing, but as occasion tags rather than a scale. |
| 22 | `access` / getting in | **COMBINE** → *Living with it* | **Not dropped.** The single most-discussed functional property in the research (11/11 on the Lady Dior, present in all six). Survives as explicit tags: *fussy to open*, *easy in and out*. |
| 23 | `upkeep` | **COMBINE** → *How it holds up* | Cause-and-effect with ageing. One question. |
| 24 | `presence` | **DERIVE** (split) | Conflated two things. **Recognisability** (loud monogram vs logo-free) is a catalog fact. **Ubiquity** ("everyone has one") is derivable from our own listing and closet volume. Neither needs asking. |
| 25 | `wears_well` / how it ages | **ASK** → *How it holds up* | The strongest ask in the whole set. Purely longitudinal, and unknowable without years of ownership. |
| 26-28 | build_quality, comfort, everyday_wearability (kept in 0059) | see above | |

## 4. Surfaced by the research, never built

| # | Dimension | Verdict | Reasoning |
|---|---|---|---|
| 29 | Capacity / what fits | **DERIVE** + the note (#9) | Most-discussed dimension overall (~83%), but it is dimensions plus a list. |
| 30 | Beauty / object desirability | **COMBINE** → stars | The Lady Dior's loudest theme. The star rating already is this in practice. |
| 31 | Timelessness / will it date | **CANDIDATE** | 6/6 bags, and it is the stated reason people buy. Partly derivable (production span, LC Index), partly opinion. Could be two tags: *feels timeless* / *feels of-the-moment*. **Your call.** |
| 32 | Fuss factor / babying anxiety | **COMBINE** → *How it holds up* | Same thing as upkeep. |
| 33 | Proportion on the wearer | **CONTEXT** | Cited alongside fit in four passes. Capture owner height once on the profile, never per review. |
| 34 | Colour practicality | **DERIVE** | Colourway is a catalog fact; "light colours show dirt" is a material fact. |
| 35 | Material honesty | **CUT** (bag level) | Mid-tier's loudest argument ("does it feel like what it claims"), but it collapses into build quality, which ceilings out. |
| 36 | Quality consistency / QC lottery | **CONTEXT** | Real mid-tier anxiety, but it is about purchase YEAR, not the bag. Capture the year, surface the pattern. |
| 37 | Buying experience (service, returns, duties) | **BRAND** | Drives real decisions. Per-bag it would pollute every model a house makes. |
| 38 | Acquisition friction / pre-spend | **BRAND** | Half the Hermès conversation, and entirely about the house. |
| 39 | Repairability / lifetime service | **BRAND** | Named by owners as the actual price justification. A house policy. |
| 40 | Counterfeit density | **DERIVE** / **BRAND** | "People assume mine is fake" is real (14/24 Neverfull), but it follows from how copied a bag is, which we can see. |
| 41 | Interior organisation | **DERIVE** | Pocket count is a spec. |
| 42 | Standing up / setting it down | **CUT** | Real on structured bags, too narrow to ask everyone. |
| 43 | Weather resilience | **DERIVE** | A material property. |
| 44 | Noise (charms, hardware) | **DERIVE** | A design fact, and only applies to a handful of bags. |
| 45 | Compliments / "what bag is that?" | **CUT** | Charming, but it is recognisability again. |

## 5. Context, captured silently

Never a question in the form. Without these the aggregates are noise.

| # | Field | How | Why |
|---|---|---|---|
| 46 | Ownership status | Derived from `closet_item` (have/had) | The two highest-engagement Birkin threads were from people who do not own and do not want one. Pooling owners and onlookers measures brand sentiment, not experience. |
| 47 | Purchase year + channel | One optional line, or derived | A vintage buyer and a boutique buyer rate the same bag differently. |
| 48 | Owner height | Profile, once | Makes fit and comfort readable instead of contradictory. |

---

## The resulting ask

**Six inputs, down from thirteen.**

1. ★ **Overall rating**
2. **Title** (optional one-liner)
3. **Review text** (optional)
4. 🏷️ **How it holds up** — ages beautifully · shows every mark · corners go first · needs babying · low maintenance · hardware wears
5. 🏷️ **Living with it** — easy in and out · fussy to open · comfortable loaded · digs in · heavy fast · goes flat
6. 🏷️ **Where it fits your life** — everyday · work · evenings · travel · saved for occasions · I reach for it constantly · it mostly sits

Plus the **what-fits note** where the wear surface already lives, and photos and
corrections on their own surfaces as today.

Every tag is community vocabulary taken from the research, and each doubles as a
search facet (the StoryGraph lesson in `ux/ux-research-brief.md` §B: one taxonomy
serving capture, filtering, and recommendations at once).

**Open for your call:** whether *timelessness* (#31) earns two tags in group 6.
