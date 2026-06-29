# Bag Stories worklist — "The Story" module rollout

*Live queue for seeding the per-bag editorial "The Story" module (`src/lib/bag-stories/`).
Treatment is locked: Option 1 (category icon + gold edge, stacked cards). Each tidbit
must carry a real cited source (never-invent). Commit after each batch.*

**Metric:** engagement (dwell time, return visits) + GEO (cited origin/design/history
content captures a new query class). Monetization indirect (more qualified sessions at the
buy/sell CTA).

## Status legend
⬜ to do · 🔄 in progress · ✅ seeded (cited) · ⏭ skipped (low lore / mismatch risk)

## Queue (iconic styles, match fragment in parens)
- ✅ Hermès Birkin (`birkin`)
- ✅ Chanel Classic Flap (`classic flap`, `2.55`)
- ✅ Hermès Kelly (`kelly`)
- ✅ Hermès Constance (`constance`)
- ✅ Louis Vuitton Neverfull (`neverfull`)
- ✅ Louis Vuitton Speedy (`speedy`)
- ✅ Louis Vuitton Capucines (`capucines`)
- ✅ Dior Lady Dior (`lady dior`)
- ✅ Dior Saddle (`saddle`)
- ✅ Gucci GG Marmont (`marmont`)
- ✅ Gucci Dionysus (`dionysus`)
- ✅ Gucci Jackie (`jackie`)
- ✅ Gucci Bamboo (`bamboo`)
- ✅ Celine Triomphe (`triomphe`)
- ✅ Saint Laurent Loulou (`loulou`)
- ✅ Fendi Baguette (`baguette`)
- ✅ Fendi Peekaboo (`peekaboo`)
- ✅ Chanel Boy (`boy`)
- ✅ Mulberry Bayswater (`bayswater`)
- ✅ Bottega Veneta Jodie (`jodie`)
- ✅ Loewe Puzzle (`puzzle`)
- ✅ Coach Tabby (`tabby`)
- ✅ Telfar Shopping Bag (`telfar`, `shopping bag`)

## Video layer — GREENLIT + shipped (curated facades + per-intent search link-outs)
- ✅ Capability built (`StoryVideos.tsx`, reuses youtube-nocookie facade).
- ✅ Seeded attributable clips: Birkin (60 Minutes, Harper's BAZAAR), Neverfull (Louis Vuitton), Lady Dior (LUXE.TV).
- ⬜ Expand curated clips to more bags as confidently-attributable videos are found.

## Wave 2 — more bags (match fragment in parens)
- ✅ Louis Vuitton Alma (`alma`)
- ✅ Louis Vuitton Petite Malle (`petite malle`)
- ✅ Dior 30 Montaigne (`30 montaigne`)
- ⬜ Dior Book Tote (`book tote`)
- ✅ Celine Luggage (`luggage`)
- ✅ Gucci Horsebit 1955 (`horsebit`)
- ✅ Saint Laurent Sac de Jour (`sac de jour`)
- ✅ Bottega Veneta Pouch (`pouch`)
- ✅ Prada Galleria (`galleria`)
- ✅ Chloé Paddington (`paddington`)
- ⬜ Chanel Gabrielle (`gabrielle`)
- ⬜ Goyard Saint Louis (`saint louis`, `st louis`)

## DB promotion — style_story table (so content is editable without a deploy)
- ✅ Migration `0033` (after the OO-UX lane's `0032`): `style_story` table, JSONB payload.
- ✅ Loader script: serialize code-defined `BAG_STORIES` into the table (idempotent).
- ✅ `getBagStory` reads DB-first, falls back to code data (resilient; never 404s).
- ⬜ Human-gated: owner applies `0033` + runs the loader; code stays the seed/fallback.

## Notes
- Skip `19`/bare-numeric matches (would false-match `1955`/`1961` style names).
- Each seeded entry: tagline + 3 tidbits (origin/design/culture or trivia) + 2 people.
