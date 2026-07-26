#!/bin/bash
# deploy-prod.sh — the ONE blessed way to push this site to production.
#
# WHY THIS EXISTS (2026-07-26): `vercel --prod` uploads THE FOLDER YOU RUN IT IN.
# It does not deploy `main`, it does not deploy GitHub, it deploys whatever files
# are sitting on your disk right there. On 2026-07-26 the habitual deploy folder
# (~/Documents/luxury-catalog) was parked on branch `ops/vendor-inbox-0719`,
# 28 COMMITS BEHIND origin/main. Deploying from it would have rolled production
# backwards past the LC Index fix, the signup moment and the availability alerts,
# and nothing would have warned anyone — the deploy would have reported success.
#
# The second trap: from an unlinked folder, a bare `vercel link` silently creates
# a NEW empty project named after the directory and "deploys" there instead of to
# the live site (one junk project, `luxury-catalog-heropick`, was left on
# 2026-07-09). Linking also overwrites .env.local with pulled env.
#
# So this script refuses to deploy unless ALL of these hold:
#   1. the working tree is clean (no uncommitted or untracked tracked-path edits)
#   2. HEAD is EXACTLY origin/main (0 commits ahead, 0 behind)
#   3. .vercel/project.json exists and names the real `luxury-catalog` project
# then it deploys, and smoke-checks the live site afterwards.
#
# HOW TO READ THE OUTCOME: trust the final banner. Success ends with
# "✅ deployed to production"; ANY failure ends with a "⛔⛔ … NOT DEPLOYED"
# banner and a non-zero exit. Run it BARE — piping through tee/tail makes `$?`
# report the pipe's status, which is how a failed landing once looked green.
set -euo pipefail

EXPECTED_PROJECT="luxury-catalog"
SMOKE_URL="https://www.luxurycatalog.com"

fail() { printf '⛔ deploy-prod: %s\n' "$1" >&2; exit 1; }

on_exit() {
  local rc=$?
  if [ "$rc" -ne 0 ]; then
    echo ""
    echo "⛔⛔ DEPLOY ABORTED (exit $rc) — PRODUCTION WAS NOT CHANGED ⛔⛔"
    echo "⛔ The live site is still serving whatever it served before."
    echo "⛔ Fix the failure above, then rerun: bash scripts/deploy-prod.sh"
  fi
}
trap on_exit EXIT

command -v git >/dev/null 2>&1 || fail "git not found on PATH."
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "not inside a git repo."

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT" || fail "could not cd to the repo root."
echo "📁 Deploying from: $REPO_ROOT"

# ── Gate 1: clean tree ────────────────────────────────────────────────────────
# Untracked files matter here too: vercel uploads the DIRECTORY, so a stray file
# ships with the deploy even though git would ignore it for a commit.
if [ -n "$(git status --porcelain)" ]; then
  echo ""
  git status --short
  fail "working tree is not clean (see above). Commit, stash or remove these first."
fi
echo "✅ Working tree clean."

# ── Gate 2: HEAD is exactly origin/main ───────────────────────────────────────
git fetch origin main --quiet || fail "could not fetch origin/main."
HEAD_SHA="$(git rev-parse HEAD)"
MAIN_SHA="$(git rev-parse origin/main)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if [ "$HEAD_SHA" != "$MAIN_SHA" ]; then
  BEHIND="$(git rev-list --count HEAD..origin/main)"
  AHEAD="$(git rev-list --count origin/main..HEAD)"
  echo ""
  echo "   this folder : $BRANCH @ ${HEAD_SHA:0:7}"
  echo "   origin/main : ${MAIN_SHA:0:7}"
  echo "   $BEHIND commit(s) BEHIND main, $AHEAD commit(s) ahead."
  echo ""
  if [ "$BEHIND" -gt 0 ]; then
    echo "   Deploying now would ROLL PRODUCTION BACKWARDS by $BEHIND commit(s)."
  else
    echo "   This folder has $AHEAD commit(s) that are not on main yet."
    echo "   Land them first: bash scripts/land-to-main.sh"
  fi
  fail "HEAD is not origin/main. Production ships from main only."
fi
echo "✅ HEAD is exactly origin/main (${HEAD_SHA:0:7})."

# ── Gate 3: linked to the REAL project ────────────────────────────────────────
[ -f .vercel/project.json ] || fail \
  "no .vercel/project.json here. Copy the link from an already-linked tree instead of running \`vercel link\`:
     cp -R ~/Documents/luxury-catalog/.vercel $REPO_ROOT/
   (a bare \`vercel link\` creates a junk project and clobbers .env.local)."

PROJECT_NAME="$(node -e 'try{process.stdout.write(require("./.vercel/project.json").projectName||"")}catch(e){}' 2>/dev/null || true)"
[ "$PROJECT_NAME" = "$EXPECTED_PROJECT" ] || fail \
  "this folder is linked to project '${PROJECT_NAME:-<unreadable>}', not '$EXPECTED_PROJECT'. Refusing to deploy to the wrong project."
echo "✅ Linked to the '$EXPECTED_PROJECT' project."

# ── Deploy ────────────────────────────────────────────────────────────────────
echo ""
echo "🚀 Deploying to production. Vercel builds this remotely; it takes a few minutes."
echo "   If it asks you to log in, that login is yours to complete."
echo ""
npx --yes vercel@latest deploy --prod || fail "the vercel deploy command failed (see its output above)."

# ── Smoke check ───────────────────────────────────────────────────────────────
# A deploy that "succeeds" but serves 500s is still a failure. Check the live
# site actually answers before claiming victory.
echo ""
echo "🔎 Smoke-checking the live site…"
SMOKE_FAILED=0
for path in "/" "/rankings" "/shop"; do
  # `cmd || echo 000` APPENDS on failure (curl prints "200", then the fallback adds
  # "000" -> "200000", seen on the first real run 2026-07-26). Replace, don't append.
  # 60s because a cold /shop render legitimately exceeds 30s right after a deploy.
  if ! code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 60 "${SMOKE_URL}${path}")"; then
    code="000"
  fi
  if [ "$code" = "200" ]; then
    printf '   ✅ %-12s %s\n' "$path" "$code"
  else
    printf '   ⚠️  %-12s %s\n' "$path" "$code"
    SMOKE_FAILED=1
  fi
done

echo ""
if [ "$SMOKE_FAILED" -eq 0 ]; then
  echo "✅ deployed to production. Evidence:"
else
  echo "✅ deployed to production, but a smoke check did not return 200 (above)."
  echo "   The deploy itself succeeded; check the Vercel logs for those routes."
  echo ""
  echo "Evidence:"
fi
echo "   commit  : ${HEAD_SHA:0:7} (== origin/main)"
echo "   project : $PROJECT_NAME"
echo "   folder  : $REPO_ROOT"
echo "   live    : $SMOKE_URL"
