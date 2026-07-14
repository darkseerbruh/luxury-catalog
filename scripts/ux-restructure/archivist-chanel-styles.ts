// READ-ONLY: list all Chanel styles (style_id + name) for archivist merge-target research.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "path";

config({ path: path.resolve(__dirname, "../../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: brands, error: bErr } = await supabase
    .from("brand")
    .select("brand_id, name")
    .ilike("name", "%chanel%");
  if (bErr) throw bErr;
  console.log("Brands:", JSON.stringify(brands));

  for (const b of brands ?? []) {
    let all: { style_id: number; name: string }[] = [];
    let from = 0;
    for (;;) {
      const { data, error } = await supabase
        .from("style")
        .select("style_id, name")
        .eq("brand_id", b.brand_id)
        .order("style_id")
        .range(from, from + 999);
      if (error) throw error;
      all = all.concat(data ?? []);
      if (!data || data.length < 1000) break;
      from += 1000;
    }
    console.log(`\n== ${b.name} (${all.length} styles) ==`);
    for (const s of all) console.log(`${s.style_id}\t${s.name}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
