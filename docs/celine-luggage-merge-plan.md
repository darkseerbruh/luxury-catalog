# Celine "Luggage" duplicate — merge/cleanup dry-run plan (OWNER-GATED)

*Prepared 2026-06-23. Destructive (a delete), so it is **not executed** — this is the
plan for the owner to approve. See `docs/catalog-backbone-handoff.md` §5/§7.6.*

## The duplicate

Two Celine styles describe the same bag:

| Style | Name | Variants | Price rows | Other refs |
|---|---|---|---|---|
| **#207** | `Luggage` | **0** | **0** | closet 0 · review 0 · summary 0 |
| **#484** | `Luggage Tote` (backbone canonical) | 4 (Nano/Micro/Mini/Medium) | 185 | — |

All resale data was deliberately loaded onto the clean backbone canonical **#484
"Luggage Tote"** (the matcher scores the exact backbone name highest, so the verbose
legacy row was bypassed). **#207 is an empty orphan** — it carries no variants, no
price history, and nothing in closet / reviews / watchlist / `variant_price_summary`
points at it.

## What "merge" means here

Because #207 holds **no data**, there is nothing to migrate. The cleanup is a single
safe row delete, not a re-point. Concretely:

```sql
-- VERIFY FIRST (must all return 0):
select count(*) from variant where style_id = 207;          -- expect 0
-- (no variants ⇒ no price_history / closet_item / review can reference #207)

-- THEN delete the empty duplicate style:
delete from style where style_id = 207 and brand_id = 202;  -- "Luggage" under Celine
```

No `price_history`, `variant`, `closet_item`, or `review` rows are touched. The live
`/bag/[id]` pages are per-variant, and #207 has no variants, so no public URL changes.

## Recommendation

**Safe to approve.** This is the lowest-risk item in the catalog-cleanup backlog: a
pure dedup delete of an empty style, fully additive-safe to the live app. If the owner
prefers extra caution, keep #207 (an empty style is harmless — it never resolves and
never renders); the only benefit of deleting is a tidier brand style list.

## How to run it (when approved)

Add a guarded migration (the project applies DB changes via the **GitHub → Actions →
"Apply database migrations"** workflow, merged to `main` first):

```sql
-- supabase/migrations/00NN_drop_empty_celine_luggage_dupe.sql
delete from style where style_id = 207 and brand_id = 202
  and not exists (select 1 from variant where variant.style_id = 207);
```

The `not exists` guard makes it a no-op if anything ever attaches to #207 before it
runs — so it can never delete a style that has gained data.
