-- Revert variant 199 (Chanel Classic Flap Medium) to the default branded
-- placeholder by clearing its sourced photo. BagImage renders image_url when
-- present, else the luxury placeholder tile, so nulling these two fields makes
-- /bag/199 show the default unpopulated icon again.
--
-- Data-only change; reversible by re-running the image import feed.
UPDATE variant
SET image_url = NULL,
    image_source = NULL
WHERE variant_id = 199;
