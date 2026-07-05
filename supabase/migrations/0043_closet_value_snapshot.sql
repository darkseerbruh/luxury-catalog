-- 0043: closet value snapshots — the collector's "value over time" (her named
-- pain point: a portfolio view that won't show value over time). A scheduled
-- job writes one row per user per run; /closet renders a sparkline once two
-- or more points exist. The app degrades gracefully until this is applied
-- (no sparkline, nothing else changes).

create table if not exists closet_value_snapshot (
  snapshot_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  taken_on date not null default current_date,
  -- Summed resale medians across the user's valued "have" bags (dominant
  -- currency), plus coverage so the number is never read as complete when it
  -- isn't.
  total numeric not null,
  currency text,
  valued integer not null,
  bag_count integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, taken_on)
);

alter table closet_value_snapshot enable row level security;

-- Users read their own history; writes are service-role only (the cron),
-- so no insert/update/delete policies for authenticated users.
create policy "closet_value_snapshot_select_own"
  on closet_value_snapshot for select
  using (auth.uid() = user_id);

create index if not exists closet_value_snapshot_user_date
  on closet_value_snapshot (user_id, taken_on);
