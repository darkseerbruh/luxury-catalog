# Where to Buy — trust hub spec

*Owner-greenlit 2026-07-09 (chat: eBay scoping → trust hub). Sister feature to `/rankings`
(2026-07-08): same pattern — a data-backed destination page + per-object pages, GEO-first.*

## What it is

One place that answers "where should I buy a preloved bag, and what actually protects me
there?" — the queries behind it ("is ebay legit for bags", "is the real real authentic",
"julia rose boston reviews") are high-intent purchase-anxiety moments no one currently
answers with sourced facts.

**Positioning (locked in chat):** we don't judge, we equip. The hub never says "don't buy
there." It shows what each venue's programs do and don't cover (facts, dated), our take
(explicitly an opinion), and — the signature section — **how to close each gap yourself**
if you're buying there anyway.

## Metrics it moves

- **GEO/SEO capture**: each venue profile page is the direct answer to an "is X legit"
  query; ItemList/FAQ JSON-LD + sitemap like `/rankings`.
- **Affiliate click-through**: protected venues link out attributed (eBay Partner Network
  is live today; TRR/Rebag/CJ pending). Trust context raises willingness to click Buy.
- **Habit loop**: every remedy links internal (markers articles, `/identify`, the bag
  page's median). Strategic line: *check Luxury Catalog before you buy anywhere.*

## Surfaces

1. **`/where-to-buy`** — the hub.
   - **Protection matrix**: venues × protections, ✓ / ✗ / threshold chips.
   - **Price-aware toggle (signature move)**: a price input flips threshold-gated cells —
     at $300, eBay/Poshmark authentication shows ✗ ("physical check starts at $500");
     at $800 it shows ✓. Nobody else surfaces this.
   - Venue cards grouped by category: Consignors (they hold the item) · Marketplaces
     (a stranger ships it) · Rental/membership · Person-to-person (FB Marketplace,
     Instagram/indie dealers).
   - "Our take" tier per venue, framed as informed opinion, never a verdict.
2. **`/where-to-buy/[slug]`** — one profile page per venue.
   - Fact table: every claim with its **source link + date checked**.
   - Track record on public record: BBB rating/complaint themes, documented events —
     reported as dated facts, never characterized.
   - **"Buying here anyway?"** — the gap-to-remedy section, assembled from that venue's
     ✗ cells (FB Marketplace gets the fullest; Fashionphile nearly none).
3. **Bag-page tie-in**: `WhereToBuy.tsx` module links each listed platform's name to its
   profile page (small change; module already exists).

## Data model (pure lib, no IO — the `platforms.ts` pattern)

`src/lib/where-to-buy.ts` — extends (does not replace) `PLATFORMS`; `estimateLandedCost`
stays the cost source of truth.

```
VenueProfile {
  key, label, category: consignor|marketplace|rental|p2p
  authentication: { type: physical|photo|none, thresholdUsd?, note, fact }
  returns:        { windowDays|null, detail, fact }
  paymentProtection: { covered, detail, fact }   // incl. the meetup/local-pickup gap
  fakeRemedy:     { detail, fact }               // what happens if it's fake
  trackRecord:    Fact[]                         // BBB, documented events
  ourTake:        { tier, blurb }                // opinion-framed
}
Fact { claim, sourceUrl, checkedAt }             // EVERY factual cell carries both
```

**Sourcing bar (non-negotiable):** a cell renders only with `sourceUrl + checkedAt`;
unverified = renders "not yet verified", never a guess. Freshness: monthly re-verify
sweep alongside the price re-capture cadence.

**Gap-to-remedy library** — `remedies` keyed by gap, composed per venue from its ✗ cells:

| Gap | Remedy beats |
|---|---|
| No authentication | third-party photo authentication before paying ($10–50 services); our markers article for the style; possession proof (handwritten-note photo); reverse-image-search the listing |
| No payment protection | rails with documented protection (PayPal G&S 180-day, credit-card chargeback) vs rails with none (Zelle/Venmo F&F/wire); in-person = inspect first, public place |
| No returns | terms in writing before paying; condition photo checklist; film the unboxing |
| Unknown seller | history elsewhere; name + "reviews"/BBB search; live video walkthrough |
| (always) Price-reality check | the bag page's live median with n + date; "well below the going rate" = the strongest marker to slow down on — our data, our differentiator |

## Launch venue set (v1)

Verified this session (2026-07-09, each venue's own published policy):
eBay (AG physical ≥$500 US/AU/JP; pre-delivery inspection) · Poshmark (Posh Authenticate
physical ≥$500) · Mercari (optional $5 photo-review via Real Authentication; nothing
automatic). Carried from `platforms.ts` (re-verify + date-stamp at build): Fashionphile ·
The RealReal · Vestiaire · The Luxury Closet. New at build (verify then include): Rebag ·
Facebook Marketplace (Purchase Protection covers checkout-shipped only, NOT local pickup —
verify exact scope) · Instagram/indie dealers as a *category* page with the
questions-to-ask checklist (named indies like Julia Rose Boston only with on-record facts).

## Voice + compliance

Full `docs/voice-and-tone.md` gate. No em dashes. No walls (≥5 sentences never ship);
beats + non-logo iconography (check/x/shield/receipt glyphs). Canonical hedges:
recommendations = "our take"; authentication = markers/programs, never "authentic";
track record = "on record as of <date>". Tier labels are opinion-framed by construction.

## Copy skeleton (voice-gated at build)

- Hub H1: "Where to buy, honestly." Sub: "What each place actually protects, at your
  price. No judgment, just the receipts."
- Tier labels (our take): **Protected** · **Know the gaps** · **You're on your own**.
- Remedy section H2: "Buying here anyway?" Sub: "Fair. Here's how to cover the gaps
  yourself."

## Build order

1. `where-to-buy.ts` + remedy library + tests (pure, follows `platforms.ts` conventions).
2. Hub page (matrix + price toggle + cards) — server-rendered, URL-driven price param.
3. Profile template + venue pages; JSON-LD (FAQ per profile, ItemList on hub) + sitemap.
4. `WhereToBuy.tsx` platform-name links.
5. Later (not v1): where-to-SELL sister section (consignor payout terms); authentication-
   service referral partnerships; named-indie profiles beyond the category checklist.
