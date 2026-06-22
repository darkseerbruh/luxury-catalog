-- Phase 3: pgvector + Voyage embeddings
-- Enable pgvector extension (idempotent; requires Supabase pg_vector extension enabled in the dashboard).
create extension if not exists vector;

-- Add a 1024-dim embedding column to variant (Voyage voyage-multimodal-3.5 outputs 1024 dims).
alter table variant
  add column if not exists embedding vector(1024);

-- HNSW index for approximate nearest-neighbour search (cosine distance).
-- m=16, ef_construction=64 is the Supabase-recommended default for catalogs of this size.
create index if not exists variant_embedding_hnsw_idx
  on variant
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Track when each variant was last embedded so the batch job knows what to (re-)embed.
alter table variant
  add column if not exists embedded_at timestamptz;

-- Add a dense taste vector to user_profile (same 1024-dim space).
alter table user_profile
  add column if not exists taste_embedding vector(1024);

-- HNSW index on user taste vectors (used for "users like you" similarity, future phase).
create index if not exists user_profile_taste_hnsw_idx
  on user_profile
  using hnsw (taste_embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- RPC function used by the hybrid-search vector leg.
-- Returns variant_ids ordered by cosine similarity to a query embedding.
create or replace function match_variants(
  query_embedding vector(1024),
  match_count     int default 60
)
returns table (variant_id bigint, similarity float)
language sql stable
as $$
  select
    variant_id,
    1 - (embedding <=> query_embedding) as similarity
  from variant
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;
