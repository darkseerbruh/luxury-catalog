#!/bin/bash
# PreToolUse hook (Edit|Write|NotebookEdit) — the worktree guard's teeth.
#
# worktree-guard.sh WARNS at session start when two live chats share a folder, but
# on 2026-07-05 six live chats sat in the primary checkout anyway, switching each
# other's branch mid-turn. Warnings get scrolled past; this hook makes the rule
# self-enforcing: a file edit inside a folder where ANOTHER live chat is working
# is BLOCKED (exit 2), with the fix printed. Reads/searches/git are never blocked,
# and edits to files in your OWN isolated worktree always pass — so the escape
# hatch (create a worktree, work there) works immediately.
#
# "Live" here = heartbeat younger than BLOCK_WINDOW. Heartbeats refresh on every
# user prompt (worktree-heartbeat.sh) AND on every edit this hook sees, so an
# actively-editing chat stays warm even during a long autonomous turn.
set -euo pipefail

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] && exit 0

BLOCK_WINDOW=900   # another chat editing/prompting within 15 min counts as live

payload="$(cat 2>/dev/null || true)"
field() { printf '%s' "$payload" | grep -oE "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/'; }
session_id="$(field session_id)"
cwd="$(field cwd)"
file_path="$(field file_path)"
[ -n "$file_path" ] || file_path="$(field notebook_path)"
[ -n "$session_id" ] || exit 0

# Judge the collision by where the FILE lives, not where the session started —
# a chat that moved itself into a fresh worktree must be allowed to edit there
# even though its cwd is still the contested folder.
target_dir="$(dirname "$file_path" 2>/dev/null || true)"
[ -d "$target_dir" ] || target_dir="${cwd:-$PWD}"
top="$(git -C "$target_dir" rev-parse --show-toplevel 2>/dev/null)" || exit 0
common="$(git -C "$target_dir" rev-parse --git-common-dir 2>/dev/null)" || exit 0
case "$common" in /*) ;; *) common="$target_dir/$common" ;; esac
lockdir="$common/claude-session-locks"
mkdir -p "$lockdir"
now="$(date +%s)"

# refresh our own heartbeat (keyed to where WE are working, i.e. the file's tree)
branch="$(git -C "$target_dir" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
printf '%s\t%s\t%s\n' "$now" "$top" "$branch" > "$lockdir/$session_id"

collisions=""
for lock in "$lockdir"/*; do
  [ -f "$lock" ] || continue
  id="$(basename "$lock")"
  [ "$id" = "$session_id" ] && continue
  [ "$id" = "info" ] && continue
  IFS=$'\t' read -r ts ltop lbranch < "$lock" 2>/dev/null || continue
  [ -n "${ts:-}" ] || continue
  age=$(( now - ts ))
  if [ "$ltop" = "$top" ] && [ "$age" -le "$BLOCK_WINDOW" ]; then
    collisions="${collisions}  • session ${id} (branch ${lbranch}, active $((age/60))m ago)"$'\n'
  fi
done
[ -z "$collisions" ] && exit 0

cat >&2 <<EOF
⛔ EDIT BLOCKED — another live chat is working in this same folder ($top):
$collisions
Two live chats in one working tree clobber each other (they share one checked-out
branch and one set of files). Do NOT edit here. Instead:
  1. Create your own worktree and continue there:
       git worktree add -b ops/\$(date +%m%d)-<task> ~/Documents/luxury-catalog-<task> origin/main
     (then edit files under the new folder; this guard keys on the file's location)
  2. Land finished work with scripts/land-to-main.sh — never 'git checkout main'.
If the other session is actually closed, its heartbeat expires in ≤15 min, or
delete its file under: $lockdir/
EOF
exit 2
