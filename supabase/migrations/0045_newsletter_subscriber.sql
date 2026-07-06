-- Luxury Catalog: newsletter opt-in capture (the missing email channel in
-- docs/automation-map.md). CAPTURE ONLY: this table stores who asked for the
-- newsletter and where they asked from. No sending/campaigns ship with this
-- migration; double opt-in (confirmed -> true) and unsubscribe handling land
-- with the first Resend send, so `confirmed` stays false and `unsubscribed_at`
-- stays null until that pipeline exists.
--
-- The app degrades gracefully if this is absent: subscribeNewsletter
-- (src/lib/newsletter-actions.ts) catches the missing-table error and returns
-- a friendly "not available yet" result, so merging code before applying this
-- migration never 500s (the owner applies migrations via the GitHub Action
-- after merge).

create table if not exists newsletter_subscriber (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  -- Which placement captured the signup (footer, articles_index, homepage,
  -- taste_page, ...). Feeds the newsletter_subscribed analytics event too.
  source text,
  created_at timestamptz not null default now(),
  -- Double opt-in flag; flipped by the (future) confirmation email flow.
  confirmed boolean not null default false,
  -- Set by the (future) unsubscribe flow; a row is never hard-deleted so a
  -- re-subscribe after unsubscribe keeps its history.
  unsubscribed_at timestamptz
);

-- Emails are PII: lock the table down completely for anon/authenticated.
-- There are deliberately NO policies — only the service-role client (which
-- bypasses RLS; src/lib/supabase/admin.ts) can read or write rows, and it only
-- runs server-side.
alter table newsletter_subscriber enable row level security;
