# Fragrantica page teardown — what to steal, what to fix

*Observed live in Chrome, 2026-07-26, signed OUT. Page: Baccarat Rouge 540
(Maison Francis Kurkdjian), one of the most-voted fragrances on the site. All
figures are what the page displayed on that date. A signed-in pass is still to
come, to diff the two states.*

---

## The number that justifies the whole approach

| Signal | Count |
|---|---|
| **Rating votes** | **29,107** |
| Written reviews | 3,900 |
| Upvotes on a single pro/con line | up to **1,600** |

**Voting outnumbers writing by roughly 7.5 to 1**, and one AI-summarised line
collected more upvotes than the page has reviews. This is the quantitative case
for a low-friction tap: the 90% who will never write still register an opinion.

---

## ⭐ The anatomy every voting module shares

This is the most important structural finding, and it is exactly the unified idea
we specced independently:

> **Your vote is a slider at the top, defaulted to "no vote".**
> **The community distribution sits directly below it, as labelled bars with counts.**

You cast your vote on the *same scale* you read the aggregate on. No separate
form, no modal, no context switch. Longevity, sillage, gender and price value all
use this identical shape, so learning one teaches you all four.

---

## The full module inventory

### 1. Main accords — derived character bars
`woody · amber · warm spicy · metallic · fresh spicy · aromatic · white floral ·
animalic · fresh`. Proportional, ranked, colour-coded, at the very top of the page.
**Derived from composition, not voted.** Our "measured" tier.

### 2. RATING — a sentiment distribution, not stars
`love 12.7k · like 6.4k · ok 3.2k · dislike 3.8k · hate 3k` → "3.76 out of 5 with
29,107 votes". Each with a face icon, coloured bar, count.

**Negativity gets two of five slots.** A star average hides the haters; this shows
the split, which matters on a divisive object.

### 3. WHEN TO WEAR — occasion voting as a distribution
`winter 9.8k · spring 6.2k · summer 4k · fall 9.8k · day 7.1k · night 9.4k`.
Seasons and time-of-day in one module, **non-exclusive**, shown as bars rather than
a single "best for" label. The better display for our occasion chips.

### 4. What People Say — AI pros and cons, each votable
Two columns, every line with 👍 and 👎 counts.

> **PROS** 1.2k/209 "A unique and memorable scent that lingers in your memory" ·
> 933/181 "Complex mix of sweet, metallic, and salty" · 919/198 "Great for special
> occasions and making a statement"
>
> **CONS** 1.6k/68 "Expensive price point may not be justifiable for some
> consumers" · 1.1k/201 "May not live up to the hype for some people" · 922/156
> "Extremely polarizing and divisive scent profile"

Disclosed verbatim beneath the module:
> "These pros and cons are AI-generated from member reviews and may be inaccurate.
> Please read full reviews and consider your own needs before purchasing."

**This answers where the extra data comes from.** The claims are summarised **from
member reviews**, then **voted on separately**, which is why vote counts exceed the
review count. The AI drafts, the crowd ratifies.

### 5. PERFUME PYRAMID — vote on the spec itself
Notes rendered as image tiles **sized by vote weight** (Saffron's tile is visibly
larger than Jasmine's). Toggles for "Show votes" and "Hide Labels", plus a "Vote
for ingredients" action.

**The crowd corrects the manufacturer's own claim**, inside a controlled vocabulary
editors maintain. Perception of prominence rendered as size.

### 6. PERFORMANCE — longevity + sillage
| Longevity | | Sillage | |
|---|---|---|---|
| very weak | 521 | intimate | 1.3k |
| weak | 714 | moderate | 4.5k |
| moderate | 3.1k | strong | 6.3k |
| long lasting | 5.7k | enormous | 3.7k |
| eternal | 5.4k | | |

Both use the slider-plus-distribution anatomy. Named ordinal buckets, not numbers.

### 7. DEMOGRAPHICS & VALUE — gender + price value
| Gender | | Price value | |
|---|---|---|---|
| female | 3.6k | way overpriced | **5.5k** |
| more female | 3.5k | overpriced | 4k |
| unisex | **6.4k** | ok | 2.6k |
| more male | 474 | good value | 547 |
| male | 326 | great value | 399 |

**Price value is the sleeper finding.** The fragrance rates 3.76/5 overall, yet
**5.5k people call it "way overpriced" and only 399 call it great value.** Those
are clearly different opinions, which means a price-value scale is *not* a
restatement of the overall rating. Worth revisiting our decision to cut worth-it,
since ours was a boolean and this is a five-point scale with a legitimate negative
end. Gender is colour-coded (pink → teal → blue) and reads as a spectrum, not a
binary.

### 8. "This perfume reminds me of" — a crowd-built similarity graph
Cards with 👍/👎 counts and a **+ Suggest** button, plus **Compare** on each.

> Baccarat Rouge Extrait 2.6k/210 · Ariana Grande Cloud **3.3k/1.6k** · Zara Red
> Temptation 1.5k/200 · Mancera Instant Crush 1.8k/1.2k

**The community builds AND ranks the similarity graph.** Note Ariana Grande Cloud
at 3.3k up but 1.6k down: a genuinely contested comparison, and the split is
visible rather than hidden. Zara Red Temptation at 1.5k/200 is near-consensus, the
known affordable alternative.

### 9. People who like this also like
Twenty collaborative recommendations, each with a **Compare** button.

### 10. Reviews, photos, shops
3.9K written reviews · "Fragram" member photos · an affiliate shop rail and an
Amazon product grid.

### 11. The signup gate
Write actions prompt: *"Join Fragrantica, become a member of the most vibrant
fragrance community for free, and get the most out of Fragrantica. Unlock member
only features on this website."* (Owner-observed on "Show votes".)

**Good:** the gate arrives at the moment of intent, when someone has already
decided to participate. **Weak:** it never says *which* features. A list of what
you unlock would convert better.

---

## The UX failure to avoid

The owner's read holds: **contribution points are scattered with no through-line.**
Rating in one box, when-to-wear in another, note votes inside the pyramid,
performance and demographics far below the fold, pro/con votes elsewhere again,
review writing somewhere else. A member who wants to contribute has no single
path; a member who doesn't is nagged in six places.

**Our fix:** one unified list of scales (`bag-scales-spec.md`) where the ask is the
empty state of a row. Same richness, one path.

---

## Options for us, ranked

| # | Mechanic | Our version | Verdict |
|---|---|---|---|
| 1 | **Slider-plus-distribution anatomy** | Every scale: your vote on top, community bars below | **Adopt outright.** It is our unified-scale idea, proven at scale. |
| 2 | **AI claims, individually votable** | Reputation synthesis publishes claims; owners thumb them | **Strong yes.** Highest engagement on the page, and it is our cold-start fix. |
| 3 | **"This bag reminds me of" + Suggest** | Crowd-built similarity, votable, with Compare | **Strong yes.** Dupe and alternative discovery, and every card is an affiliate path. |
| 4 | **Price-value as a 5-point scale** | Way overpriced ↔ great value | **Reconsider.** Demonstrably not a restatement of the star rating. |
| 5 | **Sentiment distribution instead of stars** | love / like / ok / dislike / hate | **Worth testing.** Shows the split on divisive bags. |
| 6 | **Occasion as a voted distribution** | Our occasion chips as bars with counts | **Yes.** Same data, better display. |
| 7 | **Vote on the spec itself** | Vote on catalog attributes, not just suggest edits | **Later.** Ours is a correction queue today. |
| 8 | **Compare on every related card** | We already have `/compare` | **Cheap yes.** |
| 9 | **Signup gate at the moment of intent** | Same, but **name the features** | **Yes, improved.** |

---

## The mechanic worth stealing outright

**Synthesise a claim, then let the crowd vote on it.** It solves cold start (the
page is useful before anyone contributes), collects far more signal than a review
form, produces a legible aggregate ("1.6k people agree this is overpriced"), and
degrades honestly because a rejected claim sinks.

Ours, seeded by the Reputation synthesis and thumbed by owners:

> 👍 1,204 👎 209 · *Owners say the double flap is slow to open one-handed*
> 👍 933 👎 181 · *Owners say the lambskin holds up better than expected*

Disclosure follows theirs: state plainly that it is drawn from published reviews,
name the sources, date it, link out.

---

## Still to check, signed in
- Does the module set change, or only the write affordances?
- What exactly the signup modal lists as member-only.
- Whether personal state (my vote, my shelves) renders inline in the same scales.
