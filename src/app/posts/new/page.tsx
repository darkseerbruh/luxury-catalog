import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { getBrandsOverview } from "@/lib/queries";
import PostForm from "../PostForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Write an article · The Luxury Catalog",
  robots: { index: false, follow: false },
};

export default async function NewPostPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getProfile();
  if (!profile?.isExpert) {
    // Not an expert: no authoring access. Send them to the public list.
    redirect("/posts");
  }

  const brands = (await getBrandsOverview()).map((b) => ({ brandId: b.brandId, name: b.name }));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">
          <Link href="/profile/posts" className="hover:text-gold">My articles</Link> / New
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Write an article</h1>
        <p className="mt-2 text-muted">
          Save a draft or publish straight away. Stick to what you can verify — never invent
          authentication markers, date codes, or serial formats. A wrong call costs a reader real money.
        </p>
      </header>
      <PostForm brands={brands} />
    </main>
  );
}
