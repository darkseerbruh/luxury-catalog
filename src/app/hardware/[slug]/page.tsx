import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHardwareObject } from "@/lib/queries";
import { SITE_URL } from "@/lib/geo";
import AttributeObjectPage, { type AttributeObjectView } from "@/components/AttributeObjectPage";

export const dynamic = "force-dynamic";

const getHardware = cache(getHardwareObject);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hw = await getHardware(slug);
  if (!hw) return {};
  const title = `${hw.name} hardware bags`;
  const description = `Bags in our catalog finished with ${hw.name} hardware, ${hw.bagCount} across ${hw.houses.length} houses.`;
  const url = `${SITE_URL}/hardware/${hw.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
  };
}

export default async function HardwarePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hw = await getHardware(slug);
  if (!hw) notFound();

  const view: AttributeObjectView = {
    kindLabel: "Hardware",
    name: hw.name,
    subtitle: `Bags finished with ${hw.name} hardware across the catalog.`,
    facts: [],
    notes: [],
    bagCount: hw.bagCount,
    houses: hw.houses,
    bags: hw.bags,
    shopHref: `/search?q=${encodeURIComponent(hw.name)}`,
  };

  return <AttributeObjectPage view={view} />;
}
