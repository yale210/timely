import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useAdminHistory } from "@/hooks/admin/notifications/useAdminHistory";
import { getBroadcastHistory } from "@/api/notifications";

// Mock API
vi.mock("@/api/notifications", () => ({
  getBroadcastHistory: vi.fn(),
}));

const mockedGetBroadcastHistory = vi.mocked(getBroadcastHistory);

describe("useAdminHistory Hook", () => {
  const mockItems = [
    {
      id: 1,
      title: "B1",
      status: "COMPLETED" as const,
      target: "all",
      recipient_count: 10,
      delivered_count: 10,
      failed_count: 0,
      sender: 1,
      sender_username: "admin",
      queued_at: "2023-01-01T10:00:00Z",
      completed_at: "2023-01-01T10:05:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetBroadcastHistory.mockResolvedValue({ results: mockItems, count: 100, next: null, previous: null });
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

    expect(mockedGetBroadcastHistory).toHaveBeenCalledWith({
      page: 1,
      q: undefined,
      status: undefined,
      target: undefined,
    });
  });

  it("sets error when fetch fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      /* Silence console error */
    });
    mockedGetBroadcastHistory.mockRejectedValue(new Error("Failed"));

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

    act(() => {
      result.current.actions.setSearch("new query");
    });

    expect(result.current.state.search).toBe("new query");
    expect(result.current.state.page).toBe(1);
    
    expect(mockedGetBroadcastHistory).toHaveBeenLastCalledWith(expect.objectContaining({
      q: "new query",
      page: 1,
    }));
  });

  it("updates status filter and resets page", async () => {
    const { result } = renderHook(() => useAdminHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.actions.setStatusFilter("FAILED");
    });

    expect(result.current.state.statusFilter).toBe("FAILED");
    expect(result.current.state.page).toBe(1);
    
    expect(mockedGetBroadcastHistory).toHaveBeenLastCalledWith(expect.objectContaining({
      status: "FAILED",
      page: 1,
    }));
  });

  it("updates target filter and resets page", async () => {
    const { result } = renderHook(() => useAdminHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.actions.setTargetFilter("staff");
    });

    expect(result.current.state.targetFilter).toBe("staff");
    expect(result.current.state.page).toBe(1);
    
    expect(mockedGetBroadcastHistory).toHaveBeenLastCalledWith(expect.objectContaining({
      target: "staff",
      page: 1,
    }));
  });

  it("updates page", async () => {
    const { result } = renderHook(() => useAdminHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.actions.setPage(3);
    });

    expect(result.current.state.page).toBe(3);
    
    expect(mockedGetBroadcastHistory).toHaveBeenLastCalledWith(expect.objectContaining({
      page: 3,
    }));
  });
});
