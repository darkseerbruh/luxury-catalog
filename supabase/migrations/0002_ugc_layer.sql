-- Luxury Catalog: UGC layer (collection ↔ wishlist ↔ reviews)
-- Source: docs/handoff.md → "Next major workstream: the UGC layer"
--
-- Design decisions baked in here:
--   * ONE relationship table (`user_bag`) is simultaneously the collection
--     (status='own'), the wishlist (status='want'), and the flipper's sold
--     history (status='had'). "Notify me when available" is NOT a separate
--     feature — it is a `want` row with notify_on_availability=true.
--   * Granularity is VARIANT level (decided 2026-06-20), e.g. the Kelly 25 in
--     epsom, not "the Kelly". Display rolls up to style in the app layer.
--   * Reviews are OPINION and are walled off from the authoritative catalog.
--     Nothing here ever writes to the production/auth tables in 0001. The
--     "never invent" authentication rule is unaffected.
--
-- PREREQUISITE: Supabase Auth. These tables key off `auth.users(id)`, which
-- exists in every Supabase project by default. RLS is enabled so the policies
-- take effect the moment the app starts sending authenticated requests.

-- ============ Enums ============

create type user_bag_status as enum ('want', 'own', 'had', 'considering');

create type acquisition_channel as enum ('thrift', 'retail', 'resale', 'gift', 'unknown');

create type review_status as enum ('published', 'pending', 'removed');

create type review_tag_value_type as enum ('scale', 'boolean', 'category');

-- ============ Shared updated_at trigger ============

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ Table 16: user_bag (collection + wishlist + history) ============
-- One row per (user, variant). The `status` field is the whole point:
-- it makes the collection, the wishlist, and sold-history the same object.

create table user_bag (
  user_bag_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  status user_bag_status not null,
  -- acquisition detail (this is also the brief's "thrift store find logging")
  acquisition_channel acquisition_channel,
  acquired_at date,
  paid_price numeric(12, 2),
  paid_currency text,
  condition sale_condition,
  -- wishlist availability alerts: a `want` row with this flag is the target of
  -- the "email me when it becomes available" job. No separate alerts table.
  notify_on_availability boolean not null default false,
  notified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, variant_id)
);

create index on user_bag (variant_id);
create index on user_bag (user_id, status);
-- partial index to make the availability-alert sweep cheap
create index on user_bag (variant_id) where status = 'want' and notify_on_availability;

create trigger user_bag_set_updated_at
  before update on user_bag
  for each row execute function set_updated_at();

-- ============ Table 17: review ============
-- Opinion/experience, separate from `user_feedback` (which is about factual
-- accuracy). One review per user per variant. `verified_owner` is set true when
-- the user has (or had) the bag in `user_bag` — our "verified purchase".

create table review (
  review_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  -- soft link to the ownership record this review came from, if any
  user_bag_id bigint references user_bag(user_bag_id) on delete set null,
  rating smallint check (rating between 1 and 5),
  title text,
  body text,
  verified_owner boolean not null default false,
  status review_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, variant_id)
);

create index on review (variant_id) where status = 'published';
create index on review (user_id);

create trigger review_set_updated_at
  before update on review
  for each row execute function set_updated_at();

-- ============ Table 18: review_tag_definition (controlled vocabulary) ============
-- Lock the v1 tag vocabulary here so tags aggregate cleanly into searchable
-- facets. Changing this post-launch fragments aggregation, so treat additions
-- carefully. `allowed_values` enumerates the legal values for `category`/`scale`
-- tags; `boolean` tags use 'yes'/'no'.

create table review_tag_definition (
  tag_key text primary key,
  label text not null,
  value_type review_tag_value_type not null,
  allowed_values text[],
  -- optional pointer at the hard catalog field this soft tag echoes, for the
  -- "route disagreements into the research queue" loop (e.g. fits, carry_method)
  related_catalog_field text,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============ Table 19: review_tag (per-review structured selections) ============

create table review_tag (
  review_tag_id bigint generated always as identity primary key,
  review_id bigint not null references review(review_id) on delete cascade,
  tag_key text not null references review_tag_definition(tag_key),
  tag_value text not null,
  created_at timestamptz not null default now(),
  unique (review_id, tag_key)
);

create index on review_tag (tag_key, tag_value);
create index on review_tag (review_id);

-- ============ Table 20: review_summary (AI synthesis cache) ============
-- Cached "What owners say" synthesis + top tags per variant. Recomputed on a
-- review-count threshold, not per page view. Aggregate-only, no PII.

create table review_summary (
  variant_id bigint primary key references variant(variant_id) on delete cascade,
  summary_text text,
  top_tags jsonb,
  average_rating numeric(3, 2),
  source_review_count integer not null default 0,
  computed_at timestamptz not null default now()
);

-- ============ Aggregation helper: tag facet counts ============
-- Powers "bags owners say hold their shape" style search facets. Counts only
-- published reviews.

create view review_tag_facets as
select
  r.variant_id,
  rt.tag_key,
  rt.tag_value,
  count(*) as review_count
from review_tag rt
join review r on r.review_id = rt.review_id
where r.status = 'published'
group by r.variant_id, rt.tag_key, rt.tag_value;

-- ============ Seed the v1 tag vocabulary ============

insert into review_tag_definition (tag_key, label, value_type, allowed_values, related_catalog_field, description, sort_order) values
  ('holds_shape',        'Holds its shape',        'scale',    array['slumps','holds well','very structured'], null,           'How well the bag keeps its silhouette in use', 10),
  ('true_to_size',       'True to size',           'category', array['smaller than expected','true to size','larger than expected'], null, 'Perceived size vs. expectation', 20),
  ('weight',             'Weight',                 'scale',    array['light','as expected','heavier than it looks'], null,        'Carry weight impression', 30),
  ('leather_break_in',   'Leather over time',      'category', array['softens nicely','stays stiff','slouches too much'], null,   'How the material wears in', 40),
  ('crossbody_comfort',  'Comfortable to carry',   'scale',    array['uncomfortable','okay','very comfortable'], 'carry_method', 'Comfort of the carry/strap drop', 50),
  ('hardware_wear',      'Hardware durability',    'scale',    array['scratches easily','normal wear','very durable'], null,      'How the hardware holds up', 60),
  ('fits_everyday',      'Fits everyday items',    'category', array['too small','just right','roomy'], 'fits',                   'Real-world capacity for daily carry', 70),
  ('worth_the_price',    'Worth the price',        'boolean',  array['yes','no'], null,                                          'Value-for-money verdict', 80),
  ('occasion',           'Best for',               'category', array['everyday','occasion','travel','work'], null,               'Primary use case owners report', 90);

-- ============ Row Level Security ============

alter table user_bag enable row level security;
alter table review enable row level security;
alter table review_tag enable row level security;
alter table review_summary enable row level security;
alter table review_tag_definition enable row level security;

-- user_bag: fully private to its owner.
create policy user_bag_select_own on user_bag
  for select using (auth.uid() = user_id);
create policy user_bag_insert_own on user_bag
  for insert with check (auth.uid() = user_id);
create policy user_bag_update_own on user_bag
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_bag_delete_own on user_bag
  for delete using (auth.uid() = user_id);

-- review: published reviews are world-readable; authors manage their own.
create policy review_select_published on review
  for select using (status = 'published' or auth.uid() = user_id);
create policy review_insert_own on review
  for insert with check (auth.uid() = user_id);
create policy review_update_own on review
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy review_delete_own on review
  for delete using (auth.uid() = user_id);

-- review_tag: readable when the parent review is visible; writable by the author.
create policy review_tag_select on review_tag
  for select using (
    exists (
      select 1 from review r
      where r.review_id = review_tag.review_id
        and (r.status = 'published' or r.user_id = auth.uid())
    )
  );
create policy review_tag_write_own on review_tag
  for all using (
    exists (select 1 from review r where r.review_id = review_tag.review_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from review r where r.review_id = review_tag.review_id and r.user_id = auth.uid())
  );

-- review_summary + vocabulary: public read, writes done server-side via the
-- service role (which bypasses RLS), so no public write policy is granted.
create policy review_summary_select_all on review_summary
  for select using (true);
create policy review_tag_definition_select_all on review_tag_definition
  for select using (true);
