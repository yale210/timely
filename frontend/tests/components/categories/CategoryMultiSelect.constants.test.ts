import { describe, expect, it } from "vitest";
import {
  DEFAULT_SWATCH,
  MAX_CATEGORY_LENGTH,
  PRESET_COLOURS,
  VARIANT_STYLES,
} from "@/components/categories/CategoryMultiSelect.constants";

describe("CategoryMultiSelect.constants", () => {
  it("exports the expected max category length", () => {
    expect(MAX_CATEGORY_LENGTH).toBe(20);
  });

  it("exports the expected default swatch", () => {
    expect(DEFAULT_SWATCH).toBe("#94a3b8");
  });

  it("exports the expected preset colours", () => {
    expect(PRESET_COLOURS).toEqual([
      "#ef4444",
      "#f97316",
      "#f59e0b",
      "#22c55e",
      "#20c7a3",
      "#06b6d4",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#92400e",
      "#64748b",
    ]);
    expect(PRESET_COLOURS).toHaveLength(11);
  });

  it("exports task variant styles", () => {
    expect(VARIANT_STYLES.task).toEqual({
      inputFocus: "focus:ring-primary focus:border-primary",
      optionBase: "text-gray-700 hover:bg-gray-50",
      addBase: "text-primary hover:bg-blue-50",
    });
  });

  it("exports event variant styles", () => {
    expect(VARIANT_STYLES.event).toEqual({
      inputFocus: "focus:ring-orange-500 focus:border-orange-500",
      optionBase: "text-gray-700 hover:bg-gray-50",
      addBase: "text-orange-600 hover:bg-orange-50",
    });
  });

  it("defines styles for both supported variants", () => {
    expect(Object.keys(VARIANT_STYLES).sort()).toEqual(["event", "task"]);
  });
});