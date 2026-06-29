#!/bin/bash
# UserPromptSubmit hook — keeps this chat's worktree heartbeat warm.
#
# Pairs with worktree-guard.sh (SessionStart). SessionStart only fires once, so without a
# per-turn refresh a long-running chat's lock would age out and stop registering as "live".
# This runs every turn and re-stamps the lock, so the guard's collision check stays accurate
# for the whole session. Silent (no output) and never blocks a turn.
set -euo pipefail

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] && exit 0

payload="$(cat 2>/dev/null || true)"
field() { printf '%s' "$payload" | grep -oE "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/'; }
session_id="$(field session_id)"
cwd="$(field cwd)"
[ -n "$cwd" ] || cwd="${CLAUDE_PROJECT_DIR:-$PWD}"
[ -n "$session_id" ] || session_id="pid-$$"

top="$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null)" || exit 0
common="$(git -C "$cwd" rev-parse --git-common-dir 2>/dev/null)" || exit 0
case "$common" in /*) ;; *) common="$cwd/$common" ;; esac
lockdir="$common/claude-session-locks"
mkdir -p "$lockdir"

branch="$(git -C "$cwd" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
printf '%s\t%s\t%s\n' "$(date +%s)" "$top" "$branch" > "$lockdir/$session_id"
exit 0
