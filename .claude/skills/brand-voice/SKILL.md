---
name: brand-voice
description: The voice + brand "manager" for Luxury Catalog. Loads the canonical voice, brand, hedging, and compliance rules so ANY agent (including a spawned subagent that does not get the operating-rules hook) drafts or judges user-facing copy on-voice and on-brand. Use before writing or reviewing ANY user-facing copy: social posts, email, on-page editorial, tool/UI microcopy, taglines, names, value framing, authentication or finance language. Also use when making a brand, naming, or tone decision.
---

# Brand-voice manager

This is the one context layer above the project for HOW Luxury Catalog sounds and
what the brand will and will not say. The main thread gets these rules auto-injected
by `.claude/hooks/operating-rules.sh`, but spawned subagents (Explore, Plan,
general-purpose, or any Agent call) do NOT. Run this skill so they work on-voice
instead of blind.

This skill is a LOADER, not a copy. The canonical text lives in the docs below and is
the single source of truth. Read them; do not paraphrase from memory.

## Step 1 — Load the canon (read these, in order)
1. `docs/voice-and-tone.md` — the full voice spec: ethos, the two audiences in one
   voice, register flexing, the do/don't word lists, the approved tagline.
2. `docs/preferences.md`, these sections specifically:
   - "Brand voice & tone (locked)"
   - "Brand rules she holds (from the product brief)"
   - "Calibrated-hedge frames — decisive about nuance (X, not Y)"
   - "Content factuality protocol"
   - "Finance, money & compliance (locked stance)"
   - "Product decisions she's locked"

## Step 2 — Apply the non-negotiable gates to the copy
- **No em dashes.** Sole exception: the approved tagline in `voice-and-tone.md`.
- **We actually know.** Precise, fact-dense, plain-spoken, warm while being that
  informed. Not heritage-house hush, not discount breathlessness.
- **One voice flexing register** for the flipper and the collector. Do not write two
  voices; write the shared ground (someone who loves the craft and wants to be smart
  with their money).
- **Calibrated hedge on uncertain domains** (value, authenticity, fit, taste, money,
  legal). Frame as evidence + opinion, never a verdict. State "X, not Y":
  - value = *estimate, not appraisal*
  - tax = *records, not advice*
  - insurance = *refer, not act as agent*
  - recommendation = *my take / informed opinion, not a directive*
  - authentication = *markers to check, not a verdict*
  - Tone of the hedge: "we don't judge," "fashion is subjective." Decisive, not pushy.
- **Factuality.** Every published spec, price, value, or stat traces to fresh evidence
  with its date / n / anchor. Omit or hedge when unsure. Never invent.

## Step 3 — Output check before you hand back copy
Run the draft against this checklist and fix any miss:
- [ ] Zero em dashes (unless it is the approved tagline verbatim).
- [ ] Reads like one person who actually knows bags: precise, warm, no ornament.
- [ ] Any value / authenticity / money / legal claim is framed as estimate or
      markers or my-take, never a verdict.
- [ ] Every number or spec has a traceable, dated source, or it is cut.
- [ ] No banned register (no "timeless elegance" hush, no "SCORE for LESS" hype).

## Using this from a subagent
When you spawn an Agent that will touch user-facing copy or a brand decision, tell it
in the prompt: "Follow the brand-voice skill before drafting." That one line loads
this whole context instead of pasting the rules, and keeps the subagent on-voice.

If the canon and this skill ever disagree, the canon wins. Update the canon, not a
second copy here.
