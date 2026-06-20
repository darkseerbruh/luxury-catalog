/**
 * GEO (generative engine optimization) helpers — implements the marketing
 * plan's "optimize for citation, not just ranking" decision (docs/marketing-plan.md).
 *
 * Everything here is composed DETERMINISTICALLY from real catalog fields — no
 * LLM generation — so the front-loaded answers and FAQ never invent
 * authentication facts (the plan's "authentication accuracy = brand risk" rule).
 */
import type { VariantDetail } from "./queries";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://luxury-catalog-omega.vercel.app";

// E-E-A-T named author. Set NEXT_PUBLIC_AUTHOR_NAME to a real person's name to
// strengthen the authorship signal further (the plan recommends a named human).
export const AUTHOR_NAME =
  process.env.NEXT_PUBLIC_AUTHOR_NAME || "Luxury Catalog Research Desk";

export function cmToIn(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10;
}

/** "26 cm (10.2 in)" */
export function dim(cm: number | null): string | null {
  if (cm == null) return null;
  return `${cm} cm (${cmToIn(cm)} in)`;
}

export function variantLabel(v: VariantDetail): string {
  return (
    [v.sizeLabel, v.exteriorColorway, v.hardwareColor ? `${v.hardwareColor} hardware` : null]
      .filter(Boolean)
      .join(", ") || "this variant"
  );
}

export function fullTitle(v: VariantDetail): string {
  return [v.brand.name, v.style.name, v.sizeLabel].filter(Boolean).join(" ");
}

function yearPhrase(v: VariantDetail): string | null {
  if (!v.yearStart) return null;
  const end = v.yearEnd ? `${v.yearEnd}` : v.stillInProduction ? "present" : null;
  return end ? `${v.yearStart}–${end}` : `${v.yearStart}`;
}

function money(amount: number | null, currency: string | null): string | null {
  if (amount == null) return null;
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

/**
 * The front-loaded answer: a fact-dense declarative lead the page (and AI
 * assistants) can quote directly. Only includes fields that actually exist.
 */
export function buildLeadAnswer(v: VariantDetail): string {
  const subject = [
    "The",
    v.brand.name,
    v.style.name,
    v.sizeLabel,
    v.exteriorColorway ? `in ${v.exteriorColorway}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const descriptors = [v.exteriorMaterial?.name, v.style.silhouette].filter(Boolean).join(" ");
  const years = yearPhrase(v);
  const price = money(v.retailPriceOriginal, v.currency);

  const sentences: string[] = [];

  let lead = subject;
  if (descriptors) lead += ` is a ${descriptors} bag`;
  else lead += " is a designer bag";
  if (years) lead += ` produced ${years}`;
  if (price) lead += `, originally retailing around ${price}`;
  lead += ".";
  sentences.push(lead);

  // Dimensions sentence from the first production record that has them.
  const pr = v.productionRecords.find((r) => r.dimensionsHCm || r.dimensionsWCm || r.dimensionsDCm);
  if (pr) {
    const parts = [
      pr.dimensionsHCm ? `${dim(pr.dimensionsHCm)} high` : null,
      pr.dimensionsWCm ? `${dim(pr.dimensionsWCm)} wide` : null,
      pr.dimensionsDCm ? `${dim(pr.dimensionsDCm)} deep` : null,
    ].filter(Boolean);
    if (parts.length) sentences.push(`It measures ${parts.join(", ")}.`);
  }

  // Authentication clue — short, first marker only.
  const auth =
    v.authenticationMarkers ||
    v.productionRecords.find((r) => r.knownAuthenticationMarkers)?.knownAuthenticationMarkers ||
    null;
  if (auth) {
    const first = auth.split(/(?<=[.!?])\s/)[0].trim();
    if (first) sentences.push(`Authentication: ${first}${/[.!?]$/.test(first) ? "" : "."}`);
  }

  return sentences.join(" ");
}

/** ~155-char meta description derived from the lead answer. */
export function metaDescription(v: VariantDetail): string {
  const text = buildLeadAnswer(v).replace(/\s+/g, " ").trim();
  if (text.length <= 157) return text;
  return text.slice(0, 154).replace(/\s+\S*$/, "") + "…";
}

export interface Faq {
  question: string;
  answer: string;
}

/** Q&A pairs generated only from fields that exist — feeds FAQPage schema. */
export function buildFaq(v: VariantDetail): Faq[] {
  const title = fullTitle(v);
  const faqs: Faq[] = [];

  const years = yearPhrase(v);
  if (years) {
    faqs.push({
      question: `What years was the ${title} produced?`,
      answer: `The ${title} was produced ${years}.`,
    });
  }

  const pr = v.productionRecords.find((r) => r.dimensionsHCm || r.dimensionsWCm || r.dimensionsDCm);
  if (pr) {
    const parts = [
      pr.dimensionsHCm ? `height ${dim(pr.dimensionsHCm)}` : null,
      pr.dimensionsWCm ? `width ${dim(pr.dimensionsWCm)}` : null,
      pr.dimensionsDCm ? `depth ${dim(pr.dimensionsDCm)}` : null,
    ].filter(Boolean);
    if (parts.length) {
      faqs.push({
        question: `What are the dimensions of the ${title}?`,
        answer: `${parts.join(", ")}.`,
      });
    }
  }

  const price = money(v.retailPriceOriginal, v.currency);
  if (price) {
    faqs.push({
      question: `What was the original retail price of the ${title}?`,
      answer: `Around ${price} at original retail.`,
    });
  }

  const auth =
    v.authenticationMarkers ||
    v.productionRecords.find((r) => r.knownAuthenticationMarkers)?.knownAuthenticationMarkers ||
    null;
  if (auth) {
    faqs.push({
      question: `How do you authenticate a ${title}?`,
      answer: auth.length > 320 ? auth.slice(0, 317).trimEnd() + "…" : auth,
    });
  }

  const tag = v.serialTags.find((t) => t.format || t.howToRead);
  if (tag) {
    faqs.push({
      question: `What ${tag.tagType} format does the ${title} use?`,
      answer: [tag.format, tag.howToRead].filter(Boolean).join(" ").slice(0, 320),
    });
  }

  if (v.interiorStorage.length) {
    const feats = v.interiorStorage
      .map((s) => `${s.quantity > 1 ? `${s.quantity} ` : ""}${s.featureType}${s.placement ? ` (${s.placement})` : ""}`)
      .join(", ");
    faqs.push({
      question: `What interior storage does the ${title} have?`,
      answer: `${feats}.`,
    });
  }

  return faqs;
}

interface JsonLd {
  [key: string]: unknown;
}

export function productJsonLd(v: VariantDetail, url: string): JsonLd {
  const props: JsonLd[] = [];
  const add = (name: string, value: string | number | null | undefined) => {
    if (value != null && value !== "") props.push({ "@type": "PropertyValue", name, value: `${value}` });
  };
  add("Silhouette", v.style.silhouette);
  add("Size", v.sizeLabel);
  add("Exterior material", v.exteriorMaterial?.name);
  add("Colorway", v.exteriorColorway);
  add("Hardware", v.hardwareColor);
  const pr = v.productionRecords.find((r) => r.dimensionsHCm || r.dimensionsWCm || r.dimensionsDCm);
  if (pr) {
    add("Height", dim(pr.dimensionsHCm));
    add("Width", dim(pr.dimensionsWCm));
    add("Depth", dim(pr.dimensionsDCm));
  }
  add("Years produced", yearPhrase(v));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: fullTitle(v),
    brand: { "@type": "Brand", name: v.brand.name },
    category: "Designer handbag",
    description: buildLeadAnswer(v),
    url,
    ...(props.length ? { additionalProperty: props } : {}),
  };
}

export function faqJsonLd(faqs: Faq[]): JsonLd | null {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbJsonLd(v: VariantDetail): JsonLd {
  const items = [
    { name: "Home", url: SITE_URL },
    { name: v.brand.name, url: `${SITE_URL}/brand/${v.brand.brandId}` },
    { name: v.style.name, url: `${SITE_URL}/search?q=${encodeURIComponent(v.style.name)}` },
    { name: variantLabel(v), url: `${SITE_URL}/bag/${v.variantId}` },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
