-- Luxury Catalog: curated external resources (video reviews) + trusted creators
-- Source: docs/handoff.md → "Embedded resources & curated creators".
--
-- v1 is text-first with NO photos (brief constraint). Embedded YouTube reviews
-- are the visual layer that sidesteps the image-copyright problem — embedding is
-- permitted and the thumbnail comes from YouTube's CDN. We curate a roster of
-- trusted creators who consistently produce quality bag reviews and attach their
-- videos to the right catalog entity (brand / style / variant).
--
-- Public read, admin/service-role write. Applies cleanly without Supabase Auth.

create type creator_platform as enum ('youtube', 'instagram', 'tiktok', 'web');

create type resource_type as enum ('youtube', 'article', 'other');

-- ============ Table 24: creator (curated, trusted reviewers) ============

create table creator (
  creator_id bigint generated always as identity primary key,
  name text not null,
  platform creator_platform not null default 'youtube',
  channel_url text,
  channel_handle text,
  channel_id text,
  description text,
  -- curation flags (admin-set): trusted = vetted source; featured = highlighted
  is_trusted boolean not null default false,
  is_featured boolean not null default false,
  -- if the creator later joins the platform as an expert (0004), link them
  linked_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============ Table 25: resource (an embeddable external resource) ============
-- Attached to a brand, style, and/or variant — at least one. Bag pages roll up
-- style-level videos (a "Birkin review") the way reviews roll up.

create table resource (
  resource_id bigint generated always as identity primary key,
  resource_type resource_type not null default 'youtube',
  title text not null,
  url text not null,
  youtube_video_id text,
  creator_id bigint references creator(creator_id) on delete set null,
  brand_id bigint references brand(brand_id) on delete cascade,
  style_id bigint references style(style_id) on delete cascade,
  variant_id bigint references variant(variant_id) on delete cascade,
  description text,
  published_at date,
  is_featured boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint resource_attached_to_something
    check (brand_id is not null or style_id is not null or variant_id is not null)
);

create index on resource (style_id) where published;
create index on resource (variant_id) where published;
create index on resource (brand_id) where published;
create index on resource (creator_id);

-- ============ Row Level Security ============
-- Public read; curation writes go through the service role (bypasses RLS).

alter table creator enable row level security;
alter table resource enable row level security;

create policy creator_select_all on creator
  for select using (true);

create policy resource_select_published on resource
  for select using (published);
