import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVariantDetail, getResourcesForStyle, getStyleVariants, getVariantImages, getVariantEraComps } from "@/lib/queries";
import { getVariantUserState } from "@/lib/collections";
import { getVariantDemand } from "@/lib/demand";
import { listByBrand, listByStyle } from "@/lib/posts";
import { ArticleList } from "@/components/ArticleList";
import { buildResaleLinks, buildConsignmentLinks } from "@/lib/affiliate";
import { getApprovedPhotos } from "@/lib/photos";
import {
  AUTHOR_NAME,
  SITE_URL,
  buildLeadAnswer,
  metaDescription,
  buildFaq,
  fullTitle,
  dim,
  productJsonLd,
  faqJsonLd,
  breadcrumbJsonLd,
} from "@/lib/geo";
import FeedbackWidget from "./FeedbackWidget";
import SuggestEdit, { type CorrectableField } from "./SuggestEdit";
import BagActions from "./BagActions";
import PriceTrend from "./PriceTrend";
import ValueModule, { type ValueFraming } from "./ValueModule";
import TrackBagView from "./TrackBagView";
import WhereToBuy from "./WhereToBuy";
import ListingsForSale from "./ListingsForSale";
import WhereToSell from "./WhereToSell";
import StickyActionBar from "./StickyActionBar";
import PhotoContributions from "./PhotoContributions";
import RequestAuthentication from "./RequestAuthentication";
import { hasActiveAuthenticators } from "@/lib/authentication";
import Reviews from "./Reviews";
import AxisVotes from "./AxisVotes";
import Resources from "./Resources";
import SimilarBags from "./SimilarBags";
import BagDNA from "./BagDNA";
import VariantSelector from "./VariantSelector";
import { BagImage } from "@/components/BagImage";

export const dynamic = "force-dynamic";

// Dedupe the (heavy) detail fetch across generateMetadata + the page render.
const getVariant = cache(getVariantDetail);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ variantId: string }>;
}): Promise<Metadata> {
  const { variantId } = await params;
  const id = parseInt(variantId, 10);
  if (isNaN(id)) return {};
  const v = await getVariant(id);
  if (!v) return {};

  const title = `${fullTitle(v)} — production, authentication, and value`;
  const description = metaDescription(v);
  const url = `${SITE_URL}/bag/${v.variantId}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

function formatPrice(amount: number | null, currency: string | null) {
  if (amount == null) return null;
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

function ConfidenceBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    low: "text-muted border-border/50",
    medium: "text-muted border-border",
    high: "text-gold/80 border-gold/40",
    verified: "text-gold border-gold",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide ${colors[level] ?? colors.low}`}
    >
      {level}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="mb-4 font-serif text-xl text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function SpecRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 text-sm">
      <span className="w-36 shrink-0 text-muted">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

/** A spec row whose value links to the filtered search index (IMDb "every attribute is a link"). */
function LinkedSpecRow({
  label,
  value,
  query,
}: {
  label: string;
  value: string | null | undefined;
  query?: string | null;
}) {
  if (!value) return null;
  const q = query ?? value;
  return (
    <div className="flex gap-3 py-2 text-sm">
      <span className="w-36 shrink-0 text-muted">{label}</span>
      <Link
        href={`/search?q=${encodeURIComponent(q)}`}
        className="text-foreground underline decoration-border underline-offset-2 transition-colors hover:text-gold hover:decoration-gold"
      >
        {value}
      </Link>
    </div>
  );
}

/**
 * Collapsible section (progressive disclosure) built on the native
 * <details>/<summary> element — no client JS. Matches the `Section` idiom.
 */
function Collapsible({
  title,
  children,
  defaultOpen = false,
  id,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id?: string;
}) {
  return (
    <details id={id} open={defaultOpen} className="group border-t border-border pt-8">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-foreground">{title}</h2>
        <span className="shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

/** In-page jump navigation to the major sections (anchor links). */
function JumpNav({ items }: { items: { id: string; label: string }[] }) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="On this page"
      className="flex flex-wrap gap-2 rounded-2xl border border-border bg-surface p-4"
    >
      {items.map((it) => (
        <a
          key={it.id}
          href={`#${it.id}`}
          className="rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-gold hover:text-gold"
        >
          {it.label}
        </a>
      ))}
    </nav>
  );
}

function median(nums: number[]): number {
  const s = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export default async function BagDetailPage({
  params,
}: {
  params: Promise<{ variantId: string }>;
}) {
  const { variantId } = await params;
  const id = parseInt(variantId, 10);
  if (isNaN(id)) notFound();

  const [v, userState] = await Promise.all([
    getVariant(id),
    getVariantUserState(id),
  ]);
  if (!v) notFound();

  const [resources, styleVariants, images, photos, authMarketplaceLive, stylePosts, brandPosts] =
    await Promise.all([
      getResourcesForStyle(v.style.styleId, v.variantId),
      getStyleVariants(v.style.styleId),
      getVariantImages([v.variantId]),
      getApprovedPhotos(v.variantId),
      hasActiveAuthenticators(),
      listByStyle(v.style.styleId, 4),
      listByBrand(v.brand.brandId, 4),
    ]);

  // Articles for this bag, most specific first: style-tagged guides lead, then
  // brand-tagged guides not already shown. A bag inherits relevance from its
  // style and (more broadly) its brand.
  const seen = new Set(stylePosts.map((p) => p.postId));
  const bagPosts = [...stylePosts, ...brandPosts.filter((p) => !seen.has(p.postId))].slice(0, 4);

  const variantTitle = [v.sizeLabel, v.exteriorColorway, v.hardwareColor ? `${v.hardwareColor} HW` : null]
    .filter(Boolean)
    .join(" · ") || "Variant";

  const yearRange = v.yearStart
    ? v.yearEnd
      ? `${v.yearStart}–${v.yearEnd}`
      : v.yearStart.toString()
    : null;

  const leadAnswer = buildLeadAnswer(v);
  const faq = buildFaq(v);
  const updated = v.createdAt
    ? new Date(v.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;
  const sources = Array.from(
    new Set(
      v.productionRecords
        .flatMap((r) => (r.sources ? r.sources.split(/[;\n]+/) : []))
        .map((s) => s.trim())
        .filter((s) => /^https?:\/\//.test(s))
    )
  );
  const jsonLd = [
    productJsonLd(v, `${SITE_URL}/bag/${v.variantId}`),
    faqJsonLd(faq),
    breadcrumbJsonLd(v),
  ].filter(Boolean);

  // Demand signal (privacy-safe counts of wants + watchers) — powers the timing
  // read; renders only when there's real signal.
  const demand = await getVariantDemand(v.variantId);

  // Fair Market Range — computed ONLY from recorded RESALE sales (no fabrication).
  // KBB "Fair Market Range, not a single price" + StockX "Last Sale". Exclude
  // retail/boutique/MSRP rows so the range reflects the secondary market, not the
  // first-sale price (WatchCharts deliberately separates Retail vs. Market price).
  // Original retail is shown separately from `retailPriceOriginal`.
  // Prefer the explicit price_type (migration 0021); fall back to the platform
  // heuristic for legacy rows that predate it.
  const RETAIL_PLATFORM_RX = /retail|boutique|msrp|in[-\s]?store|flagship/i;
  const isRetailRow = (h: (typeof v.priceHistory)[number]) =>
    h.priceType === "retail_msrp" ||
    (h.priceType == null && h.platform != null && RETAIL_PLATFORM_RX.test(h.platform));
  const recordedSales = v.priceHistory.filter(
    (h): h is (typeof v.priceHistory)[number] & { salePrice: number } =>
      h.salePrice != null && !isRetailRow(h),
  );
  const salePrices = recordedSales.map((h) => h.salePrice);
  const fairMarket =
    salePrices.length > 0
      ? {
          count: salePrices.length,
          min: Math.min(...salePrices),
          med: Math.round(median(salePrices)),
          max: Math.max(...salePrices),
          currency: recordedSales[0].currency,
          last: recordedSales
            .slice()
            .sort((a, b) => b.dateRecorded.localeCompare(a.dateRecorded))[0],
        }
      : null;

  // Adaptive value module (M0): reframe the value summary by the viewer's
  // relationship to the bag (closet want/have/had → buyer/owner/collector), plot
  // current asking listings on the range, and instrument which framing converts.
  // All derived from the resale rows above — no new data source.
  const valueFraming: ValueFraming =
    userState.closetStatus === "have"
      ? "owner"
      : userState.closetStatus === "had"
        ? "collector"
        : "buyer";
  const valueRange = fairMarket
    ? {
        low: fairMarket.min,
        median: fairMarket.med,
        high: fairMarket.max,
        currency: fairMarket.currency,
        count: fairMarket.count,
      }
    : null;
  const listedComps = recordedSales
    .filter((h) => h.priceType === "listed")
    .map((h) => ({
      price: h.salePrice,
      platform: h.platform,
      condition: h.condition,
      url: h.sourceUrl,
    }));
  const salesByDate = recordedSales
    .slice()
    .sort((a, b) => (a.observedOn ?? a.dateRecorded).localeCompare(b.observedOn ?? b.dateRecorded));
  const resaleTrendPct =
    salesByDate.length > 1 && salesByDate[0].salePrice > 0
      ? Math.round(
          ((salesByDate[salesByDate.length - 1].salePrice - salesByDate[0].salePrice) /
            salesByDate[0].salePrice) *
            100,
        )
      : null;
  const resaleAsOf =
    salesByDate.length > 0
      ? salesByDate[salesByDate.length - 1].observedOn ??
        salesByDate[salesByDate.length - 1].dateRecorded
      : null;
  // M2 condition ladder: group the recorded resale into canonical condition
  // tiers (already enum-typed at the DB), best (least-worn) first. Each tier
  // carries its own range + listed comps so the gauge grades within tier and a
  // cheaper-but-worn bag can't masquerade as a deal. ValueModule only shows the
  // ladder when ≥2 tiers have data; otherwise it falls back to the single gauge.
  const CONDITION_ORDER = ["new", "excellent", "very good", "good", "fair"];
  const byCondition = CONDITION_ORDER.map((tier) => {
    const tierRows = recordedSales.filter((h) => h.condition === tier);
    if (tierRows.length === 0) return null;
    const tierPrices = tierRows.map((h) => h.salePrice);
    return {
      label: tier,
      low: Math.min(...tierPrices),
      median: Math.round(median(tierPrices)),
      high: Math.max(...tierPrices),
      count: tierPrices.length,
      comps: tierRows
        .filter((h) => h.priceType === "listed")
        .map((h) => ({
          price: h.salePrice,
          platform: h.platform,
          condition: h.condition,
          url: h.sourceUrl,
        })),
    };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  // Production-era context for the value module (honest year signal we have
  // today): the variant's own production range + discontinued/vintage status,
  // from year_start/year_end.
  const era = {
    productionYears: yearRange,
    discontinued: !v.stillInProduction,
    vintage: !v.stillInProduction && v.yearStart != null && v.yearStart <= new Date().getFullYear() - 20,
  };

  // Era lens (single-axis): resale rows grouped by production-year decade, read
  // from price_history.production_year (migration 0022 + LLM extraction pass).
  // RESILIENT — getVariantEraComps returns [] on any DB error or missing column,
  // so this block can never 404 the live page. The lens only renders when ≥2 era
  // bands are populated; otherwise falls through to the existing gauge, mirroring
  // the condition-ladder's ≥2-tier rule.
  //
  // Bucketing: by decade (1980s, 1990s, 2000s, 2010s, 2020s). The real TRR data
  // spans 1986–2025, which maps cleanly to 3–5 natural bands depending on density.
  // Null production_year rows are excluded — never invent or bucket an unknown year.
  //
  // TODO: era×condition matrix once per-listing condition is captured+enriched
  //       (TRR rows currently have null condition; the 2-axis view waits on that).
  const eraCompsRaw = await getVariantEraComps(v.variantId);
  function eraDecadeLabel(year: number): string {
    const decade = Math.floor(year / 10) * 10;
    return `${decade}s`;
  }
  const eraGroupMap = new Map<string, { prices: number[]; comps: { price: number; platform: string | null; condition: string | null; url: string | null }[] }>();
  for (const c of eraCompsRaw) {
    const label = eraDecadeLabel(c.productionYear);
    if (!eraGroupMap.has(label)) eraGroupMap.set(label, { prices: [], comps: [] });
    const group = eraGroupMap.get(label)!;
    group.prices.push(c.salePrice);
    if (c.priceType === "listed") {
      group.comps.push({ price: c.salePrice, platform: c.platform, condition: c.condition, url: c.sourceUrl });
    }
  }
  // Emit rows sorted chronologically (oldest era first); currency from the first era comp.
  const eraCurrency = eraCompsRaw.length > 0 ? eraCompsRaw[0].currency : (fairMarket?.currency ?? null);
  const byEra = Array.from(eraGroupMap.entries())
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([label, g]) => {
      const sorted = g.prices.slice().sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const med = sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
      return {
        label,
        low: Math.min(...g.prices),
        median: med,
        high: Math.max(...g.prices),
        count: g.prices.length,
        comps: g.comps,
      };
    })
    .filter((r) => r.count > 0);

  // Retail price trajectory (MSRP over time) — the appreciation story, shown
  // separately from the resale Fair Market Range and honestly labelled so retail
  // is never read as resale/market value.
  const retailHistory = v.priceHistory
    .filter(
      (h): h is (typeof v.priceHistory)[number] & { salePrice: number } =>
        h.salePrice != null && isRetailRow(h),
    )
    .slice()
    .sort((a, b) => (a.observedOn ?? a.dateRecorded).localeCompare(b.observedOn ?? b.dateRecorded));
  const retailChange =
    retailHistory.length > 1
      ? Math.round(
          ((retailHistory[retailHistory.length - 1].salePrice - retailHistory[0].salePrice) /
            retailHistory[0].salePrice) *
            100,
        )
      : null;

  // "How to authenticate" checklist — enumerated from existing data only.
  const authChecks: { label: string; detail: string }[] = [];
  if (v.authenticationMarkers) {
    authChecks.push({ label: "Authentication markers", detail: v.authenticationMarkers });
  }
  for (const r of v.productionRecords) {
    const era = r.productionYear ? `${r.productionYear} record` : "Production record";
    if (r.knownAuthenticationMarkers) {
      authChecks.push({
        label: `Known markers (${era})`,
        detail: r.knownAuthenticationMarkers,
      });
    }
    if (r.dateCodeFormat) {
      authChecks.push({ label: `Date code format (${era})`, detail: r.dateCodeFormat });
    }
    if (r.stampPlacement) {
      authChecks.push({
        label: `Stamp placement (${era})`,
        detail: r.stampFontNotes ? `${r.stampPlacement} — ${r.stampFontNotes}` : r.stampPlacement,
      });
    }
  }
  for (const t of v.serialTags) {
    const parts = [t.format, t.placement && `placement: ${t.placement}`, t.howToRead]
      .filter(Boolean)
      .join(" · ");
    authChecks.push({
      label: `${t.tagType}${t.verified ? " (verified)" : ""}`,
      detail: parts || t.authenticationNotes || "Catalogued serial / authentication tag.",
    });
  }

  // Whether the outbound resale / consignor links resolve (drives the top
  // action cluster's Buy/Sell CTAs and the jump-nav entries).
  const hasBuyLinks = buildResaleLinks(v.brand.name, v.style.name).length > 0;
  const hasSellLinks = buildConsignmentLinks(v.brand.name, v.style.name).length > 0;

  // Bag DNA renders when the bag has at least one composition attribute beyond its
  // house (leather / hardware / shape / colour / era) — see BagDNA's ≥2-card guard.
  const hasDna = Boolean(
    v.exteriorMaterial?.name || v.hardwareColor || v.style.silhouette || v.exteriorColorway || v.yearStart,
  );

  // Jump-nav: only link to sections that actually render.
  const jumpItems = [
    photos.length > 0 ? { id: "photos", label: "Photos" } : null,
    hasDna ? { id: "dna", label: "DNA" } : null,
    { id: "specifications", label: "Specs" },
    authChecks.length > 0 ? { id: "authentication", label: "Authentication" } : null,
    v.productionRecords.length > 0 ? { id: "production", label: "Production" } : null,
    recordedSales.length > 0 ? { id: "price-history", label: "Resale prices" } : null,
    retailHistory.length > 1 ? { id: "retail-history", label: "Retail history" } : null,
    hasBuyLinks ? { id: "where-to-buy", label: "Buy" } : null,
    hasSellLinks ? { id: "where-to-sell", label: "Sell" } : null,
    { id: "reviews", label: "Reviews" },
    { id: "owner-ratings", label: "Owner ratings" },
  ].filter((x): x is { id: string; label: string } => x !== null);

  // Curated, user-correctable fields for the "Suggest an edit" widget.
  const correctableFields: CorrectableField[] = [
    { path: "size_label", label: "Size", current: v.sizeLabel },
    { path: "exterior_colorway", label: "Exterior colorway", current: v.exteriorColorway },
    { path: "exterior_material", label: "Exterior material", current: v.exteriorMaterial?.name ?? null },
    { path: "hardware_color", label: "Hardware color", current: v.hardwareColor },
    { path: "interior_color", label: "Interior color", current: v.interiorColor },
    { path: "production_years", label: "Production years", current: yearRange },
    {
      path: "retail_price_original",
      label: "Original retail price",
      current: formatPrice(v.retailPriceOriginal, v.currency),
    },
    { path: "authentication_markers", label: "Authentication markers", current: v.authenticationMarkers },
    { path: "other", label: "Something else", current: null },
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 pb-24 sm:pb-10">
      <TrackBagView
        variantId={v.variantId}
        brand={v.brand.name}
        brandTier={(v.brand.tier as "thrift" | "mid" | "ultra-luxury") || null}
        style={v.style.name}
        silhouette={v.style.silhouette}
        hasPriceHistory={v.priceHistory.length > 0}
      />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link
          href={`/brand/${v.brand.brandId}`}
          className="hover:text-foreground"
        >
          {v.brand.name}
        </Link>
        <span>/</span>
        <Link
          href={`/search?q=${encodeURIComponent(v.style.name)}`}
          className="hover:text-foreground"
        >
          {v.style.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{variantTitle}</span>
      </nav>

      {/* Hero header */}
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">
          {v.brand.name} · {v.brand.tier.replace("-", " ")}
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">
          {v.style.name}
        </h1>
        {/* The variant subtitle is redundant once the dimensional selector shows
            the size/colour/hardware as chips — only show it for single-variant
            styles (no selector). */}
        {styleVariants.length < 2 && (
          <p className="mt-1 text-lg text-muted">{variantTitle}</p>
        )}
        <p className="mt-2 text-xs text-muted/70">
          By {AUTHOR_NAME}
          {updated ? ` · Catalogued ${updated}` : ""}
        </p>
        {v.style.description && (
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {v.style.description}
          </p>
        )}
        {demand.label && (
          <p
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
              demand.level === "hot"
                ? "border-gold bg-gold/10 text-gold"
                : "border-border text-muted"
            }`}
          >
            {demand.level === "hot" ? "🔥 High demand" : "Collector demand"} · {demand.label}
          </p>
        )}
      </header>

      {/* Hero visual — sourced photo when available, else a branded placeholder
          so the page reads as complete (never an AI-faked or unlicensed photo). */}
      <BagImage
        imageUrl={images[v.variantId]}
        brand={v.brand.name}
        alt={`${v.brand.name} ${v.style.name}`}
        className="aspect-[4/3] w-full rounded-2xl border border-border"
      />

      {/* Amazon-style variant selector — placed at the very top, right under the
          title. Each option links to its own indexable /bag/[id] page. */}
      <VariantSelector
        styleName={v.style.name}
        variants={styleVariants}
        currentVariantId={v.variantId}
      />

      {/* Front-loaded answer (GEO): the fact-dense lead AI assistants can quote. */}
      <p className="-mt-2 rounded-xl border border-gold/30 bg-gold/5 px-5 py-4 text-base leading-relaxed text-foreground">
        {leadAnswer}
      </p>

      {/* Above-the-fold decision summary: value range + key identity + retail. */}
      <section
        id="price"
        aria-label="Value summary"
        className="scroll-mt-4 rounded-2xl border border-border bg-surface p-5"
      >
        <ValueModule
          variantId={v.variantId}
          framing={valueFraming}
          range={valueRange}
          listed={listedComps}
          retailOriginal={v.retailPriceOriginal}
          retailCurrency={v.currency}
          trendPct={resaleTrendPct}
          asOf={resaleAsOf}
          demandLevel={demand.level}
          demandLabel={demand.label}
          retailTrendPct={retailChange}
          byCondition={byCondition}
          era={era}
          byEra={byEra}
          eraCurrency={eraCurrency}
        />
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-border pt-4 text-sm">
          {v.retailPriceOriginal != null && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted/70">Original retail</dt>
              <dd className="text-foreground">
                {formatPrice(v.retailPriceOriginal, v.currency)}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted/70">Bag</dt>
            <dd className="text-foreground">
              {v.brand.name} {v.style.name}
            </dd>
          </div>
          {yearRange && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted/70">Production</dt>
              <dd className="text-foreground">{yearRange}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted/70">Status</dt>
            <dd className="text-foreground">
              {v.stillInProduction ? "In production" : "Discontinued"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Decision cluster at the value moment: closet intent (want/have/had) +
          price watch + the Buy/Sell outbound CTAs — the monetization moments,
          above the fold rather than 600 lines down. */}
      <BagActions
        variantId={v.variantId}
        signedIn={userState.signedIn}
        hasBuyLinks={hasBuyLinks}
        hasSellLinks={hasSellLinks}
        initialClosetStatus={userState.closetStatus}
        initialWatching={userState.watching}
      />

      {/* In-page jump navigation (progressive disclosure / mobile long-scroll). */}
      <JumpNav items={jumpItems} />

      {/* Bag DNA — each attribute is a tappable object (SongDNA for bags). */}
      <BagDNA
        brandId={v.brand.brandId}
        brandName={v.brand.name}
        brandTier={v.brand.tier || null}
        leather={v.exteriorMaterial?.name ?? null}
        hardware={v.hardwareColor}
        silhouette={v.style.silhouette}
        colorway={v.exteriorColorway}
        yearStart={v.yearStart}
        yearEnd={v.yearEnd}
      />

      {/* Embedded video reviews — the visual layer while v1 is text-first */}
      <Resources resources={resources} />

      {/* Guides for this bag — style-tagged articles first, then brand-tagged. */}
      {bagPosts.length > 0 && (
        <section className="border-t border-border pt-8">
          <h2 className="font-serif text-2xl text-foreground">Guides for this bag</h2>
          <p className="mt-1 text-sm text-muted">
            Articles on the {v.style.name} and {v.brand.name} from our verified
            experts.
          </p>
          <div className="mt-5">
            <ArticleList posts={bagPosts} />
          </div>
        </section>
      )}

      {/* User photo contributions — real, owned reference shots + the rare-find
          recruiting empty state (the UGC engine the tier ladder rewards). */}
      <PhotoContributions
        variantId={v.variantId}
        brand={v.brand.name}
        photos={photos}
        signedIn={userState.signedIn}
      />

      {/* Core specs */}
      <div id="specifications" className="scroll-mt-4">
        <Section title="Specifications">
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            <SpecRow label="Size" value={v.sizeLabel} />
            <SpecRow label="Size category" value={v.sizeCategory} />
            <LinkedSpecRow label="Exterior material" value={v.exteriorMaterial?.name ?? null} />
            <SpecRow label="Colorway" value={v.exteriorColorway} />
            <LinkedSpecRow label="Hardware color" value={v.hardwareColor} />
            <SpecRow label="Hardware type" value={v.hardwareType} />
            <SpecRow label="Strap type" value={v.strapType} />
            <SpecRow label="Strap attachment" value={v.strapAttachmentType} />
            <SpecRow label="Interior material" value={v.interiorMaterial?.name ?? null} />
            <SpecRow label="Interior color" value={v.interiorColor} />
            <SpecRow label="Stitching color" value={v.stitchingColor} />
            <SpecRow label="Construction" value={v.constructionMethod} />
            <SpecRow label="Rigidity" value={v.rigidity} />
            <LinkedSpecRow label="Silhouette" value={v.style.silhouette} />
            <SpecRow label="Closure" value={v.style.closureType} />
            <LinkedSpecRow
              label="Production years"
              value={yearRange}
              query={v.yearStart ? v.yearStart.toString() : null}
            />
            <SpecRow label="Status" value={v.stillInProduction ? "In production" : "Discontinued"} />
            <SpecRow label="Market" value={v.marketAvailability} />
            {v.retailPriceOriginal != null && (
              <SpecRow
                label="Retail price"
                value={`${formatPrice(v.retailPriceOriginal, v.currency)} original retail`}
              />
            )}
          </div>
        </Section>
      </div>

      {/* How to authenticate — enumerated checklist built ONLY from real data. */}
      {authChecks.length > 0 && (
        <div id="authentication" className="scroll-mt-4">
          <Section title="How to authenticate this bag">
            <p className="mb-4 text-sm text-muted">
              A checklist drawn from the catalogued production records, serial
              tags, and authentication notes for this variant. These checks help
              you know what to look for; they don&rsquo;t replace an in-hand
              inspection by a qualified authenticator.
            </p>
            <ol className="flex flex-col gap-3">
              {authChecks.map((c, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-xl border border-border bg-surface p-5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/40 text-xs font-medium text-gold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.label}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-4 rounded-xl border border-border bg-surface/60 px-5 py-4">
              <p className="text-sm font-medium text-foreground">How we source &amp; verify</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Every record above is research-sourced and{" "}
                <span className="text-foreground">confidence-rated</span> (the{" "}
                <span className="uppercase tracking-wide text-gold/80">low</span>/
                <span className="uppercase tracking-wide text-gold/80">medium</span>/
                <span className="uppercase tracking-wide text-gold/80">high</span>/
                <span className="uppercase tracking-wide text-gold">verified</span>{" "}
                badges shown on each section).
                {sources.length > 0
                  ? " The cited sources are listed at the foot of this page."
                  : ""}{" "}
                We do not guarantee authenticity; verify high-stakes details in person.
              </p>
              <Link
                href="/articles"
                className="mt-2 inline-block text-sm font-medium text-gold transition-colors hover:text-gold-soft"
              >
                Read our authentication guides &rarr;
              </Link>
            </div>
          </Section>
        </div>
      )}

      {/* Authentication-marketplace on-ramp (lead capture — no money on-platform). */}
      <RequestAuthentication variantId={v.variantId} signedIn={userState.signedIn} live={authMarketplaceLive} />

      {/* Exterior material detail */}
      {v.exteriorMaterial && (
        <Section title={`About ${v.exteriorMaterial.name}`}>
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            <SpecRow label="Type" value={v.exteriorMaterial.materialType} />
            <SpecRow label="Water resistance" value={v.exteriorMaterial.waterResistance} />
            <SpecRow label="Scratch resistance" value={v.exteriorMaterial.scratchResistance} />
            <SpecRow label="Weather" value={v.exteriorMaterial.weatherFriendliness} />
            <SpecRow label="Overall hardiness" value={v.exteriorMaterial.hardinessOverall} />
          </div>
          {v.exteriorMaterial.careNotes && (
            <p className="mt-3 rounded-xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-foreground">
              <span className="mr-2 font-medium text-muted">Care:</span>
              {v.exteriorMaterial.careNotes}
            </p>
          )}
          {v.exteriorMaterial.authenticationNotes && (
            <p className="mt-3 rounded-xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-foreground">
              <span className="mr-2 font-medium text-muted">Auth notes:</span>
              {v.exteriorMaterial.authenticationNotes}
            </p>
          )}
        </Section>
      )}

      {/* Production records */}
      {v.productionRecords.length > 0 && (
        <Collapsible title="Production details" id="production">
          <div className="flex flex-col gap-4">
            {v.productionRecords.map((r) => (
              <div
                key={r.productionId}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  {r.productionYear && (
                    <span className="font-serif text-lg text-foreground">
                      {r.productionYear}
                      {r.productionSeason ? ` ${r.productionSeason}` : ""}
                    </span>
                  )}
                  <ConfidenceBadge level={r.confidenceLevel} />
                </div>
                <div className="divide-y divide-border">
                  <SpecRow label="Country" value={r.countryOfManufacture} />
                  {(r.dimensionsHCm || r.dimensionsWCm || r.dimensionsDCm) && (
                    <SpecRow
                      label="Dimensions"
                      value={[
                        r.dimensionsHCm ? `H ${dim(r.dimensionsHCm)}` : null,
                        r.dimensionsWCm ? `W ${dim(r.dimensionsWCm)}` : null,
                        r.dimensionsDCm ? `D ${dim(r.dimensionsDCm)}` : null,
                      ]
                        .filter(Boolean)
                        .join(" × ")}
                    />
                  )}
                  <SpecRow label="Date code format" value={r.dateCodeFormat} />
                  <SpecRow label="Stamp placement" value={r.stampPlacement} />
                  <SpecRow label="Stamp font" value={r.stampFontNotes} />
                </div>
                {r.knownAuthenticationMarkers && (
                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    <span className="mr-2 font-medium text-muted">Authentication:</span>
                    {r.knownAuthenticationMarkers}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Resale price history — the collector/flipper payload (resale rows only;
          retail/MSRP rows are shown separately below so they're never conflated
          with market value). */}
      {recordedSales.length > 0 && (
        <div id="price-history" className="scroll-mt-4">
          <Section title="Resale price history">
            <PriceTrend history={recordedSales} retailPrice={v.retailPriceOriginal} />
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
              {recordedSales
                .slice()
                .sort((a, b) => b.dateRecorded.localeCompare(a.dateRecorded))
                .map((h) => (
                  <li
                    key={h.priceId}
                    className="flex items-center gap-3 px-5 py-3 text-sm"
                  >
                    <span className="text-foreground">
                      {formatPrice(h.salePrice, h.currency)}
                    </span>
                    {h.condition && <span className="text-muted">{h.condition}</span>}
                    {h.provenanceCompleteness && (
                      <span className="text-muted">{h.provenanceCompleteness}</span>
                    )}
                    {h.platform && (
                      <span className="text-muted/70">{h.platform}</span>
                    )}
                    <span className="ml-auto shrink-0 text-muted">
                      {h.dateRecorded}
                    </span>
                  </li>
                ))}
            </ul>
          </Section>
        </div>
      )}

      {/* Retail price over time (MSRP) — the appreciation story, clearly labelled
          and kept distinct from resale so it's never read as market value. */}
      {retailHistory.length > 1 && (
        <div id="retail-history" className="scroll-mt-4">
          <Section title="Retail price over time">
            <p className="mb-4 text-sm leading-relaxed text-muted">
              Original boutique price (MSRP) by year — not resale value.
              {retailChange != null && retailChange > 0 && (
                <>
                  {" "}Up <span className="text-gold">{retailChange}%</span> from{" "}
                  {formatPrice(retailHistory[0].salePrice, retailHistory[0].currency)} in{" "}
                  {(retailHistory[0].observedOn ?? retailHistory[0].dateRecorded).slice(0, 4)} to{" "}
                  {formatPrice(
                    retailHistory[retailHistory.length - 1].salePrice,
                    retailHistory[retailHistory.length - 1].currency,
                  )}{" "}
                  in {(retailHistory[retailHistory.length - 1].observedOn ?? retailHistory[retailHistory.length - 1].dateRecorded).slice(0, 4)}.
                </>
              )}
            </p>
            <PriceTrend history={retailHistory} noun="retail price" />
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
              {retailHistory
                .slice()
                .sort((a, b) => (b.observedOn ?? b.dateRecorded).localeCompare(a.observedOn ?? a.dateRecorded))
                .map((h) => (
                  <li
                    key={h.priceId}
                    className="flex items-center gap-3 px-5 py-3 text-sm"
                  >
                    <span className="text-foreground">
                      {formatPrice(h.salePrice, h.currency)}
                    </span>
                    <span className="ml-auto shrink-0 text-muted">{(h.observedOn ?? h.dateRecorded).slice(0, 10)}</span>
                  </li>
                ))}
            </ul>
          </Section>
        </div>
      )}

      {/* Serial / authentication tags */}
      {v.serialTags.length > 0 && (
        <Collapsible title="Serial & authentication tags">
          <div className="flex flex-col gap-3">
            {v.serialTags.map((t) => (
              <div
                key={t.tagId}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="font-medium text-foreground">{t.tagType}</span>
                  <ConfidenceBadge level={t.confidenceLevel} />
                  {t.verified && (
                    <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
                      verified
                    </span>
                  )}
                </div>
                <div className="divide-y divide-border">
                  <SpecRow label="Format" value={t.format} />
                  <SpecRow label="Placement" value={t.placement} />
                  <SpecRow label="Year range" value={t.yearRange} />
                  <SpecRow label="How to read" value={t.howToRead} />
                </div>
                {t.authenticationNotes && (
                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    <span className="mr-2 font-medium text-muted">Notes:</span>
                    {t.authenticationNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Lock & Key */}
      {v.lockAndKey.filter((l) => l.includesLock).length > 0 && (
        <Section title="Lock & key">
          {v.lockAndKey.map((l) => (
            <div
              key={l.lockId}
              className="divide-y divide-border rounded-xl border border-border bg-surface"
            >
              <SpecRow label="Lock type" value={l.lockType} />
              <SpecRow label="Lock material" value={l.lockMaterial} />
              <SpecRow label="Lock engraving" value={l.lockEngraving} />
              <SpecRow label="Engraving format" value={l.engravingFormat} />
              <SpecRow label="Number of keys" value={l.numberOfKeys?.toString() ?? null} />
              <SpecRow label="Key type" value={l.keyType} />
              <SpecRow label="Clochette included" value={l.clochettIncluded != null ? (l.clochettIncluded ? "Yes" : "No") : null} />
              <SpecRow label="Clochette material" value={l.clochetteMaterial} />
            </div>
          ))}
        </Section>
      )}

      {/* Interior storage */}
      {v.interiorStorage.length > 0 && (
        <Section title="Interior storage">
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {v.interiorStorage.map((s) => (
              <li key={s.storageId} className="flex items-start gap-3 px-5 py-3 text-sm">
                <span className="w-6 shrink-0 text-center font-medium text-gold">
                  {s.quantity}×
                </span>
                <div>
                  <span className="text-foreground">{s.featureType}</span>
                  {s.placement && (
                    <span className="ml-2 text-muted">({s.placement})</span>
                  )}
                  {s.sizeNotes && (
                    <p className="mt-0.5 text-muted">{s.sizeNotes}</p>
                  )}
                </div>
                {s.verified && (
                  <span className="ml-auto shrink-0 rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
                    verified
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Carry methods */}
      {v.carryMethods.length > 0 && (
        <Section title="How to carry">
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {v.carryMethods.map((c) => (
              <li key={c.carryId} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span
                  className={`font-medium ${c.possible === "yes" ? "text-foreground" : c.possible === "depends" ? "text-muted" : "text-muted line-through"}`}
                >
                  {c.carryType}
                </span>
                {c.strapDropLengthCm && (
                  <span className="text-muted">{c.strapDropLengthCm} cm drop</span>
                )}
                {c.strapAdjustable && (
                  <span className="text-muted/70">adjustable</span>
                )}
                {c.notes && (
                  <span className="ml-auto shrink-0 text-muted">{c.notes}</span>
                )}
                {c.verified && (
                  <span className="ml-auto shrink-0 rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
                    verified
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Fits */}
      {v.fits.length > 0 && (
        <Section title="What fits inside">
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {v.fits.map((f) => (
              <li key={f.fitsId} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span
                  className={`${f.fits === "yes" ? "text-foreground" : f.fits === "tight" ? "text-muted" : "text-muted line-through"}`}
                >
                  {f.itemName}
                </span>
                <span className="text-muted">
                  {f.fits === "yes" ? "fits" : f.fits === "tight" ? "tight fit" : "doesn't fit"}
                </span>
                {f.notes && <span className="ml-auto text-muted">{f.notes}</span>}
                {f.verified && (
                  <span className="ml-auto shrink-0 rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
                    verified
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Known color combinations */}
      {v.knownColorCombinations.length > 0 && (
        <Collapsible title="Known color combinations">
          <div className="flex flex-col gap-3">
            {v.knownColorCombinations.map((c) => (
              <div
                key={c.combinationId}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${c.produced ? "text-foreground" : "text-muted"}`}
                  >
                    {c.produced ? "Confirmed produced" : "Not confirmed"}
                  </span>
                  {c.yearRange && (
                    <span className="text-sm text-muted">{c.yearRange}</span>
                  )}
                  <ConfidenceBadge level={c.confidenceLevel} />
                </div>
                <div className="divide-y divide-border">
                  <SpecRow label="Exterior" value={c.exteriorColor} />
                  <SpecRow label="Interior" value={c.interiorColor} />
                  <SpecRow label="Stitching" value={c.stitchingColor} />
                  <SpecRow label="Hardware" value={c.hardwareColor} />
                </div>
                {c.authenticationNotes && (
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {c.authenticationNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Provenance & packaging */}
      {v.provenance.length > 0 && (
        <Section title="Provenance & packaging">
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {v.provenance.map((p) => (
              <li key={p.provenanceId} className="px-5 py-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground capitalize">
                    {p.itemType.replace(/_/g, " ")}
                  </span>
                  {p.includedNew != null && (
                    <span className="text-muted">
                      {p.includedNew ? "included new" : "not included new"}
                    </span>
                  )}
                  {p.verified && (
                    <span className="ml-auto shrink-0 rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
                      verified
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="mt-1 text-muted">{p.description}</p>
                )}
                {p.authenticationNotes && (
                  <p className="mt-1 text-muted/80">Auth: {p.authenticationNotes}</p>
                )}
                {p.valueImpactIfMissing && (
                  <p className="mt-1 italic text-muted/70">
                    Missing: {p.valueImpactIfMissing}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Empty state if no deep data */}
      {v.productionRecords.length === 0 &&
        v.serialTags.length === 0 &&
        !v.authenticationMarkers && (
          <Section title="Research depth">
            <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 text-center text-sm text-muted">
              We haven&rsquo;t researched the authentication details for this
              variant yet. Search by style to find other bags — what people look
              for tells us what to dig into next.
            </div>
          </Section>
        )}

      {/* Live listings for this exact variant, rated against fair value (links out). */}
      <ListingsForSale variantId={v.variantId} />

      {/* Where to buy (affiliate resale search links — fallback when no live listings) */}
      <WhereToBuy variantId={v.variantId} brand={v.brand.name} style={v.style.name} />

      {/* Where to sell — buyout vs. consignment fork (consignor-referral revenue). */}
      <WhereToSell variantId={v.variantId} brand={v.brand.name} style={v.style.name} />

      {/* Reviews & ratings */}
      <Reviews variantId={v.variantId} inCloset={userState.closetStatus !== null} />

      {/* Multi-axis owner ratings (Fragrantica-style character bars) */}
      <AxisVotes variantId={v.variantId} />

      {/* Content-based "similar bags" over catalogued attributes */}
      <SimilarBags variantId={v.variantId} />

      {/* FAQ (GEO: mirrors the FAQPage structured data) */}
      {faq.length > 0 && (
        <Section title="Frequently asked questions">
          <dl className="flex flex-col gap-4">
            {faq.map((f, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-5">
                <dt className="text-sm font-medium text-foreground">{f.question}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {/* Cited sources (E-E-A-T) */}
      {sources.length > 0 && (
        <Section title="Sources">
          <ul className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface px-5 py-4">
            {sources.map((s) => (
              <li key={s} className="truncate text-xs">
                <a
                  href={s}
                  target="_blank"
                  rel="nofollow noopener"
                  className="text-muted hover:text-gold"
                >
                  {s}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted/60">
            Authentication data is research-sourced and confidence-rated. For
            anything that costs you money, check it against the bag in hand.
          </p>
        </Section>
      )}

      {/* Structured suggest-an-edit (corrections) */}
      <SuggestEdit
        variantId={v.variantId}
        signedIn={userState.signedIn}
        fields={correctableFields}
      />

      {/* User feedback */}
      <FeedbackWidget variantId={v.variantId} />

      {/* Structured data for Google AI Overviews / ChatGPT citation */}
      {jsonLd.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}

      {/* Mobile-first sticky decision-point action bar (thumb zone). */}
      <StickyActionBar
        variantId={v.variantId}
        signedIn={userState.signedIn}
        initialClosetStatus={userState.closetStatus}
        initialWatching={userState.watching}
      />
    </main>
  );
}
