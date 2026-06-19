import { supabaseAdmin } from "./lib/client";

export const MATERIALS: {
  name: string;
  material_type: "leather" | "exotic" | "fabric" | "coated canvas" | "other";
}[] = [
  { name: "Caviar Leather", material_type: "leather" },
  { name: "Lambskin", material_type: "leather" },
  { name: "Calfskin", material_type: "leather" },
  { name: "Goat Leather", material_type: "leather" },
  { name: "Saffiano", material_type: "leather" },
  { name: "Epi Leather", material_type: "leather" },
  { name: "Togo Leather", material_type: "leather" },
  { name: "Clemence Leather", material_type: "leather" },
  { name: "Epsom Leather", material_type: "leather" },
  { name: "Box Calf", material_type: "leather" },
  { name: "Veau Grainé", material_type: "leather" },
  { name: "Chevre Leather", material_type: "leather" },
  { name: "Ostrich Leather", material_type: "exotic" },
  { name: "Crocodile", material_type: "exotic" },
  { name: "Alligator", material_type: "exotic" },
  { name: "Python", material_type: "exotic" },
  { name: "Lizard", material_type: "exotic" },
  { name: "Stingray", material_type: "exotic" },
  { name: "Denim", material_type: "fabric" },
  { name: "Coated Canvas", material_type: "coated canvas" },
  { name: "Tweed", material_type: "fabric" },
  { name: "Nylon", material_type: "fabric" },
  { name: "Velvet", material_type: "fabric" },
  { name: "Jersey", material_type: "fabric" },
  { name: "Raffia", material_type: "other" },
  { name: "Wicker", material_type: "other" },
  { name: "Pebbled Leather", material_type: "leather" },
  { name: "Signature Coated Canvas", material_type: "coated canvas" },
];

export async function seedMaterials(): Promise<Map<string, number>> {
  const { data, error } = await supabaseAdmin
    .from("material")
    .upsert(MATERIALS, { onConflict: "name" })
    .select("material_id, name");

  if (error) throw new Error(`seedMaterials: ${error.message}`);

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.name, row.material_id);
  }
  console.log(`Seeded ${map.size} materials`);
  return map;
}

if (require.main === module) {
  seedMaterials().then(() => process.exit(0));
}
