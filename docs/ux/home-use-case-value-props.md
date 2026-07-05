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

## Style-read module visual — the example deck (owner pick 2026-07-05)

The quiz callout was words-only; the owner asked for a visual. Three directions
were mocked (inline first question / example result card / taste-map mosaic);
she picked the **example result card**, with the condition that it read as
**one of many possible outcomes**.

**Shipped (StyleReadCallout.tsx):** a fanned card deck beside the copy. Three
example reads crossfade on a 12s CSS-only loop (no JS, static-page safe,
`prefers-reduced-motion` shows one card, no motion). Multiplicity is carried
three ways: the fanned stack, the rotation, and the frame copy ("A few of the
reads we hand out" / "Yours is built from your answers, in your words.").

**Honesty rule:** every read shown is a VERBATIM `tasteIdentity()` output on a
plausible answer set, never a hand-written sample. Regenerate after vocabulary
changes with:

```ts
import { tasteIdentity } from "@/lib/taste-identity";
tasteIdentity({ vibe: { structured: "love", sporty: "not" }, logo: "quiet",
  hardware: { gold: "love" }, finishes: { "smooth-leather": "love" } });
// repeat for a glam+loud and an edgy+gunmetal set; copy outputs verbatim.
```

**Alternates considered (swappable later):**
- **Inline first question** — the real "What do you carry a bag for?" chips in
  the module, ending in Continue. Strong "tiles SHOW value" fit; revisit if the
  deck underperforms on quiz_started.
- **Taste-map mosaic** — Love/fine/no marks filling a vibe grid. Ties to the
  Taste Map concept; needs a non-fabricated progress treatment (content-gating
  rule: never assert fake progress).
