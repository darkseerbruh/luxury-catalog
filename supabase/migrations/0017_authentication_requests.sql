-- Luxury Catalog: authentication-marketplace on-ramp (lead capture, v1)
-- Apply after 0008_admin_flag.sql (is_admin) and 0006_social_expert_layer.sql
-- (is_authenticator — the verified experts the tier ladder recruits).
--
-- v1 IS DELIBERATELY MONEY-FREE. A requester asks a verified Authenticator to
-- check a bag; an Authenticator claims the request and the two arrange the actual
-- service + payment OFF-PLATFORM. The platform never takes custody of funds, so
-- this stays out of the Phase C money-transmitter obligations in
-- docs/finance-compliance.md (Stripe Connect / 1099-K / OFAC). When on-platform
-- payments are added later, THAT is the Phase C build and needs an attorney first.
--
-- Degrades gracefully if absent (the bag-page CTA shows a clear "not available
-- yet" path; the hub/queue show empty states).

create type auth_request_status as enum ('open', 'claimed', 'closed');

create table authentication_request (
  request_id bigint generated always as identity primary key,
  variant_id bigint references variant(variant_id) on delete set null,
  -- The requester. Login required (so we can show them status + responses).
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Optional follow-up contact, revealed to the Authenticator only on claim.
  contact_email text,
  details text,
  status auth_request_status not null default 'open',
  -- The Authenticator who took the request.
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index on authentication_request (status, created_at desc);
create index on authentication_request (user_id);
create index on authentication_request (claimed_by);

alter table authentication_request enable row level security;

-- Requester: submit + read their OWN requests (to see status / who claimed).
create policy "authreq_insert_own" on authentication_request
  for insert with check (auth.uid() = user_id);
create policy "authreq_select_own" on authentication_request
  for select using (auth.uid() = user_id);

-- Verified Authenticators may read OPEN requests (the queue) and any they claimed.
-- (The app selects the requester's contact_email only for claimed rows, so an open
-- request in the queue doesn't leak the requester's email before it's taken.)
create policy "authreq_select_authenticator" on authentication_request
  for select using (
    exists (select 1 from profile p where p.id = auth.uid() and p.is_authenticator)
    and (status = 'open' or claimed_by = auth.uid())
  );

-- Verified Authenticators may update (claim / close). The server action narrows
-- this to the safe transitions; RLS just gates who may touch the row at all.
create policy "authreq_update_authenticator" on authentication_request
  for update using (
    exists (select 1 from profile p where p.id = auth.uid() and p.is_authenticator)
  ) with check (
    exists (select 1 from profile p where p.id = auth.uid() and p.is_authenticator)
  );

-- Admins read everything (oversight).
create policy "authreq_select_admin" on authentication_request
  for select using (
    exists (select 1 from profile p where p.id = auth.uid() and p.is_admin)
  );
