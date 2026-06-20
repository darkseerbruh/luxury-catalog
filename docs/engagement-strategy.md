# Engagement & Social Strategy — Inter-user experience + recommendations

*Created 2026-06-20. Strategy/recommendation doc (not yet built). Grounds every
proposal in the existing schema (`closet_favorite`, `post`, `closet_stats`,
profile trust flags from `0006_social_expert_layer.sql`) and the contributor-tier
ladder in `handoff.md`. North star: **monetization is the end goal; engagement is
the flywheel that drives it.***

---

## 0. The one frame that decides everything

Luxury Catalog is **not** a social network. It's an authoritative reference
database (IMDb / Fragrantica for bags) with commerce intent. That positioning is
the moat vs. PurseForum — "trustworthy, structured, searchable" instead of
"chaotic, gatekept, unreliable." Every social feature must be judged against one
question:

> Does this *strengthen the authority/trust* and *drive return visits*, without
> importing the PurseForum chaos (free-form posting, moderation load, gatekeeping,
> off-platform leakage) that we exist to replace?

The engagement→monetization chain we are optimizing:

```
 social/UGC features → return visits & session depth → affiliate clicks (Rev #1)
                     → UGC (photos/reviews/corrections) → deeper data → SEO/GEO → traffic → affiliate
                     → public expert/authenticator profiles → Authentication Marketplace (Rev #2)
                     → taste data + watchlists → Premium price/alert tools (Rev #3)
                     → shareable closets & taste profiles → viral acquisition (top of funnel)
```

If a proposed feature doesn't land on one of those arrows, it's a distraction.

---

## 1. Inter-user experience — what to build, what to skip

### The verdict table (read this first)

| Feature | Verdict | Why |
|---|---|---|
| **Activity feed** (structured events from closets you follow) | **BUILD — highest priority** | The Goodreads "updates" mechanic, done with zero free text → near-zero moderation. Drives return visits + discovery + affiliate. |
| **Follow / favorite a closet** (`closet_favorite` exists) | **BUILD** | Powers the feed, the "coveted closets" leaderboard, and a collaborative-rec signal. Already in schema. |
| **Public profiles as status objects** (badges, tiers, verified) | **BUILD** | Profiles must be worth visiting → that's what makes the leaderboard, follows, and virality pay off. |
| **Leaderboards** (coveted closets, top contributors, top reviewers) | **KEEP & EXPAND** | Your stated goal — get people posting. Tie XP to value-producing UGC, not vanity. |
| **Expert editorial posts** (`post` table, gated by `is_expert`) | **BUILD (asymmetric)** | Doubles as named-author GEO/SEO content (E-E-A-T). Only verified/expert can publish long-form. |
| **Link social accounts on profile** (IG/TikTok/YouTube/Poshmark/Substack) | **BUILD (with guardrails)** | Credibility + cross-platform virality + lets real resellers/authenticators bring an audience. Guardrails below. |
| **"Verified owner" badge on reviews** (derive from `have`/`had`) | **BUILD** | Cheap, huge trust signal, differentiates from PurseForum opinions. |
| **Structured corrections / "suggest an edit"** | **BUILD** | This is how the database improves (data strategy #5) — structured, not free-form. |
| **Open 1:1 direct messages (DMs)** | **DON'T (defer)** | Moderation + **luxury-resale fraud liability** ("I'll sell you this Birkin"), spam, off-platform leakage. Zero monetization. Goodreads barely has DMs. |
| **Free-form public posting / status updates by all users** | **DON'T** | This *is* PurseForum chaos — the exact thing we replace. Channel users into structured UGC instead. |
| **General comment threads on everything** | **DON'T (defer)** | Moderation tax. Replace with structured reviews + corrections + (later) Q&A on bag pages. |
| **Real-time chat / live shopping / "likes" with no downstream** | **DON'T** | Overkill for a reference DB; vanity metrics with no monetization arrow. |

### 1a. Can they message each other? — **No open DMs. Defer; then make it transactional.**

Open DMs are the single worst fit for this product:
- **Fraud liability.** Luxury resale DMs are a notorious scam vector ("I have a deal for you, pay me off-platform"). Hosting that on "the most authoritative bag site" is reputational and legal risk.
- **Moderation cost** with no revenue to offset it.
- **Leakage** — DMs are where deals leave your affiliate/marketplace rails.

The *only* messaging worth building is **structured and monetized**: the
Authentication Marketplace inquiry thread (buyer → verified authenticator: photos +
question → quote → paid statement). That's a transaction with a take-rate, not a
social feature. Build it when the marketplace is built, not before.

### 1b. Can they post, and where? Is there a feed? — **Asymmetric posting + a structured activity feed.**

Two different things people mean by "post":

1. **Long-form editorial** — already modeled by the `post` table, gated behind
   `is_expert`. **Keep it asymmetric**: only verified experts/authenticators
   publish articles. This protects authority *and* every post is named-author,
   fact-dense, citable → it doubles as GEO content (the #1 marketing channel).
   Regular users do **not** get a free-text megaphone.

2. **The activity feed (the Goodreads element you're describing) — build this.**
   A read-only feed of **structured events** from closets you favorite:
   - "@arielle added the **LV Neverfull** to her closet"
   - "@collector reviewed the **GG Marmont** ★★★★☆"
   - "@flipper's watched **Chanel Classic Flap** dropped **12%**"
   - "@expert published *How to date a Speedy by its date code*"
   - "@curator's photo of a **rare green ostrich Peekaboo** was featured"

   Every line is derived from data we already have (`closet_item`, `review`,
   `watchlist`/`notification`, `post`, `bag_photo`). **No free text = no moderation
   queue.** High signal, addictive ("what did my people add today?"), and every
   item links to a bag page with where-to-buy. This is the highest-leverage social
   feature on the roadmap. Surface it on the home page (replacing/augmenting the
   current static closet strip) for logged-in users, and as a `/feed` route.

### 1c. Can you see when a friend adds a new bag (Goodreads)? — **Yes, that's the feed above.**

`closet_favorite` is already the follow graph. The feed = recent structured events
of the users you favorite. Note the privacy rule baked into `0006`: public closets
expose only `have` items; `want`/`had` stay private. So a clean default is: the
feed surfaces **`have` additions, reviews, published posts, and featured photos**
of people you follow (the things they've chosen to make public), plus *your own*
private signals (your watchlist drops) which only you see.

### 1d. What's the point of favoriting someone's closet? — **Make it mean five things.**

Right now in the schema it only feeds the "coveted closets" rank. Give it real
payload so it's worth doing:

1. **Subscribe to their taste** — their adds/reviews show up in your feed (Goodreads "follow a reviewer").
2. **Social proof → status** — favorites rank the "Most Coveted Closets" leaderboard (`closet_stats.favorite_count`), which makes those users post more.
3. **Discovery** — a curated closet is a taste collection; following a taste-maker is how you find bags you'd never have searched (Pinterest-board logic).
4. **A recommendation signal** — "people who favorite closets like this also want…" (collaborative filtering input, see §2).
5. **A monetization surface** — every bag in a coveted closet deep-links to where-to-buy (affiliate). Top closets become micro-influencers → later, creator revenue share.

### 1e. The leaderboard — **keep it, and make it the posting engine.**

You're right to love it. It's the cheapest, most durable engagement driver, and it
directly serves your goal (get people posting reviews & pics). Design notes:

- **Reward value-producing behavior, not vanity.** Tie XP to the contributor ladder
  already spec'd (Aficionado → Collector → Connoisseur → Authenticator → Curator):
  approved photos (rarer bag = more), reviews, accepted corrections, closet breadth.
  Removals/flags cost points. This is the StackOverflow-reputation / Duolingo-XP
  pattern — and it's the *recruiting + credentialing pipeline for the Authenticator
  Marketplace* (Rev #2).
- **Run a few focused boards, not one:**
  - **Most Coveted Closets** (taste/status — already computable from `closet_stats`)
  - **Top Contributors** (photos + data — feeds the photo system)
  - **Top Reviewers** (review count × helpfulness)
- **Seasonal resets / "this month" boards** keep it winnable for newcomers (avoids
  the entrenched-old-timers problem that makes PurseForum hostile to newbies).

### 1f. Profiles worth checking out + linking socials — **yes, with guardrails.**

A profile is the **status object** the whole social layer pays off into. Make it
worth visiting:
- Tier badge + trust badges (verified / expert / authenticator — admin-granted only).
- Curated public closet (`have` items), reviews written, photos contributed, stats.
- **Linked socials** (IG / TikTok / YouTube / Poshmark / Substack).

On linking socials specifically:
- **Pro:** credibility, cross-platform virality, lets real resellers & authenticators
  bring their audience, near-zero build cost.
- **Con:** outbound leakage; unverifiable claims (anyone can paste a handle); risk of
  profiles becoming lead-gen for off-platform selling that bypasses your rails.
- **Recommendation — do it, but:**
  1. `rel="nofollow ugc"`, display-only, no auto-embeds.
  2. Reserve a **"verified link"** treatment for trust-flagged accounts only.
  3. Keep the **primary CTA on-platform** (Favorite closet / View reviews), socials secondary.
  4. For experts/authenticators, socials are part of the **credential**, which is the
     point — it's how an outside authenticator proves they're real before the
     marketplace exists.

### 1g. Best-practice scan — what engagement sites get right, and how much applies here

From the 2025 social-commerce + community research (sources below): communities lift
retention ~50% and UGC lifts conversion ~10–20% — but the wins come from
**member-to-member relationships and UGC**, not brand broadcasting. Translated to our
constraints:

- **Adopt:** structured activity feed, follow graph, gamified UGC leaderboards,
  status profiles, social proof everywhere ("12 collectors have this," verified-owner
  reviews), streaks/progress on contribution, and **re-engagement notifications**
  (we already have price alerts — add "new activity from closets you follow" and
  "your photo was featured"). These are proven and cheap.
- **Adapt:** "creator monetization" → our version is the contributor ladder feeding
  the Authenticator Marketplace + top-closet affiliate revenue share, not TikTok-style
  storefronts.
- **Reject (for now):** livestream/live-shopping, in-app checkout (we're affiliate-out,
  not a marketplace of goods), open DMs, free-form feeds. Right for Shopify brands,
  wrong for an authority reference DB.

---

## 2. "Bags you might like" + "Find your taste" + the brain-mapping idea

### 2a. The cold-start problem (the blank profile you flagged)

A new user has no closet, no history → nothing to recommend from. This is the
classic cold-start problem. Two engines solve it, and they reinforce each other:

### 2b. Engine A — "Find your taste" quiz *(build first; cheap, viral, solves cold start)*

**Why it's high-ROI:** ~65% of people who start a quiz finish it; quizzes are the
standard cold-start fix in fashion/DTC; and it produces a **shareable artifact** that
populates the blank profile *and* drives acquisition.

**What powers it — your unfair advantage:** the catalog already structures the exact
attributes a taste quiz needs. The home page already slices by **fit** (phone /
tablet / laptop) and **carry method** (shoulder / crossbody / top-handle / belt /
clutch / backpack / luggage). Add the other structured dimensions you already hold:
silhouette (structured vs. slouchy), size, **hardware color (gold/silver/ruthenium)**,
material/leather, color palette, formality, price band, brand affinity — plus the
**persona** you *already capture at onboarding* (collector / flipper / first-purchase),
which encodes investment-vs-wear intent.

**Mechanic:** fast visual either/or ("this or that") swipes — Tinder-for-bags. ~10–15
taps. Output a named **taste profile**: e.g. *"Structured Minimalist — top-handle, gold
hardware, neutral palette, investment-grade."* Shareable card = viral loop +
instant non-empty profile.

### 2c. Engine B — "Bags you might like" *(content-based first, collaborative later)*

You do **not** need an ML platform to start. The catalog's clean structured
attributes are exactly what most recommenders wish they had.

1. **Content-based (cold start, day one):** represent each bag as an attribute vector
   and each user as a taste vector (from quiz + closet + watchlist). Cosine similarity
   → ranked recommendations. **Deterministic and explainable** ("Recommended because
   you like top-handle + gold hardware") — and it honors the **never-invent** rule,
   because it only ever reasons over real catalogued attributes.
2. **Collaborative (as data accrues):** item-item co-occurrence — *"collectors who
   `have` this also `want` that."* You already compute exactly this shape in
   `closet_stats` (want-demand against `have`). Cheap, powerful, no ML infra.
3. **Hybrid:** content-based for new users → blend in collaborative as the closet graph
   fills. This is the documented Zalando/cold-start pattern.
4. **LLM layer (optional polish):** you already run Anthropic for NL search — reuse it
   to phrase *explanations* and do soft re-ranking. **Keep facts deterministic**: the
   LLM never sources attributes, it only narrates over real data.

**Signals that feed the taste vector over time:** quiz answers → closet (want/have/had)
→ watchlist → reviews → searches (`search_performed` is already logged) → bag views
(`variant_viewed` in PostHog) → favorited closets.

### 2d. The brain-mapping idea — what's actually addictive, and how to borrow it

What makes EyeWire-style brain mapping addictive isn't neuroscience — it's four
mechanics: **(1) you build something visible** (your contribution materializes in
front of you), **(2) visible progress toward completion**, **(3) points / ranks /
teams / leaderboards**, **(4) mastery & discovery.** Your instinct — *"the more we
understand them, the better we recommend continued engagement"* — is exactly right.
Here's the buildable translation:

**Make it a "Taste Map."** Two layers:

- **Personal Taste Map (self-knowledge → the hook).** A visual map of *your* taste —
  silhouettes, brands, eras, palettes, hardware you gravitate to — that **fills in as
  you interact.** Every quiz swipe, closet add, review, or save *lights up a region*
  of your map. Show a **completeness meter**: *"Your taste is 60% mapped — answer 5
  more to sharpen your recommendations."* The incompleteness is the engine (Zeigarnik
  effect), and — critically — **every answer visibly improves the recs**, which is the
  honest, non-dark-pattern version of the addictiveness you noticed. It's the "find
  your taste" quiz turned into an ongoing, never-quite-finished progress system.

- **Collective Taste Graph (the data moat).** Every user's taste contributions, in
  aggregate, map the *taste-space* of luxury bags: which bags cluster, what "goes
  with" what, what collectors of X gravitate to. This is genuinely defensible data no
  competitor has — and it's the citizen-science analogy made literal: **many small
  contributions build a map nobody could build alone**, and it powers everyone's
  recommendations. It also generates editorial/GEO gold ("The most coveted bags of
  2026," "What Neverfull owners buy next").

**Honesty caveat (so we don't oversell internally):** this is a **taste-graph /
embedding** concept wearing a great metaphor — not literal brain mapping. The
defensible, *buildable-now* version is: structured attribute vectors + closet
co-occurrence + quiz signals → a recommender + a gamified self-knowledge UI, all on
the current Supabase stack with no ML infra. It grows into real learned embeddings
later, once there's behavioral volume. Use the metaphor for product/marketing; build
the simple, explainable engine underneath.

### 2e. How this pays off (monetization)

- Better recs → more relevant where-to-buy clicks → **affiliate (Rev #1)**.
- Taste profile → targeted alerts ("a bag matching your taste just dropped") →
  **Premium tools hook (Rev #3)**.
- Shareable taste profiles & taste maps → **viral acquisition**.
- Aggregate taste graph → editorial/GEO content → **SEO traffic → affiliate**.
- A rich, mapped profile is a profile worth checking out → feeds the entire §1 social
  loop.

### 2f. Recommendation

- **BUILD the taste quiz first** — cheapest path to a non-empty profile, viral, reuses
  the fit/carry/hardware taxonomy you already ship.
- **BUILD content-based "bags you might like"** on existing attributes — explainable,
  honors never-invent, no ML needed.
- **LAYER collaborative** ("collectors also wanted") once closet data accumulates —
  the `closet_stats` query is already the right shape.
- **ADOPT the "Taste Map" framing** as the connective product metaphor — it's the
  engagement hook, the data moat, and the recommendation fuel in one, and it's the
  through-line from engagement to monetization.
- **DON'T build ML/embedding infrastructure yet.** The clean structured catalog is the
  unfair advantage; spend it before reaching for models.

---

## 3. Suggested build order (engagement track)

> **Build status (branch `claude/lucid-archimedes-1cyi21`):** steps **1–7 BUILT**
> (compile/build verified, not runtime-tested; migration 0007 human-gated). Step 8
> (authenticator inquiry threads) intentionally deferred to the marketplace. See
> `docs/handoff.md` → "engagement / social + recommendations track" for the file map.


1. **Social UI on the existing `0006` schema** — `/u/[handle]` public profile +
   curated closet, "Most Coveted Closets" leaderboard (`closet_stats`),
   verified-owner badge on reviews, social links on profile. *(Schema is ready; this
   is pure UI.)*
2. **Activity feed** — `/feed` + logged-in home strip from structured events of
   followed closets. *(Highest engagement ROI; near-zero moderation.)*
3. **Find-your-taste quiz** → writes a taste vector to `profile`; outputs a shareable
   card; populates the blank profile.
4. **"Bags you might like"** — content-based recs on the taste vector, surfaced on
   home, profile, and bag pages.
5. **Taste Map UI + completeness meter** — wrap the quiz/closet/recs into the
   brain-map progress experience.
6. **Re-engagement notifications** — extend the existing notification system to "new
   activity from closets you follow" / "your photo was featured."
7. **Collaborative recs + collective taste graph** — once closet volume supports it.
8. **(Later, gated to marketplace)** structured authenticator inquiry threads — the
   *only* messaging worth building.

The photo-contribution + contributor-tier system (already spec'd in `handoff.md`)
slots in alongside #1–#2: it's the UGC engine the leaderboards reward.

---

## Sources
- [Sprinklr — Social Commerce best practices 2025](https://www.sprinklr.com/blog/social-commerce/)
- [Sprout Social — Social Commerce trends & best practices](https://sproutsocial.com/insights/social-commerce/)
- [Shopify — Social commerce strategy (2025)](https://www.shopify.com/enterprise/blog/social-commerce-strategy)
- [Ecommerce Fastlane — Why every DTC brand should add an ecommerce quiz](https://ecommercefastlane.com/dtc-ecommerce-quiz-personalization/)
- [Recharge / Octane AI — The power of personalization: ecommerce quizzes](https://getrecharge.com/blog/ecommerce-quizzes-with-octane-ai-2/)
- [Bloomreach — Ecommerce personalization strategies](https://www.bloomreach.com/en/blog/ecommerce-personalization)
- [Cold-start recommendation by personalized embedding region elicitation (arXiv)](https://arxiv.org/pdf/2406.00973)
- [Addressing the cold-start problem in outfit recommendation via visual preference modelling (arXiv)](https://arxiv.org/pdf/2008.01437)
- [EyeWire — gamified brain mapping (citizen science)](https://blog.eyewire.org/play-eyewire-and-contribute-to-neuroscience-research-at-mit/)
- [SciStarter — the brain-mapping games](https://blog.scistarter.org/2013/03/the-eyewire-games/)
</content>
</invoke>
