-- Luxury Catalog: re-derive the opinion-axis vocabulary from evidence.
--
-- WHY: the original 0012 axis set was an a-priori adaptation of Fragrantica's
-- model (ux-research-brief.md §F). It was never checked against what handbag
-- owners actually discuss and compare on. A 2026-07-25 dimension-discovery pass
-- across six bags spanning tiers (Hermès Birkin, Chanel Classic Flap, Dior Lady
-- Dior, Bottega Jodie, LV Neverfull, Polène/Telfar mid-tier; ~100 sources) found
-- six dimensions missing from the set in EVERY pass, and two axes that cannot be
-- rated coherently. Full evidence: docs/research-drafts/axis-evidence-2026-07.md.
--
-- WHAT CHANGES:
--   REMOVED  versatility       — flagged ambiguous by 5 of 6 passes with an
--                                identical diagnosis: it means carry-modes AND
--                                occasion-range AND outfit-matching, so no two
--                                raters mean the same thing. Its jobs now belong
--                                to `formality` (occasion), stored carry modes
--                                (data), and colour (categorical).
--   REMOVED  roomy_vs_compact  — measures which VARIANT the voter bought, not the
--                                bag. Nobody rates roominess abstractly; they ask
--                                whether a specific object fits. Becomes stored
--                                dimensions + a "what fits" list.
--   REMOVED  holds_value       — a market fact we already own in price_history,
--                                and near-dead weight mid-tier (most owners never
--                                sold). Already excluded from the votable set in
--                                src/lib/axes.ts; now dropped from the enum too.
--   REMOVED  worth_the_price   — duplicates the review `worth_it` boolean, and is
--                                channel/year dependent (a vintage Flap buyer and
--                                a boutique-today buyer answer different
--                                questions). Also already excluded in axes.ts.
--   ADDED    structure         — slouchy ↔ structured. Polar. 6 of 6 passes.
--   ADDED    formality         — casual ↔ dressy. Polar. Named cause of
--                                documented sales ("it was a tote, not a purse").
--   ADDED    access            — locked down ↔ reach right in. Polar, because
--                                security is the trade-off on open-top bags.
--                                The top functional complaint overall.
--   ADDED    upkeep            — baby it ↔ beat it. Polar. What the
--                                caviar-vs-lambskin and vachetta debates are
--                                actually about.
--   ADDED    presence          — quiet ↔ everyone knows it. Polar, and it travels
--                                across tiers: recognisability at the luxury end,
--                                ubiquity at the accessible end (the Neverfull's
--                                largest single theme).
--   ADDED    wears_well        — how it ages, split out of build_quality. All six
--                                passes separate how well a bag was MADE from how
--                                well it SURVIVES, and the "X years later" review
--                                genre is entirely the latter. This axis ABSORBS
--                                review.durability_rating (see below).
--   KEPT     build_quality (rescoped to "as it arrived"), comfort (rescoped to
--            on-the-body carry), everyday_wearability (now the outcome axis).
--
-- ONE RATING SYSTEM, NOT SEVERAL (owner call, 2026-07-25). Subjective 1-5 scales
-- were split across two tables: the axes here, and `review.durability_rating`
-- (0003), which rendered as a SECOND star-rating in the same form. That is the
-- confusing duplication. This migration folds durability_rating into the
-- `wears_well` axis, and src/lib/leaderboards.ts now reads the "Most durable"
-- board from bag_axis_vote. The review column is NOT dropped: the data is COPIED,
-- not moved, so the change stays reversible. The app stops writing it and reads
-- the axis instead.
--
-- Still deliberately outside the axis set, and correctly so: `review.rating` (the
-- overall star summary, a headline rather than a sub-scale), `review.worth_it`
-- (boolean, the kept worth signal), `review.occasion` and `bag_wear.carry`
-- (categorical), `bag_wear.fits_note` (free text). `bag_wear.weight_feel` is the
-- one remaining scale-shaped tap outside the axes; folding it in is a flagged
-- follow-up, not done here.
--
-- The rate/describe split (unipolar judgement vs polar description) lives in
-- src/lib/axes.ts, not here: it is display + capture semantics, not storage.
--
-- SAFETY: this migration is written to run while bag_axis_vote is EMPTY (verified
-- 0 rows in prod on 2026-07-25). Postgres cannot drop an enum value in place, so
-- the type is swapped wholesale. Rows on a REMOVED axis are deleted first and the
-- count is raised as a notice; rows on a KEPT axis are preserved by the cast. If
-- votes have accumulated since, read the notice before trusting the result.

begin;

-- Report and clear any votes on axes that no longer exist. With an empty table
-- this is a no-op; the notice exists so a later run is never silently lossy.
do $$
declare
  removed_count bigint;
begin
  delete from bag_axis_vote
   where axis::text in ('versatility', 'roomy_vs_compact', 'holds_value', 'worth_the_price');
  get diagnostics removed_count = row_count;
  if removed_count > 0 then
    raise notice 'bag_axis v2: deleted % vote(s) on removed axes (versatility, roomy_vs_compact, holds_value, worth_the_price).', removed_count;
  else
    raise notice 'bag_axis v2: no votes on removed axes, clean swap.';
  end if;
end $$;

-- The evidence-derived vocabulary. Order mirrors the UI: the four unipolar
-- "rate it" judgements first, then the five polar "describe it" axes.
create type bag_axis_v2 as enum (
  -- Rate it (unipolar: one end is better)
  'build_quality',
  'wears_well',
  'comfort',
  'everyday_wearability',
  -- Describe it (polar: neither end is better)
  'structure',
  'formality',
  'access',
  'upkeep',
  'presence'
);

-- Swap the column onto the new type. Surviving rows cast by name; the four
-- removed values are already gone, so no row can fail the cast.
alter table bag_axis_vote
  alter column axis type bag_axis_v2 using axis::text::bag_axis_v2;

drop type bag_axis;
alter type bag_axis_v2 rename to bag_axis;

-- ---- Fold review.durability_rating into the wears_well axis ----
-- One rating system, not two. Every durability star becomes a wears_well vote by
-- the same user on the same variant, preserving its original timestamps. COPY,
-- not move: the source column is left intact so this is reversible. `on conflict
-- do nothing` makes the migration safe to re-run and lets an existing axis vote
-- win over the older review field.
do $$
declare
  moved_count bigint;
begin
  insert into bag_axis_vote (user_id, variant_id, axis, value, created_at, updated_at)
  select user_id, variant_id, 'wears_well'::bag_axis, durability_rating, created_at, updated_at
    from review
   where durability_rating is not null
  on conflict (user_id, variant_id, axis) do nothing;
  get diagnostics moved_count = row_count;
  raise notice 'bag_axis v2: copied % durability rating(s) into the wears_well axis.', moved_count;
end $$;

comment on column review.durability_rating is
  'SUPERSEDED 2026-07-25 by the wears_well axis on bag_axis_vote (migration 0059). '
  'Retained for reversibility; the app no longer writes it and the "Most durable" '
  'leaderboard now reads bag_axis_vote. Do not add new readers.';

commit;
