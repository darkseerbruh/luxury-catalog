import ThriftFindForm from "./ThriftFindForm";
import { getCurrentUser } from "@/lib/auth";
import { hasActiveAuthenticators } from "@/lib/authentication";

export const dynamic = "force-dynamic";

export const metadata = { title: "Log a find · Luxury Catalog" };

export default async function FoundPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; style?: string }>;
}) {
  const { brand = "", style = "" } = await searchParams;
  const [user, authLive] = await Promise.all([getCurrentUser(), hasActiveAuthenticators()]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-5 py-12">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Thrift log</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Log a find</h1>
        <p className="mt-2 text-muted">
          Found something in the wild? Tell us what it was and what you paid.
          Every find sharpens what we all know is out there and what it sells
          for. No account needed.
        </p>
      </header>

      <ThriftFindForm
        defaultBrand={brand}
        defaultStyle={style}
        signedIn={!!user}
        authComingSoon={!authLive}
      />
    </main>
  );
}
