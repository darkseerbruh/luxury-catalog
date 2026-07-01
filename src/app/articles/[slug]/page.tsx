import { cache, type ComponentType, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBySlug, listPublished } from "@/lib/posts";
import { classifyDepartment } from "@/lib/article-departments";
import TrackArticleView from "./TrackArticleView";
import { getCurrentUser } from "@/lib/auth";
import { AUTHOR_NAME, AUTHOR_ROLE, SITE_URL } from "@/lib/geo";
import { PostBagCTA } from "./PostBagCTA";
import { ShopThisBag, type ShopThisBagData } from "./ShopThisBag";
import { getStyleShopData } from "@/lib/article-shop";
import { buildConsignmentLinks, applyEbayAffiliate, affiliateListingUrl } from "@/lib/affiliate";
import { coachDiagramRegistry } from "./CoachAuthDiagram";
import { chanelDiagramRegistry } from "./ChanelAuthDiagram";
import { lvAuthDiagramRegistry } from "./LVAuthDiagram";
import { gucciMarmontAuthDiagramRegistry } from "./GucciMarmontAuthDiagram";
import { brandAuthDiagramRegistry } from "./BrandAuthDiagram";
import { flapChartsRegistry } from "./FlapValueCharts";
import { flapVenueChartRegistry } from "./FlapVenueChart";
import { caviarVsLambskinChartsRegistry } from "./CaviarVsLambskinCharts";
import { leatherDiagramRegistry } from "./LeatherComparisonDiagram";
import { whereToSellDiagramRegistry } from "./WhereToSellDiagram";
import { birkinKellyChartRegistry } from "./BirkinKellyChart";
import { neverfullSizeChartRegistry } from "./NeverfullSizeChart";
import { iconicPricesChartRegistry } from "./IconicPricesChart";
import { neverfullSpeedyChartRegistry } from "./NeverfullSpeedyChart";
import { rentVsBuyDiagramRegistry } from "./RentVsBuyDiagram";
import { resaleRedFlagsDiagramRegistry } from "./ResaleRedFlagsDiagram";
import { holdsValueDiagramRegistry } from "./HoldsValueDiagram";
import { entryBagsChartRegistry } from "./EntryBagsChart";
import { coachResaleRealityChartRegistry } from "./CoachResaleRealityChart";
import { sizePriceCurveChartRegistry } from "./SizePriceCurveChart";
import { askVsSoldGapChartRegistry } from "./AskVsSoldGapChart";
import { midTierHoldsValueChartRegistry } from "./MidTierHoldsValueChart";
import { searchVsPriceChartRegistry } from "./SearchVsPriceChart";
import { chanelHermesHoldChartRegistry } from "./ChanelHermesHoldChart";
import { AuthorCard } from "./AuthorCard";
import { TrustBadges } from "@/components/TrustBadges";

// Registered article visuals. A body line `[diagram: <id>]` renders the matching
// original schematic or data-viz component (never a photo) in place.
const DIAGRAMS: Record<string, ComponentType> = {
  ...coachDiagramRegistry,
  ...chanelDiagramRegistry,
  ...lvAuthDiagramRegistry,
  ...gucciMarmontAuthDiagramRegistry,
  ...brandAuthDiagramRegistry,
  ...flapChartsRegistry,
  ...flapVenueChartRegistry,
  ...caviarVsLambskinChartsRegistry,
  ...leatherDiagramRegistry,
  ...whereToSellDiagramRegistry,
  ...birkinKellyChartRegistry,
  ...neverfullSizeChartRegistry,
  ...iconicPricesChartRegistry,
  ...neverfullSpeedyChartRegistry,
  ...rentVsBuyDiagramRegistry,
  ...resaleRedFlagsDiagramRegistry,
  ...holdsValueDiagramRegistry,
  ...entryBagsChartRegistry,
  ...coachResaleRealityChartRegistry,
  ...sizePriceCurveChartRegistry,
  ...askVsSoldGapChartRegistry,
  ...midTierHoldsValueChartRegistry,
  ...searchVsPriceChartRegistry,
  ...chanelHermesHoldChartRegistry,
};

export const dynamic = "force-dynamic";

// Dedupe the fetch across generateMetadata + the page render.
const getPost = cache(getBySlug);

function authorName(post: Awaited<ReturnType<typeof getBySlug>>): string {
  return (
    post?.author?.displayName ||
    (post?.author?.handle ? `@${post.author.handle}` : null) ||
    AUTHOR_NAME
  );
}

function plainExcerpt(post: NonNullable<Awaited<ReturnType<typeof getBySlug>>>): string {
  if (post.excerpt) return post.excerpt;
  const text = (post.body ?? "")
    .replace(/^(#{1,6}|>|-)\s+/gm, "") // strip leading block markers
    .replace(/\*\*/g, "") // strip bold markers
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= 157) return text;
  return text.slice(0, 154).replace(/\s+\S*$/, "") + "…";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article · The Luxury Catalog" };

  const title = `${post.title} · The Luxury Catalog`;
  const description = plainExcerpt(post);
  const url = `${SITE_URL}/articles/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      url,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      authors: [authorName(post)],
    },
    twitter: { card: "summary", title: post.title, description },
  };
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/** Minimal inline formatting: **bold** only. No links render from article
 * bodies on purpose, so monetization stays in the PostBagCTA block. Text nodes
 * are escaped by React, so this never injects HTML. */
function renderInline(text: string, keyPrefix: string) {
  return text.split(/\*\*/).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

/** Render the article body from its plain-text field with a small, safe markup
 * vocabulary, parsed line by line so a "## heading" sitting directly above its
 * paragraph still renders as a heading:
 *   "## heading"      -> a serif subheading
 *   "- item" lines    -> a bulleted list
 *   "> line" lines    -> a callout box (set apart from the body)
 *   "[diagram: <id>]" -> a registered schematic component
 *   anything else     -> a paragraph
 * No raw HTML is injected: every value renders as an escaped React text node. */
function Body({ body, injectAfterFirstDiagram }: { body: string | null; injectAfterFirstDiagram?: ReactNode }) {
  if (!body) return null;
  const out: ReactNode[] = [];
  let injected = false;
  let para: string[] = [];
  let list: string[] = [];
  let quote: string[] = [];
  let k = 0;
  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(" ");
    out.push(<p key={k} className="text-base leading-relaxed">{renderInline(text, `p${k}`)}</p>);
    para = [];
    k++;
  };
  const flushList = () => {
    if (!list.length) return;
    const items = list;
    out.push(
      <ul key={k} className="flex flex-col gap-1.5 pl-1">
        {items.map((l, j) => (
          <li key={j} className="flex gap-2.5 text-base leading-relaxed">
            <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
            <span>{renderInline(l, `b${k}-${j}`)}</span>
          </li>
        ))}
      </ul>,
    );
    list = [];
    k++;
  };
  const flushQuote = () => {
    if (!quote.length) return;
    const text = quote.join(" ");
    out.push(
      <aside key={k} className="rounded-2xl border border-gold/30 bg-gold/5 px-5 py-4 text-sm leading-relaxed text-muted">
        {renderInline(text, `c${k}`)}
      </aside>,
    );
    quote = [];
    k++;
  };
  const flushAll = () => {
    flushPara();
    flushList();
    flushQuote();
  };

  for (const raw of body.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flushAll();
      continue;
    }
    const diagram = line.match(/^\[diagram:\s*([\w-]+)\]$/);
    if (diagram) {
      flushAll();
      const D = DIAGRAMS[diagram[1]];
      if (D) {
        out.push(<D key={k} />);
        k++;
      }
      if (injectAfterFirstDiagram && !injected) {
        out.push(<div key={`inject-${k}`}>{injectAfterFirstDiagram}</div>);
        injected = true;
        k++;
      }
      continue;
    }
    if (line.startsWith("## ")) {
      flushAll();
      const heading = line.replace(/^##\s+/, "");
      const id = heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      out.push(
        <h2 key={k} id={id} className="mt-2 scroll-mt-24 font-serif text-xl text-foreground">
          {renderInline(heading, `h${k}`)}
        </h2>,
      );
      k++;
      continue;
    }
    if (line.startsWith("- ")) {
      flushPara();
      flushQuote();
      list.push(line.replace(/^-\s+/, ""));
      continue;
    }
    if (line.startsWith(">")) {
      flushPara();
      flushList();
      quote.push(line.replace(/^>\s?/, ""));
      continue;
    }
    flushList();
    flushQuote();
    para.push(line);
  }
  flushAll();
  return <div className="flex flex-col gap-4 text-foreground">{out}</div>;
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const user = await getCurrentUser();
  const isAuthor = user?.id === post.author?.userId;
  const date = formatDate(post.publishedAt) ?? formatDate(post.createdAt);
  // Show a "Last updated" date when the post has been edited on a later day than
  // it was published. This is the freshness signal for evergreen/fee/value posts
  // (it also feeds dateModified in the Article JSON-LD below for GEO).
  const updatedDate = formatDate(post.updatedAt);
  const showUpdated = Boolean(updatedDate && updatedDate !== date);
  const name = authorName(post);

  // More guides in the same department. Keeps a high-intent reader (especially on
  // an authentication guide) moving through the series instead of dead-ending, and
  // adds internal links for GEO. One list query, deduped against the current post.
  const dept = classifyDepartment(post);
  const moreInDept = (await listPublished())
    .filter((p) => p.slug !== post.slug && classifyDepartment(p) === dept)
    .slice(0, 6);
  const deptLabel = dept === "authentication" ? "authentication" : dept === "value" ? "value" : dept === "comparisons" ? "comparison" : "market";

  const hasTopic = Boolean(
    (post.topic.brandId && post.topic.brandName) || (post.topic.styleId && post.topic.styleName)
  );

  // Live "shop this bag" data for the visible (sticky + inline) CTAs. Real listings from
  // our capture, affiliate-attributed. Null/absent → cards simply don't render.
  const shopLabel = [post.topic.brandName, post.topic.styleName].filter(Boolean).join(" ").trim();
  const shop = hasTopic ? await getStyleShopData(post.topic.styleId) : null;
  let shopData: ShopThisBagData | null = null;
  if (shop && shop.count > 0 && shopLabel) {
    shopData = {
      label: shopLabel,
      count: shop.count,
      fromPrice: shop.fromPrice,
      currency: shop.currency,
      asOf: shop.asOf,
      offers: shop.offers
        .filter((o) => o.sourceUrl)
        .map((o) => ({
          price: o.price,
          currency: o.currency,
          sizeLabel: o.sizeLabel,
          platformLabel: o.platformLabel,
          href: affiliateListingUrl(o.sourceUrl as string, o.platform),
        })),
      sell: buildConsignmentLinks(post.topic.brandName ?? "", post.topic.styleName ?? "").map((l) => ({ key: l.key, name: l.name, url: l.url })),
      ebayUrl: applyEbayAffiliate(
        `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(shopLabel)}&_sacat=169291`,
        `post-${post.slug}`,
      ),
    };
  }

  // Article JSON-LD with a named-author byline (E-E-A-T). Only includes fields
  // that exist; no invented data.
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    url: `${SITE_URL}/articles/${post.slug}`,
    author: {
      "@type": "Person",
      name,
      ...(post.author?.handle ? { url: `${SITE_URL}/u/${post.author.handle}` } : {}),
    },
    publisher: { "@type": "Organization", name: "The Luxury Catalog" },
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
    ...(post.excerpt ? { description: post.excerpt } : {}),
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-10">
      {post.status === "published" && (
        <TrackArticleView slug={post.slug} postId={post.postId} title={post.title} />
      )}
      <nav className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link href="/articles" className="hover:text-foreground">Articles</Link>
      </nav>

      <header>
        {post.status !== "published" && (
          <p className="mb-3 inline-block rounded-full border border-gold/40 px-3 py-1 text-xs uppercase tracking-wide text-gold">
            {post.status === "draft" ? "Draft — only you can see this" : post.status}
          </p>
        )}
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-sm text-muted">
          By{" "}
          {post.author?.handle ? (
            <Link href={`/u/${post.author.handle}`} className="text-foreground hover:text-gold">
              {name}
            </Link>
          ) : (
            name
          )}
          {post.author && `, ${AUTHOR_ROLE}`}
          {post.author && (
            <TrustBadges
              isVerified={post.author.isVerified}
              isExpert={post.author.isExpert}
              isAuthenticator={post.author.isAuthenticator}
              className="ml-2 inline-flex align-middle"
            />
          )}
          {date ? ` · ${date}` : ""}
          {showUpdated ? ` · Updated ${updatedDate}` : ""}
        </p>
        {isAuthor && (
          <Link
            href={`/articles/${post.slug}/edit`}
            className="mt-3 inline-block rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
          >
            Edit article
          </Link>
        )}
      </header>

      {post.excerpt && (
        <p className="border-l-2 border-gold/40 pl-4 text-lg leading-relaxed text-muted">
          {post.excerpt}
        </p>
      )}

      <article>
        <Body
          body={post.body}
          injectAfterFirstDiagram={shopData ? <ShopThisBag variant="inline" data={shopData} /> : undefined}
        />
      </article>

      {/* Dismissible floating shop bar: keeps the buy/sell path visible without forcing
          a scroll to the bottom. Mobile = bottom bar, desktop = bottom-right card. */}
      {shopData && <ShopThisBag variant="floating" data={shopData} />}

      {/* Money-moment: topic-tagged posts hand off to commissionable buy/sell links */}
      {hasTopic && (post.topic.brandName || post.topic.styleName) && (
        <PostBagCTA brandName={post.topic.brandName} styleName={post.topic.styleName} slug={post.slug} />
      )}

      {/* Author credibility card (E-E-A-T): who wrote this and why to trust it. */}
      {post.author && <AuthorCard author={post.author} />}

      {/* Sources / related — link to the brand or style this article covers */}
      {hasTopic && (
        <section className="border-t border-border pt-6">
          <h2 className="mb-3 font-serif text-lg text-foreground">Related in the catalog</h2>
          <div className="flex flex-wrap gap-2">
            {post.topic.brandId && post.topic.brandName && (
              <Link
                href={`/brand/${post.topic.brandId}`}
                className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
              >
                {post.topic.brandName}
              </Link>
            )}
            {post.topic.styleId && post.topic.styleName && (
              <Link
                href={`/search?q=${encodeURIComponent(post.topic.styleName)}`}
                className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
              >
                {post.topic.styleName}
              </Link>
            )}
          </div>
        </section>
      )}

      {moreInDept.length > 0 && (
        <section className="border-t border-border pt-6">
          <h2 className="mb-3 font-serif text-lg text-foreground">More {deptLabel} guides</h2>
          <div className="grid gap-x-10 sm:grid-cols-2">
            {moreInDept.map((p) => (
              <Link
                key={p.postId}
                href={`/articles/${p.slug}`}
                className="group flex items-baseline gap-2.5 border-b border-border/60 py-2.5"
              >
                <span className="shrink-0 text-gold">&rarr;</span>
                <span className="font-serif text-[15px] leading-snug text-foreground group-hover:text-gold-soft">
                  {p.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-border pt-6 text-sm text-muted">
        <Link href="/articles" className="hover:text-gold">← All articles</Link>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
