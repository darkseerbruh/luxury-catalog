# Bag detail page (`/bag/[variantId]`) — UX worklist

Source: owner screen-recording walkthrough of the Fendi Baguette page, 2026-07-14
(`Screen Recording 2026-07-14 at 7.05.53 PM.mov`, ~20 min). This doc is the durable
capture + checklist. Work top-to-bottom; check items as they land.

Cross-cutting canon: **production canon = the house's own documentation** (preferences
ENFORCED #13). The Baguette production pull (archivist) feeds the selector + Bag DNA so
they reflect what Fendi made, not our listing coverage.

---

## Bucket 1 — clear fixes

- [ ] **1. Hero layout.** Text stack (brand / tier / name) is vertically wasteful. Left-align
  the text block, float the bag image to its right so they sit side by side and collapse the
  top of the page. Files: `page.tsx` hero section.
- [ ] **2. Size cm inconsistency.** Only `Small · 23 cm` and `Maxi · 33 cm` show dimensions;
  Micro/Nano/Mini/Medium/Large/Midi/Mama don't. Be consistent — show cm on every size we hold a
  figure for, or none. File: `VariantSelector.tsx`.
- [ ] **3. "Mama" clears Colour.** Selecting the Mama size drops the entire Colour axis. Bug in
  axis-resolve. File: `VariantSelector.tsx`.
- [ ] **4. Wrong / broken images.** Micro thumbnail is a ring/jewelry; a Nano-black + a cropped
  shot aren't Baguettes. Image QA — wrong-bag + bad crops. (Data pass, not just code.)
- [ ] **5. Material becomes a selectable axis.** Today it's a separate non-selectable "Made in"
  block. Promote Material to a 4th "Choose your Baguette" axis (Size / Colour / Hardware /
  Material). Files: `VariantSelector.tsx`, `page.tsx`.
- [ ] **6. "Seasonal" label mimics a chip.** Non-interactive labels must not look clickable like
  the material chips. Restyle. File: `VariantSelector.tsx`.
- [ ] **7. Cut the GEO filler line.** "The Fendi Baguette Nano in Beige is a designer bag."
  comes from `src/lib/geo.ts:88`. Keep GEO intent in page metadata; cut the generic visible
  sentence (it's identical filler every time).
- [ ] **8. De-dupe "Discontinued" + consolidate tooltips.** Status shows twice (tag + status row)
  and two overlapping on-hover tooltips. One statement, one tooltip. File: `ValueModule.tsx` /
  `page.tsx`.
- [ ] **9. Worth chart needs its subject.** Best $795 / median $873 / high $950 with no label of
  WHICH variant. Label the chart with the selected variant (pairs with sticky header, #17).
  File: `ValueModule.tsx` / `PriceTrend.tsx` / `CompScale.tsx`.
- [ ] **10. Move "Want: Just this one / Any beige / Any colourway" up next to Colour.** Today it
  sits far below, detached from the colour choice it modifies. Files: `WantBreadth.tsx`, `page.tsx`.
- [ ] **11. Anchors read as tags.** "The story / DNA / Specs / Resale prices…" (`JumpNav`) look
  like tags, not jump-links — no web pattern signals "anchor." Redesign as a clear section nav or
  remove. File: `JumpNav` (find component).
- [ ] **12. "Suggest edit" opens in-page.** Make it a button that reveals an in-page editor right
  where the user is, referencing the exact field, not a nav link. File: `SuggestEdit.tsx`.
- [ ] **13. Cut "Add to compare"** from the bag page AND from search-result image cards (compare
  is over-placed; not the primary use case). Files: `page.tsx` + search result card.

## Bucket 2 — decisions (applying owner-recommended defaults)

- [ ] **14. Closet CTAs move up** under the hero image (Want it / Have it / Had it / Alert me +
  Where to buy / Where to sell). Default (b). Files: `BagActions.tsx`, `page.tsx`.
- [ ] **15. Heart = wishlist, then reclassify.** Heart adds to wishlist; a post-save prompt offers
  "already own it? → Have it," which is the natural bridge into the review ask. Default (a).
- [ ] **16. "Make it yours, or move it on" copy.** Strike "move it on" (nobody says it). Rewrite
  on-voice (2-3 options in-thread before commit).

## Bucket 3 — bigger explorations

- [ ] **17. Sticky selector header.** Small thumb + selected variant pinned on scroll, so the
  worth chart etc. always has context. File: `StickyActionBar.tsx` (exists — extend).
- [ ] **18. On-hover availability (Amazon pattern).** Grey-out / strike combos the house never
  made. GATED on the archivist Baguette production pull (canon data first).
- [ ] **19. Bag DNA reconcile.** Spec is `docs/ux/object-oriented-ux.md` + mockup
  `docs/ux/mockups/bagdna.png` (6-card grid: House/Leather/Hardware/Shape/Era/Designer). Fixes:
  House card subtitle must be a heritage line (e.g. "est. 1997 · Italy"), NOT the raw tier number
  "3"; module collapses to House+Colour when attributes are null — fill from production canon.
  File: `BagDNA.tsx`, `page.tsx`.
- [ ] **20. Authentication placement.** Owner: more important than Watch / Story / DNA. Move the
  authentication guide up the page. File: `page.tsx` order.
- [ ] **21. Owner review flow.** Move the 6-slot "Have this in hand?" ask out of the page body;
  trigger it after someone marks "Have it." File: `ReviewForm.tsx` / `ContributionSlots.tsx`.

## Filed for owner (outward-facing / future)

- **Email follow-up to owners for reviews.** When someone marks "Have it," follow up by email
  requesting a review (reviews are high-value). Backend + email = owner-gated; noted, not built here.
- **Confirm "Baguette Mini in Blue".** Archivist production pull answers this against Fendi's
  own record; drives #18 grey-out truth.
