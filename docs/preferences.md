# Owner preferences & decisions — read at the start of every session

*For the owner of Luxury Catalog (Arielle). Complements `docs/handoff.md` (project state). This file = how she likes to work + decisions she's locked. Keep it updated as you learn more; confirm new preferences before treating them as standing rules.*

## Who she is
- **Arielle Coambes** — founder/owner of **Luxury Catalog LLC**. Product owner, **not an engineer**.
- Thinks like a founder: evaluates ideas by **engagement, virality, monetization, and strategic fit**, not just whether they work.

## How she likes to work with you (interaction style)
- **Explain technical/infra things in plain language** — minimal jargon, use analogies. Git/branches/deploys confuse her; **you handle that for her** and keep explanations simple.
- **Always lead with a clear recommendation** and mark it "(Recommended)". She usually takes the recommended option.
- **Confirm before anything destructive or irreversible** (overwrites, force-push, deletes). She values being stopped before a mistake — and you once correctly caught a stale-`main` near-overwrite for her.
- **Back "done"/"pushed" claims with evidence.** She often asks "is it really pushed / on main?" — show the proof (git output), don't just assert.
- **She's scope-ambitious** — when offered options she frequently picks **"all of these."** Build broadly, but keep the build green (`tsc`/`eslint`/`next build`) and clearly document any steps she has to do herself (migrations, env, seeds).
- She **starts new chats often to save context/tokens** — so keep `main` the single source of truth and push there at the end of every session.
- She responds well to **enthusiastic, organized replies that end with a clear question or next step.** Tables and short sections land well.
- She enjoys **creative/strategic brainstorming** and will push you to "consider any possible creative solution" — go wide, then recommend.
- **Copy & brand voice are iterated at the line level.** She gives precise, phrase-level reactions ("that lands weird," "too flip," "too movie-trailer-y," "give the info its due weight") and will happily iterate many rounds until a tagline/voice line is *exactly* right. Show concrete options and real example copy to react to — she picks, then redirects with her own priorities. Don't over-produce; she'll say "don't draft anything else, just commit" when she's ready to ship.
- **She supplies her own source material and wants analysis grounded in it**, not your assumptions — e.g. she pasted full YouTube transcripts so you'd extract her favorite creators' *actual* phrasing. Prefer real sources over guessing; if a source can't be fetched (e.g. transcript host blocks it), say so plainly and ask her for it rather than characterizing from memory.
- **Cloud-first, anti-friction.** She works from the web/cloud, not a local machine, and dislikes manual dashboard work — *"pasting into Vercel is a terrible experience."* She'll ask **"can that be done through AI?"** Default to automating setup/deploy/config steps for her rather than handing her a checklist. Note the honest constraint when it exists (e.g. a step needs a credential the environment doesn't have) and say what to add to make it automatable — don't silently fall back to "do it yourself."
- She **expects continuity across sessions** and may reference past work ("we already discussed this, you made a file"). Remember the container is ephemeral and local/gitignored files (e.g. `.env*`) don't survive — durable setup must live on `main` or in the cloud **environment config**, never a local file. If she's misremembering where something lives, gently correct with evidence.
- **Match the mode to the work: stepwise for infra/debugging, broad for features.** For setup, diagnosis, or anything risky she'll say *"one at a time, step by step"* — go incrementally and **verify each step before the next** (e.g. test network reachability *before* touching credentials). For a menu of feature options she still picks *"all."*
- **Verify real state; don't trust the narrative.** When she asks *"what's actually been done?"* / *"is it really on main?"*, she wants ground truth — read **code + git history** (and query the **live DB** when reachable), and clearly separate *verified-in-code* from *doc-claimed* or *can't-see-from-here*. The handoff is a story about the work; the code is the work.
- **Respects her own "not ready."** She'll deliberately pause a big or irreversible feature (e.g. the Authenticator Marketplace) when she's not ready to commit to it. Hold it, don't push — record the pause so a future session doesn't blindly restart it, and move on.

## Git / workflow (locked)
- **`main` is the single source of truth.** Sync from `main` at session start, merge back to `main` at end (see AGENTS.md "Branch & sync workflow"). Never build off old per-session branches.
- She prefers **automation and guardrails** so she doesn't have to remember process.

## Infra & deployment (how she wants it handled)
- **Hosting = Vercel** (team `darkseerbruh`); production tracks the `main` branch, so pushing to `main` is what ships code. Explain deploys in these plain terms.
- She wants **deploy/config done through AI, not dashboards** — Vercel env vars, Supabase migrations/seeds, etc. The cloud-friendly pattern she prefers: real secrets live in the **environment's secret store / config** (set once, persist across sessions, never in git), so you can script `vercel`/`supabase` actions each session instead of her pasting. Build the automation; tell her exactly which credential to drop into the env config to unlock it.
- **Never put live secrets in a committed file or in chat.** `.env*` is gitignored on purpose. When a needed credential is missing/invalid in the environment, surface that plainly (with evidence) before claiming a step is done.
- **She is done with the local/cloud split** — emphatically wants every check, setup, and deploy doable from cloud sessions ("*I am so sick of this weird local/cloud split*"). To unblock verification she's **pragmatic: she'll paste a credential and rotate it later** ("*if I have to replace keys, I will*"). So prioritize making her real state visible *now* — but still write secrets only to gitignored files / the env store, and steer her toward the durable fix (real values in the **environment secret store**, set once) rather than a per-session paste. Watch for **stub/placeholder env vars** the container ships (they shadow a real `.env.local`; `dotenv` won't override an already-set var) — a "wrong key" can actually be a hidden placeholder.

## Product decisions she's locked
- **Canonical app = the full catalog lineage** (search/identify/admin/closet/watchlist/reviews/etc.). A separate analytics-prototype lineage was merged in and retired.
- **Images:** realistic photos matter a great deal to her, **but source them — never AI-generate images of real bags** (legal: MetaBirkins/trade dress; integrity: the "never invent" rule). Strategy: **live licensed affiliate/marketplace galleries + consented UGC + first-party photos**; own a permanent base layer, use live listings to fill gaps. Full reasoning in `docs/image-strategy-research.md`.
- **Photo contributions (queued build):** **hybrid moderation** (trusted users auto-publish, new users queued); include **all** engagement mechanics (byline + featured hero, add-a-photo in closet, "Most Wanted Photos" board, contributor badges). Spec in `docs/handoff.md`.
- **Contributor tiers:** she loved flattering, fashion-authority naming that doubles as the **recruiting pipeline for the paid Authenticator Marketplace.** Proposed ladder: **Aficionado → Collector → Connoisseur → Authenticator → Curator** (Authenticator = the trusted/auto-publish tier). Reward quality + verification, never raw volume.

## Brand rules she holds (from the product brief)
- **Never invent** authentication markers/date codes/serials/hardware — leave `null` + `confidence_level: low` if unverifiable.
- **No obviously-AI-generated copy or video.** AI-*assisted* with human review is fine; never ship something that reads as AI slop (it also gets downweighted by AI search). Complements the never-AI-images rule.
- **Catalog stays free** — monetize via affiliate + (later) authenticator marketplace + premium *search capability*, never a content paywall.
- **Coach matters** — the viral thrift-store acquisition engine.
- **Mobile-first** — every page works at 375px.

## Brand voice & tone (locked) — canonical: `docs/voice-and-tone.md`
- **A fresh, internet-native voice** — explicitly *not* legacy-luxury hush (serif, "timeless elegance") and *not* discount breathlessness ("SCORE designer for LESS!!").
- **Rigor + precision is the mission and leads; warmth is the delivery.** Deeply informed and informational, told warmly — not "warm with facts bolted on." Priority order: (1) deeply informed/warmly told, (2) clear over clever, (3) the reassuring friend at the moment of joy ("that was a great choice, totally worth it" / "this is me in a bag"), (4) smart with your money (savvy resale), (5) **no snobbery/anti-status — a guardrail to check against, never the headline** (leading with "bags aren't status" is too defensive).
- **Persona vs. system split:** the *founder-as-face* (on-camera) may gush first-person ("I'm obsessed," "love love love"); the *brand system* (everywhere else) earns enthusiasm through specifics and **avoids empty superlatives** (*stunning, iconic, must-have*).
- **One voice, register-flexed by surface** (loosest on TikTok → tightest at authentication / price / premium-tool money-moments). It **bridges two audiences in one voice** — Gen-Z thrift-flippers *and* collectors/investors — never splitting into two brands.
- **Locked taglines:** *Carry a little art. Choose it well.* · *Know what it's worth — and what it's worth to you.*
- **Ethos:** name the honest "why" people buy (money + taste + craft + belonging) and let the reader *into the club* via real, de-gatekept knowledge — democratize what was gatekept; never pander.
- **Reference creators she loves (learn-from, don't copy):** **Je Suis Lou** (primary tonal model — informed-but-warm, anti-snobbery, transparency-as-mission, joy/memory-led value, "we don't judge"); @relaxitsonlyfashion (deadpan + deep passion); @AlexandraAnele (approachable + exacting); @juliareingoldproductions (human-on-the-other-side; the founder-persona model). Brand canon: Mr Porter ("would you say it in the pub?"), Mailchimp-minus-quirk (clear over clever), Aesop (no superlatives), Ffern (make the mechanics feel human).
- **Content channels chosen** (canonical: `docs/social-content-calendar.md`): Pinterest, Email/Newsletter, Instagram, TikTok/YouTube Shorts. Evaluate formats by **revenue proximity × solo-operator effort**; every post drives to a real page; **batch the video**; the newsletter opt-in is a known unbuilt dependency.

## Surfacing features on the home/entry pages (UX copy)
- **Lead with the value prop, not a list.** On entry surfaces (home, nav), a flat list of feature links/chips is *"not a good experience."* Each use case needs a **hook that sells why it's for you** and drives traffic to the feature — motivate the click, don't just enumerate.
- **One entry per destination — dedupe overlapping flows.** If two use cases point at the same place (e.g. two chips both linking to `/identify`), **show it once** as a single combined value-prop block with copy that speaks to *both* audiences. Never surface duplicate links to the same flow.
- **Offer a few copy/positioning options to choose from.** She'll ask you to *"suggest a few options for how to best highlight"* something — give 2–3 distinct angles per item, ship a sensible default, and record the alternatives where sessions can reuse/swap them (e.g. `docs/ux/home-use-case-value-props.md`). Treat copy as A/B-swappable, not final.

## What she's drawn to
- "Good feels," status, and recognition mechanics for users; gamification **tied to strategy**.
- Language that makes the reader feel *let into the club* via real knowledge — **warm, precise, and unpretentious**, never ornate luxury-speak or empty superlatives (see "Brand voice & tone" above).
- Caution + honesty on legal/IP risk; grounding big decisions in research first.

## Current open work
This file deliberately tracks durable *preferences*, not volatile status. For what's
shipped vs. pending right now, read `docs/handoff.md` (it changes session to session).
