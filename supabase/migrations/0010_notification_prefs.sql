-- Luxury Catalog: notification preferences
-- Apply after 0006_social_expert_layer.sql (extends `profile`).
--
-- A single jsonb column holds per-channel opt-outs so we don't churn the schema
-- every time a new notification type is added. Absent keys mean "opted in"
-- (default-on), so existing rows need no backfill. The app reads this before
-- creating re-engagement notifications and respects the opt-outs.
--
-- Shape (all optional booleans; false = opted out):
--   {
--     "price_alert":     bool,  -- watchlist price-drop alerts
--     "closet_activity": bool,  -- followed-closet activity + new followers
--     "photo_featured":  bool,  -- your contributed photo was featured
--     "email":           bool   -- master switch for email delivery (in-app stays)
--   }

alter table profile
  add column notification_prefs jsonb not null default '{}'::jsonb;

-- The existing 0002 profile_update_own policy already lets a user update their
-- own row; notification_prefs is a non-privileged column so it is covered. No
-- new policy needed. (is_admin / trust flags remain column-revoked by 0008.)
