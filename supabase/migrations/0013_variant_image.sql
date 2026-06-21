-- Luxury Catalog: per-variant primary image URL (launch visuals pipeline).
-- Source: docs/ux/ux-evaluation.md (visuals) — BagImage renders this when present,
-- else a branded placeholder. Photos must be SOURCED (licensed / reseller-feed with
-- image rights / first-party / UGC) — never AI-generated or hotlinked unlicensed,
-- per the product brief.
--
-- HUMAN-GATED MIGRATION — like 0007–0012, NOT applied or runtime-tested by the
-- authoring session (no Supabase credentials). Apply after 0012. Until applied the
-- app degrades gracefully: getVariantImages() catches the missing column and
-- returns no URLs, so every surface keeps showing the placeholder (no errors).
--
-- A single primary image per variant is enough for launch. Multiple photos / UGC
-- attribution can come later as a bag_photo table (handoff contributor system),
-- which BagImage can consume the same way.

alter table variant add column image_url text;

-- Optional provenance for the image, so sourcing/licensing is auditable. Nullable;
-- no backfill needed.
alter table variant add column image_source text;
