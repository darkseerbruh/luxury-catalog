import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

// override: true so a local .env.local wins over any ambient placeholder vars
// the execution environment may pre-set (e.g. a cloud container's stub
// SUPABASE_* values). No-op in deploys (Vercel) where there is no .env.local.
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local"), override: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
