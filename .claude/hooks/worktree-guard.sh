#!/bin/bash
# SessionStart hook — worktree collision guard.
#
# THE PROBLEM IT SOLVES: parallel-sessions.md rule #1 says two live chats must never
# share one working folder (a branch switch or stray file in one clobbers the other).
# But the environment keeps dropping fresh chats into the SAME original checkout, so the
# rule gets violated by accident. This guard makes the violation visible.
#
# HOW: every session writes a heartbeat keyed by its Claude session_id into the shared
# git common-dir (shared across all worktrees). At SessionStart we refresh our own
# heartbeat, prune stale ones, then check whether ANOTHER live session is sitting in the
# exact same folder. If so, we WARN and print the command to spin up an isolated
# worktree. Enforcement lives in worktree-collision-block.sh (PreToolUse), which blocks
# the actual file edits — warn-only here proved insufficient on 2026-07-05 (six live
# chats in one folder). This hook also lists live chats in OTHER folders so a fresh chat
# can spot a duplicate of its own lane before starting.
set -euo pipefail

# Web/remote sessions run in isolated containers with no shared filesystem — no collision
# is possible, so this guard is a no-op there.
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] && exit 0

LIVE_WINDOW=10800           # a heartbeat newer than this (3h) counts as a live chat
STALE_WINDOW=86400          # locks older than this (24h) are pruned

# --- read the SessionStart JSON payload from stdin (session_id + cwd) ---
payload="$(cat 2>/dev/null || true)"
field() { printf '%s' "$payload" | grep -oE "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/'; }
session_id="$(field session_id)"
cwd="$(field cwd)"
[ -n "$cwd" ] || cwd="${CLAUDE_PROJECT_DIR:-$PWD}"
[ -n "$session_id" ] || session_id="pid-$$"   # degrade gracefully if no id is provided

# --- locate this worktree + the shared lock registry ---
top="$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null)" || exit 0
common="$(git -C "$cwd" rev-parse --git-common-dir 2>/dev/null)" || exit 0
case "$common" in /*) ;; *) common="$cwd/$common" ;; esac   # make absolute
lockdir="$common/claude-session-locks"
mkdir -p "$lockdir"

now="$(date +%s)"

# --- refresh our own heartbeat: <session_id> -> "epoch<TAB>toplevel<TAB>branch" ---
branch="$(git -C "$cwd" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
printf '%s\t%s\t%s\n' "$now" "$top" "$branch" > "$lockdir/$session_id"

# --- prune stale locks + collect OTHER live sessions (same folder = collision;
# --- elsewhere = FYI so a new chat can spot a duplicate of its own task/lane) ---
collisions=""
elsewhere=""
for lock in "$lockdir"/*; do
  [ -e "$lock" ] || continue
  id="$(basename "$lock")"
  IFS=$'\t' read -r ts ltop lbranch < "$lock" 2>/dev/null || continue
  [ -n "${ts:-}" ] || continue
  age=$(( now - ts ))
  if [ "$age" -gt "$STALE_WINDOW" ]; then rm -f "$lock"; continue; fi
  [ "$id" = "$session_id" ] && continue
  [ "$age" -le "$LIVE_WINDOW" ] || continue
  if [ "$ltop" = "$top" ]; then
    collisions="${collisions}  • session ${id} (branch ${lbranch}, last seen $((age/60))m ago)"$'\n'
  else
    elsewhere="${elsewhere}  • ${lbranch} in ${ltop} ($((age/60))m ago)"$'\n'
  fi
done

# --- ambient line: where am I, and what other worktrees exist ---
printf '🌳 Worktree guard — this chat: %s  ·  branch %s\n' "$top" "$branch"

if [ -n "$collisions" ]; then
  printf '🚨 COLLISION RISK — another live chat is in THIS SAME folder:\n%s' "$collisions"
  printf '   Two live chats in one folder clobber each other (parallel-sessions.md rule #1).\n'
  printf '   File edits here are BLOCKED by the PreToolUse guard (worktree-collision-block.sh).\n'
  printf '   Move THIS chat to its own worktree before editing files:\n'
  printf '     git worktree add -b ops/$(date +%%m%%d-$$) ~/Documents/luxury-catalog-$$ origin/main\n'
  printf '   Existing worktrees you can reuse instead:\n'
  git -C "$cwd" worktree list 2>/dev/null | sed 's/^/     /'
else
  printf '   No other live chat in this folder. Safe to work here.\n'
fi
if [ -n "$elsewhere" ]; then
  printf '👀 Other live chats right now (one live chat per lane — do NOT duplicate their task):\n%s' "$elsewhere"
fi
printf '📤 Land finished work with: bash scripts/land-to-main.sh (never `git checkout main`).\n'
exit 0
