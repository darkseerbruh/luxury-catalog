-- Luxury Catalog: no-auth email capture for price-drop / availability alerts
-- Source: docs/marketing-plan.md → Tier-2 "owned audience you don't rent".
--
-- Distinct from user_bag.notify_on_availability (that's for signed-in users).
-- This captures an email against a specific bag from anyone, signed in or not —
-- the lightweight watchlist that builds an owned audience pre-auth.

create type bag_alert_kind as enum ('price_drop', 'availability');

create table bag_alert_subscription (
  subscription_id bigint generated always as identity primary key,
  email text not null,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  alert_kind bag_alert_kind not null default 'price_drop',
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unsubscribed boolean not null default false,
  unique (email, variant_id, alert_kind)
);

create index on bag_alert_subscription (variant_id) where not unsubscribed;

-- RLS: anyone (anon) may subscribe; nobody may read via the public API.
-- The alert-sending job reads with the service role, which bypasses RLS.
alter table bag_alert_subscription enable row level security;

create policy bag_alert_insert_anon on bag_alert_subscription
  for insert to anon, authenticated
  with check (true);
