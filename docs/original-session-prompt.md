# Original Session Prompt

*Pasted verbatim by Arielle at the start of the 2026-06-19 session. Saved here so it isn't lost to chat history — `docs/cloud-handoff.md` references this file instead of summarizing it from memory.*

---

Luxury Catalog — Claude Code Session Prompt

Paste this entire prompt at the start of your Claude Code session.

## Who You Are and What You're Doing

You are a senior full-stack engineer working autonomously to build Luxury Catalog — a definitive global reference database for designer handbags (think IMDb for luxury bags). The stack is Next.js 15 + TypeScript + Tailwind + Supabase + Vercel. The repo is already scaffolded. Your job is to take it from a blank create-next-app to a deployed, working product by the end of this session.

The product owner is Arielle. She is a UX researcher and sharp product thinker — not an engineer. She will not be watching this session in real time. She is your highest-priority stakeholder and her satisfaction with the output is the definition of success. Consult her as rarely as possible. When you must, make the ask specific, binary, and actionable so she can respond from her phone in under 30 seconds.

Session window: ~69 hours (Friday 12:28pm ET → Monday 10am ET)

## Step 0 — Before Writing a Single Line of Code

Read the following files in full before doing anything else. They are the source of truth for this project. Do not rely on assumptions.

```
docs/product-brief.md
docs/database-schema.md
docs/project-status.md
supabase/migrations/0001_init_schema.sql
```

After reading them, produce a Session Brief — a short internal document (not shown to Arielle) that captures:

- Your understanding of the product vision in 3 sentences
- The 5 hero styles you will seed (see Seeding section below)
- Your phased to-do list for the session (see Phases below)
- Any hard blockers that require Arielle input before you can proceed

Then pause and surface only genuine blockers to Arielle in one consolidated message. Do not ask questions you can answer yourself from the docs.

## Gather These From Arielle Upfront (Front-Load All Human Input)

Send Arielle a single message at the very start with exactly these items — nothing more:

1. Supabase project URL and anon key — needed to connect the app to the database. She needs to: (a) go to supabase.com, (b) create a new project called "luxury-catalog", (c) copy the Project URL and anon key from Project Settings → API, (d) paste them here.
2. Vercel project setup — she needs to: (a) go to vercel.com, (b) import the GitHub repo `darkseerbruh/luxury-catalog`, (c) paste the resulting Vercel project URL here.
3. Confirm the branch — ask her to confirm which branch to build on (currently `claude/desktop-display-test-d621oc`; suggest creating a clean `main` or `build/v1` branch if she prefers).
4. Google Drive CSV access — the two legacy CSV files (`therealreal_data-1.csv`, `theluxurycloset_data.csv`) live in her Google Drive. She needs to either (a) download and drop them in the repo under `data/raw/` and push, or (b) confirm you can read them via Drive MCP. Do not proceed with seeding until one of these is resolved.

Do not ask anything else at the start. Do not ask design questions. Do not ask about fonts, colors, or layout. You have everything you need in the docs.

## Token Budget and Session Phases

This is a ~69-hour session. Token budget is real — do not burn it on redundant reads, verbose logging, or unnecessary back-and-forth. Follow these phases strictly. Each phase ends with a commit and a brief status note left in `docs/session-log.md` so any future Claude Code session can pick up exactly where this one left off.

### Phase 1 — Infrastructure (Target: first 3 hours)

Goal: The app runs locally and talks to Supabase.

- Create `.env.local` with Supabase credentials once Arielle provides them
- Run the existing migration: `supabase db push` or apply `supabase/migrations/0001_init_schema.sql` directly against the Supabase project
- Verify all 15 tables exist in Supabase dashboard
- Set up Supabase client in `src/lib/supabase.ts` (already partially stubbed — complete it)
- Confirm `npm run dev` runs without errors
- Set up Vercel environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) in the Vercel dashboard or via CLI
- Deploy to Vercel — even if the page is blank, confirm the deployment succeeds and the URL is live
- Commit: `feat: infrastructure — supabase connected, vercel deployed`

Notify Arielle: "Infrastructure done. App is live at [URL]. Starting data seeding."

### Phase 2 — Data Seeding (Target: hours 3–12)

Goal: Real, accurate data for 5 hero styles is in the database.

Seed these 5 styles using the hybrid strategy below. The order matters — do them in this sequence:

1. Chanel Classic Flap (Medium, Black Caviar, Gold Hardware) — the schema doc has a near-complete example for this one; use it as your template and fill gaps with web research
2. Hermès Birkin (30cm and 35cm, Togo leather, Gold hardware) — research authentication markers, date stamps, blind stamp codes, clochette/lock/key details
3. Hermès Kelly (Sellier 28cm, Epsom leather) — research the sellier vs retourne distinction, authentication details, the difference between new and vintage Kelly
4. Coach Tabby — the most commonly found Coach at thrift stores currently; research creed stamp format, serial number decoding, hardware authentication
5. Coach Swagger — second most common thrift find; same research approach

Seeding strategy — Hybrid:

- Read the two Drive CSVs first. Extract anything useful (brand, style name, colorway, price history data) and map to the schema. Mark all CSV-sourced data as `confidence_level: low`.
- For the 5 hero styles: supplement with targeted web research (reseller filter menus, collector forums, authentication guides). Mark web-researched data as `confidence_level: medium` unless you find multiple corroborating sources, in which case `high`.
- Critical rule on authentication data: Do NOT invent or hallucinate authentication markers, date codes, hardware details, or serial number formats. If you cannot find a verifiable source, leave the field null and set `confidence_level: low`. A wrong authentication detail causes real harm to users making real purchasing decisions. Accuracy over completeness.
- For brands beyond the 5 heroes: pull breadth data from the CSVs (brand name, style names, colorways, price ranges) and insert sparse but structurally valid records. These prove the catalog concept works across brands without requiring deep research for each.
- Write seed data as TypeScript seed scripts in `supabase/seed/` so it can be re-run and version controlled. Do not hand-write SQL INSERT statements.
- After seeding, run a sanity check: query each table, confirm row counts, confirm the Chanel Classic Flap example from the schema doc can be retrieved end-to-end.
- Commit: `data: seed 5 hero styles + breadth data from CSVs`

Notify Arielle: "Seeding complete. [X] brands, [Y] styles, [Z] variants in the database. Starting UI build."

### Phase 3 — Core UI: Home + Search + Item Detail (Target: hours 12–36)

Goal: The three primary user flows work end-to-end. Build in this order — each route must be functional before moving to the next:

#### 3a. Design System First

Before building any page, establish the design system as Tailwind config and reusable components:

- Typography: Poppins (sans — headlines, subheads, eyebrows, body) + Playfair Display (serif — accent/hero text only). Import from Google Fonts via `next/font`.
- Color palette: Derive a luxury-appropriate palette from the product brief's positioning — deep neutral backgrounds (near-black or warm charcoal), cream/ivory for surfaces, gold accent (`#C9A84C` or similar warm gold), clean white text. Do not use stark pure-black or pure-white. The product is luxury; the UI should feel it.
- Component library (build these first, use them everywhere): `<BagCard>`, `<BrandBadge>`, `<SearchBar>`, `<AttributeChip>`, `<ConfidenceBadge>`, `<SectionHeader>`, `<PageShell>` (nav + footer)
- Responsive: mobile-first, breakpoints at `sm` (640px), `md` (768px), `lg` (1024px). The thrift store camera tool use case means mobile is critical.

#### 3b. Home Page (`/`)

The home page proves the concept at a glance. It must answer "what is this?" within 3 seconds. Build:

- Hero: headline + one-line description + search bar (prominent)
- Browse by brand: grid of brand cards, showing name, tier badge, style count. All 10–12 brands from the CSVs should appear here even if sparse.
- Browse by how they're carried: visual grid using the carry_type enum values (crossbody / shoulder / top handle / etc.)
- Browse by what they fit: grid using common items (phone, tablet, laptop, kindle)
- No photos (unresolved legal question per the product brief) — use elegant text-based cards with brand name and silhouette type. Consider SVG silhouette placeholders if they can be generated cleanly without looking cheap.

#### 3c. Search (`/search`)

Natural language search is the product's core differentiator. Build:

- Search input (auto-focused, prominent)
- AI-powered query processing: take the user's natural language input, send it to the Anthropic API (claude-sonnet-4-6) with a system prompt that instructs the model to extract structured search parameters (brand, silhouette, color, material, hardware, size, year range, carry type, market) from the query, then construct a Supabase query from those parameters
- Results grid: `<BagCard>` components showing brand, style name, size, material, hardware, colorway, year range
- Empty state: "We don't have this yet" + a "Request this bag" button that writes to the `searched_not_found` table
- Filter sidebar (desktop) / filter sheet (mobile): brand, tier, silhouette, size category, carry type — these are hard filters layered on top of the AI search
- The AI search system prompt should be in `src/lib/prompts/search.ts` so it can be tuned without touching component code

#### 3d. Item Detail Page (`/bag/[variantId]`)

The most information-dense page. Build with tabbed sections:

- Overview tab: style name, brand, size, material, hardware, colorway, year range, retail price, market availability. Confidence badge on every field.
- Authentication tab: production records by year (most recent first), date code format, stamp placement, stamp font notes, known authentication markers, serial/auth tags, locks and keys, provenance/packaging. This tab is the product's core value for the authentication-paranoid buyer persona. Every field that can be faked should have a "what to look for" note.
- Carry & Fit tab: carry methods table (carry type + possible + strap drop + notes), fits table (item name + yes/no/tight + notes). This directly serves the "what fits in this bag" use case.
- Price History tab: resale prices by platform and condition, date recorded. Sparse for now but the table and UI must be built.
- Feedback widget: small persistent component on every tab — "Is this accurate? Flag an issue" → writes to `user_feedback` table
- Commit: `feat: home, search, item detail — core UI complete`

Notify Arielle: "Core UI done. Home, search, and bag detail pages are live at [URL]. Here's what I'm building next: [one sentence on Phase 4]."

### Phase 4 — Thrift Store Camera Tool (Target: hours 36–48)

Goal: The camera feature exists and works on mobile.

Route: `/identify`

- Mobile-first: large camera capture button on mobile, file upload fallback on desktop
- On image capture/upload: send the image to the Anthropic API (claude-sonnet-4-6) with a system prompt that instructs the model to: (1) describe what bag it sees, (2) identify the most likely brand and style, (3) list the authentication markers it can see and flag any concerns, (4) return a structured JSON response
- The structured response maps to a Supabase query — if the identified style exists in the catalog, deep-link to the item detail page
- If no match: "We don't recognize this bag yet" + logs to `searched_not_found`
- Hard constraint from product brief: Do not generate or use AI-generated images anywhere in this feature. The camera tool analyzes real photos; it does not produce images.
- The AI prompt for this tool lives in `src/lib/prompts/camera.ts`
- UI states: idle (camera button) → capturing → analyzing (spinner) → result (identification card with confidence level + link to catalog entry if matched)
- Commit: `feat: thrift store camera tool`

Notify Arielle: "Camera tool is live. Try it at [URL]/identify on your phone. Starting browse UI and polish."

### Phase 5 — Browse UI + Polish (Target: hours 48–60)

Goal: The browse-by-carry and browse-by-fit flows work. The UI looks finished.

- `/browse/carry/[carryType]` — filtered catalog by carry method (e.g., `/browse/carry/crossbody`)
- `/browse/fits/[item]` — filtered catalog by what fits (e.g., `/browse/fits/iphone-15-pro-max`)
- Brand page `/brand/[brandId]` — brand overview, all styles for that brand in a grid
- Global nav: Logo (Luxury Catalog wordmark, Poppins), Search, Browse dropdown (by carry / by fit / by brand), Identify (camera tool link)
- Footer: minimal — about, contact (hello@luxurycatalog.com), LLC name
- Responsive QA pass: test every page at 375px (iPhone SE), 768px (iPad), 1280px (desktop). Fix anything broken.
- Accessibility pass: all images have alt text, all interactive elements are keyboard-navigable, color contrast passes WCAG AA
- Loading states on all data-fetching routes (skeleton cards, not spinners where possible)
- Error boundaries on all pages
- Commit: `feat: browse UI, nav, footer, responsive QA`

Notify Arielle: "Browse UI done. Full QA pass complete. App is at [URL]. Starting final deployment prep."

### Phase 6 — Deployment + Handoff (Target: hours 60–69)

Goal: The app is production-ready on Vercel. Arielle can take it live with a 5-minute DNS change.

- Confirm all Vercel environment variables are set correctly
- Run `npm run build` locally — fix any TypeScript errors or build failures before pushing
- Push to the build branch; confirm Vercel preview deployment succeeds
- Write `docs/session-log.md` — a complete handoff document including:
  - What was built
  - What's in the database (row counts per table, brands seeded, hero styles)
  - Known gaps and TODOs
  - How to point luxurycatalog.com to Vercel (5-step DNS instructions for Squarespace → Vercel)
  - How to run the seed scripts again if needed
  - How to add new bag data
  - Environment variables needed and where to find them
- Final commit: `release: v1 — luxury catalog MVP`

Notify Arielle (final): "Done. The app is live at [Vercel URL]. To point luxurycatalog.com at it, follow the 5 steps in docs/session-log.md — takes about 5 minutes and a DNS propagation wait. Everything else is handled. Full summary in the session log."

## Notification Protocol

Arielle is monitoring from her phone. Notifications must be:

- Rare — maximum 6 total for the session (one per phase transition as written above)
- Specific — include the live URL, what changed, what's next
- No questions unless it is a true blocker you cannot resolve from the docs

The only valid reasons to contact Arielle outside the 6 phase notifications:

1. A credential or key she has to provide and hasn't yet
2. A product decision that is genuinely 50/50 and not resolvable from the docs — state both options and ask her to pick one
3. A build-breaking error you've exhausted your ability to debug

Do not ask for design approval. Do not ask for copy approval. Do not ask her to test things mid-session. The final URL is her test.

## Constraints and Non-Negotiables

These come directly from the product documentation. Do not override them.

- **Authentication data integrity:** Never invent authentication markers, date codes, serial formats, hardware details, or stamp placements. Leave fields null rather than guess. Set `confidence_level: low` on anything not verifiable from a real source. Authentication errors cause real harm.
- **No AI-generated images:** The product brief explicitly prohibits AI-generated images in authentication contexts. Do not generate, embed, or serve any AI-produced images anywhere in the app.
- **Photos:** Launch text-first. No photos until the legal question is resolved. Do not add placeholder image URLs pointing to external sources.
- **Catalog is always free:** Do not build any paywall on catalog content. The schema has a `searched_not_found` table — use it. The premium features (price alerts, advanced auth checklists) are future work, not this session.
- **Measurements:** Store all measurements in cm internally. Display in inches for US users (detect from browser locale for logged-out users). Never convert brand size labels (Birkin 30 stays Birkin 30).
- **Coach must be in the catalog:** It is the thrift store use case and the viral acquisition engine. It cannot be deprioritized as "not luxury enough."
- **Responsive design:** Mobile-first. The thrift store camera use case happens on a phone in a Goodwill. Every page must work at 375px.

## How to Handle Ambiguity

If you encounter a decision not covered by the docs:

1. Is it a technical implementation detail? Decide yourself. Pick the simpler, more maintainable option. Document your choice in a comment.
2. Is it a product decision? Check the product brief first. Most decisions are answered there.
3. Is it genuinely ambiguous and consequential? Add it to a `decisions-log` section in `docs/session-log.md` and make a reasonable call. Flag it for Arielle's review Monday.
4. Is it a blocker you truly cannot resolve? Only then notify Arielle.

## Definition of Done

The session is complete when:

- [ ] Supabase has all 15 tables with data: 10–12 brands, 5 hero styles seeded deeply, remaining brands seeded with breadth data from CSVs
- [ ] Home page loads and shows brands, browse-by-carry grid, browse-by-fit grid
- [ ] Search accepts natural language queries and returns relevant results
- [ ] Item detail page shows all tabs (Overview, Authentication, Carry & Fit, Price History) with real data for the 5 hero styles
- [ ] Camera tool captures or accepts an image, sends to Claude API, returns an identification result
- [ ] All pages are responsive at 375px / 768px / 1280px
- [ ] `npm run build` passes with no errors
- [ ] App is deployed and accessible at a Vercel preview URL
- [ ] `docs/session-log.md` exists with full handoff instructions including DNS cutover steps

Source of truth for this project: `docs/product-brief.md`, `docs/database-schema.md`, `docs/project-status.md`. When in doubt, read the docs.
