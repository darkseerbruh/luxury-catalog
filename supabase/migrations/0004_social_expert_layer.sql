-- Luxury Catalog: social / expert layer (stickiness)
-- Source: docs/handoff.md → "Next major workstream, part 2".
--
-- Builds on the user_bag/review spine from 0002. Turns the private collection
-- into a Poshmark-style public closet, adds closet follows, a data-backed
-- "coveted closet" ranking (powered by inverting our wishlist data), and
-- verified expert/authenticator profiles + an expert post (blog) table.
--
-- PREREQUISITE: Supabase Auth (same as 0002). Not yet applied to the DB.

-- ============ Enums ============

create type post_status as enum ('draft', 'published', 'archived');

-- ============ Table 21: user_profile (1:1 with auth.users) ============
-- The "who is this user" table the whole social layer needs. Trust flags are
-- ADMIN-GRANTED only (never self-serve) — they are the trust signal.

create table user_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  display_name text,
  bio text,
  avatar_url text,
  -- Poshmark-style closet: private by default, public only on opt-in.
  closet_public boolean not null default false,
  is_verified boolean not null default false,
  is_expert boolean not null default false,
  is_authenticator boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- handles: lowercase letters/numbers/underscores, 3–30 chars
  constraint user_profile_handle_format
    check (handle is null or handle ~ '^[a-z0-9_]{3,30}$')
);

create trigger user_profile_set_updated_at
  before update on user_profile
  for each row execute function set_updated_at();

-- ============ Table 22: closet_favorite (follow / love a closet) ============

create table closet_favorite (
  closet_favorite_id bigint generated always as identity primary key,
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_user_id, owner_user_id),
  constraint closet_favorite_not_self check (follower_user_id <> owner_user_id)
);

create index on closet_favorite (owner_user_id);

-- ============ Table 23: post (expert editorial / blog) ============
-- Doubles as GEO content (marketing plan): named-author, fact-dense, citable.

create table post (
  post_id bigint generated always as identity primary key,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  status post_status not null default 'draft',
  -- optional topical links, e.g. "what's coming this Chanel season"
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

-- ============ View: closet_stats ("most coveted closets") ============
-- Per public closet: how many bags they own, the want-demand for those bags
-- (our wishlist data, inverted), and how many users favorite the closet.
-- Runs as the view owner so it can aggregate across RLS-protected user_bag,
-- but exposes ONLY aggregate counts for PUBLIC closets — no private rows leak,
-- and individual "who wants what" is never revealed.

create view closet_stats as
select
  p.user_id,
  p.handle,
  p.display_name,
  p.is_verified,
  p.is_expert,
  p.is_authenticator,
  owned.owned_count,
  demand.want_demand,
  fav.favorite_count
from user_profile p
cross join lateral (
  select count(*)::int as owned_count
  from user_bag b
  where b.user_id = p.user_id and b.status in ('own', 'had')
) owned
cross join lateral (
  select count(*)::int as want_demand
  from user_bag mine
  join user_bag w
    on w.variant_id = mine.variant_id
   and w.status = 'want'
   and w.user_id <> p.user_id
  where mine.user_id = p.user_id and mine.status in ('own', 'had')
) demand
cross join lateral (
  select count(*)::int as favorite_count
  from closet_favorite f
  where f.owner_user_id = p.user_id
) fav
where p.closet_public;

grant select on closet_stats to anon, authenticated;

-- ============ Row Level Security ============

alter table user_profile enable row level security;
alter table closet_favorite enable row level security;
alter table post enable row level security;

-- user_profile: world-readable (public profile fields); each user edits own.
-- Trust flags are only changed by the service role (admin), which bypasses RLS.
create policy user_profile_select_all on user_profile
  for select using (true);
create policy user_profile_insert_own on user_profile
  for insert with check (auth.uid() = user_id);
create policy user_profile_update_own on user_profile
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- closet_favorite: readable by all (drives public counts/feeds); managed by the follower.
create policy closet_favorite_select_all on closet_favorite
  for select using (true);
create policy closet_favorite_write_own on closet_favorite
  for all using (auth.uid() = follower_user_id) with check (auth.uid() = follower_user_id);

-- post: published posts world-readable; authors manage their own drafts.
create policy post_select_published on post
  for select using (status = 'published' or auth.uid() = author_user_id);
create policy post_write_own on post
  for all using (auth.uid() = author_user_id) with check (auth.uid() = author_user_id);

-- Public closets: allow reading another user's owned/had bags when their
-- profile is public. This ORs with the owner-only policy from 0002, so private
-- closets stay private and wishlists (status='want') are never exposed here.
create policy user_bag_select_public_closet on user_bag
  for select using (
    status in ('own', 'had')
    and exists (
      select 1 from user_profile p
      where p.user_id = user_bag.user_id and p.closet_public
    )
  );
