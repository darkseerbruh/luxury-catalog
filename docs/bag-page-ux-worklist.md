# Bag detail page (`/bag/[variantId]`) — UX worklist

Source: owner screen-recording walkthrough of the Fendi Baguette page, 2026-07-14
(`Screen Recording 2026-07-14 at 7.05.53 PM.mov`, ~20 min). This doc is the durable
capture + checklist. Work top-to-bottom; check items as they land.

Cross-cutting canon: **production canon = the house's own documentation** (preferences
ENFORCED #13). The Baguette production pull (archivist) feeds the selector + Bag DNA so
they reflect what Fendi made, not our listing coverage.

---

## Bucket 1 — clear fixes

- [x] **1. Hero layout.** DONE — header text left, image floated right on wide screens (stacks
  on mobile); collapses the tall top. Verified in browser. File: `page.tsx` hero section.
- [x] **2. Size cm inconsistency — was actually WRONG data.** FIXED. `SIZE_MEASURE` was a Chanel
  table keyed by bare size word with NO brand scope, so "Small · 23 cm" / "Maxi · 33 cm" on the
  Fendi Baguette were Chanel's widths bleeding onto Fendi (a spec error, ENFORCED #3). Made it
  brand-scoped: a measurement prints only when the bag's brand has a sourced number for that size;
  Fendi now shows plain size words (consistent, correct). Test added. Real per-style Fendi cm
  (Nano ~11 / Mini ~19 / Medium ~26.5 from canon) belong in the production record (data task).
- [x] **3. "Mama" clears Colour.** FIXED. Root cause: `colourApplies` in `VariantSelector.tsx`
  hid Colour when the selected material wasn't in `colourBearingMaterials` (materials that pair
  with a colour in OUR rows). The Baguette's Mama (#1378) is `Canvas, colour=∅` and Small (#1669)
  is `Lambskin, colour=∅`, so only "Leather" counted as colour-bearing → picking Mama hid all 10
  colours. Pure canon violation (#13: inferring from coverage). Fix: removed the guard entirely —
  `visibleDims` alone decides if Colour is a real axis (it already collapses a single-print style
  like LV Monogram to one colourway, so no LV regression; 17 variant-dims tests green). Verified
  on the live Mama page: Colour axis now shows (Beige/Black chips present).
- [x] **4. Wrong / broken images.** FIXED at the source (the face picker). Root cause: candidates
  are baguettes but the WRONG sub-variant (Double Baguette, charm bag, studded Bloody Mary, wrong
  size), and the picker always took the top candidate even at a negative score. Fixes: added a
  REJECTION FLOOR (best score must be >= 0, else the branded placeholder shows, never a wrong bag);
  added Fendi sizes (nano/mama/midi) to the wrong-size veto; vetoed sub-models/novelty (double
  baguette, trunk, fendace, studded, flowerland, bloody, charm already); and strip Rebag's product
  id glued to the last word so size words stay detectable. Verified: Micro -> real micro baguette,
  Mama -> suede mama, charm/studded/mini-on-nano -> rejected. 34 listings-core tests green.
- [x] **5. Material as selectable axis.** DONE (2026-07-14). Built the slug classifier
  `supabase/ingest/seed-material-variants-from-slug.ts`: classifies each listing from its TITLE/slug
  (zucca/selleria/sequin/fur/croc/jacquard) to the canon material, splits each (size,colour) variant
  where a material has >= 5 listings, dedups against existing children. Applied to the Baguette (204):
  14 material variants created, ~228 listings re-pointed. Verified: the selector now shows a
  **Material** axis with real chips (FF / Zucca Canvas, Fur, Sequins / Embellished, Embroidered,
  Leather); child pages render (HTTP 200) with correct images or the honest placeholder (#4 floor,
  never a wrong bag). Reversible: `seed-material-variants-from-production.ts --reverse --style=204
  --write` collapses all material children back. To extend to more styles: run the slug seed with
  `--style=<id>`.
- [x] **6. "Seasonal" label / "Made in" mimics a chip.** DONE — `ProductionRange` now renders as
  quiet read-only text, not selector-style pills; "Seasonal:" reads as a prefix, not a chip.
- [x] **7. Cut the GEO filler line.** DONE — the lead box is hidden when it degrades to bare
  filler (`leadIsSubstantive`); the string still feeds metadata/JSON-LD.
- [x] **8. De-dupe "Discontinued" + tooltips.** DONE — dropped the bare pill; the sourced Status
  row + its single tooltip is the one source; era note reworded so it doesn't echo.
- [x] **9. Worth chart names its subject.** DONE — `ValueModule` shows the variant under the
  heading (brand · style · size · colour).
- [x] **10. "Want: just this / any colourway" moved beside the selector.** DONE.
- [x] **11. Anchors read as a nav, not tags.** DONE — `JumpNav` is an "On this page" underlined
  text nav, not filter-tag pills.
- [x] **12. "Suggest edit" opens in-page.** DONE — inline "Suggest an edit / Tell us" links now
  auto-open the editor in place (via `#suggest-edit` / `#suggest-edit:<field>` + a hashchange
  listener that expands the form, pre-targets the field, and scrolls it into view). Anchor id
  added. Verified anchor present. File: `SuggestEdit.tsx`.
- [x] **13. Cut "Add to compare".** DONE — removed from the bag page and the search-result
  toggle+tray; `/compare` page untouched.

## Bucket 2 — decisions (applying owner-recommended defaults)

- [x] **14. Closet CTAs moved up** directly under the hero (want/have/had + buy/sell). DONE.
- [x] **15. Heart -> post-save reclassify (Option B).** DONE — after a wishlist save, the shared
  `QuickSaveHeart` shows a small popover everywhere: "Saved to your wishlist. Already carry it?"
  [Have it] [Had it], calling the closet actions and auto-dismissing (7s). Have it -> nudges the
  wear review; Had it -> points to sell. Bridges the heart into the owner review flow (#21) +
  consignor referral. Owner email follow-up stays hers.
- [x] **16. Closet heading copy.** DONE — "Add it to your closet" (was "Make it yours, or move it
  on"). Alternatives if she prefers: "Track this bag" / "Your closet".

## Bucket 3 — bigger explorations

- [x] **17. Sticky variant reminder.** DONE — new `StickyVariantBar.tsx`: thumb + brand/style/
  variant pinned under the header on scroll (>360px), with a "Value & price" jump. Verified in
  browser: hidden at top, reveals on scroll, sits at top:60px (no header overlap).
- [~] **18. On-hover availability (grey-out).** RESOLVED-BY-CANON, correctly NOT built. Greying a
  value requires a SOURCED "never made" negative; the archivist canon explicitly asserts NO
  negatives (it documents positives + "not yet sourced"). So there is no data to grey-out from,
  and per canon #13 the right behavior is to keep everything selectable — which is exactly what
  the selector now does after the #3 fix. Grey-out only becomes possible if/when we source
  negative production evidence for a house. (Baguette Mini in blue = confirmed positive, stays
  selectable.) Separate cleanup: Micro/Small/Large/Maxi/Midi are RESELLER size labels; official
  Fendi sizes are Nano/Mini/Baguette(Medium)/Chain Midi/Mamma → alias-layer data task.
- [ ] **19. Bag DNA reconcile.** Spec is `docs/ux/object-oriented-ux.md` + mockup
  `docs/ux/mockups/bagdna.png` (6-card grid: House/Leather/Hardware/Shape/Era/Designer). Fixes:
  House card subtitle must be a heritage line (e.g. "est. 1997 · Italy"), NOT the raw tier number
  "3"; module collapses to House+Colour when attributes are null — fill from production canon.
  File: `BagDNA.tsx`, `page.tsx`.
- [x] **20. Authentication placement.** DONE — moved the full "How to authenticate this bag"
  section + RequestAuthentication up to right after the "Is it real? Start here" digest, above Bag
  DNA + The Story (owner ranking: auth > watch > story > DNA). Jump-nav reordered to match
  (Authentication before DNA). Verified in DOM: `#authentication` precedes `#dna`.
- [~] **21. Owner review flow.** CORE DONE. The have→review bridge already existed in BagActions
  ("How does it wear? Tell the next buyer" when owned). New: the big "Have this in hand? 0 of 6"
  module is now GATED — the full ask shows only to people who HELD the bag (closet have/had) or
  are already mid-contribution; everyone else gets a soft "Carried this one? Mark it as yours"
  nudge to #your-move. Aligns with her recording AND the spec's "signed-in owners" (not a lock
  conflict). `getContributionSlots` now returns `closetStatus`. REMAINING (design-y, deferred):
  the post-heart popup (#15) and the owner email follow-up (outward-facing, hers).

## Filed for owner (outward-facing / future)

- **Email follow-up to owners for reviews.** When someone marks "Have it," follow up by email
  requesting a review (reviews are high-value). Backend + email = owner-gated; noted, not built here.
- **Confirm "Baguette Mini in Blue".** Archivist production pull answers this against Fendi's
  own record; drives #18 grey-out truth.
