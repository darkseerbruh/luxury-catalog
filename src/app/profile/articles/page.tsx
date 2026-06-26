import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { listMyPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My articles · The Luxury Catalog",
  robots: { index: false, follow: false },
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function MyPostsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getProfile();
  if (!profile?.isExpert) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-12">
        <h1 className="font-serif text-3xl text-foreground">Articles</h1>
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted">
          Writing here is open to verified experts. If you know authentication or
          collecting and want to contribute, reach out from your{" "}
          <Link href="/profile" className="text-gold hover:underline">profile</Link>.
        </div>
      </main>
    );
  }

  const posts = await listMyPosts();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted">Editorial</p>
          <h1 className="mt-1 font-serif text-3xl text-foreground">My articles</h1>
        </div>
        <Link
          href="/articles/new"
          className="shrink-0 rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
        >
          Write an article
        </Link>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted">
          No articles yet. When you write one, it&rsquo;ll show up here.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((p) => {
            const date = formatDate(p.publishedAt) ?? formatDate(p.updatedAt);
            return (
              <li
                key={p.postId}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-lg text-foreground">{p.title}</h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs uppercase tracking-wide ${
                        p.status === "published"
                          ? "bg-gold/10 text-gold"
                          : "border border-border text-muted"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  {date && <p className="mt-1 text-xs text-muted/70">{date}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  {p.status === "published" && (
                    <Link
                      href={`/articles/${p.slug}`}
                      className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
                    >
                      View
                    </Link>
                  )}
                  <Link
                    href={`/articles/${p.slug}/edit`}
                    className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
