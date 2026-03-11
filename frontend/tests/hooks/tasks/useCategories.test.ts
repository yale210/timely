import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import useCategories from "@/hooks/tasks/useCategories";
import { getCategories } from "@/services/taskService";

vi.mock("@/services/taskService", () => ({
  getCategories: vi.fn(),
}));

describe("useCategories Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return initial loading state", () => {
    vi.mocked(getCategories).mockReturnValue(new Promise(() => {
      // Intentionally never resolves to test loading state
    }));
    const { result } = renderHook(() => useCategories());
    expect(result.current.loading).toBe(true);
    expect(result.current.categories).toEqual([]);
  });

  it("should fetch categories and update state", async () => {
    const mockCategories = [{ id: 1, text: "Category 1" }];
    vi.mocked(getCategories).mockResolvedValueOnce(mockCategories);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.categories).toEqual(mockCategories);
    });

    expect(getCategories).toHaveBeenCalledTimes(1);
  });

  it("should handle fetch failure", async () => {
    vi.mocked(getCategories).mockRejectedValueOnce(new Error("Request failed"));

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.categories).toEqual([]);
    });
  });

  it("should handle fetch error", async () => {
    vi.mocked(getCategories).mockRejectedValueOnce(new Error("Server error"));

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.categories).toEqual([]);
    });
  });

  it("should not update state if unmounted", async () => {
    let resolveFetch: (value: { id: number; text: string }[]) => void;
    const fetchPromise = new Promise<{ id: number; text: string }[]>((resolve) => {
      resolveFetch = resolve;
    });
    vi.mocked(getCategories).mockReturnValue(fetchPromise);

    const { result, unmount } = renderHook(() => useCategories());

    unmount();

    resolveFetch!([{ id: 1, text: "Category 1" }]);

    // Wait a bit to ensure any async updates would have happened
    await new Promise((r) => setTimeout(r, 10));

    expect(result.current.categories).toEqual([]);
  });
});
