-- ============ Migration 0041: tiktok_trend ============
-- Trending TikTok search terms captured from the Creative Center "Saved"
-- keyword list (owner screen-records the list; scripts OCR + parse it). This is
-- the living, auto-updating home for that data after the Google Sheets route was
-- blocked by the owner's Workspace org policies (2026-07-01).
--
-- Admin-only surface: RLS on, NO public SELECT policy. Read via the service-role
-- client (getSupabaseAdmin), same pattern as searched_not_found.
--
-- Two column families:
--   MACHINE (refreshed by supabase/seed/seed-tiktok-trends.ts on every new
--     capture): term, popularity, pop_num, growth_pct, brand, suggested_content,
--     our_page, sat_priority, captured_on, updated_at.
--   HUMAN (owner-edited, PRESERVED across refreshes because the loader omits them
--     from the upsert payload): creators_saturation, content_status, notes.
--
-- popularity/growth_pct are kept as display strings (e.g. "435K", "1000%+") AND
-- pop_num as a sortable integer. sat_priority is our popularity x trend x brand
-- x angle score (see build in docs/tiktok-trending-terms context).

create table if not exists tiktok_trend (
  term                text primary key,
  popularity          text,                 -- display, e.g. "435K"
  pop_num             bigint,               -- sortable
  growth_pct          text,                 -- display, e.g. "1000%+"; verify in-app
  brand               text,
  suggested_content   text,
  our_page            text,                 -- live page this maps to, if any
  sat_priority        numeric,              -- saturation-check priority score
  creators_saturation bigint,               -- HUMAN: creator count from the click-in
  content_status      text,                 -- HUMAN: idea / drafted / posted
  notes               text,                 -- HUMAN: freeform
  captured_on         date not null default current_date,
  updated_at          timestamptz not null default now()
);

alter table tiktok_trend enable row level security;
-- No public policies on purpose: service-role (admin) reads/writes only.
