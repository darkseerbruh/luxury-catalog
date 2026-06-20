import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getUserBags } from "@/lib/queries";
import CollectionList from "../CollectionList";
import SignedOutGate from "../SignedOutGate";

export const dynamic = "force-dynamic";

export default async function MyBagsPage() {
  const user = await getCurrentUser();
  const items = user ? await getUserBags(user.id, ["own", "had"]) : [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">My bags</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Collection</h1>
        <p className="mt-2 text-sm text-muted">
          The bags you own and have owned.{" "}
          <Link href="/me/wishlist" className="text-gold/80 hover:text-gold">
            View wishlist →
          </Link>
        </p>
      </header>

      {user ? <CollectionList items={items} variant="collection" /> : <SignedOutGate />}
    </main>
  );
}
