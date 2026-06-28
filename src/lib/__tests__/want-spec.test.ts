import { describe, it, expect } from "vitest";
import { wantSpecLabel } from "../want-spec";

describe("wantSpecLabel", () => {
  it("uses the variant label for an exact (null) want", () => {
    expect(wantSpecLabel(null, "Chanel 19", "Medium · Emerald")).toBe("Medium · Emerald");
  });
  it("names a colour-family want", () => {
    expect(wantSpecLabel({ colorFamily: "Green" }, "Chanel 19", "Medium · Emerald")).toBe("Any green Chanel 19");
  });
  it("names an any-colourway want", () => {
    expect(wantSpecLabel({ anyColor: true }, "Chanel 19", "Medium · Emerald")).toBe("Any Chanel 19");
  });
});
