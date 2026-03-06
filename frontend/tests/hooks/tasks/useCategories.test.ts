import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import useCategories from "@/hooks/tasks/useCategories";

describe("useCategories Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return initial loading state", () => {
    (global.fetch as any).mockReturnValue(new Promise(() => {})); // Never resolves
    const { result } = renderHook(() => useCategories());
    expect(result.current.loading).toBe(true);
    expect(result.current.categories).toEqual([]);
  });

  it("should fetch categories and update state", async () => {
    const mockCategories = [{ id: 1, text: "Category 1" }];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories,
    });

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.categories).toEqual(mockCategories);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/categories/", { credentials: "include" });
  });

  it("should handle fetch failure", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.categories).toEqual([]);
    });
  });

  it("should handle fetch error", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network Error"));

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.categories).toEqual([]);
    });
  });

  it("should not update state if unmounted", async () => {
    let resolveFetch: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    (global.fetch as any).mockReturnValue(fetchPromise);

    const { result, unmount } = renderHook(() => useCategories());

    unmount();

    resolveFetch!({
      ok: true,
      json: async () => [{ id: 1, text: "Category 1" }],
    });

    // Wait a bit to ensure any async updates would have happened
    await new Promise((r) => setTimeout(r, 10));

    expect(result.current.categories).toEqual([]);
  });
});
