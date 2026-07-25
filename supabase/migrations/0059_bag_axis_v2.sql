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
--   KEPT     build_quality (rescoped to "as it arrived"), comfort (rescoped to
--            on-the-body carry), everyday_wearability (now the outcome axis).
--
-- ONE EVIDENCE-BACKED AXIS DELIBERATELY *NOT* ADDED: "how it ages". All six
-- passes wanted build_quality split into craft-as-it-arrived vs how-it-survives,
-- and that split is real. But `review.durability_rating` (0003) ALREADY captures
-- how-it-survives and already powers the "Most durable" homepage leaderboard
-- (src/lib/leaderboards.ts). Adding a `wears_well` axis would ask the same
-- question twice in the same form and split the signal across two tables. So the
-- split ships as: build_quality = as it arrived (here) + durability_rating = over
-- time (on review). Unifying the two into one system is a live follow-up, not a
-- silent breaking change.
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

commit;
