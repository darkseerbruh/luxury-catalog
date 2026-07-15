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
- [ ] **2. Size cm inconsistency.** RESOLVED-BY-DATA, not code: `measuredSizeLabel` shows cm only
  where we hold a measurement. Stripping real cm to look uniform hides good info (against canon);
  the archivist pull supplies the missing dims (Nano ~11cm, Mini ~19cm, Medium ~26-27cm). Load =
  owner-gated. File: `variant-label.ts` (data, not logic).
- [x] **3. "Mama" clears Colour.** FIXED. Root cause: `colourApplies` in `VariantSelector.tsx`
  hid Colour when the selected material wasn't in `colourBearingMaterials` (materials that pair
  with a colour in OUR rows). The Baguette's Mama (#1378) is `Canvas, colour=∅` and Small (#1669)
  is `Lambskin, colour=∅`, so only "Leather" counted as colour-bearing → picking Mama hid all 10
  colours. Pure canon violation (#13: inferring from coverage). Fix: removed the guard entirely —
  `visibleDims` alone decides if Colour is a real axis (it already collapses a single-print style
  like LV Monogram to one colourway, so no LV regression; 17 variant-dims tests green). Verified
  on the live Mama page: Colour axis now shows (Beige/Black chips present).
- [ ] **4. Wrong / broken images.** Micro thumb = jewelry; Nano-black + a crop aren't Baguettes.
  Image-QA DATA pass (wrong-bag + bad crops) — needs the image pipeline, not this page's code.
- [ ] **5. Material as selectable axis.** ALREADY SUPPORTED in code (`DIMS` includes `material`);
  it shows in the selector whenever variant rows vary by material. For the Baguette they don't
  yet, so material falls to the read-only "Made in" block. Making it selectable = load variant
  rows per finish (`seed-material-variants-from-production.ts`), which is owner-gated data.
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
- [ ] **15. Heart = wishlist, then reclassify.** OWNER-DEFERRED — she said "I need to explore
  that." Needs the post-save prompt flow + closet reclassify UI (Have/Had), tied to #21. Not built.
- [x] **16. Closet heading copy.** DONE — "Add it to your closet" (was "Make it yours, or move it
  on"). Alternatives if she prefers: "Track this bag" / "Your closet".

## Bucket 3 — bigger explorations

- [x] **17. Sticky variant reminder.** DONE — new `StickyVariantBar.tsx`: thumb + brand/style/
  variant pinned under the header on scroll (>360px), with a "Value & price" jump. Verified in
  browser: hidden at top, reveals on scroll, sits at top:60px (no header overlap).
- [ ] **18. On-hover availability (Amazon pattern).** Grey-out / strike combos the house never
  made. Archivist canon is IN (`docs/research-drafts/fendi-baguette-production-canon.md`):
  Baguette Mini in blue = YES (do not strike). DB load of the production matrix is owner-gated
  (migration = hers). Also flagged: Micro/Small/Large/Maxi/Midi are RESELLER labels, official
  Fendi sizes are Nano/Mini/Baguette(Medium)/Chain Midi/Mamma — belongs in the alias layer.
- [ ] **19. Bag DNA reconcile.** Spec is `docs/ux/object-oriented-ux.md` + mockup
  `docs/ux/mockups/bagdna.png` (6-card grid: House/Leather/Hardware/Shape/Era/Designer). Fixes:
  House card subtitle must be a heritage line (e.g. "est. 1997 · Italy"), NOT the raw tier number
  "3"; module collapses to House+Colour when attributes are null — fill from production canon.
  File: `BagDNA.tsx`, `page.tsx`.
- [~] **20. Authentication placement.** ADDRESSED (digest): the "Is it real? Start here" auth
  digest already sits high (right after the closet CTAs, above Bag DNA + Story) and links to the
  full checklist + the brand guide. Moving the full 65-line checklist section up too is optional
  and best confirmed with her (it reshuffles JumpNav order + the `#authentication` anchor).
- [ ] **21. Owner review flow.** OWNER-DEFERRED — she said on the recording "file that away, we
  need to come back to." Also conflicts with the locked contribution copy/spec
  (`docs/ux/review-data-leaderboards.md`, 2026-07-07). Not built. Ties to #15.

## Filed for owner (outward-facing / future)

- **Email follow-up to owners for reviews.** When someone marks "Have it," follow up by email
  requesting a review (reviews are high-value). Backend + email = owner-gated; noted, not built here.
- **Confirm "Baguette Mini in Blue".** Archivist production pull answers this against Fendi's
  own record; drives #18 grey-out truth.
