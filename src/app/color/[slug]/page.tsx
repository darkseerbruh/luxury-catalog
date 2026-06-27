import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getColorObject } from "@/lib/queries";
import { SITE_URL } from "@/lib/geo";
import AttributeObjectPage, { type AttributeObjectView } from "@/components/AttributeObjectPage";

export const dynamic = "force-dynamic";

const getColor = cache(getColorObject);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const color = await getColor(slug);
  if (!color) return {};
  const title = `${color.name} bags`;
  const description = `Bags in our catalog in ${color.name}, ${color.bagCount} across ${color.houses.length} houses.`;
  const url = `${SITE_URL}/color/${color.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
  };
}

export default async function ColorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const color = await getColor(slug);
  if (!color) notFound();

  const view: AttributeObjectView = {
    kindLabel: "Colour",
    name: color.name,
    subtitle: `Bags catalogued in ${color.name}.`,
    facts: [],
    notes: [],
    bagCount: color.bagCount,
    houses: color.houses,
    bags: color.bags,
    shopHref: `/search?q=${encodeURIComponent(color.name)}`,
  };

  return <AttributeObjectPage view={view} />;
}
