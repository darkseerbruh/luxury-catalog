import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getUserBags } from "@/lib/queries";
import CollectionList from "../CollectionList";
import SignedOutGate from "../SignedOutGate";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  const items = user ? await getUserBags(user.id, ["want"]) : [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">My bags</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Wishlist</h1>
        <p className="mt-2 text-sm text-muted">
          The bags you want — turn on “Notify when available” to get an email when
          one can be bought.{" "}
          <Link href="/me/bags" className="text-gold/80 hover:text-gold">
            View collection →
          </Link>
        </p>
      </header>

      {user ? <CollectionList items={items} variant="wishlist" /> : <SignedOutGate />}
    </main>
  );
}
