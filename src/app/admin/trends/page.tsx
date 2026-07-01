import Link from "next/link";
import { getTiktokTrends } from "@/lib/trends";
import TrendsTable from "./TrendsTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "TikTok trends — Admin · Luxury Catalog",
  robots: { index: false, follow: false },
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="font-serif text-3xl text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}

export default async function TrendsPage() {
  const rows = await getTiktokTrends();
  const filled = rows.filter((r) => r.creators_saturation != null).length;
  const captured = rows[0]?.captured_on ?? null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">
          <Link href="/admin" className="transition-colors hover:text-gold">
            Admin
          </Link>{" "}
          / TikTok trends
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">TikTok trending terms</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Trending bag searches from the TikTok Creative Center, sorted by popularity. Sort and
          filter to find where demand is high. Click into the top terms on TikTok, record the
          creator count in <span className="text-foreground">Creators</span>, and build first where
          demand is high and saturation is low. Popularity is TikTok&rsquo;s search signal; growth is
          directional, worth a second check in-app.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted">
          No trending terms loaded yet. Run{" "}
          <code className="text-foreground">npx tsx supabase/seed/seed-tiktok-trends.ts</code> after
          a capture.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Trending terms" value={rows.length.toString()} />
            <Stat label="Saturation filled in" value={`${filled} / ${rows.length}`} />
            <Stat
              label="Captured"
              value={captured ? new Date(captured).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
            />
          </div>
          <TrendsTable rows={rows} />
        </>
      )}
    </main>
  );
}
