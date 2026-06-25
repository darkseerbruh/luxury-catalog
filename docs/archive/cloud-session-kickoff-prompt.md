# Paste this into the new cloud session

---

You're picking up an in-progress build of Luxury Catalog. A prior local session completed Phases 1-2 of a 6-phase plan; you're continuing from Phase 3. This is a real product build, not a fresh start — read before acting.

Read these files, in this exact order, before doing anything else:

1. `docs/cloud-handoff.md` — current state, environment bootstrap steps (this sandbox won't have the local `.env.local` or toolchain from the prior session), and what's done vs. not
2. `docs/original-session-prompt.md` — the verbatim original brief: phased plan, Arielle's notification protocol, hard constraints, definition of done
3. `docs/product-brief.md` — product vision and source of truth for any product decision
4. `docs/database-schema.md` — the 15-table schema
5. `docs/session-log.md` — chronological log of what's actually been built, with caveats and known gaps
6. `AGENTS.md` (repo root) — this Next.js version has breaking changes from training-data assumptions; read `node_modules/next/dist/docs/` before writing Next.js code

After reading, bootstrap the environment per `docs/cloud-handoff.md` (clone, checkout `claude/desktop-display-test-d621oc`, install Node/Supabase CLI if missing, recreate `.env.local` from the Supabase/Vercel dashboards — ask me for values if you don't have dashboard access). Verify the bootstrap with the checks listed in that doc before writing any code.

Then resume at Phase 3 (Core UI: design system → Home → Search → Item Detail) following the phased plan in `docs/original-session-prompt.md`. Keep following the notification protocol in that doc — rare, specific updates to me, no design/copy approval requests, only flag genuine blockers.
