-- Luxury Catalog: the three physical-spec columns the bag-page "measured" scales
-- need and the schema did not have.
--
-- WHY (docs/ux/bag-page-build-plan.md, owner-approved 2026-07-26): the bag page
-- presents every data point as a scale. Derived scales come from catalog facts, so
-- a scale we hold no column for simply cannot render. An audit on 2026-07-25 found
-- dimensions/opening/strap-drop columns exist but sit at 0% across 4,409 variants,
-- and weight, closure and pockets had no column at all.
--
--   weight_g       → the "Light ↔ Heavy for its size" scale (grams ÷ volume,
--                    percentile against comparable bags). The felt burden stays an
--                    owner opinion; the mass is a fact.
--   closure_type   → the SECURITY half of "Getting in". Access ease is asked of
--                    owners; how the bag closes is a spec, and the two are separate
--                    axes (an open tote is easy AND insecure).
--   pocket_count   → interior organisation, which the research found people discuss
--                    constantly ("a bottomless pit", 15 of 24 Neverfull sources)
--                    but which is a countable fact, not an opinion.
--
-- Closure vocabulary is a closed set, mirroring how `review.occasion` was
-- structured in 0028. The raw listing phrasings normalise into it (see
-- supabase/ingest/promote-spec-facts.ts): "top zipper"/"zip closure" → zip;
-- "turn-lock"/"turnlock"/"twist lock"/"push lock" → turnlock; "magnetic
-- snap"/"magnetic closure"/"snap lock" → magnetic.
--
-- All three are NULLABLE and stay null until sourced. Per the locked catalog rule,
-- an unknown is recorded as unknown and never guessed.

begin;

alter table variant add column if not exists weight_g integer
  check (weight_g is null or (weight_g > 0 and weight_g < 20000));

alter table variant add column if not exists closure_type text
  check (closure_type is null or closure_type in (
    'zip', 'turnlock', 'magnetic', 'clasp', 'drawstring',
    'buckle', 'flap', 'toggle', 'open'
  ));

alter table variant add column if not exists pocket_count smallint
  check (pocket_count is null or (pocket_count >= 0 and pocket_count < 50));

comment on column variant.weight_g is
  'Empty weight in grams, sourced from the house or a reseller spec. Drives the '
  '"light or heavy for its size" scale (grams / volume). Never estimated.';

comment on column variant.closure_type is
  'How the bag closes. Closed set. Drives the security half of "Getting in"; the '
  'access-ease half is an owner opinion on bag_axis_vote. "open" means no closure '
  '(an open-top tote), which is a real answer, not a missing one.';

comment on column variant.pocket_count is
  'Interior pocket count. A countable fact, deliberately not a vote. Pocket '
  'USEFULNESS stays out of the catalog (per owner: one useless small pocket must '
  'not drag down an otherwise accessible bag).';

-- Partial indexes: every consumer filters on "has this spec", never scans nulls.
create index if not exists variant_weight_g_idx on variant (weight_g) where weight_g is not null;
create index if not exists variant_closure_type_idx on variant (closure_type) where closure_type is not null;

commit;
