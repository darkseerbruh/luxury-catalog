-- ============ Migration 0033: style_story ============
-- Promotes the per-bag "The Story" editorial content (cited tidbits, the people,
-- curated videos, the tagline) from code into the DB so it can be edited without
-- a deploy. The app degrades gracefully until this is applied: getBagStory reads
-- the table first and FALLS BACK to the code-defined stories (src/lib/bag-stories)
-- on any error or missing row, so every seeded bag keeps showing its story before
-- and after this migration. After applying, run supabase/seed/seed-bag-stories.ts
-- to load the rows; from then on the DB row wins and is the editable source.
--
-- Public, sourced editorial content, so it gets a public SELECT policy. Writes are
-- service-role only (seed/admin), so no insert/update policy is defined here.

create table if not exists style_story (
  story_key   text primary key,                       -- stable key (first match fragment)
  match       text[] not null default '{}',           -- lowercased style-name fragments
  tagline     text not null,
  watch_query text,
  tidbits     jsonb not null default '[]'::jsonb,      -- [{kind,title,body,sources:[{name,url}]}]
  people      jsonb not null default '[]'::jsonb,      -- [{name,role,note}]
  videos      jsonb not null default '[]'::jsonb,      -- [{youtubeId,title,source}]
  updated_at  timestamptz not null default now()
);

alter table style_story enable row level security;

create policy "style_story public read" on style_story
  for select using (true);
