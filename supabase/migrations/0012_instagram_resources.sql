-- Luxury Catalog: Instagram embeds for the curated-resource layer.
-- Source: docs/social-embed-strategy.md.
--
-- Extends the embed-don't-host model (migration 0004) from YouTube to Instagram.
-- v1 stays text-first with NO photos (brief constraint); embedding sidesteps the
-- image-copyright problem. Instagram posts are rendered via the official
-- authenticated Meta oEmbed Read API (token is server-only), behind the same
-- click-to-load facade the YouTube card uses. See src/lib/instagram.ts.
--
-- NOTE: `creator_platform` already includes 'instagram' (0004) — no change there.
-- Only `resource_type` needs the new value.
--
-- ⚠️ Postgres requires `ALTER TYPE ... ADD VALUE` to run OUTSIDE a transaction,
-- and the new value cannot be used in the SAME transaction it was added in. Keep
-- this migration to the enum add + nullable column adds only; do not INSERT rows
-- that use the 'instagram' value here.

alter type resource_type add value if not exists 'instagram';

-- Cache columns for the facade poster so rendering a bag page does not require a
-- live oEmbed token call on every request. Populated at curation/seed time (or
-- lazily) from the Meta oEmbed Read response. All nullable + additive: the
-- existing YouTube path is unaffected.
alter table resource add column if not exists embed_html text;
alter table resource add column if not exists thumbnail_url text;
alter table resource add column if not exists author_name text;

-- No RLS change needed: `resource` already exposes public read where published.
