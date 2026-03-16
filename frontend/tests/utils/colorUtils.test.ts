import { describe, expect, it } from "vitest";
import { getOverrideColour, hexToRgba } from "@/utils/colorUtils";
import type { Category } from "@/types";

describe("hexToRgba", () => {
  it("converts a valid hex colour to rgba", () => {
    expect(hexToRgba("#1a2b3c", 0.5)).toBe("rgba(26, 43, 60, 0.5)");
  });

  it("falls back to black for invalid hex values", () => {
    expect(hexToRgba("#fff", 0.25)).toBe("rgba(0,0,0,0.25)");
  });
});

describe("getOverrideColour", () => {
  it("returns null when categories are missing", () => {
    expect(getOverrideColour(undefined)).toBeNull();
    expect(getOverrideColour([])).toBeNull();
  });

  it("returns the first colour override found", () => {
    const categories: Category[] = [
      { id: 1, text: "Math", colour: "#ff0000", colour_override: false },
      { id: 2, text: "Work", colour: "#00ff00", colour_override: true },
      { id: 3, text: "Study", colour: "#0000ff", colour_override: true },
    ];

    expect(getOverrideColour(categories)).toBe("#00ff00");
  });

  it("ignores categories without a usable override colour", () => {
    const categories: Category[] = [
      { id: 1, text: "Math", colour: null, colour_override: true },
      { id: 2, text: "Work", colour_override: true },
    ];

    expect(getOverrideColour(categories)).toBeNull();
  });
});
