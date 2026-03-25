import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useThemes } from "@/hooks/settings/useThemes";

describe("useThemes", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.font;
  });

  it("exposes theme and font options", () => {
    const { result } = renderHook(() => useThemes());

    expect(result.current.state.themeOptions).toEqual([
      "light",
      "dark",
      "midnight",
      "retro",
      "bento",
      "taro",
      "paper",
      "terminal",
      "sea-glass",
      "coral",
      "forest-night",
      "plum-ink",
      "neon-noir",
      "ivy",
      "arctic",
      "signal",
    ]);
    expect(result.current.state.fontOptions).toEqual([
      "poppins",
      "comfortaa",
      "righteous",
      "fira-code",
      "kalam",
      "gloria-hallelujah",
      "bitcount",
      "bebas-neue",
    ]);
    expect(result.current.error.theme).toBeNull();
    expect(result.current.error.font).toBeNull();
  });

  it("applies theme and font changes through hook actions", () => {
    const { result } = renderHook(() => useThemes());

    act(() => {
      result.current.actions.applyTheme("dark");
      result.current.actions.applyFont("poppins");
    });

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.font).toBe("poppins");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(localStorage.getItem("font")).toBe("poppins");
  });
});
