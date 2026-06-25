#!/bin/bash
# SessionStart hook — doc-bloat guard. Runs ONCE per session (not per turn, so it never
# nags) and warns when the always-loaded docs drift over budget, prompting a cleanup pass.
# This is the automated backstop for the "keep docs lean" rule in AGENTS.md. Budgets sit a
# little above the known-good sizes so the guard fires on real growth, not normal edits.
set -euo pipefail
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

# --- budgets (raise deliberately if a doc legitimately needs to grow) ---
BLOCK_MAX=1300      # chars in the per-turn ENFORCED block (it's injected EVERY turn; raised for the 8th rule)
RULE_MAX=260        # chars in any single ENFORCED rule (keep them one-liners)
PREFS_MAX=230       # lines in preferences.md
HANDOFF_MAX=320     # lines in handoff.md (recaps belong in handoff-archive.md)

warn=""
add() { warn="${warn}$1"$'\n'; }

if [ -f docs/preferences.md ]; then
  block="$(awk '/ENFORCED:start/{f=1;next} /ENFORCED:end/{f=0} f' docs/preferences.md)"
  bchars=$(printf '%s' "$block" | wc -c | tr -d ' ')
  rmax=$(printf '%s\n' "$block" | awk '{print length}' | sort -rn | head -1)
  pl=$(wc -l < docs/preferences.md | tr -d ' ')
  [ "${bchars:-0}" -gt "$BLOCK_MAX" ] && add "  • ENFORCED block is ${bchars} chars (budget ${BLOCK_MAX}) — it's re-injected every turn; tighten it or move detail to a prose section."
  [ "${rmax:-0}" -gt "$RULE_MAX" ]   && add "  • An ENFORCED rule is ${rmax} chars (budget ${RULE_MAX}) — shrink it to a one-liner + pointer (see how #3 points to the factuality protocol)."
  [ "${pl:-0}" -gt "$PREFS_MAX" ]    && add "  • preferences.md is ${pl} lines (budget ${PREFS_MAX}) — dedupe overlapping bullets; demote nuance, keep locked decisions."
  # The Preference Bar #2/#4: priorities must be DECISIVE — no hedge words in the ENFORCED block.
  hedge=$(printf '%s\n' "$block" | grep -ioE "consider|maybe|try to|should probably|when possible|if needed|as appropriate|generally|when appropriate" | sort -u | tr '\n' ' ' | sed 's/ $//')
  [ -n "$hedge" ] && add "  • ENFORCED block has hedge words ($hedge) — priorities must be decisive; rewrite as imperatives (Preference Bar #2/#4)."
fi

if [ -f docs/handoff.md ]; then
  hl=$(wc -l < docs/handoff.md | tr -d ' ')
  [ "${hl:-0}" -gt "$HANDOFF_MAX" ] && add "  • handoff.md is ${hl} lines (budget ${HANDOFF_MAX}) — move older session recaps to docs/handoff-archive.md, keep live state + reference only."
fi

if [ -n "$warn" ]; then
  printf '⚠️ Doc-bloat guard — over budget, do a cleanup pass this session:\n%s' "$warn"
fi
exit 0
