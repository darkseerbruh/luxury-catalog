import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { getAllBags } from "@/lib/catalog/sample-data";

export default function Home() {
  const bags = getAllBags();

  return (
    <div className="min-h-full bg-white dark:bg-black">
      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            The Luxury Catalog
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-500">
            An authentication and reference catalog for luxury handbags. Browse
            by tier and silhouette, then open a piece for its authentication
            markers, provenance and resale price history.
          </p>
        </header>
        <CatalogBrowser bags={bags} />
      </main>
    </div>
  );
}
