import { supabaseAdmin } from "./client";

const materialIdCache = new Map<string, number>();

function guessMaterialType(name: string): "leather" | "exotic" | "fabric" | "coated canvas" | "other" {
  const n = name.toLowerCase();
  if (n.includes("canvas")) return "coated canvas";
  if (n.includes("ostrich") || n.includes("croc") || n.includes("python") || n.includes("lizard") || n.includes("stingray") || n.includes("alligator") || n.includes("exotic")) return "exotic";
  if (n.includes("fabric") || n.includes("suede") || n.includes("tweed") || n.includes("denim") || n.includes("nylon") || n.includes("jersey")) return "fabric";
  if (n.includes("leather") || n.includes("calf") || n.includes("lambskin") || n.includes("caviar") || n.includes("togo") || n.includes("epsom") || n.includes("epi")) return "leather";
  return "other";
}

/** Resolves a free-text material description to a material_id, creating the row if needed. */
export async function resolveMaterialId(rawName: string | null | undefined): Promise<number | null> {
  if (!rawName) return null;
  const name = rawName.trim();
  if (!name) return null;

  if (materialIdCache.has(name)) return materialIdCache.get(name)!;

  const { data: existing } = await supabaseAdmin
    .from("material")
    .select("material_id")
    .eq("name", name)
    .maybeSingle();

  if (existing) {
    materialIdCache.set(name, existing.material_id);
    return existing.material_id;
  }

  const { data: inserted, error } = await supabaseAdmin
    .from("material")
    .insert({ name, material_type: guessMaterialType(name) })
    .select("material_id")
    .single();

  if (error) {
    console.warn(`resolveMaterialId: failed to create material "${name}": ${error.message}`);
    return null;
  }

  materialIdCache.set(name, inserted.material_id);
  return inserted.material_id;
}
