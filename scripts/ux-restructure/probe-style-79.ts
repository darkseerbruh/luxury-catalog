/** Read-only probe of Chanel style #79 (0714 audit §11 follow-up). */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

(async () => {
  const { data: style } = await db.from("style").select("*").eq("style_id", 79).maybeSingle();
  console.log("STYLE 79:", JSON.stringify(style, null, 2));

  const { data: variants } = await db.from("variant").select("*").eq("style_id", 79);
  console.log("VARIANTS:", JSON.stringify(variants, null, 2));

  for (const v of variants ?? []) {
    const { data: comps, count } = await db
      .from("price_history")
      .select("price_id, price, currency, notes, source, listing_ref", { count: "exact" })
      .eq("variant_id", v.variant_id)
      .limit(5);
    console.log(`COMPS v${v.variant_id} (count=${count}):`, JSON.stringify(comps, null, 2));
  }

  // any discovered_listing rows guessed at this style?
  const { data: disc } = await db
    .from("discovered_listing")
    .select("id, title, url, price, style_guess, status")
    .or("style_guess.eq.79,style_guess.eq.Vintage Quilted Shoulder Bag")
    .limit(10);
  console.log("DISCOVERED (style_guess→79):", JSON.stringify(disc, null, 2));
})();
