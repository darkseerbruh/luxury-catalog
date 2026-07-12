import { describe, it, expect } from "vitest";
import { groupProductionOptions } from "@/lib/production-options";

describe("groupProductionOptions", () => {
  it("groups rows into ordered axes (size → colour → material → construction)", () => {
    const axes = groupProductionOptions([
      { axis: "construction", value: "Diamond", permanence: "permanent", season_code: null, is_default: true, note: null, sort_order: 1 },
      { axis: "size", value: "Small", permanence: "permanent", season_code: null, is_default: false, note: null, sort_order: 1 },
      { axis: "color", value: "Black", permanence: "permanent", season_code: null, is_default: true, note: "anchor", sort_order: 1 },
      { axis: "material", value: "Caviar", permanence: "permanent", season_code: null, is_default: true, note: null, sort_order: 1 },
    ]);
    expect(axes.map((a) => a.axis)).toEqual(["size", "color", "material", "construction"]);
    expect(axes[1].label).toBe("Colour");
    expect(axes[1].options[0]).toMatchObject({ value: "Black", isDefault: true, permanence: "permanent" });
  });

  it("ignores unknown axes and empty input", () => {
    expect(groupProductionOptions([])).toEqual([]);
    expect(
      groupProductionOptions([{ axis: "bogus", value: "x", permanence: null, season_code: null, is_default: null, note: null, sort_order: 0 }]),
    ).toEqual([]);
  });
});
