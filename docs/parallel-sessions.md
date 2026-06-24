# Running multiple Claude chats at once without collisions

Two+ chats developing this repo **simultaneously** must NOT share one working folder —
a folder can only have one branch checked out, so a branch switch or stray uncommitted
file in one chat clobbers the other. (We hit this twice on 2026-06-24.) The fix is a
separate **git worktree** per chat: distinct folders, one shared `.git` (same history,
same remote, same branches).

## The setup
| Chat | Folder | Branch |
|---|---|---|
| Data / ingest | `~/Documents/luxury-catalog-data` | `data/market-capture` |
| Shop / UI | `~/Documents/luxury-catalog` (original checkout) | `shop/listings` (own branch, NOT `main`) |
| Integration target | — | `main` — both merge into it |

Create a worktree:  `git worktree add -b <branch> ~/Documents/<folder> origin/main`
List / remove:       `git worktree list` · `git worktree remove <folder>`

**Gitignored local state doesn't copy with a worktree** — after creating one, copy over
`.env.local` (DB creds) and the `data/ingest/` cache, or scripts can't run.

## Rules that keep it clean
1. Each chat stays in **its own folder, on its own branch** off `main`.
2. Each chat edits files **only in its own folder**. Natural split here: ingest/pipeline
   (`supabase/ingest/**`, `scripts/**`) vs. shop UI (`src/app/shop/**`, `src/components/**`).
3. **Land work onto `main`** without touching the other chat's checkout:
   ```
   git fetch origin
   git merge origin/main        # pull in the other chat's merges first
   # …run gates: tsc --noEmit, eslint src, next build, npm test…
   git push origin <your-branch>:main   # fast-forward main on the remote
   ```
   If the push is rejected (other chat merged first), `git merge origin/main` again and retry.

## Shared resources worktrees do NOT isolate
- **Prod Supabase DB** — every chat hits the same database. Coordinate before restructuring
  shared tables. (Data chat writes `price_history` / `discovered_listing`; shop reads them.)
- **Migration numbers** — two chats can both grab `00NN_*.sql` and clash. Whoever adds one
  **announces the number** so the other skips it.
- **The git remote** — last push to `main` wins; always `merge origin/main` before pushing.
