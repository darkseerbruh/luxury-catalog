# UX review 0714 — worklist (run until done)

Source: owner's 9-min screen-recording UX audit (2026-07-14), transcript + frames in `UX review/`.
Branch: `ops/search-relevance-0714`. Owner directive: fix ALL of these, real restructure not paint job, don't stop to ask.

## Root insight
The bag "page" is keyed per-VARIANT (`/bag/[variantId]`), and the breadth-seed created a separate
`style` row per leather+size combo ("Togo Birkin 35", "Ostrich Birkin 35" …) instead of one "Birkin"
style with variant axes. That single data defect causes: inverted hierarchy, empty variant selector,
weird shop rollup, and "view all X" catch-all confusion. The real fix is a **data merge** +
rendering that keys off the canonical style.

## Status legend: [ ] todo  [~] in progress  [x] done+committed  [S] staged for owner (migration)

### P0 — "looks broken"
- [x] 1. Shop search: loading skeleton (`shop/loading.tsx`) so a slow search never looks dead
- [x] 1b. Shop search: LLM parse skipped for name queries (fast-path) (force-dynamic + serial LLM parse + hybrid)
- [x] 2. Bag page auto-jumps to #for-sale on load — land at top; stop appending #for-sale to bag links

### P1 — search & nav
- [x] 3. Nav "Search bags" jitters/pops on hover — expand inline, no layout jump (`HeaderNav.tsx`)
- [x] 4. Home pre-search dropdown shows "Shop the market / Deals only" — drop it; keep tier list (`HomeHero.tsx`)
- [ ] 5. Shop grid: specific-style search shows one rollup tile, not the individual Birkins/listings
- [x] 6. Best-deal presort → default "Most relevant" on search (DONE earlier this session)
- [x] 7. "birkin" surfaced non-Birkins → brand-flood gated (DONE earlier this session)

### P1 — home search dropdown (works better than shop, per owner)
- [x] 8. Names truncate ("Guilloche Tadelakt B…") — never truncate a name, wrap (`HomeHero.tsx`)
- [ ] 9. Leather/size same font as style name — split style (primary) vs variant detail (secondary)
- [ ] 10. First result "Birkin" is the catch-all page but looks like a listing — distinct "View all Birkins" card

### P2 — bag page RESTRUCTURE (the real one)
- [ ] 11. Inverted hierarchy: "Togo Birkin 35" is the style. Merge pseudo-styles → canonical Birkin;
        breadcrumb Home / Hermès / Birkin / [variant]
- [ ] 12. No axis switcher on page — wire VariantSelector to swap leather/size/color/hardware
- [ ] 13. Color shown nowhere — surface as first-class variant attribute
- [x] 14. "By Arielle" byline on a bag — remove on bag pages
- [x] 15. "Discontinued" with no source — add sourced hover ("how we know")
- [ ] 16. Variant link went to a shop page — route variant links to the specific bag page

### The migration (P2 core) — STAGED, owner applies
- [ ] M. Catalog-wide: find pseudo-styles (style name = "<leather/desc> <StyleBase> <size>" where a
        canonical base style exists), re-parent their variants (parse leather→exterior_material,
        size→size_label), carry price_history, delete emptied pseudo-styles. Dry-run report first.
        Owner applies (rule 7: DB migrations are hers).

## Verify
Own dev server on a dedicated port + curl / browser pane (worktree preview gotcha). Green gate via
`land-to-main.sh` at the end.
