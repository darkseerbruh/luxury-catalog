# Fragrantica page teardown — what to steal, what to fix

*Observed live in Chrome, 2026-07-26. Page: Baccarat Rouge 540 (Maison Francis
Kurkdjian), one of the most-voted fragrances on the site. All figures below are
what the page displayed on that date.*

---

## The number that justifies the whole approach

| Signal | Count |
|---|---|
| **Rating votes** | **29,107** |
| Written reviews | 3,900 |
| Upvotes on a single pros item | up to 1,600 |

**Voting outnumbers writing by about 7.5 to 1.** A single AI-summarised pro/con
line collected more upvotes (1.6k) than the page has reviews. This is the
quantitative case for a low-friction tap: the 90% who will never write still
happily register an opinion.

---

## The six modules, and what each is doing

### 1. RATING — a sentiment distribution, not stars
`love 12.7k · like 6.4k · ok 3.2k · dislike 3.8k · hate 3k`
Each with a face icon, a coloured bar, and a count. Composited into "3.76 out of
5 with 29,107 votes".

**What's smart:** it names the emotions instead of abstracting to numbers, and it
gives **negativity two of five slots**. A star rating hides the haters inside an
average; this shows the split. Baccarat Rouge is genuinely divisive and the
distribution says so at a glance.

### 2. WHEN TO WEAR — occasion voting rendered as bars
`winter 9.8k · spring 6.2k · summer 4k · fall 9.8k · day 7.1k · night 9.4k`

**What's smart:** seasons and time-of-day in one module, **not mutually
exclusive**, and displayed as a distribution rather than a single winner. This is
the direct analogue of our occasion chips, and it shows the better display: vote
counts as bars, not a single "best for" label.

### 3. Main accords — derived character bars
`woody · amber · warm spicy · metallic · fresh spicy · aromatic · white floral ·
animalic · fresh`, proportional and ranked, each colour-coded.

**What's smart:** these are **derived from the composition**, not voted. They sit
at the very top of the page as the at-a-glance identity. This is exactly our
"measured scales" tier.

### 4. Perfume pyramid with "Show votes" and "Vote for ingredients"
Users vote on the **notes themselves**, crowd-correcting the brand's own claims,
inside a controlled vocabulary editors maintain.

**What's smart:** the community can correct the manufacturer's spec sheet without
free text. That's our "suggest an edit" surface, but continuous and votable.

### 5. What People Say — AI pros and cons, each votable
Two columns. Every line carries 👍 and 👎 counts.

> **PROS** · 1.2k / 209 "A unique and memorable scent that lingers in your memory"
> · 933 / 181 "Complex mix of sweet, metallic, and salty"
> · 919 / 198 "Great for special occasions and making a statement"
>
> **CONS** · 1.6k / 68 "Expensive price point may not be justifiable for some"
> · 1.1k / 201 "May not live up to the hype for some people"
> · 922 / 156 "Extremely polarizing and divisive scent profile"

Disclosed verbatim at the bottom of the module:
> "These pros and cons are AI-generated from member reviews and may be inaccurate.
> Please read full reviews and consider your own needs before purchasing."

**What's smart:** this answers the owner's question about where the extra data
comes from. The pros and cons are **summarised from member reviews**, then
**voted on separately**, which is why the vote counts exceed the review count.
The AI drafts, the crowd ratifies. Nobody has to write anything to participate,
and the disclosure is plain and prominent.

**This is the single most transferable mechanic on the page**, and it maps almost
exactly onto our Reputation layer: synthesise, publish as a claim, let the
community confirm or reject it.

### 6. People who like this also like
Twenty cross-links, each with a **Compare** button.

**What's smart:** collaborative recommendation plus a direct comparison entry
point, with no dead ends.

### Not found today
The **longevity / sillage / gender** voting module the owner remembered is not on
this page as of 2026-07-26. It is either login-gated or was removed in a redesign.
Worth a second look while signed in before we treat it as a live pattern.

---

## The UX failure to avoid

The owner's read is right: **the opportunities to contribute are scattered across
the page with no through-line.** Rating sits in one box, when-to-wear in another,
note votes buried in the pyramid, pro/con votes far below the fold, review writing
somewhere else again. A member who wants to contribute has no single path, and a
member who doesn't is nagged in five places.

**Our version:** one unified list of scales (`bag-scales-spec.md`), where the ask
is simply the empty state of a row. Same richness, one path.

---

## Options for us, ranked by what they'd add

| # | Mechanic | Our version | Verdict |
|---|---|---|---|
| 1 | **AI pro/con summary, individually votable** | Reputation layer publishes claims; members thumb them up or down | **Strong yes.** Highest engagement on their page, and it fits the moat directly. |
| 2 | **Sentiment distribution instead of stars** | love / like / ok / dislike / hate | **Worth testing.** Shows the split on divisive bags. Replaces or supplements ★. |
| 3 | **Occasion as a voted distribution** | Our occasion chips, displayed as bars with counts | **Yes.** Same data we already planned, better display. |
| 4 | **Derived character bars at the top** | Our measured scales | **Already specced.** |
| 5 | **Vote on the spec itself** | Vote on catalog attributes rather than only suggesting edits | **Maybe later.** Ours is a correction queue today. |
| 6 | **Compare button on every related item** | Compare on the "people who like this" rail | **Cheap yes.** We already have `/compare`. |

---

## The mechanic worth stealing outright

**Synthesise a claim, then let the crowd vote on it.** It solves cold-start (the
page is useful before anyone contributes), it collects far more signal than a
review form, it produces a legible aggregate ("1.6k people agree this is
overpriced"), and it degrades honestly because a claim the crowd rejects sinks.

For us the claims come from the Reputation synthesis and get thumbed by owners:

> 👍 1,204 👎 209 · *Owners say the double flap is slow to open one-handed*
> 👍 933 👎 181 · *Owners say the lambskin holds up better than expected*

Our disclosure would follow theirs: state plainly that the summary is drawn from
published reviews, name the sources, date it, and link out.
