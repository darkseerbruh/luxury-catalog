# Running multiple Claude chats at once without collisions

*This doc is the **worktree mechanics**. The **lane ownership + live status** (who owns which
files, what each lane is mid-doing) live in the **Active-lanes registry** at the top of
[handoff.md](handoff.md) — that is the source of truth a new chat hydrates from. Read it first;
this doc is how you physically isolate the work.*

Two+ chats developing this repo **simultaneously** must NOT share one working folder —
a folder can only have one branch checked out, so a branch switch or stray uncommitted
file in one chat clobbers the other. (We hit this twice on 2026-06-24.) The fix is a
separate **git worktree** per chat: distinct folders, one shared `.git` (same history,
same remote, same branches).

## The setup (one worktree per lane — see the registry for what each owns)
| Lane | Folder | Branch |
|---|---|---|
| Content / editorial | `~/Documents/luxury-catalog-content` | `content/editorial` |
| Data / ingest | `~/Documents/luxury-catalog-data` | `data/market-capture` |
| UX / shop + auth-UX | `~/Documents/luxury-catalog` (original checkout) | `shop/listings` (own branch, NOT `main`) |
| Infra / ops (catch-all) | a fresh worktree per task | `ops/<task>` |
| Integration target | — | `main` — every lane merges into it |

Create a worktree:  `git worktree add -b <branch> ~/Documents/<folder> origin/main`
List / remove:       `git worktree list` · `git worktree remove <folder>`

**Gitignored local state doesn't copy with a worktree** — after creating one, copy over
`.env.local` (DB creds) and the `data/ingest/` cache, or scripts can't run. For deps, run
**`npm install` in the worktree** — do NOT symlink `node_modules` to the main checkout: Turbopack
(`next build`) rejects a `node_modules` symlink that points out of the project root and fatal-errors.
(tsc/eslint/vitest tolerate the symlink; only the build breaks — so the symlink hides the problem until build time.)

## Rules that keep it clean

> **Automated backstop (hardened 2026-07-05):** every chat heartbeats by its Claude
> `session_id` into the shared git common-dir (`worktree-guard.sh` at SessionStart +
> `worktree-heartbeat.sh` every turn). Two layers act on it:
> **(1) warn** — the SessionStart guard prints a collision banner with the `git worktree add`
> one-liner when another live chat shares your folder; **(2) block** — a PreToolUse hook
> (`worktree-collision-block.sh`) REJECTS any file edit inside a folder where another chat
> was active in the last 15 min, printing the escape hatch. The block keys on the edited
> FILE's location, so a chat that moves itself into a fresh worktree can edit there
> immediately. (Warn-only proved insufficient: on 2026-07-05 six live chats shared the
> primary checkout and switched each other's branch mid-turn.) No-op on remote/web sessions.

1. Each chat stays in **its own folder, on its own branch** off `origin/main`.
   **One live chat per lane/task** — if the guard shows another live chat already on your
   task (same branch or same lane), do NOT start a duplicate: tell the owner and stop.
   Duplicate chats burn the shared Claude usage limit doing the same work twice.
2. Each chat works **only in its own folder** (its worktree). Within that folder a chat may
   edit **any file its task needs** — lanes are not file-fences (see the registry). The only
   collision risk is two **live** chats editing the same files at once; when that happens, the
   natural split is ingest/pipeline (`supabase/ingest/**`, `scripts/**`) vs. shop UI
   (`src/app/**`, `src/components/**`).
3. **Land work onto `main` with `bash scripts/land-to-main.sh`** — run from your session
   branch, in your worktree. It does the whole race-safe sequence for you: merge
   `origin/main` into your branch → green gate (docs-only diffs skip it) → shared landing
   lock (so two chats never run `next build` at the same time — this was the CPU killer) →
   `git push origin HEAD:main` with automatic re-merge + retry when another chat lands
   first. **Never `git checkout main`** — local `main` is permanently checked out in the
   analyst worktree (`~/Documents/luxury-catalog-analyst`), so the checkout fails in every
   other folder; that failure is how landed-looking work used to get stranded off GitHub.

## Shared resources worktrees do NOT isolate
- **Prod Supabase DB** — every chat hits the same database. Coordinate before restructuring
  shared tables. (Data chat writes `price_history` / `discovered_listing`; shop reads them.)
- **Migration numbers** — two chats can both grab `00NN_*.sql` and clash. Whoever adds one
  **announces the number** so the other skips it.
- **The git remote** — last push to `main` wins; always `merge origin/main` before pushing.
