import { notFound } from "next/navigation";

import { BagDetail } from "@/components/catalog/BagDetail";
import { getAllBags, getBagById } from "@/lib/catalog/sample-data";

/** Prerender a page for each known bag at build time. */
export function generateStaticParams() {
  return getAllBags().map((bag) => ({ id: bag.id }));
}

export default async function BagPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bag = getBagById(id);
  if (!bag) notFound();

  return (
    <div className="min-h-full bg-white dark:bg-black">
      <main className="mx-auto flex w-full max-w-5xl justify-center px-6 py-16">
        <BagDetail bag={bag} />
      </main>
    </div>
  );
}
