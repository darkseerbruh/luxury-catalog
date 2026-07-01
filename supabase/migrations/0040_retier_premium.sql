-- Luxury Catalog — re-tier the Premium houses from 'mid' into the new 'premium' tier.
--
-- Runs AFTER 0039 (which adds the enum value and must commit first). Per the brand
-- tiering audit (LePrix "Luxury Brand Hierarchy" + Rebag 2025 Clair Report): the
-- houses whose icons typically resell ~$700-1,500 on higher volume move to Premium;
-- the Luxury houses (Dior, Bottega, Celine, Saint Laurent, Loewe) stay 'mid'.
--
-- MIGRATION NUMBER 0040 (announced). Idempotent (only touches the named brands).

update brand
   set tier = 'premium'
 where name in ('Gucci', 'Prada', 'Fendi', 'Givenchy', 'Valentino', 'Balenciaga', 'Miu Miu')
   and tier = 'mid';
