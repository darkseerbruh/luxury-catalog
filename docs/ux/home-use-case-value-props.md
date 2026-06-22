# Home page — use-case value props ("What brings you in?")

The home page surfaces the catalog's use cases so a stranger arriving from
search / GEO / social is hooked by **why a feature is for them**, not handed a
flat list of links. This is the `PersonaRouter` section (`src/components/PersonaRouter.tsx`).

## The fix that shipped

- **Two of the old chips both linked to `/identify`** — "Verify it's authentic"
  (the cautious buyer) and "I found one thrifting" (the bargain hunter). Sending
  two list items to the same place is the kind of "listing" that doesn't earn a
  click. They are now **one featured hook** with a combined value prop that speaks
  to both: *"Is it real — and what's it worth?"*
- The remaining three use cases lead with the **payoff** (what you walk away
  with), not a feature description.

## Per-use-case options (pick/swap the angle)

The shipped copy is **Option A** for each. Alternatives are real angles to A/B or
rotate — all stay inside the guardrails (never invent data, no hype superlatives,
estimate-not-appraisal).

### Combined scan — "Is it real, and what's it worth?" → `/identify`
*Serves the authentication-anxious buyer **and** the thrift/estate hunter.*
- **A (shipped) — dual-stakes:** "…a $20 estate-sale find or a five-figure buy,
  one scan tells you if it's genuine and what it actually sells for." Covers both
  audiences in one breath.
- **B — thrill/virality lead:** "Found one in the wild? Snap it and find out in
  seconds if you just scored." Leans into the viral thrift moment; softer for the
  high-stakes buyer.
- **C — trust/anti-fake lead:** "Before you trust a listing or a reseller, scan it
  against the markers and date codes the fakes get wrong." Leans into buyer
  protection; softer for the thrifter.

### Collect & invest → `/#brands`
- **A (shipped) — buy-and-hold confidence:** "Production history, materials, and
  what each piece actually resells for — buy and hold with confidence."
- **B — asset framing:** "Track what you own like a portfolio: what it cost, what
  it's worth now, and which pieces are holding value."
- **C — depth flex:** "The production detail collectors argue about — year,
  hardware, leather, market exclusivity — in one record per bag."

### Buy & resell → `/search`
- **A (shipped) — fair-number:** "Price trends and where to buy — and where to
  sell — so you know a fair number before you spend or list."
- **B — profit/flip lead:** "Spot the spread: what a bag costs across resale
  platforms vs. what it's selling for, before you flip it."
- **C — where-to-sell gap:** "Know the best place — and price — to list what you
  already own." (Note: a dedicated "where to sell" surface is still a backlog gap,
  per `docs/ux/ux-evaluation.md`.)

### My first designer bag → `/quiz`
- **A (shipped) — taste-first onboarding:** "New to this? Find your taste in 60
  seconds, then research the markers, sizes, and prices before you commit."
- **B — anti-regret:** "A first designer bag is a big spend. Learn what lasts,
  what holds value, and what fits your life before you buy."
- **C — quiz hook:** "Not sure where to start? Take the 60-second taste quiz —
  no account needed to see your result." (Mirrors the logged-out quiz banner.)

## Layout notes
- The combined scan is a **featured full-width card** (gold-tinted) because it's
  the viral entry point; the other three sit in a 3-up grid below.
- Mobile-first: single column at 375px, 3-up from `sm`.
- All cards are `next/link` — no client JS, works server-rendered.
