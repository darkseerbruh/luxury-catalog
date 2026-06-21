import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug } from "../posts-core";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("How To Authenticate A Birkin")).toBe(
      "how-to-authenticate-a-birkin"
    );
  });

  it("strips accents (Hermès -> hermes)", () => {
    expect(slugify("Hermès Kelly guide")).toBe("hermes-kelly-guide");
  });

  it("drops apostrophes without splitting the word", () => {
    expect(slugify("Collector's notes")).toBe("collectors-notes");
  });

  it("collapses punctuation and whitespace runs to single hyphens", () => {
    expect(slugify("Chanel  —  Classic Flap!! (2024)")).toBe(
      "chanel-classic-flap-2024"
    );
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  ...hello...  ")).toBe("hello");
  });

  it("is idempotent", () => {
    const once = slugify("Some Title Here");
    expect(slugify(once)).toBe(once);
  });

  it("falls back to 'post' for symbol-only input", () => {
    expect(slugify("!!!")).toBe("post");
    expect(slugify("")).toBe("post");
  });

  it("does not end on a hyphen after the 80-char cap", () => {
    const long = "word ".repeat(40); // forces a slice mid-stream
    const s = slugify(long);
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s.endsWith("-")).toBe(false);
  });
});

describe("uniqueSlug", () => {
  it("returns the base slug when free", () => {
    expect(uniqueSlug("Hello World", new Set())).toBe("hello-world");
  });

  it("appends -2 on first collision", () => {
    expect(uniqueSlug("Hello World", new Set(["hello-world"]))).toBe(
      "hello-world-2"
    );
  });

  it("increments past consecutive collisions", () => {
    const taken = new Set(["hello-world", "hello-world-2", "hello-world-3"]);
    expect(uniqueSlug("Hello World", taken)).toBe("hello-world-4");
  });

  it("slugifies the base before de-duping", () => {
    expect(uniqueSlug("Hermès Kelly", new Set(["hermes-kelly"]))).toBe(
      "hermes-kelly-2"
    );
  });
});
