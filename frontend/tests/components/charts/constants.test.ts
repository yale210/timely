import { describe, expect, it } from "vitest";
import { LIGHT_GREY, PRIMARY_BLUE } from "@/components/charts/constants";

describe("chart constants", () => {
  it("exports the shared chart colours", () => {
    expect(PRIMARY_BLUE).toBe("#3b82f6");
    expect(LIGHT_GREY).toBe("#64748b");
  });
});
