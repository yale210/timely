import { renderHook, waitFor } from "@testing-library/react";
import moment from "moment";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import * as taskService from "@/services/taskService";
import * as eventService from "@/services/eventService";
import * as statsService from "@/services/statsService";
import type { Task } from "@/types";

vi.mock("@/services/taskService", () => ({
  getTasks: vi.fn(),
}));
vi.mock("@/services/eventService", () => ({
  getEvents: vi.fn(),
}));
vi.mock("@/services/statsService", () => ({
  getWeeklySummary: vi.fn(),
}));

describe("useDashboard", () => {
  const fixedNow = "2026-03-01T12:00:00.000Z";
  const now = moment(fixedNow);
  const mockTasks = [
    { id: 1, title: "Today Task", deadline: now.toISOString(), completed: false },
    { id: 2, title: "Overdue Task", deadline: now.clone().subtract(1, "day").toISOString(), completed: false },
    { id: 3, title: "Pending Task", deadline: now.clone().add(2, "days").toISOString(), completed: false },
    { id: 4, title: "Completed Task", deadline: now.toISOString(), completed: true },
  ] as Task[];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(fixedNow));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("loads tasks and derives dashboard sections", async () => {
    vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks);
    vi.mocked(eventService.getEvents).mockResolvedValue([]);
    vi.mocked(statsService.getWeeklySummary).mockResolvedValue({
      total_tasks: 0,
      completed_tasks: 0,
      completion_percentage: 0,
      total_minutes_planned: 0,
      daily_stats: [],
      importance_stats: [],
    });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading.tasks).toBe(false));

    expect(result.current.state.sections.todayTasks.map((task) => task.title)).toEqual(["Today Task"]);
    expect(result.current.state.sections.pendingTasks.map((task) => task.title)).toEqual(["Pending Task"]);
    expect(result.current.state.sections.overdueTasks.map((task) => task.title)).toEqual(["Overdue Task"]);
    expect(result.current.state.cardValues.today).toEqual(["Today Task"]);
    expect(result.current.error.tasks).toBeNull();
  });

  it("falls back to empty state when loading tasks fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(taskService.getTasks).mockRejectedValue(new Error("API error"));
    vi.mocked(eventService.getEvents).mockResolvedValue([]);
    vi.mocked(statsService.getWeeklySummary).mockResolvedValue({
      total_tasks: 0,
      completed_tasks: 0,
      completion_percentage: 0,
      total_minutes_planned: 0,
      daily_stats: [],
      importance_stats: [],
    });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading.tasks).toBe(false));

    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.state.sections.todayTasks).toHaveLength(0);
    expect(result.current.state.sections.pendingTasks).toHaveLength(0);
    expect(result.current.state.sections.overdueTasks).toHaveLength(0);
    expect(result.current.error.tasks).toBe("Failed to load dashboard tasks.");
  });
});

