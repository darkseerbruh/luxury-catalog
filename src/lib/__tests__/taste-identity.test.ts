import { describe, it, expect } from "vitest";
import { tasteIdentity } from "../taste-identity";

describe("tasteIdentity", () => {
  it("leads with the logo line when logo is a decisive quiet pole", () => {
    const r = tasteIdentity({
      vibe: { structured: "love" },
      logo: "quiet",
      hardware: { gold: "love" },
    });
    expect(r.headline).toBe("You don't need it to shout.");
    expect(r.read).toContain("You feel composed, in control, warm and quietly certain.");
    expect(r.read).toContain("The room feels that you have it handled.");
    expect(r.tags).toEqual(["Structured", "No logos", "Gold"]);
  });

  it("leads with the vibe headline when logo is the middle (recognizable)", () => {
    const r = tasteIdentity({
      vibe: { edgy: "love" },
      logo: "recognizable",
      hardware: { gunmetal: "love" },
    });
    expect(r.headline).toBe("You like a little armor.");
    expect(r.read).toContain("sharp, a little untouchable");
    expect(r.read).toContain("with an edge");
    expect(r.read).toContain("and in on it");
    expect(r.tags).toEqual(["Edgy", "Recognizable", "Gunmetal"]);
  });

  it("leads with the loud logo line and reflects it", () => {
    const r = tasteIdentity({ vibe: { glam: "love" }, logo: "loud" });
    expect(r.headline).toBe("You're happy to be appreciated.");
    expect(r.read).toContain("alive, magnetic");
    expect(r.read).toContain("and happy to be looked at");
    expect(r.tags).toEqual(["Glam", "Logo-forward"]);
  });

  it("winks at a second loved vibe", () => {
    const r = tasteIdentity({ vibe: { structured: "love", boho: "love" }, logo: "quiet" });
    // edgy/glam/boho outrank structured, so boho leads, structured is the streak.
    expect(r.headline).toBe("You don't need it to shout.");
    expect(r.read).toContain("with a composed streak");
  });

  it("gives a warm fallback when there is no signal", () => {
    const r = tasteIdentity({ vibe: { structured: "fine" }, logo: "recognizable" });
    expect(r.headline).toBe("You're open to a lot.");
    expect(r.read).toContain("good place to start");
  });

  it("handles a decisive logo with no loved vibe", () => {
    const r = tasteIdentity({ logo: "quiet" });
    expect(r.headline).toBe("You don't need it to shout.");
    expect(r.read).toContain("quietly certain");
    expect(r.tags).toEqual(["No logos"]);
  });

  it("ignores 'fine' and 'not' marks for the read", () => {
    const r = tasteIdentity({
      vibe: { sporty: "love", glam: "not" },
      hardware: { silver: "fine" },
      logo: "recognizable",
    });
    expect(r.headline).toBe("You want it to keep up.");
    expect(r.tags).toEqual(["Sporty", "Recognizable"]);
  });
});
