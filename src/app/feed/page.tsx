import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getFeed } from "@/lib/feed";
import { FeedItem } from "@/components/FeedItem";

export const dynamic = "force-dynamic";

export const metadata = { title: "Activity · The Luxury Catalog" };

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const events = await getFeed(60);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Activity</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">From closets you follow</h1>
        <p className="mt-2 text-muted">
          New bags, reviews and articles from the collectors whose eye you trust.
        </p>
      </header>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-5 py-10 text-center text-muted">
          <p>It&rsquo;s quiet in here.</p>
          <p className="mt-1 text-sm">
            Follow a closet and what they save, review and write shows up here.
          </p>
          <Link
            href="/closets"
            className="mt-5 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Browse coveted closets
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {events.map((e) => (
            <FeedItem key={e.id} event={e} />
          ))}
        </ul>
      )}
    </main>
  );
}
