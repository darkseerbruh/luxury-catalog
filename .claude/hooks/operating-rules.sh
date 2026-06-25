#!/bin/bash
# UserPromptSubmit hook — re-injects the owner's standing operating rules on EVERY turn.
#
# SINGLE SOURCE OF TRUTH: the rules are NOT stored here. They live in the
# ENFORCED:start..ENFORCED:end block at the top of docs/preferences.md, and this hook
# reads them live. So updating preferences.md is the only thing anyone ever does — the
# hook (and AGENTS.md, which points at the same block) stay in sync automatically.
set -euo pipefail

PREFS="$CLAUDE_PROJECT_DIR/docs/preferences.md"
[ -f "$PREFS" ] || exit 0   # never block a turn if the file is missing

RULES="$(awk '/ENFORCED:start/{f=1;next} /ENFORCED:end/{f=0} f' "$PREFS")"
[ -n "$RULES" ] || exit 0

printf '[Operating rules — apply to THIS response. Source: docs/preferences.md ENFORCED block.]\n%s\n' "$RULES"
