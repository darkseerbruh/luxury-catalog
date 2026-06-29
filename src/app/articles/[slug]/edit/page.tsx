import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { getBySlug } from "@/lib/posts";
import { getBrandsOverview } from "@/lib/queries";
import PostForm from "../../PostForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit article · The Luxury Catalog",
  robots: { index: false, follow: false },
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getProfile();
  if (!profile?.isExpert) redirect("/articles");

  const post = await getBySlug(slug);
  if (!post) notFound();
  // Only the author may edit (RLS also enforces this; this is the UI guard).
  if (post.author?.userId !== user.id) redirect(`/articles/${post.slug}`);

  const brands = (await getBrandsOverview()).map((b) => ({ brandId: b.brandId, name: b.name }));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">
          <Link href="/profile/articles" className="hover:text-gold">My articles</Link> / Edit
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Edit article</h1>
        <p className="mt-2 text-muted">
          The URL stays the same when you change the title.{" "}
          <Link href={`/articles/${post.slug}`} className="text-gold hover:underline">View live →</Link>
        </p>
      </header>
      <PostForm
        brands={brands}
        initial={{
          postId: post.postId,
          title: post.title,
          excerpt: post.excerpt ?? "",
          body: post.body ?? "",
          topicBrandId: post.topic.brandId,
          status: post.status,
        }}
      />
    </main>
  );
}
