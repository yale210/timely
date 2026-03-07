import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useThemeFont } from "@/hooks/common/useThemeFont";

describe("useThemeFont Hook", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.font;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing if theme and font are not in localStorage", () => {
    renderHook(() => useThemeFont());
    
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.documentElement.dataset.font).toBeUndefined();
  });

  it("applies theme if present in localStorage", () => {
    localStorage.setItem("theme", "dark");
    renderHook(() => useThemeFont());
    
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("applies font if present in localStorage", () => {
    localStorage.setItem("font", "serif");
    renderHook(() => useThemeFont());
    
    expect(document.documentElement.dataset.font).toBe("serif");
  });

  it("applies both theme and font if present in localStorage", () => {
    localStorage.setItem("theme", "light");
    localStorage.setItem("font", "sans");
    renderHook(() => useThemeFont());
    
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.dataset.font).toBe("sans");
  });
});
