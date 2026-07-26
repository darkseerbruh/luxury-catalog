-- Luxury Catalog: exterior dimensions on `variant`.
--
-- CORRECTING THE RECORD: migration 0064's comment claimed dimension columns
-- already existed and sat at 0% coverage. That was wrong, and the promote pass
-- proved it by failing on every write ("Could not find the 'dimensions_d_cm'
-- column"). `variant` has size_label and size_category (words like "Medium"),
-- rigidity, and strap fields, but has never held a NUMBER for how big a bag is.
--
-- Why it matters: several bag-page reads want real magnitudes, not words.
--   * "Light or heavy for its size" needs grams over volume, so weight_g (0064)
--     is useless on its own.
--   * "Holds less than it looks" is exactly apparent volume vs what fits, and
--     apparent volume is h x w x d.
--   * Comparing two sizes of the same style ("is the 25 actually small?") is a
--     numeric question the size_label cannot answer.
--
-- Centimetres, because the sources state both and one unit has to win. The
-- promote pass converts inches and REFUSES anything unit-ambiguous rather than
-- guessing, which is why coverage will be honest but thin.
--
-- All nullable. Per the locked catalog rule an unsourced dimension stays null and
-- is never estimated from a photo or a similar bag.

begin;

alter table variant add column if not exists dimensions_h_cm numeric(5,1)
  check (dimensions_h_cm is null or (dimensions_h_cm >= 3 and dimensions_h_cm <= 120));
alter table variant add column if not exists dimensions_w_cm numeric(5,1)
  check (dimensions_w_cm is null or (dimensions_w_cm >= 3 and dimensions_w_cm <= 120));
alter table variant add column if not exists dimensions_d_cm numeric(5,1)
  check (dimensions_d_cm is null or (dimensions_d_cm >= 1 and dimensions_d_cm <= 60));

-- Handle or strap drop: the distance from the top of the bag to the top of your
-- shoulder when carried. The single most-argued spec in the Birkin corpus (9 of 14
-- sources) and answered authoritatively nowhere, which makes it citable content as
-- well as a filter ("does it clear a coat").
alter table variant add column if not exists strap_drop_cm numeric(4,1)
  check (strap_drop_cm is null or (strap_drop_cm >= 1 and strap_drop_cm <= 80));

comment on column variant.dimensions_h_cm is
  'Exterior height in cm. Sourced, never estimated. Feeds the size and capacity '
  'reads; with weight_g it gives density (light or heavy for its size).';
comment on column variant.dimensions_w_cm is 'Exterior width in cm. Sourced, never estimated.';
comment on column variant.dimensions_d_cm is 'Exterior depth in cm. Sourced, never estimated.';
comment on column variant.strap_drop_cm is
  'Handle or strap drop in cm. The most-argued spec in the research and answered '
  'authoritatively nowhere; also decides whether a bag clears a coat.';

-- Partial index: consumers filter on "has dimensions", never scan nulls.
create index if not exists variant_dimensions_idx
  on variant (dimensions_h_cm, dimensions_w_cm, dimensions_d_cm)
  where dimensions_h_cm is not null;

commit;
