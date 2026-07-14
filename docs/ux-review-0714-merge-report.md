# Pseudo-style merge — review + apply (STAGED, your call)

The bag-page hierarchy problem you flagged ("why is Togo Birkin 35 the style, and
Gold-Plated HW a subpage?") is a **data** defect: the breadth-seed made a separate
`style` row per leather+size combo instead of one style with variant axes. The bag page
already renders correctly for clean styles — `/bag/211` shows breadcrumb
**Home / Hermès / Birkin / 35 · gold HW**, title **Birkin**, and the size/leather/colour/
hardware selector. The merge below brings the junk rows into that same shape.

This mutates the **live catalog**, so I did not run it. It's built, dry-run-verified, and
reversible. You fire it.

## What it does (28 safe merges)
Re-parents each pseudo-style's variant to its canonical base, filling `size_label` /
`exterior_material_id` only where missing, re-points style children, deletes the emptied
row. `price_history` follows the variant. A rollback file is written on apply.

Examples (full list printed by the dry-run):
- Hermès: `Togo/Clemence/Ostrich/Guilloche Tadelakt Birkin 35` → **Birkin** (+size 35 +leather)
- Hermès: `Toile Herbag MM/31` → **Herbag**; `Evercolor/Clemence Lindy 30` → **Lindy**
- LV: `Monogram Speedy 30/35/40` → **Speedy**; `Monogram Neverfull GM` → **Neverfull**
- Chanel: `Caviar Medallion Tote` → **Medallion Tote**

## What it deliberately does NOT touch (143 flagged)
Anything whose extra word is a sub-model or silhouette, not a leather — these are
DISTINCT bags and must not be collapsed:
- `Neverfull Pouch`, `Félicie Pochette`, `Musette Tango`, `Petit Sac Plat`, `Willow Tote`,
  `Birkin Touch`, `Constance To Go`, `Kelly To Go`, `Speedy Soft` …

Those need a human eye (and often a real second style, not a merge). Left for a later pass.

## Run it
```bash
cd <a fresh worktree or main>          # needs .env.local with SUPABASE_SERVICE_ROLE_KEY
npx tsx scripts/ux-restructure/detect-pseudo-styles.ts     # regenerate the plan (prints safe/flagged)
npx tsx scripts/ux-restructure/merge-pseudo-styles.ts       # DRY-RUN, prints the 28
npx tsx scripts/ux-restructure/merge-pseudo-styles.ts --apply   # execute
# scope to one brand while you gain confidence:
npx tsx scripts/ux-restructure/merge-pseudo-styles.ts --apply --only=louis   # or --only=birkin won't work; brand substring
```
Undo:
```bash
npx tsx scripts/ux-restructure/rollback-pseudo-styles.ts scripts/ux-restructure/rollback-all-28.json --apply
```

## After applying
- `/bag/83` ("Togo Birkin 35") redirects nothing — the variant persists, now under Birkin,
  so the URL still resolves and renders as a Birkin variant.
- Search "birkin" collapses the six cards to one **Birkin** (the catch-all confusion you
  noted disappears on its own).
