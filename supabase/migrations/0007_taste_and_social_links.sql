-- Luxury Catalog: taste vector + social links (engagement / recommendations track)
-- Source: docs/engagement-strategy.md §2–§3, docs/handoff.md.
-- Apply after 0006_social_expert_layer.sql (extends `profile`).
--
-- Adds three columns to `profile`:
--   * social_links     — IG/TikTok/YouTube/Poshmark/Substack handles for the
--                        public profile (display-only, rendered rel="nofollow ugc").
--   * taste_vector     — the structured taste profile written by the /quiz and
--                        derived from closet + watchlist. Drives content-based
--                        "bags you might like". JSON of dimension -> weighted values.
--   * taste_completeness — 0–100 progress meter for the Taste Map ("answer N more").
--
-- These are SELF-SERVE, owner-editable fields (unlike the admin-granted trust
-- flags added in 0006). RLS is unchanged: the owner-update policy from 0002
-- (`profile_update_own`) already governs writes; the public-read policy from
-- 0006 (`profile_select_public`) already governs reads of opted-in profiles.

alter table profile
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists taste_vector jsonb,
  add column if not exists taste_completeness int not null default 0;

alter table profile
  add constraint profile_taste_completeness_range
  check (taste_completeness >= 0 and taste_completeness <= 100);

comment on column profile.social_links is
  'Display-only social handles {instagram,tiktok,youtube,poshmark,substack,website}. Rendered rel="nofollow ugc".';
comment on column profile.taste_vector is
  'Structured taste profile from /quiz + closet + watchlist. Drives content-based recommendations.';
comment on column profile.taste_completeness is
  'Taste Map completeness 0–100 ("answer N more to sharpen recommendations").';

-- ============ New re-engagement notification types ============
-- Extends the notification_type enum from 0003 ('price_alert','system') with the
-- two social re-engagement events from the strategy doc §1g / build-order #6.
-- Inserted by the closet-favorite / featured-photo flows (service role or the
-- acting user's own session). `closet_followed` links to no variant; the body
-- carries the actor handle. ALTER TYPE ... ADD VALUE is idempotent via IF NOT EXISTS.

alter type notification_type add value if not exists 'closet_activity';
alter type notification_type add value if not exists 'photo_featured';
