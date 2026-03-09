import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWeeklySummaries } from "@/hooks/analytics/useWeeklySummaries";
import { getWeeklySummary } from "@/services/statsService";
import type { WeeklyStats } from "@/types";

vi.mock("@/services/statsService", () => ({
  getWeeklySummary: vi.fn(),
}));

describe("useWeeklySummaries", () => {
  const mockStats: WeeklyStats = {
    total_tasks: 4,
    completed_tasks: 2,
    completion_percentage: 50,
    total_minutes_planned: 180,
    daily_stats: [
      { day: "Mon", completed_count: 1, total_minutes: 60 },
      { day: "Tue", completed_count: 1, total_minutes: 45 },
    ],
    importance_stats: Array.from({ length: 10 }, (_, index) => ({
      level: index + 1,
      completed_count: index,
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads weekly summary state on mount", async () => {
    vi.mocked(getWeeklySummary).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useWeeklySummaries());

    await waitFor(() => expect(result.current.loading.summary).toBe(false));

    expect(result.current.state.stats).toEqual(mockStats);
    expect(result.current.state.weekOptions.length).toBeGreaterThan(0);
    expect(result.current.state.chartMode).toBe("importance");
    expect(getWeeklySummary).toHaveBeenCalledWith(result.current.state.selectedWeek);
  });

  it("updates week selection and chart mode", async () => {
    vi.mocked(getWeeklySummary).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useWeeklySummaries());

    await waitFor(() => expect(result.current.loading.summary).toBe(false));

    act(() => {
      result.current.actions.setChartMode("tasks");
      result.current.actions.setSelectedWeek("2026-02-02");
    });

    await waitFor(() => expect(getWeeklySummary).toHaveBeenLastCalledWith("2026-02-02"));

    expect(result.current.state.chartMode).toBe("tasks");
  });

  it("stores an error message when the summary request fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(getWeeklySummary).mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useWeeklySummaries());

    await waitFor(() => expect(result.current.loading.summary).toBe(false));

    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.state.stats).toBeNull();
    expect(result.current.error.summary).toBe("Failed to load weekly summary.");
  });
});
