import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { listPublished, type PostSummary } from "@/lib/posts";
import { getProfile } from "@/lib/auth";
import { SITE_URL } from "@/lib/geo";
import {
  DEPARTMENTS,
  getDepartment,
  classifyDepartment,
  type DepartmentId,
} from "@/lib/article-departments";

export const dynamic = "force-dynamic";

/** How many pieces a department previews on the overview before "View all". */
const PREVIEW = 4;

type SearchParams = {
  department?: string;
  brand?: string;
  q?: string;
  sort?: string;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { department } = await searchParams;
  const dept = getDepartment(department);
  const title = dept
    ? `${dept.label} — ${dept.blurb} · The Luxury Catalog`
    : "The Journal — guides on what's real, what it's worth, and what to buy · The Luxury Catalog";
  const description = dept
    ? `${dept.label}: ${dept.blurb} Written straight by The Luxury Catalog's verified experts, built on real resale data.`
    : "Guides on authenticating designer handbags, what they hold in resale, and which to buy. Sorted by what you came to do, written by verified experts.";
  const canonical = dept ? `${SITE_URL}/articles?department=${dept.id}` : `${SITE_URL}/articles`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function byline(p: PostSummary): string {
  return p.author?.displayName || (p.author?.handle ? `@${p.author.handle}` : "The Luxury Catalog");
}

/** Build an /articles href, dropping empty params so URLs stay clean + indexable. */
function href(params: Partial<SearchParams>): string {
  const sp = new URLSearchParams();
  if (params.department) sp.set("department", params.department);
  if (params.brand) sp.set("brand", params.brand);
  if (params.q) sp.set("q", params.q);
  if (params.sort && params.sort !== "newest") sp.set("sort", params.sort);
  const qs = sp.toString();
  return qs ? `/articles?${qs}` : "/articles";
}

/** The department motif drawn as a watermark behind the house name. Original
 * line-art, never a real bag or a redrawn logo (image rule: real-bag photos must
 * be first-party/licensed; decorative illustration is fine). Authentication = a
 * loupe over a stitched seam (markers to check); value = a price tag; comparisons
 * = two silhouettes; market = the ask-vs-sold bars. */
function DeptMotif({ dept }: { dept: DepartmentId }) {
  const stroke = "#c9a24c";
  if (dept === "market") {
    return (
      <svg width="200" height="132" viewBox="0 0 280 190" fill="none" aria-hidden>
        <line x1="20" y1="160" x2="270" y2="160" stroke={stroke} strokeWidth="1.5" />
        <rect x="46" y="58" width="26" height="102" fill={stroke} opacity="0.35" />
        <rect x="46" y="116" width="26" height="44" fill={stroke} />
        <rect x="130" y="44" width="26" height="116" fill={stroke} opacity="0.35" />
        <rect x="130" y="100" width="26" height="60" fill={stroke} />
        <rect x="214" y="72" width="26" height="88" fill={stroke} opacity="0.35" />
        <rect x="214" y="124" width="26" height="36" fill={stroke} />
      </svg>
    );
  }
  if (dept === "value") {
    return (
      <svg width="150" height="150" viewBox="0 0 100 100" fill="none" stroke={stroke} strokeWidth="2" aria-hidden>
        <path d="M14 40 L54 40 L86 72 L58 100 L26 68 Z" />
        <circle cx="34" cy="60" r="6" />
        <path d="M46 16 v18 M40 22 h12 M40 28 h12" strokeWidth="2.4" />
      </svg>
    );
  }
  if (dept === "comparisons") {
    return (
      <svg width="170" height="120" viewBox="0 0 160 110" fill="none" stroke={stroke} strokeWidth="2" aria-hidden>
        <path d="M18 44 h44 l-5 44 H23 z" opacity="0.45" />
        <path d="M27 44 c0-13 26-13 26 0" opacity="0.45" />
        <path d="M92 36 h48 l-6 52 H98 z" />
        <path d="M102 36 c0-15 28-15 28 0" />
      </svg>
    );
  }
  // authentication — a jeweller's loupe inspecting a stitched seam
  return (
    <svg width="160" height="130" viewBox="0 0 170 140" fill="none" stroke={stroke} strokeWidth="2" aria-hidden>
      <line x1="18" y1="98" x2="150" y2="98" strokeDasharray="9 8" opacity="0.55" />
      <line x1="18" y1="110" x2="150" y2="110" strokeDasharray="9 8" opacity="0.35" />
      <circle cx="92" cy="56" r="30" />
      <line x1="113" y1="78" x2="138" y2="104" strokeWidth="3" />
      <path d="M80 56 l8 9 16 -19" strokeWidth="2.6" />
    </svg>
  );
}

/** Editorial cover art for the lead spread. There is no real-bag photography here
 * by policy (real bags must be first-party or licensed; AI photoreal is barred) —
 * this is an original, designed "cover plate": the house name set in display type,
 * the department's honesty frame, and the department motif behind it, on a warm
 * lattice. House names are TYPE, never a redrawn logo. */
function CoverPlate({ brand, dept, h = "h-40" }: { brand: string | null; dept: DepartmentId; h?: string }) {
  const house = brand ?? "The Journal";
  const frame = getDepartment(dept)?.frame ?? "";
  const patternId = `lattice-${dept}`;
  return (
    <div
      className={`relative flex ${h} flex-col items-center justify-center overflow-hidden rounded-md border border-border`}
      style={{ background: "radial-gradient(125% 95% at 50% 0%, #2c2618 0%, #1a1815 55%, #100f0d 100%)" }}
      aria-hidden
    >
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
        <defs>
          <pattern id={patternId} width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0 H20 M0 0 V20" stroke="#c9a24c" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.16]">
        <DeptMotif dept={dept} />
      </div>

      <span className="absolute left-3 top-3 text-[10px] uppercase tracking-[0.28em] text-gold/70">
        The Journal
      </span>

      <div className="relative z-10 px-4 text-center">
        <span className="mx-auto block h-px w-8 bg-gold/50" />
        <span className="mt-2.5 block font-serif text-xl leading-tight tracking-[0.03em] text-gold-soft sm:text-[1.65rem]">
          {house}
        </span>
        {frame && (
          <span className="mt-2 block text-[9px] uppercase leading-relaxed tracking-[0.2em] text-muted">
            {frame}
          </span>
        )}
        <span className="mx-auto mt-2.5 block h-px w-8 bg-gold/50" />
      </div>
    </div>
  );
}

/** A compact index row, magazine-contents style. */
function EntryRow({ p }: { p: PostSummary }) {
  return (
    <Link
      href={`/articles/${p.slug}`}
      className="group flex items-baseline gap-3 border-b border-border/60 py-2.5"
    >
      <span className="shrink-0 text-gold">&rarr;</span>
      <span>
        <span className="font-serif text-[15px] leading-snug text-foreground group-hover:text-gold-soft">
          {p.title}
        </span>
        <span className="mt-0.5 block text-[11px] tracking-wide text-muted">
          {byline(p)}
          {p.topic.brandName ? ` · ${p.topic.brandName}` : ""}
        </span>
      </span>
    </Link>
  );
}

/** The big lead spread (art + headline + deck). */
function LeadCard({ p, eyebrow, dept }: { p: PostSummary; eyebrow: string; dept: DepartmentId }) {
  const date = formatDate(p.publishedAt);
  return (
    <Link
      href={`/articles/${p.slug}`}
      className="group grid gap-5 overflow-hidden rounded-lg border border-border bg-surface p-4 transition-colors hover:border-gold sm:grid-cols-[230px_1fr] sm:p-0"
    >
      <CoverPlate brand={p.topic.brandName} dept={dept} h="h-40 sm:h-full sm:min-h-[170px]" />
      <div className="sm:py-5 sm:pr-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
        <h3 className="mt-2 font-serif text-2xl leading-tight text-foreground group-hover:text-gold-soft">
          {p.title}
        </h3>
        {p.excerpt && <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">{p.excerpt}</p>}
        <p className="mt-3 text-xs text-muted">
          By <span className="text-gold-soft">{byline(p)}</span>
          {p.topic.brandName ? ` · ${p.topic.brandName}` : ""}
          {date ? ` · ${date}` : ""}
        </p>
      </div>
    </Link>
  );
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const [allPosts, profile] = await Promise.all([listPublished(), getProfile()]);

  const q = (sp.q ?? "").trim();
  const sort = sp.sort === "oldest" ? "oldest" : "newest";
  const activeDept = getDepartment(sp.department);
  const activeBrandId = sp.brand && Number.isFinite(Number(sp.brand)) ? Number(sp.brand) : null;

  // Annotate every post with its department once.
  const tagged = allPosts.map((p) => ({ post: p, dept: classifyDepartment(p) }));

  // Brand scope: everything the active house filter allows. The whole page (rail
  // counts, previews, lead, search) reads from this, so the house filter is one
  // orthogonal dimension layered over departments.
  const scoped = activeBrandId
    ? tagged.filter((t) => t.post.topic.brandId === activeBrandId)
    : tagged;

  const sortPosts = (arr: PostSummary[]) => (sort === "oldest" ? [...arr].reverse() : arr);

  // Rail department counts, scoped to the active house filter so a dead combo
  // (e.g. Comparisons with a house that has none) dims instead of misleading.
  const deptCount = (id: DepartmentId) => scoped.filter((t) => t.dept === id).length;

  // House facet: only houses that actually have a piece in the current scope, so
  // we never offer a filter that leads nowhere. In a department, that's the
  // houses present in THAT department.
  const facetSource = activeDept ? tagged.filter((t) => t.dept === activeDept.id) : tagged;
  const facetMap = new Map<number, { brandId: number; name: string; count: number }>();
  for (const t of facetSource) {
    const { brandId, brandName } = t.post.topic;
    if (brandId != null && brandName) {
      const e = facetMap.get(brandId) ?? { brandId, name: brandName, count: 0 };
      e.count += 1;
      facetMap.set(brandId, e);
    }
  }
  const houses = [...facetMap.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const pillBase = "rounded-full border px-3 py-1.5 text-[13px] transition-colors";
  const pillOn = "border-gold text-gold";
  const pillOff = "border-border text-muted hover:border-gold hover:text-gold";

  // ---- RAIL (shared across every state) ------------------------------------
  const rail = (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <form action="/articles" method="get" className="mb-6">
        <label className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-muted focus-within:border-gold">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3-3" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search the journal"
            className="w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
        </label>
      </form>

      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted">Departments</p>
      <nav aria-label="Departments" className="-mx-1 flex gap-1 overflow-x-auto pb-1 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
        <Link
          href={href({ brand: sp.brand })}
          className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border px-3 py-2 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:border-b lg:border-border/60 lg:px-0 ${
            !activeDept && !q ? "border-gold text-gold-soft lg:border-b-gold" : "border-border text-foreground lg:border-b-border/60"
          }`}
        >
          <span className="font-serif text-xs text-gold">&#9733;</span>
          <span className="text-sm font-medium">All departments</span>
          <span className="ml-auto hidden text-[11px] text-muted lg:inline">{scoped.length}</span>
        </Link>
        {DEPARTMENTS.map((d) => {
          const n = deptCount(d.id);
          const active = activeDept?.id === d.id;
          const dimmed = n === 0;
          const cls = `flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border px-3 py-2 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:border-b lg:px-0 ${
            active
              ? "border-gold text-gold-soft lg:border-b-gold"
              : dimmed
                ? "border-border text-muted/40 lg:border-b-border/60"
                : "border-border text-foreground lg:border-b-border/60"
          }`;
          const inner = (
            <>
              <span className="font-serif text-xs text-gold">{d.number}</span>
              <span className="text-sm font-medium">{d.label}</span>
              <span className="ml-auto hidden text-[11px] text-muted lg:inline">{n}</span>
            </>
          );
          return dimmed ? (
            <span key={d.id} className={cls} aria-disabled title="No guides for this house yet">
              {inner}
            </span>
          ) : (
            <Link key={d.id} href={href({ department: d.id, brand: sp.brand })} className={cls}>
              {inner}
            </Link>
          );
        })}
      </nav>

      {houses.length > 0 && (
        <div className="mt-6">
          <p className="mb-2.5 text-[10px] uppercase tracking-[0.2em] text-muted">Filter by house</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={href({ department: sp.department, q: q || undefined })}
              className={`${pillBase} ${!activeBrandId ? pillOn : pillOff}`}
            >
              All
            </Link>
            {houses.map((b) => (
              <Link
                key={b.brandId}
                href={href({ department: sp.department, brand: String(b.brandId), q: q || undefined })}
                className={`${pillBase} ${activeBrandId === b.brandId ? pillOn : pillOff}`}
              >
                {b.name} <span className="text-muted/60">{b.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {profile?.isExpert && (
        <Link
          href="/articles/new"
          className="mt-6 inline-flex rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          Write an article
        </Link>
      )}
    </aside>
  );

  // ---- CONTENT -------------------------------------------------------------
  let content: ReactNode;

  if (allPosts.length === 0) {
    content = (
      <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted">
        No articles yet. The first ones are being written, check back soon.
      </div>
    );
  } else if (q) {
    // SEARCH: a flat list across the current house scope, each tagged with its
    // department so the result still tells you what kind of piece it is.
    const ql = q.toLowerCase();
    const hits = sortPosts(
      scoped
        .filter(
          (t) =>
            t.post.title.toLowerCase().includes(ql) ||
            (t.post.excerpt ?? "").toLowerCase().includes(ql),
        )
        .map((t) => t.post),
    );
    content = (
      <section>
        <p className="text-[11px] uppercase tracking-[0.06em] text-muted">
          <Link href={href({ brand: sp.brand })} className="text-gold">The Journal</Link> / Search
        </p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">
          {hits.length} result{hits.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
        </h1>
        {hits.length === 0 ? (
          <p className="mt-6 text-muted">
            Nothing matched. Try a brand or a bag name, or{" "}
            <Link href={href({ brand: sp.brand })} className="text-gold hover:underline">browse the departments</Link>.
          </p>
        ) : (
          <div className="mt-6 grid gap-x-10 sm:grid-cols-2">
            {hits.map((p) => (
              <EntryRow key={p.postId} p={p} />
            ))}
          </div>
        )}
      </section>
    );
  } else if (activeDept) {
    // DEPARTMENT drill-in: that department's full list, scoped by house.
    const posts = sortPosts(scoped.filter((t) => t.dept === activeDept.id).map((t) => t.post));
    const sortHref = href({
      department: activeDept.id,
      brand: sp.brand,
      sort: sort === "newest" ? "oldest" : "newest",
    });
    content = (
      <section>
        <p className="text-[11px] uppercase tracking-[0.06em] text-muted">
          <Link href={href({ brand: sp.brand })} className="text-gold">The Journal</Link> / {activeDept.label}
        </p>
        <div className="mt-2 border-b-2 border-gold pb-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Department {activeDept.number}</p>
          <h1 className="mt-1 font-serif text-4xl text-foreground">{activeDept.label}</h1>
          <p className="mt-1.5 text-sm italic text-muted">
            {activeDept.frame}. {activeDept.blurb}
          </p>
        </div>
        <div className="mt-4 mb-6 flex items-center gap-3 text-xs text-muted">
          <Link
            href={href({ brand: sp.brand })}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold px-3 py-1.5 text-gold"
          >
            {activeDept.label} <span className="opacity-70">&times;</span>
          </Link>
          <span>{posts.length} guide{posts.length === 1 ? "" : "s"}</span>
          {posts.length > 1 && (
            <Link href={sortHref} className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 hover:border-gold">
              {sort === "newest" ? "Newest first" : "Oldest first"}
            </Link>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted">
            No {activeDept.label.toLowerCase()} guides for this house yet.{" "}
            <Link href={href({ department: activeDept.id })} className="text-gold hover:underline">
              Clear the house filter
            </Link>
            .
          </div>
        ) : (
          <>
            <LeadCard p={posts[0]} eyebrow={`Latest · ${posts[0].topic.brandName ?? activeDept.label}`} dept={activeDept.id} />
            {posts.length > 1 && (
              <div className="mt-6 grid gap-x-10 sm:grid-cols-2">
                {posts.slice(1).map((p) => (
                  <EntryRow key={p.postId} p={p} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    );
  } else {
    // OVERVIEW: the lead, then every department previewed with "View all".
    const lead = scoped[0]?.post;
    const leadDept = scoped[0]?.dept ?? "market";
    content = (
      <section>
        {activeBrandId && (
          <div className="mb-5 flex items-center gap-3 text-xs text-muted">
            <span>Filtered to</span>
            <Link
              href={href({})}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold px-3 py-1.5 text-gold"
            >
              {houses.find((h) => h.brandId === activeBrandId)?.name ?? "house"} <span className="opacity-70">&times;</span>
            </Link>
          </div>
        )}

        {lead && !activeBrandId && (
          <div className="mb-8">
            <p className="mb-2.5 text-[11px] uppercase tracking-[0.22em] text-gold">The lead</p>
            <LeadCard p={lead} eyebrow={`Latest · ${lead.topic.brandName ?? "The Journal"}`} dept={leadDept} />
          </div>
        )}

        <div className="grid gap-x-11 gap-y-9 sm:grid-cols-2">
          {DEPARTMENTS.map((d) => {
            const posts = sortPosts(scoped.filter((t) => t.dept === d.id).map((t) => t.post));
            if (posts.length === 0) return null;
            return (
              <div key={d.id}>
                <div className="flex items-baseline gap-2.5 border-b-2 border-gold pb-1.5">
                  <span className="font-serif text-lg font-bold text-gold">{d.number}</span>
                  <Link href={href({ department: d.id, brand: sp.brand })} className="text-[13px] uppercase tracking-[0.16em] text-foreground hover:text-gold-soft">
                    {d.label}
                  </Link>
                  {posts.length > PREVIEW && (
                    <Link href={href({ department: d.id, brand: sp.brand })} className="ml-auto whitespace-nowrap text-[11px] tracking-wide text-gold hover:underline">
                      View all {posts.length} &rarr;
                    </Link>
                  )}
                </div>
                <p className="mb-1 mt-1.5 text-[11px] italic text-muted">{d.frame}</p>
                <div>
                  {posts.slice(0, PREVIEW).map((p) => (
                    <EntryRow key={p.postId} p={p} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8">
      <div className="mb-7">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">The Luxury Catalog · Editorial</p>
        {!activeDept && !q ? (
          <h1 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">The Journal</h1>
        ) : (
          <p className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">The Journal</p>
        )}
        <p className="mt-2 max-w-prose text-sm text-muted">
          What&apos;s real, what it&apos;s worth, and whether it&apos;s worth it to you. Sorted by what you came to do.
          Checking a specific bag right now?{" "}
          <Link href="/identify" className="text-gold hover:underline">Identify it from a photo</Link>{" "}
          or <Link href="/authenticate" className="text-gold hover:underline">request a pro review</Link>.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[210px_1fr]">
        {rail}
        {content}
      </div>
    </main>
  );
}
