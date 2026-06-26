# Content gating strategy — what shows only once we have users

*Created 2026-06-26. Why this exists: a reference site with community features
looks like a ghost town before it has a community. Empty leaderboards, a "most
coveted" list of one bag, and "what the community knows" with nothing behind it
all read as broken, and faking them with sample data breaks the never-invent
rule. So we GATE: anything powered by user input stays hidden until there is
enough real signal, then reveals itself automatically as the data arrives.*

> **Engagement/monetization lens:** this protects first-impression trust (a
> credible reference earns the return visit and the affiliate click) and avoids
> teaching new visitors that our social proof is empty. It does not move a metric
> on its own; it stops a negative (a hollow homepage) from suppressing the
> metrics the populated sections will later move (return rate, want-signal,
> outbound clicks). The reveal itself becomes an engagement event worth
> instrumenting once thresholds are near.

---

## The principle (one line)

**Show a community surface only when it has enough real input to be good. Never
fabricate to fill it. Reveal automatically, never by hand.**

## Three ways to handle an under-filled surface

Pick one per surface. Most community surfaces use **Hard gate**; contribution
surfaces use **Invite**; decorative ones use **Fallback**.

| Mode | What the visitor sees | Use it when | Example |
|---|---|---|---|
| **Hard gate** | Nothing. The section is omitted until the threshold is met. | An empty or near-empty version looks broken or misleads (a ranking of one). | Most coveted bags, "what the community knows" leaderboards |
| **Invite** | An empty state that asks for the first contribution. | The emptiness is the call to action, and one contribution genuinely helps. | "Rate a bag you've carried," "Have a photo of this rare find?" |
| **Fallback** | An illustrative, clearly-not-real visual. | The element is decorative and never asserts a number. | The homepage goal tiles' icon visuals |

The rule that keeps these honest: **Fallback visuals never show a figure.** The
moment a real number would appear (a price, a count, a rank), it's Hard gate or
Invite, never a made-up sample.

## The reveal ladder (auto-reveals as the user base grows)

Each surface flips on by itself the moment its count clears the threshold. No
deploy, no manual switch. Thresholds live in one place: `GATE_THRESHOLDS` in
`src/lib/content-gates.ts`. Start conservative; raise a threshold if a surface
turns on but still feels thin.

| Surface | Powered by (user input we don't have yet) | Gate (threshold) | Mode | Status today |
|---|---|---|---|---|
| **Most coveted bags** (`/coveted`, nav "Coveted", footer link) | "want" marks across closets | ≥ 25 total `want` rows | Hard gate | Hidden |
| **What the community knows** (homepage review leaderboards) | reviews + ratings | ≥ 25 total reviews | Hard gate | Hidden |
| **Most durable / Highest rated / Most worth it / By occasion** boards | per-axis ratings | enough rated bags per board (board renders only when it has rows) + the section gate above | Hard gate | Hidden |
| **Best value retention** board | resale median vs retail | needs price data (not user input) | Hard gate via "enough rows" | Shows when price data lands |
| **Coveted closets** (`/coveted-closets`) | public closets + closet favorites | ≥ N public closets with want-demand (to add) | Hard gate | To wire |
| **Verified-owner badge** on reviews | reviewer has the bag in `have`/`had` | per-review (badge appears only when true) | Invite-adjacent | Per-review |
| **Activity feed** (homepage + `/feed`) | derived events (saves, reviews, finds) | user-gated + empty state | Invite | Empty state |
| **Recommendations** | interaction history (collaborative) | content-based works now; collaborative gates on interaction volume (to add) | Fallback → real | Content-based |
| **UGC photo galleries** (bag pages) | submitted, approved photos | per-bag (gallery shows only approved photos) + "rare find" empty state | Invite | Per-bag |
| **Most Wanted Photos** board | want-signal on no-photo bags | ≥ N no-photo bags with want-signal (to add) | Hard gate | To wire |
| **Contributor tiers / XP leaderboard** | approved contributions | ≥ N contributors past Aficionado (to add) | Hard gate | To wire |
| **Collective Taste Map** | many users' taste profiles | ≥ N profiles with signal (to add) | Hard gate | To wire |
| **Newsletter "price drops this week"** | watchlists + price history | ≥ N watched bags with a recent drop (to add) | Hard gate | To wire |

"To add" = the gate is defined in strategy here but not yet wired in code. The
two live gates today are `covetedBagsReady()` and `communityKnowledgeReady()`.

## What is "informed by user input we don't have yet" — the full list

Everything that needs *people doing things* before it's true:

1. **Want-signal** — who marked which bag "want." Drives: most coveted bags,
   most coveted closets, Most Wanted Photos, demand-aware recommendations.
2. **Reviews + ratings** — durability, comfort, worth-it, occasion tags. Drives:
   every review leaderboard, verified-owner badges, review-fed search facets, the
   "what the community knows" section.
3. **Closet contents** (`have` / `had`) — what people own or owned. Drives:
   collective value stats, verified-owner badges, "people who own this also own."
4. **Public closets + favorites** — opt-in shared collections and follows.
   Drives: coveted closets ranking, social activity, expert closets.
5. **Submitted photos** — UGC reference shots. Drives: bag-page galleries, the
   licensed-image base layer, Most Wanted Photos, contributor tiers.
6. **Contributions + corrections** — approved photos, accepted edits, knowledge.
   Drives: contributor tiers, XP leaderboards, the Authenticator pipeline.
7. **Interaction history** — views, saves, click-throughs. Drives: collaborative
   recommendations, "trending" (only if we ever decide to show popularity), the
   Taste Map's collective layer.
8. **Demand intent** — fake-door "notify me" taps (Authenticator Marketplace,
   camera tool). Drives: the warm launch list and the gate that flips those
   features from a door to the real flow once backing exists.

Two of these are NOT user input and so are gated on content volume, not people:
**price/listing data** (best deals, value-retention board) and **catalog depth**
(brand "top styles"). They follow the same "show only when populated" rule.

## What we deliberately DON'T gate into existence

- **Popularity claims.** With no view data we never call anything "popular" or
  "trending." Brand "top styles" stay framed as *most documented*, not most
  loved (locked preference). A popularity surface waits for real interaction
  data and honest framing.
- **Fabricated counts.** No "join 10,000 collectors," no sample portfolio totals,
  no placeholder rankings. A smaller true number beats a bigger invented one.

## How it works in code

- `src/lib/content-gates.ts` — one async function per gate, each reads a real
  count and compares to `GATE_THRESHOLDS`. Resilient by contract: any missing
  env / table / column / error returns a count of 0, so the gate reads false and
  the surface stays hidden (same pattern as the rest of the homepage data layer).
- Callers: the homepage gates `<CommunityLeaderboards />`; the layout passes
  `covetedReady` to the header nav and gates the footer "Most coveted bags" link.
- Adding a gate: add a threshold to `GATE_THRESHOLDS`, write a `xReady()`
  function, and wrap the section in `{xReady && <Section />}`. Wire the same
  boolean anywhere the surface is linked (nav, footer) so it never half-shows.

## Maintenance

When a new community feature ships, add its row to the reveal ladder above and
decide its mode before launch, so it never goes live as a ghost town. Revisit
thresholds after the first real traffic: the goal is "turns on the moment it
looks credible," not "turns on the moment it's technically non-empty."
