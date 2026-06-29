import { describe, it, expect } from "vitest";
import { safeNext } from "../safe-next";

describe("safeNext", () => {
  it("allows internal paths", () => {
    expect(safeNext("/bag/199")).toBe("/bag/199");
    expect(safeNext("/closet")).toBe("/closet");
  });
  it("rejects external or protocol-relative URLs", () => {
    expect(safeNext("//evil.com")).toBeNull();
    expect(safeNext("https://evil.com")).toBeNull();
    expect(safeNext("javascript:alert(1)")).toBeNull();
  });
  it("rejects empties and non-strings", () => {
    expect(safeNext("")).toBeNull();
    expect(safeNext(null)).toBeNull();
    expect(safeNext(undefined)).toBeNull();
    expect(safeNext(42)).toBeNull();
  });
});
