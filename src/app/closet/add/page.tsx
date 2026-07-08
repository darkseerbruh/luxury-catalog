import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ClosetAddFlow } from "@/components/ClosetAddFlow";

export const dynamic = "force-dynamic";

export const metadata = { title: "Add a bag · Luxury Catalog" };

export default async function AddBagPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-12">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Your closet</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Add a bag</h1>
        <p className="mt-2 text-muted">Find your bag, mark it yours, and leave the first word on it.</p>
      </header>
      <ClosetAddFlow />
    </main>
  );
}
