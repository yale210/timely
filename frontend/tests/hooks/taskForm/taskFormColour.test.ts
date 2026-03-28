import { describe, expect, it } from "vitest";
import {
  buildPickerPosition,
  getSelectedCategoryObjects,
  getTaskFormColourState,
} from "@/hooks/taskForm/taskFormColour";

describe("taskFormColour", () => {
  const categories = [
    { id: 1, text: "Work", colour: "#ff0000", colour_override: true },
    { id: 2, text: "Study", colour: "#00ff00", colour_override: false },
    { id: 3, text: "Life", colour: "#0000ff", colour_override: false },
  ] as never[];

  it("returns only selected category objects", () => {
    const result = getSelectedCategoryObjects(categories, [1, 3]);

    expect(result.map((category) => category.id)).toEqual([1, 3]);
  });

  it("returns colour override state when override exists", () => {
    const result = getTaskFormColourState(categories, [1, 2], "#123456");

    expect(result.selectedCategoryObjects.map((category) => category.id)).toEqual([1, 2]);
    expect(result.overrideColour).toBe("#ff0000");
    expect(result.isColourLocked).toBe(true);
    expect(result.displayColour).toBe("#ff0000");
  });

  it("falls back to task colour when no override exists", () => {
    const result = getTaskFormColourState(categories, [2, 3], "#123456");

    expect(result.overrideColour).toBeNull();
    expect(result.isColourLocked).toBe(false);
    expect(result.displayColour).toBe("#123456");
  });

  it("builds picker position from a DOMRect", () => {
    const rect = {
      bottom: 200,
      right: 400,
    } as DOMRect;

    expect(buildPickerPosition(rect)).toEqual({
      top: 208,
      left: 128,
    });
  });
});