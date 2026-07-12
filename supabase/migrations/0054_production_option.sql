-- 0054_production_option.sql
--
-- The PRODUCTION RECORD that drives the bag-page variant selector (owner decision
-- 2026-07-12): options come from what the house MADE, not from the listings we happen
-- to have. "No listing" ≠ "never made" — a produced option we lack a photo/price for is
-- still a real, selectable option (hedged "no photo yet"); greying a chip means the house
-- never produced it, sourced. One row per (style, axis, value): the sizes, colour
-- families, materials, constructions (etc.) a style was produced in, with permanence
-- (permanent vs seasonal) + provenance. Seeded per style by
-- supabase/ingest/load-production-options.ts from the archivist matrix
-- (docs/research-drafts/classic-flap-production-matrix.md).
--
-- HUMAN-GATED MIGRATION — like 0021–0053, NOT applied or runtime-tested by the authoring
-- session (no Supabase credentials). Apply via GitHub → Actions → "Apply database
-- migrations" → Run workflow (blank input), after 0053.
--
-- Additive: a NEW table, so nothing existing changes. The read layer
-- (src/lib/production-options.ts) is resilient — it returns [] when the table is absent —
-- so the app is unchanged until this is applied AND the loader is run.

create table if not exists production_option (
  id           bigserial primary key,
  style_id     bigint not null references style(style_id) on delete cascade,
  axis         text   not null,   -- size | color | material | construction | hardware
  value        text   not null,   -- 'Small', 'Black', 'Caviar', 'Diamond', ...
  permanence   text,              -- 'permanent' | 'seasonal' | NULL (unknown)
  season_code  text,              -- e.g. '18S' (seasonal colours only)
  is_default   boolean not null default false,  -- e.g. Diamond quilt, Caviar leather
  note         text,              -- hedge / detail shown to the reader
  source       text,              -- provenance (archivist-sourced)
  sort_order   int    not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- One row per (style, axis, value); case-insensitive so 'Black'/'black' can't double up.
create unique index if not exists uq_production_option
  on production_option (style_id, axis, lower(value));

create index if not exists idx_production_option_style
  on production_option (style_id, axis, sort_order);

alter table production_option drop constraint if exists production_option_axis_chk;
alter table production_option add constraint production_option_axis_chk
  check (axis in ('size', 'color', 'material', 'construction', 'hardware'));

alter table production_option drop constraint if exists production_option_permanence_chk;
alter table production_option add constraint production_option_permanence_chk
  check (permanence is null or permanence in ('permanent', 'seasonal'));

comment on table production_option is
  'The production record per style (owner 2026-07-12): sizes/colours/materials/constructions the '
  'house actually made, with permanence + provenance. Drives the bag-page selector options; a '
  'produced-but-unlisted option stays selectable (hedged), and grey-out = never produced, sourced. '
  'Seeded by supabase/ingest/load-production-options.ts from the archivist matrix.';
