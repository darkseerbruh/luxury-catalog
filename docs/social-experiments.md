# Social experiments registry

The one place that answers: **what are we testing, what changed, which posts are the
arms, and what did we learn.** Metricool is the source of truth for the POSTS; this file
is the source of truth for the EXPERIMENT wrapped around them.

## Non-negotiables

1. **Metricool is the source of truth for content.** If a post is not in Metricool, it is
   not real. Every arm below links a Metricool `post_id`. No `post_id`, no arm. ([[feedback_ab_one_variable]])
2. **One variable per experiment.** Everything else is held constant and reused verbatim
   (existing text, not new copy). A win must be attributable to the one thing that changed.
3. **Every arm names its ingredients.** So we can see at a glance what was held vs varied.

## The ingredients of a post (the elements we test or hold)

| Element | Examples |
|---|---|
| **Hook** | the on-screen opening line / question |
| **Caption** | post text + hashtags + link + UTM |
| **Bed** | data slideshow · scenery b-roll · **founder face** · talking-head |
| **Sound** | trending audio id (owner adds in-app) |
| **Format** | carousel · reel · text-card · slideshow |
| **Channel** | IG · TikTok · Pinterest |
| **Slot** | publish time |
| **CTA** | follow · link-in-bio · save |

An experiment fixes all of these except **one** (the variable), and varies only that one
across arms A / B.

## Status vocabulary

`draft` (staged, not scheduled) · `scheduled` (will auto-publish) · `published` · `measuring`
(live, gathering) · `concluded` (result recorded).

---

## EXP-2026-07-visualbed — founder face vs faceless

| Field | Value |
|---|---|
| **Hypothesis** | Swapping a faceless bed for a founder-face bed under the *same* hook lifts retention + follows. |
| **Variable** | **Bed** only (faceless scenery b-roll ↔ founder face + bag wall). |
| **Held constant** | Hook, caption, format (text-card reel), channels (IG + TikTok), slot (18:00 ET), CTA (follow). |
| **Primary metric** | Watch-through (retention) + follows. **Secondary:** saves + comments. |
| **UTM** | `2026-07-visualbed-ab` |
| **Started** | 2026-07-06 · **Status:** measuring |
| **Read rule** | If B beats A on retention + follows across the pairs, raise the locked ~1 face : 2 faceless ratio and make founder-bed the default for keep-warm. Else keep faceless. |

**Arms.** A = faceless (control, already in the planner). B = founder face (staged draft,
owner picks sound + publishes). Same hook + caption on both; only the bed differs. A-arm ids
are from a planner scan and should be re-confirmed against Metricool before publishing.

| Hook | A faceless (id · date) | B founder (id · date) | Result |
|---|---|---|---|
| Is it the bag you love, or the version of you who carries it? | 346253245 · Jul 8 | 346293700 · Jul 15 | — |
| What's the one bag you'd keep if you let all the rest go? | 346254472 · Jul 10 | 346293732 · Jul 17 | — |
| When did you know you were the kind of person who really loves bags? | 346271967 · Jul 12 | 346293746 · Jul 19 | — |
| Does a bag have to hold its value for it to be worth it to you? | 346271502 · Jul 14 | 346294253 · Jul 21 | — |
| What did you buy young that you'd never let go now? | 346271033 · Jul 16 | 346294277 · Jul 23 | — |
| If you could go back, would you tell yourself to just buy it? | 346270839 · Jul 18 | 346294629 · Jul 25 | — |
| Is there really such a thing as too many bags? | 346270372 · Jul 20 | 346294647 · Jul 27 | — |
| What's the bag you'd pass down someday? | 346269559 · Jul 22 | 346294654 · Jul 29 | — |
| Do you buy it now, or wait for the one? | 346269407 · Jul 23 | 346294661 · Jul 30 | — |
| What did your first nice bag teach you? | 346294080 · Jul 24 | 346294667 · Jul 31 | — |
| Which bag are you still thinking about? | 346293447 · Jul 26 | 346294669 · Aug 2 | — |
| What's your love language? (handbag edition) | 346192201 · Jul 6 | 346294671 · Aug 4 | — |

**Bed sources (B arm):** founder clips per `tools/video-pipeline/founder-broll-manifest.json`;
render specs `tools/video-pipeline/examples/<hook>-founder.json`.

**Dropped (not real per rule 1):** the 8 statement hooks (`first-bag, hermes-game, hills,
junkie, macbook-fit, value-fendi, doc-flight, aff-deserve`) and `kw2-the-day` have **no
faceless twin in Metricool**, so they are not experiment arms. Their founder renders exist
in `output/` but stay on the shelf unless a faceless twin is ever posted to pair against.

---

## How to add an experiment

1. Give it an id `EXP-<yyyy-mm>-<slug>`.
2. State the hypothesis and the ONE variable; list held-constant ingredients.
3. Create each arm as a Metricool post; record its `post_id` here.
4. Set the primary metric and the read rule (what result changes what decision).
5. After it runs, pull the metric per arm, write the result, set `concluded`, and note the
   decision it drove. Feed that into `docs/social-content-calendar.md`.
