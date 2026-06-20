-- Luxury Catalog: simplify closet statuses to want / have / had
-- Source: product discussion 2026-06-20.
--
-- Collapses the old researching/wishlist/owned set. "researching" added UX
-- clutter for most users, so it folds into a single "want" list (alerts —
-- via the watchlist table — are what signal higher purchase intent). Adds
-- "had" for previously-owned bags (flippers; lets past owners still review).
--   researching -> want
--   wishlist    -> want
--   owned       -> have
--   (new)       -> had
--
-- Apply after 0002_user_features.sql and before 0006_social_expert_layer.sql,
-- which references the new values.

alter table closet_item alter column status drop default;

create type closet_status_new as enum ('want', 'have', 'had');

alter table closet_item
  alter column status type closet_status_new
  using (
    case status::text
      when 'researching' then 'want'
      when 'wishlist' then 'want'
      when 'owned' then 'have'
    end::closet_status_new
  );

drop type closet_status;
alter type closet_status_new rename to closet_status;

alter table closet_item alter column status set default 'want';
