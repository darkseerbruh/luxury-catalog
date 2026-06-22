# Owner preferences & decisions — read at the start of every session

*For the owner of Luxury Catalog (Arielle). Complements `docs/handoff.md` (project state). This file = how she likes to work + decisions she's locked. Keep it updated as you learn more; confirm new preferences before treating them as standing rules.*

## Who she is
- **Arielle Coambes** — founder/owner of **Luxury Catalog LLC**. Product owner, **not an engineer**.
- Thinks like a founder: evaluates ideas by **engagement, virality, monetization, and strategic fit**, not just whether they work.

## How she likes to work with you (interaction style)
- **Explain technical/infra things in plain language** — minimal jargon, use analogies. Git/branches/deploys confuse her; **you handle that for her** and keep explanations simple.
- **Always lead with a clear recommendation** and mark it "(Recommended)". She usually takes the recommended option.
- **Confirm before anything destructive or irreversible** (overwrites, force-push, deletes). She values being stopped before a mistake — and you once correctly caught a stale-`main` near-overwrite for her.
- **Back "done"/"pushed" claims with evidence.** She often asks "is it really pushed / on main?" — show the proof (git output), don't just assert.
- **She's scope-ambitious** — when offered options she frequently picks **"all of these."** Build broadly, but keep the build green (`tsc`/`eslint`/`next build`) and clearly document any steps she has to do herself (migrations, env, seeds).
- She **starts new chats often to save context/tokens** — so keep `main` the single source of truth and push there at the end of every session.
- She responds well to **enthusiastic, organized replies that end with a clear question or next step.** Tables and short sections land well.
- She enjoys **creative/strategic brainstorming** and will push you to "consider any possible creative solution" — go wide, then recommend.

## Git / workflow (locked)
- **`main` is the single source of truth.** Sync from `main` at session start, merge back to `main` at end (see AGENTS.md "Branch & sync workflow"). Never build off old per-session branches.
- She prefers **automation and guardrails** so she doesn't have to remember process.

## Product decisions she's locked
- **Canonical app = the full catalog lineage** (search/identify/admin/closet/watchlist/reviews/etc.). A separate analytics-prototype lineage was merged in and retired.
- **Images:** realistic photos matter a great deal to her, **but source them — never AI-generate images of real bags** (legal: MetaBirkins/trade dress; integrity: the "never invent" rule). Strategy: **live licensed affiliate/marketplace galleries + consented UGC + first-party photos**; own a permanent base layer, use live listings to fill gaps. Full reasoning in `docs/image-strategy-research.md`.
- **Photo contributions (queued build):** **hybrid moderation** (trusted users auto-publish, new users queued); include **all** engagement mechanics (byline + featured hero, add-a-photo in closet, "Most Wanted Photos" board, contributor badges). Spec in `docs/handoff.md`.
- **Contributor tiers:** she loved flattering, fashion-authority naming that doubles as the **recruiting pipeline for the paid Authenticator Marketplace.** Proposed ladder: **Aficionado → Collector → Connoisseur → Authenticator → Curator** (Authenticator = the trusted/auto-publish tier). Reward quality + verification, never raw volume.

## Brand rules she holds (from the product brief)
- **Never invent** authentication markers/date codes/serials/hardware — leave `null` + `confidence_level: low` if unverifiable.
- **Catalog stays free** — monetize via affiliate + (later) authenticator marketplace + premium *search capability*, never a content paywall.
- **Coach matters** — the viral thrift-store acquisition engine.
- **Mobile-first** — every page works at 375px.

## What she's drawn to
- "Good feels," status, and recognition mechanics for users; gamification **tied to strategy**.
- Elevated, flattering language for a luxury audience.
- Caution + honesty on legal/IP risk; grounding big decisions in research first.

## Current open work
This file deliberately tracks durable *preferences*, not volatile status. For what's
shipped vs. pending right now, read `docs/handoff.md` (it changes session to session).
