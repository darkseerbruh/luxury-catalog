import { redirect } from "next/navigation";

/**
 * "Today's deals" has been folded into the unified Shop surface — it's now the
 * "deals only, best deal first" preset of /shop (one listings engine, not two). This
 * route redirects so existing links/bookmarks keep working.
 */
export default function DealsPage() {
  redirect("/shop?deals=1&sort=best-deal");
}
