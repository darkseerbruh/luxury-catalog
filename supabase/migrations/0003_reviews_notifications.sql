-- Luxury Catalog: reviews + notifications
-- Adds user reviews/ratings (powers the Figma rating displays) and an in-app
-- notification feed (the delivery target for price alerts). Apply after 0002.

-- ============ Reviews ============

create table review (
  review_id bigint generated always as identity primary key,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text,
  -- Figma "Durability / Occasion / Worth it?" fields.
  worth_it boolean,
  occasion text,
  durability_rating smallint check (durability_rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, variant_id)
);

create index on review (variant_id);

alter table review enable row level security;

-- Reviews are public to read; writers can only touch their own.
create policy "review_select_all" on review
  for select using (true);
create policy "review_insert_own" on review
  for insert with check (auth.uid() = user_id);
create policy "review_update_own" on review
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "review_delete_own" on review
  for delete using (auth.uid() = user_id);

-- ============ Notifications ============

create type notification_type as enum ('price_alert', 'system');

create table notification (
  notification_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type notification_type not null default 'system',
  title text not null,
  body text,
  variant_id bigint references variant(variant_id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index on notification (user_id, created_at desc);

alter table notification enable row level security;

-- Users read/update their own notifications. Inserts come from the price-alert
-- cron via the service-role key (which bypasses RLS), so no insert policy.
create policy "notification_select_own" on notification
  for select using (auth.uid() = user_id);
create policy "notification_update_own" on notification
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
