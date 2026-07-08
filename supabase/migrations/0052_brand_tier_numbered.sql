-- Luxury Catalog — numbered brand tiers (House Standing formula).
--
-- The brand_tier enum was industry-borrowed (thrift / mid / premium / ultra-luxury)
-- and assigned by hand, which drifted incoherent (Dior "mid" below Gucci "premium",
-- Burberry "thrift"). We replace it with OUR formula: House Standing (a measured
-- resale-market score), cut into numbered bands Tier 1 (highest) -> Tier 5.
-- Formula + band cutoffs: docs/ux/tier-formula-spec.md. Pure core:
-- src/lib/house-standing.ts.
--
-- This migration only ADDS the numeric values to the enum (additive, idempotent).
-- The BACKFILL (setting each brand.tier from its computed band) is done by the
-- report script AFTER this lands:
--   npm run house-standing -- --write
-- The old string values stay in the type (Postgres can't drop enum values without a
-- type rebuild); they are simply unused once every brand is re-tiered. Retiring them
-- + switching the UI labels to "Tier N" is a separate coordinated change (spec §Rollout).
--
-- HUMAN-GATED MIGRATION — like the 002x series, NOT applied by the authoring session
-- (no Supabase credentials in the worktree). Apply via GitHub -> Actions -> "Apply
-- database migrations" -> Run workflow, AFTER this file is on `main`. Then run the
-- backfill above. Safe / idempotent: add-value-if-not-exists throughout.

alter type brand_tier add value if not exists '1';
alter type brand_tier add value if not exists '2';
alter type brand_tier add value if not exists '3';
alter type brand_tier add value if not exists '4';
alter type brand_tier add value if not exists '5';
