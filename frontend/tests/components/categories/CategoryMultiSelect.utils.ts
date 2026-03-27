import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fitFloatingPosition,
  getDropdownLayout,
  getMenuPosition,
  getPickerPosition,
  getRandomPresetColour,
  normalise,
  parseColourInput,
} from "@/components/categories/CategoryMultiSelect.utils";

describe("CategoryMultiSelect.utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("normalise", () => {
    it("trims and lowercases the input", () => {
      expect(normalise("  My CATEGORY  ")).toBe("my category");
    });
  });

  describe("getRandomPresetColour", () => {
    it("returns a colour from the provided preset list", () => {
      const colours = ["#111111", "#222222", "#333333"];
      vi.spyOn(Math, "random").mockReturnValue(0.4);

      expect(getRandomPresetColour(colours)).toBe("#222222");
    });

    it("can return the first colour", () => {
      const colours = ["#111111", "#222222", "#333333"];
      vi.spyOn(Math, "random").mockReturnValue(0);

      expect(getRandomPresetColour(colours)).toBe("#111111");
    });
  });

  describe("fitFloatingPosition", () => {
    it("returns the same position when already within viewport", () => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 1000,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 800,
      });

      const rect = {
        left: 100,
        top: 120,
        right: 300,
        bottom: 320,
        width: 200,
        height: 200,
      } as DOMRect;

      expect(fitFloatingPosition({ left: 100, top: 120 }, rect)).toEqual({
        left: 100,
        top: 120,
      });
    });

    it("clamps position back into the viewport on all sides", () => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 500,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 400,
      });

      const rect = {
        left: -20,
        top: -10,
        right: 700,
        bottom: 600,
        width: 200,
        height: 150,
      } as DOMRect;

      expect(fitFloatingPosition({ left: 300, top: 250 }, rect)).toEqual({
        left: 8,
        top: 8,
      });
    });

    it("clamps right and bottom overflow using element size", () => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 500,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 400,
      });

      const rect = {
        left: 300,
        top: 250,
        right: 550,
        bottom: 430,
        width: 180,
        height: 120,
      } as DOMRect;

      expect(fitFloatingPosition({ left: 350, top: 300 }, rect)).toEqual({
        left: 312,
        top: 272,
      });
    });
  });

  describe("getDropdownLayout", () => {
    it("returns null when input is null", () => {
      expect(getDropdownLayout(null)).toBeNull();
    });

    it("positions the dropdown below the input when there is enough space", () => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 1200,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 900,
      });

      const input = document.createElement("input");
      vi.spyOn(input, "getBoundingClientRect").mockReturnValue({
        top: 100,
        bottom: 140,
        left: 50,
        right: 250,
        width: 200,
        height: 40,
      } as DOMRect);

      expect(getDropdownLayout(input)).toEqual({
        position: {
          top: 146,
          left: 50,
          width: 200,
        },
        maxHeight: 224,
      });
    });

    it("positions the dropdown above the input when below space is limited and above is larger", () => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 1200,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 400,
      });

      const input = document.createElement("input");
      vi.spyOn(input, "getBoundingClientRect").mockReturnValue({
        top: 320,
        bottom: 360,
        left: 100,
        right: 350,
        width: 250,
        height: 40,
      } as DOMRect);

      expect(getDropdownLayout(input)).toEqual({
        position: {
          top: 90,
          left: 100,
          width: 250,
        },
        maxHeight: 224,
      });
    });

    it("clamps left position inside the viewport", () => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 300,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 700,
      });

      const input = document.createElement("input");
      vi.spyOn(input, "getBoundingClientRect").mockReturnValue({
        top: 100,
        bottom: 140,
        left: 250,
        right: 450,
        width: 200,
        height: 40,
      } as DOMRect);

      expect(getDropdownLayout(input)).toEqual({
        position: {
          top: 146,
          left: 92,
          width: 200,
        },
        maxHeight: 224,
      });
    });

    it("uses the minimum dropdown height when available space is very small", () => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 600,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 220,
      });

      const input = document.createElement("input");
      vi.spyOn(input, "getBoundingClientRect").mockReturnValue({
        top: 70,
        bottom: 110,
        left: 20,
        right: 220,
        width: 200,
        height: 40,
      } as DOMRect);

      expect(getDropdownLayout(input)).toEqual({
        position: {
          top: 116,
          left: 20,
          width: 200,
        },
        maxHeight: 160,
      });
    });
  });

  describe("getMenuPosition", () => {
    it("calculates the menu position relative to the trigger", () => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 1200,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 900,
      });

      const button = document.createElement("button");
      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        top: 100,
        bottom: 130,
        left: 400,
        right: 500,
        width: 100,
        height: 30,
      } as DOMRect);

      expect(getMenuPosition(button)).toEqual({
        top: 136,
        left: 324,
      });
    });

    it("clamps the menu inside the viewport", () => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: 250,
      });
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: 200,
      });

      const button = document.createElement("button");
      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        top: 180,
        bottom: 195,
        left: 230,
        right: 260,
        width: 30,
        height: 15,
      } as DOMRect);

      expect(getMenuPosition(button)).toEqual({
        top: 8,
        left: 66,
      });
    });
  });

  describe("getPickerPosition", () => {
    it("positions the picker above and to the left of the trigger rect", () => {
      const rect = {
        top: 350,
        left: 420,
      } as DOMRect;

      expect(getPickerPosition(rect)).toEqual({
        top: 70,
        left: 140,
      });
    });
  });

  describe("parseColourInput", () => {
    it("normalises full hex input", () => {
      expect(parseColourInput("  #AABBCC  ")).toBe("#aabbcc");
    });

    it("parses rgb input into hex", () => {
      expect(parseColourInput("rgb(255, 0, 16)")).toBe("#ff0010");
    });

    it("clamps rgb channels to valid byte values", () => {
      expect(parseColourInput("rgb(300, -5, 260)")).toBeNull();
    });

    it("returns null for invalid input", () => {
      expect(parseColourInput("blue")).toBeNull();
      expect(parseColourInput("#abc")).toBeNull();
      expect(parseColourInput("rgba(1, 2, 3, 0.5)")).toBeNull();
    });
  });
});