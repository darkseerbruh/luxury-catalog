-- 0031: bag aliases — the "also known as" set per canonical bag.
--
-- Powers the bag-page alias block + JSON-LD alternateName (authority + GEO). Keyed by
-- (brand, canonical_model) INDEPENDENT of the (verbose/polluted) style table, so it can
-- be populated from the categorizer + reseller-name aggregation + community nicknames
-- without waiting on catalog cleanup. Three alias layers via source_type:
--   official  — Chanel/house + curated dictionary (the canonical name itself)
--   reseller  — the distinct name each marketplace uses (aggregate-aliases.ts)
--   community — collector/forum nicknames (community-bag-nicknames.json)

create table if not exists bag_alias (
  bag_alias_id    bigint generated always as identity primary key,
  brand           text not null,
  canonical_model text not null,
  tier            text,                       -- icon | named | seasonal | null
  alias           text not null,
  source_type     text not null check (source_type in ('official','reseller','community')),
  source          text,                       -- Chanel | TheRealReal | Fashionphile | PurseForum | FB group | ...
  listing_count   integer not null default 0,
  created_at      timestamptz not null default now()
);

-- one row per (bag, alias, source); re-runs upsert on this key
create unique index if not exists bag_alias_uniq
  on bag_alias (brand, canonical_model, lower(alias), coalesce(source, ''));
create index if not exists bag_alias_lookup
  on bag_alias (brand, canonical_model);

-- Public catalog reference data: anon read, writes via service role only (mirrors 0029).
alter table bag_alias enable row level security;
drop policy if exists bag_alias_public_read on bag_alias;
create policy bag_alias_public_read on bag_alias for select using (true);
