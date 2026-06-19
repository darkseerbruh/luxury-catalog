-- Luxury Catalog: initial schema
-- Source: project schema document, June 2026

create extension if not exists "pgcrypto";

-- ============ Enums ============

create type brand_tier as enum ('thrift', 'mid', 'ultra-luxury');

create type silhouette_type as enum (
  'structured', 'semi-structured', 'slouchy', 'box', 'hobo', 'clutch', 'belt bag', 'tote'
);

create type size_category as enum ('mini', 'small', 'medium', 'large', 'oversized');

create type rigidity_level as enum ('rigid', 'semi-structured', 'slouchy');

create type production_season as enum ('SS', 'FW', 'Resort', 'Pre-Fall');

create type material_category as enum ('leather', 'exotic', 'fabric', 'coated canvas', 'other');

create type resistance_level as enum ('none', 'low', 'medium', 'high');

create type weather_friendliness_level as enum ('poor', 'fair', 'good', 'excellent');

create type hardiness_level as enum ('delicate', 'moderate', 'hardy');

create type confidence_level as enum ('low', 'medium', 'high', 'verified');

create type carry_type as enum (
  'crossbody', 'shoulder', 'crossbody chest', 'belt bag waist',
  'top handle wrist', 'top handle crook of arm', 'hand clutch', 'backpack'
);

create type possible_level as enum ('yes', 'no', 'depends');

create type fits_level as enum ('yes', 'no', 'tight');

create type storage_feature_type as enum (
  'zip pocket', 'open pocket', 'card slot', 'divider',
  'key hook', 'mirror', 'phone pocket', 'pen loop'
);

create type tag_type as enum (
  'serial number', 'date code', 'hologram sticker', 'creed stamp',
  'entrupy tag', 'dust bag code', 'authenticity card', 'RFID chip'
);

create type provenance_item_type as enum (
  'box', 'dust bag', 'authenticity card', 'receipt', 'care booklet', 'ribbon',
  'tissue paper', 'extra hardware', 'spare leather', 'entrupy certificate', 'export certificate'
);

create type sale_condition as enum ('new', 'excellent', 'very good', 'good', 'fair');

create type provenance_completeness as enum ('full set', 'partial', 'none');

create type feedback_record_type as enum ('style', 'variant', 'production', 'material', 'color_combination');

create type feedback_type as enum ('inaccurate', 'missing information', 'confirm accurate', 'request addition');

-- ============ Table 1: Brand ============

create table brand (
  brand_id bigint generated always as identity primary key,
  name text not null unique,
  country_of_origin text,
  founded_year integer,
  tier brand_tier not null,
  description text,
  created_at timestamptz not null default now()
);

-- ============ Table 2: Style ============

create table style (
  style_id bigint generated always as identity primary key,
  brand_id bigint not null references brand(brand_id) on delete cascade,
  name text not null,
  style_family text,
  silhouette silhouette_type,
  closure_type text,
  year_introduced integer,
  redesigned integer,
  discontinued boolean not null default false,
  year_discontinued integer,
  description text,
  created_at timestamptz not null default now(),
  unique (brand_id, name)
);

create index on style (brand_id);

-- ============ Table 5: Material ============
-- Defined before Variant since Variant references it.

create table material (
  material_id bigint generated always as identity primary key,
  name text not null unique,
  material_type material_category not null,
  water_resistance resistance_level,
  scratch_resistance resistance_level,
  weather_friendliness weather_friendliness_level,
  hardiness_overall hardiness_level,
  care_notes text,
  authentication_notes text,
  resale_value_impact text,
  brand_context text,
  created_at timestamptz not null default now()
);

-- ============ Table 3: Variant ============

create table variant (
  variant_id bigint generated always as identity primary key,
  style_id bigint not null references style(style_id) on delete cascade,
  size_label text,
  size_category size_category,
  construction_method text,
  rigidity rigidity_level,
  exterior_material_id bigint references material(material_id),
  exterior_colorway text,
  hardware_color text,
  hardware_type text,
  strap_type text,
  strap_attachment_type text,
  interior_material_id bigint references material(material_id),
  interior_color text,
  interior_matches_exterior boolean,
  stitching_color text,
  stitching_matches_exterior boolean,
  market_availability text,
  year_start integer,
  year_end integer,
  still_in_production boolean not null default false,
  retail_price_original numeric(12, 2),
  currency text,
  authentication_markers text,
  created_at timestamptz not null default now()
);

create index on variant (style_id);
create index on variant (exterior_material_id);
create index on variant (interior_material_id);

-- ============ Table 4: Production Record ============

create table production_record (
  production_id bigint generated always as identity primary key,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  country_of_manufacture text,
  production_year integer,
  production_season production_season,
  dimensions_h_cm numeric(6, 2),
  dimensions_w_cm numeric(6, 2),
  dimensions_d_cm numeric(6, 2),
  opening_width_cm numeric(6, 2),
  opening_height_cm numeric(6, 2),
  hardware_vendor_notes text,
  screw_type text,
  screw_engraving text,
  date_code_format text,
  stamp_placement text,
  stamp_font_notes text,
  known_authentication_markers text,
  sources text,
  confidence_level confidence_level not null default 'low',
  created_at timestamptz not null default now()
);

create index on production_record (variant_id);

-- ============ Table 6: Known Color Combination ============

create table known_color_combination (
  combination_id bigint generated always as identity primary key,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  exterior_color text,
  interior_color text,
  stitching_color text,
  hardware_color text,
  produced boolean not null,
  market text,
  year_range text,
  authentication_notes text,
  confidence_level confidence_level not null default 'low',
  created_at timestamptz not null default now()
);

create index on known_color_combination (variant_id);

-- ============ Table 7: Carry Methods ============

create table carry_method (
  carry_id bigint generated always as identity primary key,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  carry_type carry_type not null,
  possible possible_level not null,
  strap_drop_length_cm numeric(6, 2),
  strap_adjustable boolean,
  notes text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index on carry_method (variant_id);

-- ============ Table 8: Fits ============

create table fits (
  fits_id bigint generated always as identity primary key,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  item_name text not null,
  fits fits_level not null,
  verified boolean not null default false,
  notes text,
  contributor text,
  created_at timestamptz not null default now()
);

create index on fits (variant_id);

-- ============ Table 9: Interior Storage ============

create table interior_storage (
  storage_id bigint generated always as identity primary key,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  production_id bigint references production_record(production_id) on delete set null,
  feature_type storage_feature_type not null,
  quantity integer not null default 1,
  placement text,
  size_notes text,
  material text,
  color text,
  authentication_notes text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index on interior_storage (variant_id);
create index on interior_storage (production_id);

-- ============ Table 10: Serial / Authentication Tags ============

create table serial_tag (
  tag_id bigint generated always as identity primary key,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  production_id bigint references production_record(production_id) on delete set null,
  tag_type tag_type not null,
  format text,
  placement text,
  material text,
  year_range text,
  how_to_read text,
  authentication_notes text,
  verified boolean not null default false,
  confidence_level confidence_level not null default 'low',
  created_at timestamptz not null default now()
);

create index on serial_tag (variant_id);
create index on serial_tag (production_id);

-- ============ Table 11: Locks and Keys ============

create table lock_and_key (
  lock_id bigint generated always as identity primary key,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  production_id bigint references production_record(production_id) on delete set null,
  includes_lock boolean not null default false,
  lock_type text,
  lock_material text,
  lock_engraving text,
  engraving_format text,
  number_of_keys integer,
  key_type text,
  key_engraving text,
  clochette_included boolean,
  clochette_material text,
  missing_lock_value_impact text,
  authentication_notes text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index on lock_and_key (variant_id);
create index on lock_and_key (production_id);

-- ============ Table 12: Provenance & Packaging ============

create table provenance_packaging (
  provenance_id bigint generated always as identity primary key,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  production_id bigint references production_record(production_id) on delete set null,
  item_type provenance_item_type not null,
  included_new boolean,
  description text,
  material text,
  color text,
  branding text,
  format_by_year text,
  authentication_notes text,
  value_impact_if_missing text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index on provenance_packaging (variant_id);
create index on provenance_packaging (production_id);

-- ============ Table 13: Price History ============

create table price_history (
  price_id bigint generated always as identity primary key,
  variant_id bigint not null references variant(variant_id) on delete cascade,
  platform text,
  condition sale_condition,
  provenance_completeness provenance_completeness,
  sale_price numeric(12, 2),
  currency text,
  date_recorded date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index on price_history (variant_id);

-- ============ Table 14: Searched Not Found ============

create table searched_not_found (
  search_id bigint generated always as identity primary key,
  search_query text not null,
  date timestamptz not null default now(),
  result_count integer not null default 0,
  user_id uuid,
  resolved boolean not null default false
);

-- ============ Table 15: User Feedback ============

create table user_feedback (
  feedback_id bigint generated always as identity primary key,
  record_type feedback_record_type not null,
  record_id bigint not null,
  feedback_type feedback_type not null,
  user_note text,
  date timestamptz not null default now(),
  resolved boolean not null default false,
  resolution_notes text
);
