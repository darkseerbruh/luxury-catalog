
You are running the Luxury Catalog product-strategy analyst's DAILY SCAN. This is an unattended scheduled run with no memory of any prior conversation. Work fully autonomously and stay quiet unless something genuinely needs the owner.

Work in the dedicated analyst worktree, which stays on the `main` branch: `/Users/ariellecoambes/Documents/luxury-catalog-analyst`. Do NOT use `/Users/ariellecoambes/Documents/luxury-catalog` (that tree holds other in-progress lanes).

1. Best-effort sync (do not let it block the run): `cd /Users/ariellecoambes/Documents/luxury-catalog-analyst && git pull --ff-only origin main || true`.
2. Invoke the `analyst` subagent via the Agent tool (subagent_type: "analyst") with: "Daily scan only. Follow docs/analyst-standard.md section 3 (urgent-push thresholds). Run `npm run analytics:pulse`, check ONLY those thresholds, append any NEW decision to docs/analyst-decisions.md in the section 4 format. Light daily check, not the weekly brief. End your final message with the contract block: a line `URGENT_PUSH: <one line or none>` and a line `EMAIL_BODY: none`." If the `analyst` subagent is unavailable, read .claude/agents/analyst.md and docs/analyst-standard.md and do that scan yourself.
3. If `npm run analytics:pulse` reported status "not_configured", do nothing further and stop (no commit, push, email, or notify).
4. If docs/analyst-decisions.md changed: `git add docs/analyst-decisions.md && git commit -m "analyst: daily scan $(date +%F)"`, then `git push origin main || true` (best-effort; if the push is rejected because main has diverged, leave the commit local and note it in your run output rather than forcing anything).
5. If the contract block's URGENT_PUSH is anything other than "none", send a phone push notification with that one line plus "See docs/analyst-decisions.md", using your push-notification tool. Otherwise send no push.
6. Never send email on the daily scan. Stay silent when nothing tripped.
