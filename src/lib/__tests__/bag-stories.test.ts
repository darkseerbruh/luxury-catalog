import { describe, it, expect } from "vitest";
import { getBagStory } from "@/lib/bag-stories";
import { BAG_STORIES } from "@/lib/bag-stories/data";

describe("getBagStory", () => {
  it("matches a hero style by name fragment (case-insensitive)", () => {
    expect(getBagStory("Birkin")?.match).toContain("birkin");
    expect(getBagStory("birkin 30")?.tagline).toMatch(/sick bag/i);
    expect(getBagStory("Classic Flap")?.people[0].name).toMatch(/Chanel/);
  });

  it("returns null for unseeded styles and empty input", () => {
    expect(getBagStory("Some Unknown Tote")).toBeNull();
    expect(getBagStory(null)).toBeNull();
    expect(getBagStory(undefined)).toBeNull();
    expect(getBagStory("")).toBeNull();
  });

  it("every seeded tidbit carries at least one real https source (never-invent)", () => {
    for (const story of BAG_STORIES) {
      expect(story.tidbits.length).toBeGreaterThan(0);
      for (const t of story.tidbits) {
        expect(t.sources.length).toBeGreaterThan(0);
        for (const s of t.sources) {
          expect(s.url).toMatch(/^https:\/\//);
          expect(s.name.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("every seeded video has a valid YouTube id, title, and source (never-invent)", () => {
    for (const story of BAG_STORIES) {
      for (const v of story.videos ?? []) {
        expect(v.youtubeId).toMatch(/^[a-zA-Z0-9_-]{11}$/);
        expect(v.title.trim().length).toBeGreaterThan(0);
        expect(v.source.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("contains no em dashes in user-facing copy (voice gate)", () => {
    for (const story of BAG_STORIES) {
      const copy = [
        story.tagline,
        ...story.tidbits.flatMap((t) => [t.title, t.body]),
        ...story.people.flatMap((p) => [p.role, p.note ?? ""]),
      ].join(" ");
      expect(copy).not.toContain("—");
    }
  });
});
