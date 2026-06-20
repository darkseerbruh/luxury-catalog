import ThriftFindForm from "./ThriftFindForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Log a find · The Luxury Catalog" };

export default async function FoundPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; style?: string }>;
}) {
  const { brand = "", style = "" } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-5 py-12">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Thrift log</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Log a find</h1>
        <p className="mt-2 text-muted">
          Found something in the wild? Tell us what it was and what you paid. It
          helps everyone understand what&rsquo;s out there and what it&rsquo;s worth.
          No account required.
        </p>
      </header>

      <ThriftFindForm defaultBrand={brand} defaultStyle={style} />
    </main>
  );
}
