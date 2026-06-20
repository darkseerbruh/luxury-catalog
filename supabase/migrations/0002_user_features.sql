-- Luxury Catalog: user accounts & engagement features
-- Adds: user profiles, the closet (saved bags), the watchlist (price alerts),
-- and the write side of the feedback loop (bag-addition requests + thrift finds).
--
-- Depends on Supabase Auth (auth.users). Apply after 0001_init_schema.sql.

-- ============ Enums ============

create type closet_status as enum ('researching', 'wishlist', 'owned');

-- Mirrors the five personas in docs/product-brief.md.
create type user_persona as enum (
  'collector', 'flipper', 'first-purchase', 'authentication', 'thrift-hunter'
);

create type find_condition as enum ('new', 'excellent', 'very good', 'good', 'fair', 'unknown');

-- ============ Table 16: Profile (1:1 with auth.users) ============

create table profile (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  persona user_persona,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profile enable row level security;

create policy "profile_select_own" on profile
  for select using (auth.uid() = id);
create policy "profile_insert_own" on profile
  for insert with check (auth.uid() = id);
create policy "profile_update_own" on profile
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============ Table 17: Closet (saved bags) ============

create table closet_item (
  closet_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  status closet_status not null default 'researching',
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, variant_id)
);

create index on closet_item (user_id);

alter table closet_item enable row level security;

create policy "closet_all_own" on closet_item
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ Table 18: Watchlist (price alerts) ============

create table watchlist (
  watch_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  target_price numeric(12, 2),
  currency text,
  alert_enabled boolean not null default true,
  last_notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, variant_id)
);

create index on watchlist (user_id);

alter table watchlist enable row level security;

create policy "watchlist_all_own" on watchlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ Table 19: Bag addition requests ============
-- "Searched but not found -> request this bag be added." Anonymous-friendly:
-- user_id is null for logged-out requesters. Read by the admin dashboard via
-- the service-role key, so no public SELECT policy is granted.

create table bag_request (
  request_id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  brand text,
  style text,
  search_query text,
  details text,
  created_at timestamptz not null default now(),
  resolved boolean not null default false
);

create index on bag_request (created_at desc);

alter table bag_request enable row level security;

-- Anyone may submit a request; logged-in users may only attribute it to themselves.
create policy "bag_request_insert_any" on bag_request
  for insert with check (user_id is null or auth.uid() = user_id);

-- ============ Table 20: Thrift-store find logging ============
-- "What did you find? What did you pay?" Same anonymous-friendly model as bag_request.

create table thrift_find (
  find_id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  brand text,
  style text,
  where_found text,
  price_paid numeric(12, 2),
  currency text,
  condition find_condition,
  authentic_guess text,
  note text,
  created_at timestamptz not null default now()
);

create index on thrift_find (created_at desc);

alter table thrift_find enable row level security;

create policy "thrift_find_insert_any" on thrift_find
  for insert with check (user_id is null or auth.uid() = user_id);

-- ============ Auto-create a profile row on signup ============

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profile (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
