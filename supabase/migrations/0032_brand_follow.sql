-- ============ Migration 0032: Brand follow ============
-- Object-oriented UX Phase 2: a user follows a house (brand) to get a return-visit
-- hook + feed the price-alert loop. One row per (user, brand). The app degrades
-- gracefully until this is applied: the Follow control and follower count read
-- resiliently and simply don't render while the table is absent (getBrandFollowState
-- returns available:false), then light up automatically once it exists.

create table if not exists brand_follow (
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id bigint not null references brand(brand_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, brand_id)
);

create index if not exists brand_follow_brand_idx on brand_follow (brand_id);

alter table brand_follow enable row level security;

-- Each user manages only their own follows. Individual follow rows are never
-- publicly readable (who-follows-whom stays private); the public follower COUNT is
-- read server-side via the service-role client, gated behind a threshold, so no
-- public SELECT policy is needed here.
create policy "brand_follow_select_own" on brand_follow
  for select using (auth.uid() = user_id);
create policy "brand_follow_insert_own" on brand_follow
  for insert with check (auth.uid() = user_id);
create policy "brand_follow_delete_own" on brand_follow
  for delete using (auth.uid() = user_id);
