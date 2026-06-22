#!/bin/bash
# Claude Code on the web — SessionStart hook.
# Installs Node dependencies so build / lint / test work without a manual
# `npm install` at the top of every cloud session. Idempotent.
set -euo pipefail

# Only run in remote (Claude Code on the web) sessions; local dev manages its own deps.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# `npm install` (not `ci`) so the cached container state is reused across sessions.
npm install --no-audit --no-fund
