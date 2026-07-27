-- Luxury Catalog: how a dimension was measured, stored alongside the number.
--
-- WHY: two independent findings on 2026-07-26 say a bare number is not enough.
--
-- 1. The archivist size-era pull found sources measuring different things under the
--    same word. Rebag publishes a Classic Flap Small at 20.3cm BASE length against
--    23cm overall, a 2.7cm gap. Christie's uses W x H x D; Miss Bugis uses L x H x W,
--    so its third figure is depth. Averaging across conventions manufactures a
--    number that describes no bag.
--
-- 2. The reseller capture probe found Fashionphile states "Base length" explicitly,
--    so its span is a BASE measurement, while TheRealReal's "Width" reads as an
--    overall span. Mixing them without recording which is which repeats the error we
--    just reverted, only more subtly, because the result looks plausible.
--
-- So every stored dimension carries its convention and whether a human actually
-- measured the bag or a guide was copied. A guide figure and a measured figure are
-- not the same evidence and must never be averaged together.

begin;

do $$ begin
  create type dimension_convention as enum ('base', 'overall', 'unknown');
exception when duplicate_object then null;
end $$;

alter table variant add column if not exists dimensions_convention dimension_convention
  not null default 'unknown';

alter table variant add column if not exists dimensions_measured boolean;

alter table variant add column if not exists dimensions_source text;

comment on column variant.dimensions_convention is
  'What the stored span means. "base" is measured across the base (Fashionphile), '
  '"overall" is the widest point. Never average across conventions: the gap is real '
  '(2.7cm on a Classic Flap Small) and it looks plausible, which is what makes it '
  'dangerous.';
comment on column variant.dimensions_measured is
  'True when someone measured the actual bag (a reseller listing, an auction lot). '
  'False when copied from a published guide. Different evidence, never averaged.';
comment on column variant.dimensions_source is
  'Where the figure came from, e.g. "fashionphile" or "christies-lot". Lets a wrong '
  'source be retracted wholesale instead of hunting rows one at a time.';

commit;
