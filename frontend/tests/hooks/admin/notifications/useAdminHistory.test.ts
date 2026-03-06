import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useAdminHistory } from "@/hooks/admin/notifications/useAdminHistory";
import { getBroadcastHistory } from "@/api/notifications";

// Mock API
vi.mock("@/api/notifications", () => ({
  getBroadcastHistory: vi.fn(),
}));

describe("useAdminHistory Hook", () => {
  const mockItems = [
    { id: 1, title: "B1", status: "COMPLETED" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (getBroadcastHistory as any).mockResolvedValue({ results: mockItems, count: 100 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches history on mount with default filters", async () => {
    const { result } = renderHook(() => useAdminHistory());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.state.items).toEqual(mockItems);
      expect(result.current.state.count).toBe(100);
      expect(result.current.state.totalPages).toBe(2); // 100 / 50
    });

    expect(getBroadcastHistory).toHaveBeenCalledWith({
      page: 1,
      q: undefined,
      status: undefined,
      target: undefined,
    });
  });

  it("sets error when fetch fails", async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (getBroadcastHistory as any).mockRejectedValue(new Error("Failed"));

    const { result } = renderHook(() => useAdminHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe("Failed to load broadcast history.");
    });
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("updates search and resets page", async () => {
    const { result } = renderHook(() => useAdminHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.actions.setSearch("new query");
    });

    expect(result.current.state.search).toBe("new query");
    expect(result.current.state.page).toBe(1);
    
    expect(getBroadcastHistory).toHaveBeenLastCalledWith(expect.objectContaining({
      q: "new query",
      page: 1,
    }));
  });

  it("updates status filter and resets page", async () => {
    const { result } = renderHook(() => useAdminHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.actions.setStatusFilter("FAILED");
    });

    expect(result.current.state.statusFilter).toBe("FAILED");
    expect(result.current.state.page).toBe(1);
    
    expect(getBroadcastHistory).toHaveBeenLastCalledWith(expect.objectContaining({
      status: "FAILED",
      page: 1,
    }));
  });

  it("updates target filter and resets page", async () => {
    const { result } = renderHook(() => useAdminHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.actions.setTargetFilter("staff");
    });

    expect(result.current.state.targetFilter).toBe("staff");
    expect(result.current.state.page).toBe(1);
    
    expect(getBroadcastHistory).toHaveBeenLastCalledWith(expect.objectContaining({
      target: "staff",
      page: 1,
    }));
  });

  it("updates page", async () => {
    const { result } = renderHook(() => useAdminHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.actions.setPage(3);
    });

    expect(result.current.state.page).toBe(3);
    
    expect(getBroadcastHistory).toHaveBeenLastCalledWith(expect.objectContaining({
      page: 3,
    }));
  });
});
