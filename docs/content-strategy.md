# Content Strategy — the canonical spine

*Created 2026-06-24. The single source of truth for what we publish and why. Pairs with
`docs/voice-and-tone.md` (how it sounds), `docs/social-content-calendar.md` (where it
runs), `docs/data-collection-handoff.md` §11 (affiliate plumbing), and the content
gap map in `docs/handoff.md`.*

## The strategy in one line
**Be the trusted reference at each buying decision, then hand off to the commissionable
action.** Content earns the trust and the search traffic; the post→bag **money-moment CTA
block** (`src/app/posts/[slug]/PostBagCTA.tsx`) converts it into a buy / sell / rent
referral, weighted to the seller side.

## What we're going for, and why
- **Decision-moment reference.** Readers arrive *mid-decision*: "is it real / what's it
  worth / which one / where do I buy, sell, or rent." Every post maps 1:1 to one of those.
- **Compare-and-hand-off monetization.** We don't sell; we inform then route to partners.
  Every post ends in the CTA block. **Seller/consignor referral is the dominant lever**
  (~$1,250 vs ~$30–60 a buyer click), so sell is surfaced first; rent is the third fork
  (the "want" intent); buy is always there.
- **Two moats.** (1) **Real resale data** nobody else publishes (original, defensible,
  AI-citable). (2) **Authentication authority** (the "is it real" brand position).
- **GEO/SEO is the channel.** Fact-dense, specific pages get cited by AI and Google. The
  voice guide *is* the SEO strategy as prose.

**The consistent rule for every post:** it answers one real decision question AND ends in a
commissionable hand-off.

## Prioritization lens
Score each piece on **$ (monetization, seller-weighted) · Reach (search + AI-citation +
shareability) · Ready (can we write it *credibly now*) · Effort (solo-operator).** Honest
constraint from the 2026-06-24 data audit: **high-end value/comparison is ready now;
authentication needs sourcing; mid-tier needs data capture.**

## The prioritized roadmap
| Post | $ | Reach | Ready | Effort | Tier |
|---|---|---|---|---|---|
| **Value pieces, hero high-end bags** (Chanel Flap ✅ drafted, LV Neverfull, Hermès Birkin, Gucci Marmont) | H | H | ✅ data | Low | **1** |
| **"Where to sell your [bag] for the most"** (seller lever, direct) | H+ | M | ✅ | Low | **1** |
| **Comparisons** (Caviar vs Lambskin · Neverfull vs Speedy · Birkin vs Kelly) | H | H | ✅ | Med | **1** |
| **"Which [Birkin/Kelly] size holds value best"** (data-led) | M | H | ✅ | Low | 2 |
| **Coach authentication** (brand/SEO wedge) | M | H+ | ❌ needs sourcing | Med | 2 |
| **Market/trend** (most coveted / appreciating / best deals) → `/coveted`, `/deals` | M | M | ✅ | Low | 2 |
| **Mid-tier value** (Coach/MK) | M | M | ❌ needs eBay/Poshmark capture | Med | 3 |
| **"Buy vs rent a [bag]"** (rental fork) | M | M | 🟡 rental CTA built; Vivrelle approval pending | Med | 3 |

## Operating rules
- **Lead with Tier 1** (overlap of highest monetization × ready today — our data moat,
  monetizes immediately through the CTA block).
- **Authentication runs in parallel as the reach/brand play**, gated on sourcing (mid-tier
  Coach first; lower stakes). Text-first + schematic SVG diagrams, never licensed photos
  (see `docs/preferences.md` image rule). Never assert an unsourced auth marker.
- **Tier 3 is genuinely blocked** (mid-tier capture, Vivrelle approval) — don't force it.
- **Every post is topic-tagged** to its brand/style so the CTA block can render the
  hand-off. Body is plain-text paragraphs (no inline links); monetization lives in the CTA.
- **All copy passes `docs/voice-and-tone.md`** §8 slop sweep + the review checklist.
