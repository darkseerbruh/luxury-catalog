import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

/**
 * Server-side gate for every /admin/* route. `requireAdmin()` redirects
 * non-admins (and fails closed when migration 0008 is unapplied), so no admin
 * page renders for an unauthorized user. Individual admin server actions must
 * still call `requireAdmin()` themselves — a layout does not protect actions.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
