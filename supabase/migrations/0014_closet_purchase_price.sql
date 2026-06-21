-- Luxury Catalog: acquisition price on closet items (collection-report cost basis).
-- Source: docs/ux/ux-evaluation.md (collection report) — enables gain/loss for the
-- tax angle, distinct from the insurance/estate "current value" already shown.
--
-- HUMAN-GATED MIGRATION — like 0007–0013, NOT applied or runtime-tested by the
-- authoring session (no Supabase credentials). Apply after 0013. Until applied the
-- app degrades gracefully: getPurchaseInfo() catches the missing columns and the
-- report simply omits the Paid / Gain-loss columns — nothing breaks.
--
-- These are owner-private (what you paid). No new RLS policy needed: the 0002
-- closet_item own-row policies already gate select/update to the owner, and these
-- are non-privileged columns on that row.

alter table closet_item add column purchase_price numeric;
alter table closet_item add column purchase_currency text;
alter table closet_item add column purchase_date date;
