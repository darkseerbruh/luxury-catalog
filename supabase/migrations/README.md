# Migration conventions

Read this BEFORE writing a new migration file.

## Every new table MUST enable RLS — no exceptions

Supabase's default privileges grant the public `anon` role FULL write
(insert/update/delete/truncate) on every new table in `public`. A `create table`
without RLS means anyone with the site's public anon key (it ships in the page
JavaScript) can edit or delete the data. This bit us on 2026-07-14: two tables
(`lc_index_snapshot` from 0049, `production_option` from 0054) shipped without
RLS and were publicly writable until 0057 closed the hole.

Boilerplate for every `create table` — include it in the SAME migration:

```sql
alter table <table> enable row level security;

-- Public catalog data the app reads with the anon key:
create policy <table>_select_all on <table>
  for select using (true);

-- Belt-and-braces: writes are service-role only (bypasses RLS).
revoke insert, update, delete, truncate, references, trigger
  on <table> from anon, authenticated;
```

Per-user tables (closet, watchlist, votes) use `auth.uid()`-scoped policies
instead of `select_all` — copy the pattern from 0003_reviews_notifications.sql.

If a table is created OUTSIDE a migration (a one-off script, another session,
the SQL editor), the same rule applies — run the boilerplate immediately.

## Other conventions

- Numbering: next 4-digit prefix after the highest existing file; never reuse.
- Migrations are HUMAN-GATED: the owner applies them via GitHub → Actions →
  "Apply database migrations" (see .github/workflows/db-migrate.yml).
- Header comment states what/why, app impact, and that it's human-gated
  (copy the tone of 0054_production_option.sql).
- Idempotent where possible: `if not exists` / `drop ... if exists` guards.
