import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEraObject } from "@/lib/queries";
import { SITE_URL } from "@/lib/geo";
import AttributeObjectPage, { type AttributeObjectView } from "@/components/AttributeObjectPage";

export const revalidate = 3600; // ISR: public catalog page, cache 1h (was force-dynamic — see infra-limits)

// On-demand ISR: render + cache each path on first visit (empty = none prerendered at build).
export function generateStaticParams() {
  return [];
}

const getEra = cache(getEraObject);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const era = await getEra(slug);
  if (!era) return {};
  const title = `${era.name} handbags`;
  const description = `Bags whose production began in the ${era.name}, ${era.bagCount} across ${era.houses.length} brands.`;
  const url = `${SITE_URL}/era/${era.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
  };
}

export default async function EraPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const era = await getEra(slug);
  if (!era) notFound();

  const view: AttributeObjectView = {
    kindLabel: "Era",
    name: era.name,
    subtitle: `Bags whose production began in the ${era.name}.`,
    facts: [],
    notes: [],
    bagCount: era.bagCount,
    houses: era.houses,
    bags: era.bags,
    shopHref: `/search?q=${encodeURIComponent(era.name)}`,
  };

  return <AttributeObjectPage view={view} />;
}
