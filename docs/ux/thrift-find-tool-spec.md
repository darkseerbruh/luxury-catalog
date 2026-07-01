# Thrift Find tool — spec (for owner review, NOT built)

*Drafted 2026-06-30. Reframes the existing photo `/identify` tool. This is a spec to
react to before any build. Nothing here ships until the owner signs off. Governing rule:
markers to check, not a verdict. The tool identifies and estimates; it never certifies a
bag as real, and it may only wave a buyer off on a specific, house-confirmed fact.*

## What it is
The in-the-aisle tool for a thrift or resale find: snap or upload a photo and get, in
plain words, **what it looks like**, **what it would be worth if genuine**, and **how to
check it is real**. It is the top-of-funnel viral hook (the shareable "I scanned a $6
thrift bag" moment), and it feeds Authentication rather than pretending to be it.

## Naming (locked 2026-06-30, on search evidence)
Evidence: `docs/research-drafts/tool-name-search-demand.md` (directional, not absolute; free
tier has no volume data, so ranked qualitatively on revealed demand + community usage,
sources dated 2026-06-30). "Spot a fake" is the #1 demand phrase AND verb-honest (help you
look, not we rule). "Authenticator" pulls the most raw demand but over-promises a verdict.
"Fake Finder" is near-zero in search, so it is not a traffic play.

- **Tool name (on-site): "Spot the Fake."**
- **Section (nav): "Authentication"** (accurate topic; captures the "authentication" search).
- **Page title / H1: "Spot the Fake: {Brand} authentication"** (ranks for both #1 "spot a
  fake" and #2 "authentication" without a verdict claim in the name).
- **Tagline (GEO / answer engines): "Is it real? Let's check the markers."** (captures the
  high-intent sleeper phrase "is my {brand} real").
- **Social / captions:** the "spot a fake" vernacular. Skip "Fake Finder" for SEO.

## Placement (decided in conversation)
- **Not** a rung on the Authentication ladder. The ladder stays **Learn (guides) → Check
  the listing (deterministic red-flag check) → Verify (pro)**, with no AI verdicts.
- The Thrift Find tool lives on the **value / discovery** side and **points into**
  Authentication for the real-or-fake question. It is the funnel's mouth, not its judge.

## The three outputs (only the safe ones are ever asserted)

| Output | Source | How it is stated |
|---|---|---|
| **What it resembles** | AI vision, matched to our catalog | "This looks like a Coach Tabby" + a confidence level. A resemblance, never "this is." The user confirms or corrects the model. |
| **What it is worth if genuine** | Our resale data | "If genuine, this model typically resells around $X (median, n, as of <date>). An estimate, not an appraisal." Never a flat number on an unverified bag. |
| **Is it real** | Handoff, not an answer | Routes to that brand's authentication guide (Learn) and a pro (Verify). The tool does not answer this. |

## Guardrails (the reason this is safe)

1. **Resemblance + confidence, never identity.** The ID is "closest match in our catalog"
   with a confidence level, and the user can correct it. Low confidence returns **no
   price** and sends them to the markers ("we cannot tell from this photo, reshoot the
   stamp, the interior tag, the hardware").
2. **Silhouette-match check (net-new, and a feature).** We match the read against our
   catalog of the house's **real** shapes. A print that says Coach on a silhouette Coach
   never made is flagged: "This looks like it is copying Coach, but the shape matches no
   Coach bag we have. A print on a shape the house never made is one of the clearest
   fakes." A miss becomes a red flag instead of a false ID.
3. **Value is always conditional on "if genuine."** No price is ever attached to an
   unverified bag as a flat fact, and no price is shown at all on a low-confidence ID or a
   silhouette mismatch.
4. **Asymmetric authenticity voice (three tiers).** No single right marker proves a bag,
   so we never certify "authentic." But a single house-confirmed wrong marker can be a
   dealbreaker:

   | Finding | Voice |
   |---|---|
   | Consistent / nothing wrong | "Nothing here rules it out, but that is not proof. Run the rest, and for anything costly, a pro." |
   | Soft or uncertain tell | "Worth scrutiny. Ask for a clearer photo of X before you trust it." |
   | Hard, house-confirmed disqualifier | "If what we are seeing is right, this is a dealbreaker. A real [Coach] is never made in China / never came in this shape. We would walk away. Confirm in person before you spend a dollar." |

   The **hard** tier fires only on facts we can stand behind from our own data (wrong
   country of origin, a silhouette the house never made, a misspelled or wrong-geometry
   logo, a "comes with an authenticity card" on a house that never issues one). A
   subjective read ("the leather looks off") only ever earns the **soft** tier.
5. **Two things keep the dealbreaker call safe:** it advises the **user about their own
   find** ("we would walk away"), it does not publish a verdict on a seller's listing; and
   it always conditions on **confirming in person**. Decisive about the flag, never falsely
   certain about the object.

## Flow
1. Snap or upload a photo.
2. **Likely ID** (resemblance + confidence) with a one-tap confirm / correct.
3. **Silhouette + hard-marker pass:** if the shape matches no real style, or a
   house-confirmed disqualifier is visible, show the dealbreaker card and stop before any
   price.
4. Otherwise, **estimated resale if genuine** (median, n, date, hedged).
5. **Check it is real:** link to the brand's authentication guide + the markers, and to a
   pro for anything costly.
6. **Save the find** to a closet (account), and, if genuine, a path to sell (sell-side
   affiliate later).

## Build status (2026-06-30)
- **Shipped:** the reframe to "Spot the Fake" (H1 + tagline), resemblance + confidence ID,
  value-if-genuine (median/n/date, gated on a catalog match + not-low confidence + no hard
  flag), the calibrated no-match copy (uncatalogued vs a shape the house never made), and the
  **hard, house-confirmed dealbreaker on country of origin** (`HOUSE_ORIGINS` in the identify
  route + a red dealbreaker card; mass-market houses excluded so Coach is never flagged for
  China). Value is suppressed whenever the hard flag fires.
- **Still pending:** the other hard disqualifiers (misspelled / wrong-geometry logo, a true
  silhouette-does-not-exist check beyond catalog absence). Vision cannot reliably extract logo
  geometry yet, so we deliberately hold it rather than over-claim. Origin is the reliable one.

## Data + reuse
- **Reused (already exists):** the `/identify` vision call; the resale medians (with n +
  observed date); the per-house authentication guides; the closet save.
- **Net-new:** the silhouette-match check (compare the read to our catalog of real shapes),
  the hard-disqualifier ruleset (country of origin, non-existent silhouette, logo geometry,
  card-myth per house, all from our brand data), the value-gating (no price on low
  confidence / mismatch), and the three-tier response copy.

## Monetization / engagement
- **Acquisition (primary):** the shareable thrift win is the viral loop's fuel.
- **Retention:** save the find to a closet (account creation, return visits).
- **Engagement + GEO:** the "here is the real shape, here are the markers" path pulls
  finders into the authentication guides.
- **Revenue:** genuine finds route to sell-side affiliate and the pro service; the walk-away
  moment protects the trust the whole loop depends on.

## Open questions / risks (for the owner)
- **AI ID accuracy:** vision can misidentify. Mitigated by resemblance-not-identity, the
  confirm step, the silhouette check, and no-price-on-low-confidence. It is not eliminated.
- **No scraping:** the tool reads the user's own photo. It does not scrape any listing.
- **Legal framing:** advice to the user about their own item, conditioned on in-person
  confirmation, never a public claim about a named seller. Confirm load-bearing wording with
  counsel before launch (same caveat as `docs/image-strategy-research.md`).
- **Scope:** ship as a demand-gated door if the ruleset is not ready, per the fake-door
  preference, and turn it real once the silhouette + disqualifier data is wired.
