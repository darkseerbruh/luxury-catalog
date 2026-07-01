import { getCurrentUser } from "@/lib/auth";
import { getBrandsOverview } from "@/lib/queries";
import TasteQuizClient from "./TasteQuizClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Find your taste · Luxury Catalog",
  description:
    "A quick taste read. We hand you the words for your own style, then point you at bags worth a look.",
};

export default async function QuizPage() {
  const [user, brands] = await Promise.all([getCurrentUser(), getBrandsOverview()]);

  // Houses are loaded live from the brand directory (already tier-ranked), so a
  // new house appears on its own. Top set first; the UI offers a "more" expander.
  const houses = brands.map((b) => b.name).slice(0, 16);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-5 py-12">
      <header className="text-center">
        <p className="text-sm uppercase tracking-widest text-muted">Style read</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">What your style says</h1>
        <p className="mt-2 text-muted">
          A few quick taps. We read your taste off real catalog details, then hand you the
          words for it.
        </p>
      </header>

      <TasteQuizClient houses={houses} signedIn={Boolean(user)} />
    </main>
  );
}
