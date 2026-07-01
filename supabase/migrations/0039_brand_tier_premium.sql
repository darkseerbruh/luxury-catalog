-- Luxury Catalog — add the 'premium' value to the brand_tier enum.
--
-- The brand directory standardized on a 4-tier vocabulary: Ultra-luxury / Luxury /
-- Premium / Contemporary. The data keys are ultra-luxury / mid ("Luxury") / premium /
-- thrift ("Contemporary"). This migration only ADDS the enum value; the re-tiering
-- UPDATEs live in 0040, because a newly added enum value cannot be used in the same
-- transaction that adds it.
--
-- MIGRATION NUMBER 0039 (announced). Safe + idempotent.

alter type brand_tier add value if not exists 'premium';
