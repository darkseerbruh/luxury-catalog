-- Luxury Catalog: social / expert layer (stickiness)
-- Source: docs/handoff.md → "social / expert layer".
-- Apply after 0002_user_features.sql (extends `profile` and builds on `closet_item`).
--
-- Turns the private closet into a Poshmark-style public closet, adds closet
-- follows, a data-backed "coveted closet" ranking (wishlist demand inverted),
-- and verified expert/authenticator profiles + an expert post (blog) table.

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

-- ============ Extend profile with social + trust fields ============
-- Trust flags (is_verified/is_expert/is_authenticator) are ADMIN-GRANTED only
-- (service role); they are the trust signal and must never be self-serve.

alter table profile
  add column handle text unique,
  add column bio text,
  add column avatar_url text,
  add column closet_public boolean not null default false,
  add column is_verified boolean not null default false,
  add column is_expert boolean not null default false,
  add column is_authenticator boolean not null default false,
  add column updated_at timestamptz not null default now();

alter table profile add constraint profile_handle_format
  check (handle is null or handle ~ '^[a-z0-9_]{3,30}$');

create trigger profile_set_updated_at
  before update on profile
  for each row execute function set_updated_at();

-- Public-facing profiles: opted-in closets + notable (expert/authenticator/
-- verified) accounts are world-readable. Own profile stays covered by the
-- existing profile_select_own policy from 0002 (policies OR together).
create policy "profile_select_public" on profile
  for select using (closet_public or is_expert or is_authenticator or is_verified);

-- Public closets: expose only OWNED items of public profiles. Wishlist /
-- researching stay private. ORs with the owner-only policy from 0002.
create policy "closet_item_select_public" on closet_item
  for select using (
    status = 'owned'
    and exists (select 1 from profile p where p.id = closet_item.user_id and p.closet_public)
  );

-- ============ Table: closet_favorite (follow / love a closet) ============

create table closet_favorite (
  closet_favorite_id bigint generated always as identity primary key,
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_user_id, owner_user_id),
  constraint closet_favorite_not_self check (follower_user_id <> owner_user_id)
);

create index on closet_favorite (owner_user_id);

alter table closet_favorite enable row level security;

create policy "closet_favorite_select_all" on closet_favorite
  for select using (true);
create policy "closet_favorite_write_own" on closet_favorite
  for all using (auth.uid() = follower_user_id) with check (auth.uid() = follower_user_id);

-- ============ Table: post (expert editorial / blog) ============
-- Doubles as GEO content (marketing plan): named-author, fact-dense, citable.

create type post_status as enum ('draft', 'published', 'archived');

create table post (
  post_id bigint generated always as identity primary key,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  status post_status not null default 'draft',
  topic_brand_id bigint references brand(brand_id) on delete set null,
  topic_style_id bigint references style(style_id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on post (status, published_at desc);
create index on post (author_user_id);

create trigger post_set_updated_at
  before update on post
  for each row execute function set_updated_at();

alter table post enable row level security;

create policy "post_select_published" on post
  for select using (status = 'published' or auth.uid() = author_user_id);
create policy "post_write_own" on post
  for all using (auth.uid() = author_user_id) with check (auth.uid() = author_user_id);

-- ============ View: closet_stats ("most coveted closets") ============
-- Per public closet: owned count, want-demand (how many OTHER users have those
-- same bags on their wishlist), and favorite count. Runs as the view owner so
-- it can aggregate across RLS-protected closet_item, but exposes ONLY aggregate
-- counts for PUBLIC closets — no private rows or "who wants what" is revealed.

create view closet_stats as
select
  p.id as user_id,
  p.handle,
  p.display_name,
  p.is_verified,
  p.is_expert,
  p.is_authenticator,
  owned.owned_count,
  demand.want_demand,
  fav.favorite_count
from profile p
cross join lateral (
  select count(*)::int as owned_count
  from closet_item c
  where c.user_id = p.id and c.status = 'owned'
) owned
cross join lateral (
  select count(*)::int as want_demand
  from closet_item mine
  join closet_item w
    on w.variant_id = mine.variant_id
   and w.status = 'wishlist'
   and w.user_id <> p.id
  where mine.user_id = p.id and mine.status = 'owned'
) demand
cross join lateral (
  select count(*)::int as favorite_count
  from closet_favorite f
  where f.owner_user_id = p.id
) fav
where p.closet_public;

grant select on closet_stats to anon, authenticated;
