#!/bin/bash
# land-to-main.sh — the ONE blessed way to land a session branch onto main.
#
# WHY THIS EXISTS: `main` is permanently checked out in the analyst worktree, so
# `git checkout main` FAILS in every other chat ("already checked out elsewhere").
# Chats improvised around it (main-land branches, local merge commits that never
# reached GitHub) and work got stranded. This script lands work WITHOUT ever
# touching a local main checkout, and it serializes the expensive build gate so
# two chats wrapping up at once don't run two `next build`s and thrash the CPU.
#
# WHAT IT DOES (run it from your session worktree, on your session branch):
#   1. refuses to run on main or with uncommitted tracked changes
#   2. fetches + merges origin/main INTO your branch (conflicts resolve here,
#      in your own worktree, never in someone else's)
#   3. takes the shared landing lock (one gate/push at a time across all chats)
#   4. runs the green gate: tsc, lint, build, test
#      — docs-only diffs (only *.md, docs/, .claude/, scripts/*.sh) skip the gate
#   5. pushes your branch to origin main: `git push origin HEAD:main`
#      — if another chat landed first, re-merges and retries (up to 3 tries)
#   6. also pushes the session branch itself as a backup/visibility ref
set -euo pipefail

MAX_PUSH_TRIES=3
LOCK_WAIT_SECS=2400          # wait up to 40 min for another chat's gate to finish
LOCK_STALE_SECS=2700         # a lock older than 45 min is a crashed chat — steal it

top="$(git rev-parse --show-toplevel)"
common="$(git rev-parse --git-common-dir)"
case "$common" in /*) ;; *) common="$top/$common" ;; esac
branch="$(git branch --show-current)"
cd "$top"

fail() { printf '⛔ land-to-main: %s\n' "$1" >&2; exit 1; }

[ -n "$branch" ] || fail "detached HEAD — check out your session branch first."
[ "$branch" != "main" ] && [ "$branch" != "main-land" ] || \
  fail "you are on '$branch'. Land from a session branch, never main itself."
git diff --quiet && git diff --cached --quiet || \
  fail "uncommitted changes on tracked files. Commit them first, then rerun."

# ---------- 1. bring origin/main into the session branch ----------
git fetch origin main
if ! git merge --no-edit origin/main; then
  fail "merge conflict with origin/main. Resolve it here in THIS worktree, commit the merge, rerun this script."
fi

# ---------- 2. decide gate scope ----------
# Docs/hooks/shell-script-only diffs can't break the Next.js app; skip the heavy
# gate for them. ANY other path (src/, supabase/, config, package.json…) = full gate.
gate_scope() {
  local files
  files="$(git diff --name-only origin/main...HEAD)"
  [ -n "$files" ] || { echo "none"; return; }
  if printf '%s\n' "$files" | grep -qvE '(^docs/|^\.claude/|\.md$|^scripts/[^/]+\.sh$)'; then
    echo "full"
  else
    echo "docs"
  fi
}

run_gate() {
  local scope; scope="$(gate_scope)"
  case "$scope" in
    none) echo "🟢 gate: branch is identical to origin/main — nothing to gate." ;;
    docs) echo "🟢 gate: docs/hooks-only diff — build gate skipped (cannot affect the app)." ;;
    full)
      echo "🔒 gate: full green gate (tsc, lint, build, test)…"
      npx tsc --noEmit
      npm run lint
      npm run build
      npm test
      ;;
  esac
}

# ---------- 3. shared landing lock (serializes gate+push across all chats) ----------
lock="$common/claude-land.lock"
release_lock() { rm -rf "$lock"; }
acquire_lock() {
  local waited=0
  while ! mkdir "$lock" 2>/dev/null; do
    # steal a lock left behind by a crashed chat
    local age=$(( $(date +%s) - $(stat -f %m "$lock" 2>/dev/null || echo 0) ))
    if [ "$age" -gt "$LOCK_STALE_SECS" ]; then
      echo "…stealing stale landing lock (${age}s old)."
      rm -rf "$lock"; continue
    fi
    [ "$waited" -eq 0 ] && echo "⏳ another chat is landing (lock held) — waiting for my turn…"
    sleep 20; waited=$(( waited + 20 ))
    [ "$waited" -gt "$LOCK_WAIT_SECS" ] && fail "gave up waiting for the landing lock after $((LOCK_WAIT_SECS/60)) min. If no other chat is mid-landing, remove $lock and rerun."
  done
  printf 'branch=%s pid=%s at=%s\n' "$branch" "$$" "$(date '+%F %T')" > "$lock/info"
  trap release_lock EXIT
}
acquire_lock

# ---------- 4. gate, push, retry on race ----------
run_gate
tries=0
until git push origin HEAD:main; do
  tries=$(( tries + 1 ))
  [ "$tries" -ge "$MAX_PUSH_TRIES" ] && fail "push rejected $MAX_PUSH_TRIES times — main is moving fast. Rerun the script."
  echo "↻ another chat pushed main first — merging their work and retrying ($tries/$MAX_PUSH_TRIES)…"
  git fetch origin main
  git merge --no-edit origin/main || fail "merge conflict on retry. Resolve, commit, rerun."
  # if the retry-merge pulled in app code, the gate result is stale — rerun it
  if ! git diff --quiet HEAD@{1} HEAD -- . ':(exclude)docs' ':(exclude).claude' ':(exclude)*.md' 2>/dev/null; then
    run_gate
  fi
done
release_lock; trap - EXIT

# ---------- 5. push the session branch too, then show evidence ----------
git push -u origin "$branch" >/dev/null 2>&1 || true
git fetch origin main >/dev/null 2>&1 || true
echo ""
echo "✅ landed on main. Evidence:"
git log --oneline -3 origin/main
echo "origin/main == $(git rev-parse --short origin/main); your HEAD == $(git rev-parse --short HEAD)"
