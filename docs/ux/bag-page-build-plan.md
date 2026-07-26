# The bag page community build plan

*Consolidated 2026-07-26, owner-approved ("do them all"). Supersedes the scattered
proposals across `bag-scales-spec.md`, `fragrantica-to-bags-translation.md`,
`review-ask-inventory.md` and `review-ask-never-built.md`. Evidence base:
`research-drafts/axis-evidence-2026-07.md` (6 bags, ~100 owner sources) and
`fragrantica-teardown-0726.md` (live competitive teardown).*

---

## The four principles

1. **Ask only what we cannot learn elsewhere.** Longitudinal, bodily, behavioural,
   or social. Properties of the object get derived.
2. **One canvas per bag, not five features.** Everything you record about a bag lives
   in one panel with a private/public toggle per field. *(Owner: Fragrantica's split
   between review, private note, shelf and tags means "I never remember where I wrote
   it down.")*
3. **One layout, gate the action.** Counts and community data show to everyone;
   only writing requires an account. *(Fragrantica hides "41.5K people own this" from
   logged-out visitors, which wastes its best social proof on the people who need it
   least.)*
4. **Slider on top, distribution below.** Every scale: your vote as a slider
   defaulted to "no vote", the community spread as labelled bars directly beneath.
   You vote on the same scale you read.

---

## 1. Sentiment: emotional only

**Love · Like · OK · Dislike · Hated it on sight**

Negativity holds two of five slots, matching the pattern that makes divisive objects
read as divisive. **"Sold it" is deliberately NOT here** (owner correction): selling
implies you liked it once, and it is a behaviour, not a feeling.

---

## 2. Shelf states, with a reason

| State | Meaning |
|---|---|
| **Want** | On the list |
| **Tried** | Held it in person, never owned it |
| **Have** | Own it now |
| **Had** | No longer have it |

**"Had" takes an optional one-tap reason:** sold it · returned it · gifted it ·
**rented it** · lost it.

That reason is where the signal is. "Sold after five years" and "returned in a week"
are different stories, and both beat a low rating. **Rented** cleanly covers
Vivrelle and similar, where the person never owned the bag at all.

**Counts show to everyone.** Per principle 3.

---

## 3. The owner scales (asked)

| Scale | Ends |
|---|---|
| Getting in | Fussy to get into ↔ Easy in and out |
| Holds its shape | Slouches ↔ Holds its shape |
| How it holds up | **Baby it ↔ Live in it** |
| Dress code | Casual ↔ Dressy |
| **Price value** | Way overpriced ↔ Great value |
| **Worth it where** | Only worth it preloved ↔ Worth it at full retail |

Price value is in because Fragrantica's data proves it is not a restatement of the
overall rating: 3.76/5 overall while 5.5k call it way overpriced and 399 call it
great value. Our earlier version failed because it was a boolean.

**Worth-it-where has no perfume equivalent** and is arguably the most useful value
question in our category.

---

## 4. Age and trend: two scales, not one ⚠️ needs design work

Owner correction: timeless is not the midpoint between young and mature. These are
two axes wearing one label.

**A. Who it reads as** — Youthful ↔ Grown-up
**B. When it reads as** — Of-the-moment ↔ Enduring

**The fix that rescues trend.** It was cut for being unstable ("Celine Luggage,
trendy and dated as hell"). Instability is only fatal for a static average.
**Timestamp every vote and store it as a time series**, and the drift becomes the
product:

> *In 2020 this read as of-the-moment. In 2026 it reads like a classic.*

Nobody holds that. The objection becomes the feature.

⚠️ **Copy risk:** a youthful/grown-up scale can read as ageist in a way "grandma
bag" does not when said affectionately. Needs a copywriter pass before shipping.

---

## 5. Most worn (not "workhorse")

Owner: "workhorse" implies laptop bag. The concept is the fragrance world's
no-brainer wear, the one you grab without thinking.

**Not a daily log.** The owner does not do this on Fragrantica and is the target
user. Instead, a **periodic check-in**:

> **Still your most worn?**
> *Anything changed since last time?*

**Triggers:**
- Every three to four months
- On return after an absence
- As a newsletter prompt for email subscribers

**Yields:** per bag, "41% of owners call this their most worn" · per closet, which
bags get used and which sit · sitewide, a **Most Worn leaderboard**, a genuinely new
ranking that no competitor can compute.

**Moves:** return visits (the check-in is a re-engagement hook) + unique data.

---

## 6. Votable Reputation claims ⭐

Fragrantica's highest-engagement mechanic: AI pros and cons drawn from member
reviews, each thumb-votable, up to 1.6k votes per line, disclosed plainly.

> 👍 1,204 👎 209 · *Owners say the double flap is slow to open one-handed*
> 👍 933 👎 181 · *Owners say the lambskin holds up better than expected*

Seeded from our web synthesis (proved on the Chanel 19, 11 sources), then ratified
or rejected by owners. **Cold-start fix and top engagement mechanic in one.**

Carried-over guardrails: synthesis never republication · tag sources `community` vs
`commercial` and weight criticism toward community · date every claim · let owners
mark a claim outdated.

---

## 7. "This bag reminds me of" — three rails

| Rail | Question it answers |
|---|---|
| **The affordable alternative** | The dupe question, asked constantly, answered nowhere trustworthy |
| **The same energy** | Different house, similar feel |
| **The upgrade** | What people move to next |

**How they populate, three sources stacked:**

1. **Derived (day one, every bag):** same silhouette + material + size, lower price
   band = alternative; higher band = upgrade; attribute similarity = same energy.
2. **Web-seeded (icons):** dupe chatter is everywhere and already surfaced unprompted
   in our research passes.
3. **Crowd (grows):** Suggest, vote, and **"I chose this over…"**, which captures the
   actual decision rather than mere resemblance.

Plus **Compare** on every card. **Moves:** discovery → affiliate, and evergreen SEO.

---

## 8. Photo surfaces

**A. Wear-and-tear timeline.** The same bag at year 1, 3, 5. Nothing on the internet
has this, and it is the visual proof behind the holds-up scale.

**B. What-fits photo.** Your actual contents laid out. Answers the most-discussed
dimension (~83% of sources) visually, with a clear brief that makes it an easy
contribution.

---

## 9. The one canvas

Everything an owner records about a bag lives in **one panel**, not scattered across
a review, a note, a shelf and tags. Per-field privacy toggles instead of separate
features.

**This is also where purchase context is captured**, as a useful personal record
rather than an interrogation: purchase year · channel (boutique / preloved /
consignment / gift) · what you paid. That context is what makes price-value and
quality-by-year readable in aggregate.

---

## 10. Repair

**Affiliate status, honestly:** our earlier research found repair shops are
direct-only with no affiliate programs, and a 2026-07-26 owner check agrees that
matches expectations. **Keep looking; a custom partnership is an option the owner is
open to.** Do not build revenue assumptions on it yet.

**What ships regardless:** a repair referral surface that reminds people repair is
part of what we cover. The repair *log* is secondary and optional, since engagement
is doubtful.

---

## 11. Derived scales (never asked)

| Scale | Ends | Source | Status |
|---|---|---|---|
| Weight | Light ↔ Heavy *for its size* | grams ÷ volume | needs `weight_g` |
| Capacity | Compact ↔ Roomy | dimensions | 0% filled |
| Opening | Narrow ↔ Wide | `opening_width_cm` | 0% filled |
| Strap drop | Short ↔ Long (+ clears a coat) | `strap_drop_length_cm` | 0% filled |
| Built structure | Soft ↔ Rigid | `rigidity` | 0.4% filled |
| Recognisability | **IYKYK ↔ Recognisable** | logo prominence + icon status | needs a source pass |
| Ubiquity | Rare ↔ Everywhere | our listings + closet counts | ✅ ready |
| Value retention | Falls ↔ Holds | price history vs retail | ✅ ready |

**Derived chips:** carry modes · closure type · exterior material · hardware colour ·
interior pockets.

**Character bars** at the top of the page: `structured · slouchy · compact ·
logo-forward · minimal · vintage · evening`, proportional and derived.

⚠️ **Most of this is blocked on the spec backfill.** Columns exist and are empty
across 4,409 variants.

---

## 12. Signup gate that names the payoff

Fragrantica gates at the moment of intent, which is right, but never says what you
get. Ours says it:

> **Add your read**
> You will be able to rate how bags actually wear, keep a closet of what you own and
> want, tell us which bag you reach for most, and get told when a bag you want drops
> in price.

---

## Build order

| # | Unit | Why here | Blocked by |
|---|---|---|---|
| 1 | **Spec backfill + 3 new columns** | Gates every derived scale | — |
| 2 | **Show shelf counts to everyone** | Nearly free, fixes the clearest competitor mistake | — |
| 3 | **Owner scales + slider/distribution anatomy** | The core surface | migration |
| 4 | **Votable Reputation claims** | Cold start + top engagement | synthesis pipeline |
| 5 | **"Reminds me of" three rails** | Discovery + affiliate + SEO | derived pass |
| 6 | **Shelf states + reasons** | Cheap, high signal | migration |
| 7 | **Most worn check-in** | Return visits + unique data | — |
| 8 | **One canvas + purchase context** | Fixes the UX failure we identified | 3 |
| 9 | **Photo surfaces** | Visual proof | moderation exists |
| 10 | **Age + trend scales** | ⚠️ needs design + copy work first | — |
| 11 | **Repair referral** | Reminds people we cover it | — |

**Owner-held:** build quality (parked) · whether migration 0059 applies as-is now
that the scale set has grown.
