# Trusted smaller resellers — evaluation + referral/ingestion plan

*Created 2026-06-25 (reseller-research lane). Evaluates smaller, independent luxury
handbag resellers beyond Fashionphile + TheRealReal, for two uses: (1) ingest their live
prices into the catalog and hand off at the decision point, (2) feature them editorially as
vetted sources. All trust/price/affiliate signals are dated; trust is stated as reputation
signals, never a verdict. Pairs with `docs/market-sweep-worklist.md` (capture to-dos),
`docs/content-strategy.md`, and `docs/data-collection-handoff.md` §11 (affiliate plumbing).*

## The frame
A reseller helps the site two ways, moving different metrics:
1. **Data + hand-off (revenue + moat).** Ingest live prices into the Shop and the
   self-updating data-viz, link out. Needs a structured feed + trust. Monetizes only with an
   affiliate program; even without one, the prices enrich comps (the data moat).
2. **Trust / creator collaboration (engagement + brand).** Feature them as a vetted source.
   Redeluxe doubles here (Georgia Swain is already a chosen creator partner).

## The hard gates (legal + integrity)
- **Trust gate.** Refer/ingest only from resellers with a written money-back authenticity
  guarantee + solid independent reputation + protected payment. The risk is referral
  liability: sending readers (especially via paid affiliate links) to a seller who ships a
  fake. FTC endorsement rules can reach a referrer who "knew or should have known"
  (16 CFR 255). This gate is the shield. It removes Instagram-DM-only and untrusted sellers.
- **Copyright.** Prices are facts: ingest with a `source_url`. Never ingest their photos or
  descriptions.
- **Authentication frame.** Never assert "authentic" ourselves; markers to check, not a
  verdict. Lean on the reseller's own guarantee, do not adopt it as our claim.
- **Do not refer: Julia Rose Boston.** Reputation red flags (PurseForum complaints re:
  consigned items held/reposted at higher prices, irregular payouts; BBB-listed but not
  accredited, checked 2026-06-25). Named here so a future session does not re-add it.

## Feasibility finding (verified 2026-06-25)
Redeluxe and Couture USA both run on **Shopify with open `products.json` feeds** (vendor =
brand, product_type = style, variants[].price, tags = condition), the same path that powers
the Fashionphile capture. "List their listings" is real and low-effort for the Shopify
subset. Build one reusable `shopify-products` adapter (per-store config) rather than per-site
code.

## Affiliate availability (dated 2026-06-25)
Rates/cookie windows come from third-party affiliate directories and can be stale. Confirm
live terms in the network at signup.

| Reseller | Affiliate? | Rate (estimate, confirm) | Network | Notes |
|---|---|---|---|---|
| **Redeluxe** | Yes | not published | Direct (partners.redeluxe.com) | Flagship; direct = higher net; creator partner |
| **Rebag** | Yes | ~7% (3% over $2,500), 30-day cookie | Impact | Clearest terms |
| **Yoogi's Closet** | Yes | not published | Own program | Trusted, since 2008 |
| **Madison Avenue Couture** | Yes (invite-only) | up to ~$1,000/item, pays on delivery | MadAve Collective | Already applied; Hermès/Chanel only |
| **The Luxury Closet** | Yes | ~5% | CJ | Dubai, broad |
| **Vestiaire Collective** | Yes | ~6 to 10% | CJ | Large, already known |
| **Sellier Knightsbridge** | Yes | not published | Network (UK) | UK shipping friction |
| **Luxe Du Jour** | Yes (+ influencer) | not published | Own program | |
| **Luxe Collective** (UK) | Yes | ~4%, 30-day cookie | Impact | UK |
| **Couture USA** | No (loyalty + refer-a-friend store credit only) | n/a | n/a | Data/trust only |
| **Ann's Fabulous Finds** | None found | n/a | n/a | Data/trust only |
| **Privé Porter** | None found | n/a | n/a | Instagram-DM model; no feed, no affiliate |

## Reputation signals (dated 2026-06-25)
- **Redeluxe:** ~5 stars Trustpilot; 100% money-back authenticity guarantee; broad brands
  incl. mid-tier (Michael Kors, Fendi). Founder Georgia Swain (your creator partner).
- **Yoogi's Closet:** ~3,500 Trustpilot reviews; 100% money-back incl. shipping; since 2008.
- **Rebag:** since 2014; refund on inauthentic (authenticator vague).
- **Madison Avenue Couture:** names third-party authenticators (Bababebi, Authenticate First
  for Hermès; Zekos for Chanel); Hermès/Chanel only; niche/consignment.
- **Privé Porter:** large + trusted ($175M+ via Instagram); money-back if Hermès rejects;
  Birkin/Kelly only; sells via Instagram DM (no structured feed).
- **Sellier Knightsbridge (UK):** microscopic-tech auth + money-back; since 2019.
- **Couture USA:** open Shopify feed verified, but Trustpilot carries scam/shipping
  complaints alongside positives. Vet before referring.
- **Ann's Fabulous Finds:** good Trustpilot, since 2008.

## Three-angle verdict (rated against owner preferences)
| Angle | Verdict | Why, in plain terms |
|---|---|---|
| Strategic | Refer to a vetted set; ingest the Shopify subset | More trusted price points = richer value module + better GEO (the moat) and more hand-off surfaces; reuses the FP pipeline so it does not overbuild; affiliate-enabled ones also earn. |
| Fit | Strong, weighted to Redeluxe | Matches "reference that lets you shop, never a cart"; Redeluxe is the natural flagship (creator partner + mid-tier coverage the giants miss). |
| Legal | Safe only behind the trust gate | Prices are facts (source_url); never their imagery/copy; refer only to money-back + protected-payment sellers; keep affiliate disclosure; never assert authenticity. |

## Recommended sequence
1. **Redeluxe first** (direct affiliate, flagship, creator partner, mid-tier gap). Owner:
   apply at partners.redeluxe.com + confirm rate.
2. **Add affiliate-enabled trusted ones:** Rebag, Madison Avenue Couture (applied), then the
   CJ/Impact tier (Luxury Closet, Vestiaire, Luxe Collective) as gap-fill.
3. **Feature high-trust niche sellers editorially** (Madison Ave, Privé Porter, Sellier)
   even without ingestion.
4. **Data lane:** capture vetted Shopify feeds (Redeluxe, Couture USA, others TBD). See
   `docs/market-sweep-worklist.md` "Incoming to-dos."

## Open / owner-gated
- Redeluxe affiliate rate (apply to confirm).
- Reputation vetting of the unverified set (HER Authentic, Luxe Du Jour, The Luxury Savvy,
  Handbag Sense, Mightychic, FashioNica, CODOGIRL, Dallas Designer Handbags) before referral.
- Affiliate signups are owner-gated (Awin/CJ/Impact/direct).
