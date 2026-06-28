# Luxury Catalog — Marketing + UX Personas (research-grounded draft)

*Internal strategy deliverable. Drives customer-journey mapping, feature prioritization, and voice/tone. Provisional, to be validated against PostHog usage as it accumulates. Last drafted 2026-06-27.*

> This document is internal, so the product's "never invent" rule about user-facing bag facts does not bind it. But every non-obvious claim about buyer motivation is cited (see §6). Where a claim is community sentiment rather than hard data, it is labeled as such.

---

## 1. Purpose & method

### What these personas are for
Three concrete jobs, in priority order:
1. **Customer-journey mapping** — define the real entry points and paths through the app (quiz → bag page → closet → alert → affiliate hand-off), so we design the *flow* a real motivation runs, not a feature tour.
2. **Feature prioritization** — give the backlog a scoring lens. "Which persona does this serve, and how central is it to them?" beats "is it cool."
3. **Voice/tone** — one brand voice, register-flexed per surface (loosest on TikTok, tightest at authentication/price). Personas tell us which register lands where.

### The method we used (marketing + UX, synthesized)
Personas are a contested craft. The two parent fields define a "good persona" differently, and we deliberately fuse them:

- **UX personas (Nielsen Norman Group; Alan Cooper's goal-directed personas).** NN/g's core rule: a persona is "a quick, empathy-inducing shorthand for users' context, motivations, needs, and approaches," rooted in qualitative understanding, *not* demographic stereotypes — "age, location, and job title don't predict behavior" [1]. Cooper invented the persona ("Kathy," 1985) as a goal archetype derived from interviewing likely users, precisely so designers could design for a goal rather than a demographic average [2]. NN/g classifies personas as **lightweight/proto** (assumption-based, no new research), **qualitative** (5–30 interviews, "the best fit for most teams"), or **statistical** (large survey + clustering, lets you size each persona as a % of the base) [3]. NN/g recommends **3–6 personas** — "not an exhaustive, scientific taxonomy" [3]. This directly confirms the founder's instinct: personas are behavior/goal clusters, not demographic boxes.
- **Marketing buyer personas (Adele Revella, *Buyer Personas* / the Buyer Persona Institute).** Revella adapted Cooper's idea for marketers: where UX wants what users *want from the product*, marketing needs what real buyers want *from the buying experience* [2]. Her **Five Rings of Buying Insight** are: **Priority Initiative** (the trigger — why act now vs. stay with the status quo), **Success Factors** (the result the buyer expects), **Perceived Barriers** (what stops them; why they'd trust a competitor instead), **Buyer's Journey** (how they evaluate and eliminate options), and **Decision Criteria** (the specific attributes they weigh) [4][5]. Her framework deliberately *reduces* the number of personas and strips out irrelevant demographic data [4].
- **Jobs-to-be-Done (as complement, not replacement).** NN/g's own position: JTBD and personas are "quite compatible" — JTBD captures the situation/motivation/outcome ("decide what to build"), personas add the behavioral and attitudinal narrative ("align stakeholders, write copy") [6]. So we use JTBD *inside* each persona (the "primary jobs" line) rather than choosing one over the other.

**Our synthesis — what a Luxury Catalog persona must contain:**
1. A **goal/motivation cluster** (UX) — the jobs they're hiring us for.
2. A **buying-insight layer** (marketing) — trigger, success factor, barrier, what they distrust.
3. A **maturity-timeline position** (our addition — see §2) — because the founder is right that "collecting" is a *stage*, not a peer category.
4. A **data signature** — the analytics events that would confirm the persona exists, so each one is *validatable*, not just asserted.

These are **qualitative-leaning provisional personas** in NN/g's terms: grounded in cited market research and community evidence, not yet in our own user interviews or clustered PostHog data. They are explicitly a v1 to be re-cut once real usage accumulates — which matches how the founder works (instrument, then let usage data decide the priority).

---

## 2. The motivation / maturity map

The founder's core critique is that the old 5 buckets flatten two different axes into one list. So we model **two axes**, not one bucket.

### Axis A — Maturity / relationship-to-the-craft (a timeline, mostly one-directional)

```
APPRECIATE ──► ASPIRE ──► FIRST PURCHASE ──► BUILD / COLLECT ──► INVEST / STEWARD
 love the      save toward   cross the         own several;        manage value,
 bags, learn   a specific    threshold;        repeat buyer;       insurance, tax,
 the lore      grail         high anxiety      taste hardening      curation
```

This is a *journey stage*, not a personality type. A single human moves rightward over months or years. "Building a collection that holds value" is the right-hand end of this axis — exactly the founder's point that it is a **stage, not a box**. Crucially, **most users sit at the left** (appreciate/aspire), and the app's free fact-density is what serves them long before they can buy.

### Axis B — Active motivations (can co-occur, at *any* maturity stage)

| Motivation | The act | Co-occurs with |
|---|---|---|
| **Carry / wear** | "I want a bag to use and love" | Appreciate→First purchase; quiet-luxury self-reward |
| **Value / invest** | "I want it to hold or grow value" | First purchase onward; collectors |
| **Resell / flip** | "I buy to sell at a profit" | Parallel to the whole timeline |
| **Authenticate** | "Is this real?" | Almost always *in service of* another motivation |
| **Hunt the deal** | "Find it below market / in the wild" | Carry-shoppers AND flippers, same act |

Axis B motivations are **not personas** — they are verbs that combine. A persona is a *recurring combination* of Axis-A stage + Axis-B motivations.

### The two clustering corrections the founder named

1. **Flipping + authenticating are one cluster, not two personas.** A flipper authenticates *in order to* flip — authentication is a sub-task of the resale job, not a standalone identity. Community evidence is blunt about this: thrift/flip threads treat "have a professional authenticate it" as a *step in the flip*, not a separate hobby [13], and the most-upvoted vintage-Coach resource is a cataloguer who reselling-flippers use to ID styles before buying [14]. **Implication:** "authentication" should never be a top-level persona. It's a *job* that the Reseller (and the nervous First-Buyer) both run.

2. **"Next bag to carry" and "steal in the wild" are one shopping act.** To the shopper, finding the bag they want and spotting it below market are the *same behavior* with the price knob turned. Reddit's recurring "one luxury bag or 2–3 mid-range?" and "pre-owned — yay or nay?" threads show the *same buyer* weighing carry-desire and price in a single decision [9][12]. **Implication:** don't split "find my next bag" and "spot a steal" into two personas or two homepage doors aimed at different people. It's one shopping journey; "deal" is a filter on it.

### How the two axes produce personas
We define each persona as **one dominant maturity stage + one or two dominant Axis-B motivations**, chosen so the set is *distinct, memorable, and actionable* (NN/g's bar [3]) and covers the real traffic — from the large appreciate/aspire base up through the small collector/investor tip, with the reseller running parallel.

---

## 3. The personas

**Why five.** NN/g says 3–6, and warns thin personas are worse than few sharp ones [3]; Revella's whole method *reduces* persona count [4]. We land on **five** because the maturity axis needs at least three points to not collapse the founder's "it's a stage" insight (an entry-level appreciator, a first-buyer, a collector are genuinely different journeys), plus the parallel **Reseller** motivation (which the founder correctly bundles with authentication), plus the **value-anxious cross-shopper** who is the app's data-and-affiliate sweet spot. Fewer than five and we re-flatten the timeline; more and we'd be splitting motivations that co-occur (the exact error we're fixing).

A note on overlap: these personas **intentionally share motivations** (everyone authenticates sometimes; everyone hunts a deal sometimes). They differ by *center of gravity* — dominant stage + dominant motivation — not by exclusive ownership of a behavior.

---

### Persona 1 — "Maya, the Appreciator" (the romance-and-research entry point)

**Snapshot.** One-line essence: *In love with the bags before she can buy them; here to learn the lore and dream.* Maturity: **Appreciate → Aspire** (left end). Motivations: **carry/wear (aspirational)**, light **hunt-the-deal** (what *would* I buy), occasional **value** curiosity ("does it hold value?"). This is the largest segment by headcount and the top of every funnel.

**Marketing lens.**
- *Psychographics (source-supported):* skews Gen-Z/younger-millennial, value- and authenticity-oriented, discovers via social/creators not search — ~50% of secondhand shoppers now find their next item through social/creator feeds [8], and Gen-Z shows "selective engagement, lower brand loyalty, higher expectations around authenticity and relevance" [7]. Resale is explicitly her *gateway* to aspirational brands she can't yet buy new [10][11].
- *Trigger (Priority Initiative):* a creator video, a "what's it worth" curiosity, a bag she keeps seeing. Not a purchase event — an *interest* event.
- *Channels:* TikTok/YouTube Shorts, Pinterest (inbound high-intent), Instagram, the Journal via GEO/AI-search citation.
- *Message:* "Let me into the club via real knowledge." De-gatekeeping, lore, "fashion is subjective, we don't judge" (Je Suis Lou register).
- *Distrusts:* snobbery, gatekeeping, hype superlatives, anything that feels like a sales pitch before she's ready.

**UX lens.**
- *Primary jobs:* understand a bag's story/era/why-it-matters; learn what things are worth; build a vocabulary; daydream a future grail.
- *Behaviors:* deep reading on bag pages and the Journal; quiz; saving to `want`; long sessions, no transactions.
- *Pain points / friction moment:* content that assumes she already knows the jargon; price data with no plain-language "what this means"; being pushed to buy/sign up before she's ready.
- *Entry points:* the taste quiz (no account), "What's it worth?" tile, brand intelligence hubs, the Journal, GEO/AI-search landings on bag pages.

**What this persona means for us.**
- *Journeys:* quiz → matched bags → bag page "Story" + value → save to `want` → (later) price alert. The classic appreciation-to-aspiration on-ramp.
- *Features she most needs:* the Journal/Story modules, the taste quiz + Taste Map, brand hubs, plain-language value explainers, `want` list with alerts. She is the reason the catalog is **free and fact-dense**.
- *Voice register:* warmest, most de-gatekeeping. Lore-forward, joy-led, zero pressure.

**How we'd recognize her in data.** High article/bag-page dwell time; quiz completion without signup; multiple `want` adds, zero `have`/`had`; price-alert set on an aspirational (high-price) bag; arrives from social/AI-search referrers; few or no outbound affiliate clicks yet.

---

### Persona 2 — "Sofia, the First-Serious-Buyer" (the high-anxiety threshold)

**Snapshot.** Essence: *About to spend real money for the first time and terrified of getting it wrong.* Maturity: **First Purchase** (the threshold). Motivations: **carry/wear** (primary), **value** ("will it hold value / was it worth it?"), **authenticate** (acute — "is this real before I pay?"), **hunt-the-deal** (pre-owned to stretch budget). This is where the most monetizable anxiety lives.

**Marketing lens.**
- *Psychographics:* the "aspirational consumer" of every luxury report — increasingly price-sensitive, value-oriented, turning to resale because new prices have run away from her (Chanel Classic Flap +80% 2019–2024) [16][17]. Resale lets her "explore aspirational brands" and buy "premium and luxury in one place at up to 90% off" [8][11]. The "one good bag vs. several mid-range?" agony is *her* canonical thread [9][12] (community sentiment).
- *Trigger (Priority Initiative):* a milestone (promotion, birthday, "I finally saved up"), or finding a specific grail at a reachable price.
- *Success Factor:* confidence she chose well, won't be scammed, and didn't overpay.
- *Perceived Barriers:* fear of fakes; fear of buyer's remorse; not knowing what's a fair price; not knowing pre-owned is safe.
- *Channels:* search/GEO ("is the LV Neverfull worth it," "is this real"), creator reviews, the bag page itself.
- *Distrusts:* a verdict she can't check ("trust me, it's authentic"); a price with no evidence; pushy affiliate links.

**UX lens.**
- *Primary jobs:* decide *which* bag; confirm it's real *before paying*; confirm the price is fair; find where to buy it safely.
- *Behaviors:* compares 2–3 bags; reads authentication markers hard; checks the value gauge and price-over-time; opens buy/sell/rent links; sets one alert and waits for a dip.
- *Pain points / friction moment:* the moment right before purchase — "I think this is the one, but is it real and is this a fair price?" If we don't answer both, she bounces to PurseForum/Reddit or stalls.
- *Entry points:* "Is it real?" tile, "What's it worth?" tile, a specific bag page from search, the quiz result.

**What this persona means for us.**
- *Journeys:* search/quiz → bag page → authentication markers + value gauge (the two anxieties answered side by side) → affiliate buy hand-off → `have` + review prompt. She is the **affiliate backbone** (buyer-side, traffic-bound).
- *Features she most needs:* authentication guides (markers, not a verdict), the value module (evidence before assertion, graded within condition tier), price alerts, buy hand-off above the fold, "verified owner" reviews.
- *Voice register:* tightest, most reassuring. Calibrated hedge throughout: *markers to check, not a verdict; estimate, not appraisal*. The "reassuring friend at the moment of joy" ("that was a great choice, totally worth it").

**How we'd recognize her in data.** Authentication-article views + value-module views in the *same* session on the *same* bag; comparison behavior across 2–3 bags; one high-intent price alert; first outbound buy-click; first `have` add + review prompt accepted; search/GEO referrer with intent queries.

---

### Persona 3 — "Diane, the Collector / Steward" (the right end of the timeline)

**Snapshot.** Essence: *Owns several, buys repeatedly, and now thinks like a curator and a steward of value.* Maturity: **Build / Collect → Invest / Steward** (right end). Motivations: **value/invest** (primary), **carry/wear**, **hunt-the-deal** (knows market floors), occasional **authenticate** (high competence, low anxiety). Smallest by headcount, highest LTV and authority value.

**Marketing lens.**
- *Psychographics:* established buyer who treats certain bags as assets — and the data backs the instinct selectively: Hermès averaged ~138% value retention in the 2025 Rebag Clair report, the Birkin +92% over 10 years on resale, Chanel flaps buoyed by retail hikes [16][17]; The RealReal logs classics climbing (Birkin 30 +15%, LV Speedy +13%, Goyard Saint Louis +18%) [15]. She also knows the *counter*-truth the community repeats — "almost no luxury bag holds its value once you resell" outside a short list [9] (community sentiment) — which is exactly the nuance our value module must honor.
- *Trigger:* a gap in the collection, a market dip she's been watching, a grail becoming available, or a portfolio/insurance/tax need.
- *Success Factor:* the collection's value is understood, organized, and defensible; acquisitions are well-timed and well-priced.
- *Perceived Barriers:* thin/unreliable resale data; tools that treat her like a beginner; value claims she can't audit.
- *Channels:* the app itself (closet/portfolio), WatchCharts/Chrono24-style reference habits, expert/authenticator circles, direct.
- *Distrusts:* fabricated precision, "investment"/guaranteed-return framing, blended ranges that ignore exact spec (colour × leather × hardware × year).

**UX lens.**
- *Primary jobs:* track what she owns and what it's worth; time acquisitions and sales; manage value over the long run (and the records that go with it).
- *Behaviors:* populates `have`; checks closet value; sets alerts as market-watch tools; reads price-over-time and era axes; uses `had` for bags she's sold.
- *Pain points / friction moment:* a value figure that's vague or spec-blind; missing sold-price data; a portfolio view that won't show value over time.
- *Entry points:* "Collect & invest" tile → `/closet`; bag pages for spec-exact comps; (future) the collection report.

**What this persona means for us.**
- *Journeys:* closet/portfolio → per-bag value (spec-exact) → alerts as market-watch → sell hand-off from `had` → (future) collection report (value/insurance-referral/tax-records).
- *Features she most needs:* the closet portfolio + closet value, spec-exact value module with era axis and sold prices (when available), price alerts, sell/consign hand-off, the deferred premium collection report (estimate-not-appraisal; records-not-advice; refer-not-act).
- *Voice register:* peer-expert. Precise, evidence-first, never condescending; hedge is about *uncertainty in the data*, not about her competence.

**How we'd recognize her in data.** Multiple `have` items with priced bags; repeat closet-value views; several alerts used as watch (not single-purchase); engagement with era/sold-price views; `had` entries (sold history); high return frequency; interest in collection-report fake-door.

---

### Persona 4 — "Jordan, the Reseller / Flipper" (the parallel motivation, with authentication folded in)

**Snapshot.** Essence: *Buys to sell; authenticating is a step in the flip, not a hobby.* Maturity: **runs parallel to the whole timeline** (can be a thrift-flipper newbie or a pro reseller). Motivations: **resell/flip** (primary), **authenticate** (bundled — *in service of* the flip), **hunt-the-deal** (core skill), **value** (knows comps cold). This persona explicitly absorbs the old "authentication" and "thrift-hunter" buckets.

**Marketing lens.**
- *Psychographics:* spans the Coach/thrift-flipper (the founder's viral acquisition engine) to the semi-pro reseller. Operates on r/Flipping, r/Coach, VintageCoachRehab, eBay/Poshmark/FB Marketplace; treats "have a professional authenticate it" as a *cost of doing business* [13][14] (community sentiment). Sustainability/circularity tailwind is real but secondary to margin [8].
- *Trigger:* a mispriced item in the wild (thrift, estate, FB Marketplace), or a comp spread worth arbitraging.
- *Success Factor:* buy low, confirm real, sell at/above comp — fast.
- *Perceived Barriers:* uncertainty whether an item is authentic (kills the margin if wrong); not knowing the current comp/where to sell for the best net.
- *Channels:* thrift/flip communities, the bag page (for comps + markers), `had`-list, sell hand-off.
- *Distrusts:* a verdict tool that could get them sued for selling a fake; vague comps; a platform that hides where to sell.

**UX lens.**
- *Primary jobs:* authenticate a found item fast; price it against the market; find the best place to sell.
- *Behaviors:* heavy authentication-guide use; rapid comp/price-floor checks; `had` for sold inventory; sell/consign link use; Coach/mid-tier-heavy.
- *Pain points / friction moment:* standing in a thrift store deciding "real or fake, and worth it?" in 60 seconds — the mobile authentication-and-comp moment.
- *Entry points:* "Is it real?" tile (mobile), Coach/mid-tier bag pages, the deals section, sell hand-off.

**What this persona means for us.**
- *Journeys:* identify/authentication guide → comp check on bag page → sell/consign hand-off → `had`. Coach/thrift is the **viral acquisition loop** (shareable wins, "found this for $8").
- *Features she most needs:* fast mobile authentication markers, spec-exact comps + price floors, sell/consign hand-off wherever a flip signal appears, `had` list, deals section. (Tax/cost-basis records are a *nice-to-have* for this persona — valuable to the pro flipper, minor to most.)
- *Voice register:* savvy-peer, "smart with your money." Still *markers to check, not a verdict* (legal cover for them as sellers), but punchier and faster than Sofia's reassurance register.

**How we'd recognize her in data.** Authentication-guide views *paired with* comp/price-floor views on mid-tier brands (esp. Coach); sell-link clicks; `had` adds; rapid mobile sessions; deals-section engagement; low ratio of `want` to `had`.

---

### Persona 5 — "The Cross-Shopper" (a behavioral overlay, not a sixth body)

**Snapshot.** Essence: *Any of the above when they're actively shopping the market — comparing the whole market and handing off to the cheapest legit seller.* This is **not a separate maturity stage**; it's the **shared shopping state** that Maya, Sofia, Diane, and Jordan all enter. We name it because the founder's second correction ("next bag" and "steal in the wild" are one act) is really a *mode*, and the app's Google-Shopping-style compare-and-hand-off is built for exactly this mode.

We carry it as a **lightweight overlay persona** (NN/g's proto-persona idea [3]) rather than a fifth full body, because treating it as its own person would re-commit the flattening error — it's a state the four real personas pass through, where the only knob is "how much does price vs. desire drive this specific decision."

**What it means for us.** It validates a single, unified Shop/compare surface (one shopping journey, "deal" as a filter), the cross-platform low/median/high price comparison, and the buy/sell/rent hand-off at the decision point. **In data:** any persona showing market-comparison + outbound affiliate clicks in a session — the conversion event we instrument regardless of which persona fired it.

---

## 4. Critique of the current model & onboarding recommendation

### The old 5 buckets, mapped onto the new personas

Current enum (`src/lib/profile-actions.ts`, and the `PERSONAS` array in `src/app/onboarding/page.tsx`): `collector` · `flipper` · `first-purchase` · `authentication` · `thrift-hunter`. The homepage picker `src/components/PersonaRouter.tsx` ("What brings you in?") is already a *different* 4-tile model (Is it real / Collect & invest / What's it worth / Find the bag for me) — so onboarding and the homepage **already disagree**, which is its own reason to reconcile.

| Old bucket | Maps to | The error the founder named |
|---|---|---|
| `collector` | Persona 3 (Diane) | Treated as a peer category. It's the **right end of a timeline**, not a box — most users will never sit here, and forcing the choice mislabels appreciators/first-buyers. |
| `flipper` | Persona 4 (Jordan) | Correct motivation, but split from `authentication`… |
| `authentication` | …**a sub-job of Persona 4** (and a moment for Persona 2) | **Not a persona at all.** A flipper authenticates *in order to* flip; a first-buyer authenticates *in order to* buy safely. Splitting it invents a person who only checks realness for its own sake — that person is rare. [13][14] |
| `thrift-hunter` | Persona 4 (Jordan), shading into Persona 1/2 | "Spotting a steal" and "finding my next bag" are **one shopping act** [9][12] — `thrift-hunter` vs a (notional) "shopper" bucket is the same behavior at different price sensitivity. |
| `first-purchase` | Persona 2 (Sofia) | The one bucket that maps cleanly — but as a *stage*, which the flat list can't express. |

**Net:** the old model commits all three errors the founder flagged — it splits one cluster (flip+authenticate), splits one act (next-bag vs. steal), and flattens one timeline (collecting as a peer box). And it forces a **single mutually-exclusive choice**, which is wrong because the real personas *share motivations* and *move along a timeline*.

### Recommendation — what onboarding should capture instead

**Top 3 recommendations (in priority order):**

1. **Replace the single forced-choice radio with a multi-select of *motivations* (Axis B), not personas.** Ask "What brings you here? (pick all that apply)" over the real verbs: *Carry/find a bag I'll love · See what bags are worth · Tell real from fake · Buy to resell · Track a collection I own.* This lets flip+authenticate co-select (revealing Jordan), lets carry+value co-select (revealing Sofia), and never forces a beginner to claim "collector." It mirrors the multi-motivation reality instead of fighting it.

2. **Infer maturity (Axis A) from behavior, don't ask it.** Don't make her self-declare "appreciator vs collector" — it's awkward and people misjudge their own stage. Derive it from closet state and events: `want`-only → appreciate/aspire; first `have` + buy-click → first purchase; multiple priced `have` + repeat value views → collector; any `had` + sell-clicks → reseller signal. This is the founder's own pattern (instrument, let usage decide) and makes the persona *self-correcting* as the user matures.

3. **Make onboarding light and reversible; let the quiz + first sessions do the real profiling.** Onboarding should capture username + display name + the motivation multi-select (and nothing heavier), because the **taste quiz and early behavior** carry far more signal than a single dropdown — and the quiz is already the never-gatekept growth loop. Keep "change any time," and have the homepage picker and onboarding share *one* model so they stop disagreeing.

**Concretely, the change set (for a later build session, not done here):**
- `src/lib/profile-actions.ts`: replace the 5-value single `persona` enum with a `motivations text[]` multi-select over the 5 verbs above; keep `persona` derivable (or drop it) and add a behavior-derived `maturity_stage` computed from closet/events rather than stored from a question.
- `src/app/onboarding/page.tsx`: swap the single-radio `PERSONAS` fieldset for a checkbox group of motivations; keep it to one short question.
- `src/components/PersonaRouter.tsx`: it's already motivation-shaped (4 tiles ≈ Axis-B verbs minus resell) — add a resell/sell entry (or fold it into the deals section per existing prefs) so the homepage and onboarding cover the same verb set, and treat tile clicks as motivation signals feeding the same inference.

This keeps onboarding a 30-second, low-friction step (per the founder's auth/onboarding prefs), stops forcing a wrong single identity, and turns persona assignment into something **measured over time** rather than **declared once**.

---

## 5. How well-sourced each section is (evidence strength)

| Section | Evidence strength | Notes |
|---|---|---|
| §1 Method (persona best practice) | **Strong.** | Primary-field sources: NN/g [1][3][6], Cooper [2], Revella [4][5]. Directly confirms behavior-not-demographics and the 3–6 count. |
| §2 Maturity/motivation map | **Medium-strong.** | The *axes* are our synthesis (founder's insight + JTBD); the *clustering corrections* are backed by community evidence [9][12][13][14] and resale-as-gateway data [8][10][11]. |
| Persona 1 Appreciator | **Medium-strong.** | Gen-Z attitudes + social discovery + resale-as-gateway well-sourced [7][8][10][11]; the exact in-app behavior is inferred (validate in PostHog). |
| Persona 2 First-Buyer | **Medium-strong.** | Aspirational trade-down + price escalation + resale value motivation strong [8][11][16][17]; the dual authentication+value anxiety is community-evidenced [9][12] but our framing. |
| Persona 3 Collector | **Strong on the market data, medium on the person.** | Retention figures are hard data [15][16][17]; "thinks like a steward" is reasoned, not surveyed. |
| Persona 4 Reseller/Flipper | **Medium (community-heavy).** | Authentication-as-flip-step and thrift/Coach behavior come from labeled community sentiment [13][14] + circularity tailwind [8]; few hard numbers on flippers specifically. |
| Persona 5 Cross-Shopper overlay | **Reasoned, not separately sourced.** | A behavioral overlay justified by the founder's insight + the compare-and-hand-off model; validate as a session *state* in data. |
| §4 Critique & onboarding rec | **Strong (internally grounded).** | Maps to the real files; the recommendation follows directly from the founder's stated errors + her instrument-then-decide pattern. |

**Where evidence was thin:** anything about *specific in-app behavior* of each persona (necessarily, the app's PostHog history is young) — flagged throughout as "recognize in data" hypotheses to validate. And hard quantitative data on *flippers specifically* is scarce; that persona leans on labeled community sentiment.

---

## 6. Sources

1. Nielsen Norman Group — *Personas: Study Guide / "3 Persona Types"* and persona topic pages. Behavior-over-demographics; "age, location, and job title don't predict behavior." https://www.nngroup.com/topic/personas/ ; https://www.nngroup.com/articles/persona-types/
2. Delve.ai — *The History of Buyer Personas* (Alan Cooper's "Kathy," 1985; Revella's adaptation of UX personas for marketers). https://www.delve.ai/blog/the-history-of-buyer-personas
3. Nielsen Norman Group — *3 Persona Types: Lightweight, Qualitative, and Statistical* (proto/qualitative/statistical; 3–6 personas; "not an exhaustive, scientific taxonomy"). https://www.nngroup.com/articles/persona-types/
4. Adele Revella / Buyer Persona Institute — *Buyer Personas* and the Five Rings of Buying Insight (Priority Initiative, Success Factors, Perceived Barriers, Buyer's Journey, Decision Criteria). Pragmatic Institute: https://www.pragmaticinstitute.com/resources/podcasts/product/the-five-rings-of-buying-insight/
5. *Five Rings of Customer Insight* — Sales & Marketing Management. https://salesandmarketing.com/five-rings-customer-insight/
6. Nielsen Norman Group — *Personas vs. Jobs-to-Be-Done* (compatible/complementary; JTBD inside personas). https://www.nngroup.com/articles/personas-jobs-be-done/
7. Bain & Company / Altagamma — *Luxury Goods Worldwide Market Study* 2024–2025 (Gen-Z selective engagement, lower brand loyalty, authenticity expectations; aspirational trade-down). https://www.bain.com/insights/luxury-in-transition-securing-future-growth/ ; Fortune coverage: https://fortune.com/2025/06/19/luxury-sector-exclusivity-gen-z-bain-co-report/
8. ThredUp — *Resale Report* 2024 & 2025 (secondhand ~$393B / ~10% of apparel; Gen-Z & millennials ~70% of growth to 2030; ~50% discover via social/creators; resale as value + "premium and luxury in one place at up to 90% off"). https://www.thredup.com/resale ; 2025 PDF: https://cf-assets-tup.thredup.com/resale_report/2025/ThredUp_Resale_Report_2025.pdf
9. Reddit r/handbags — *"One luxury bag or 2–3 mid range bags?"* (community sentiment: the carry-vs-value-vs-price tradeoff; "almost no luxury bag holds its value once you resell"). https://www.reddit.com/r/handbags/comments/1irktcm/one_luxury_bag_or_23_mid_range_bags/ ; related: https://www.reddit.com/r/handbags/comments/1guxtfv/one_luxury_bag_or_several_lower_end_bags/
10. Bain & Company — secondhand luxury (~€48B in 2024, +7%, outpacing new) as "a gateway to luxury for aspirational consumers." https://www.bain.com/insights/luxury-in-transition-securing-future-growth/
11. McKinsey & BoF — *The State of Fashion 2025 / 2026* (resale to "explore aspirational brands"; secondhand growing 2–3× firsthand; price-sensitivity and trade-down). https://www.mckinsey.com/industries/retail/our-insights/state-of-fashion ; State of Fashion: Luxury PDF: https://www.mckinsey.com/~/media/mckinsey/industries/retail/our%20insights/state%20of%20luxury/2025/the-state-of-fashion-luxury-vf.pdf
12. Reddit r/handbags — *"Pre-owned luxury handbags — yay or nay?"* and *"For those who own luxury bags, what was your first?"* (community sentiment: first-purchase deliberation; pre-owned chosen for price). https://www.reddit.com/r/handbags/comments/18p5g0e/preowned_luxury_handbags_yay_or_nay_and_what_to/ ; https://www.reddit.com/r/handbags/comments/17llwbk/for_those_who_own_luxury_bags_what_was_your_first/
13. Reddit r/Flipping & r/VintageFashion — *"I bought a Coach purse… have a professional authenticate it"* and a vintage-Coach authenticity dispute (community sentiment: authentication is a *step in the flip*). https://www.reddit.com/r/Flipping/comments/1uenon/i_bought_a_coach_purse_that_needs_repair/ ; https://www.reddit.com/r/VintageFashion/comments/13jzx5s/
14. Reddit r/VintageCoachRehab — *"I catalogued 650 vintage Coach bag styles"* (community resource flippers use to ID before buying; "I can't authenticate bags — I'm not an expert"). https://www.reddit.com/r/VintageCoachRehab/comments/1fu1exj/
15. The RealReal — *2024 & 2025 Luxury Resale Reports* (most-searched LV/Chanel; classics climbing: Birkin 30 +15%, LV Speedy +13%, Goyard Saint Louis +18%, The Row Margaux +44% YoY). https://www.therealreal.com/resale-report-2025 ; https://www.therealreal.com/resale-report-24
16. Fashionphile — *Ultra-Luxury Resale Report* (most investment-worthy styles; Hermès/Chanel value retention). https://blog.fashionphile.com/2024-resale-report/
17. Rebag — *2025 Clair Report* (Hermès ~138% avg retention; Kelly Mini II 282% of retail; Birkin +92% over 10 years on resale; Chanel flap +80% retail 2019–2024; The Row enters "unicorn" tier). Coverage: https://wwd.com/fashion-news/fashion-scoops/rebag-2025-clair-report-luxury-resale-1238350782/ ; https://fashionista.com/2025/12/rebag-2025-clair-report-luxury-handbags-resale-trends

*Note on labeling: items [9], [12], [13], [14] are Reddit community sentiment (qualitative directional signal), not measured data — labeled as such inline. Items [7], [8], [10], [11], [15], [16], [17] are industry/market reports; [1]–[6] are persona-methodology authorities.*
