import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import type { Task, WeeklyStats, Event } from "@/types";
import type { ReactNode } from "react";
import { useDashboard } from "@/hooks/dashboard/useDashboard";

vi.mock("@/hooks/dashboard/useDashboard", () => ({
  useDashboard: vi.fn(),
}));
vi.mock("@/components/dashboard/DashboardOverview", () => ({
  default: ({
    tasks,
    events,
    weeklyStats,
  }: {
    tasks: Task[];
    events: Event[];
    weeklyStats: WeeklyStats | null;
  }) => (
    <div data-testid="dashboard-overview">
      <span>tasks:{tasks.length}</span>
      <span>events:{events.length}</span>
      <span>weekly:{weeklyStats ? "yes" : "no"}</span>
      {tasks.length > 0 ? <span>{tasks[0].title}</span> : <span>No Upcoming Tasks</span>}
      <span>Weekly Overview</span>
      <span>Upcoming Tasks</span>
    </div>
  ),
}));

// Mock components to avoid context/dependency bloat
vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

describe("Dashboard Page", () => {
  const todayIso = new Date().toISOString();
  const mockTasks = [
    {
      id: 1,
      title: "Upcoming Task",
      deadline: todayIso,
      start_time: todayIso,
      completed: false,
      categories: [],
      importance: 5,
      estimated_minutes: 30,
    },
  ] as Task[];
  const mockEvents: Event[] = [];
  const mockWeeklyStats: WeeklyStats = {
    total_tasks: 1,
    completed_tasks: 0,
    completion_percentage: 0,
    total_minutes_planned: 30,
    daily_stats: [],
    importance_stats: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDashboard).mockReturnValue({
      state: {
        tasks: mockTasks,
        events: mockEvents,
        weeklyStats: mockWeeklyStats,
        sections: { todayTasks: [], pendingTasks: [], overdueTasks: [] },
        cardValues: { today: [], pending: [], overdue: [] },
      },
      loading: { tasks: false, summary: false },
      error: { tasks: null, summary: null },
      actions: { refresh: vi.fn() },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders weekly overview and upcoming tasks", () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId("app-layout")).toBeInTheDocument();
    expect(screen.getByText("Weekly Overview")).toBeDefined();
    expect(screen.getByText("Upcoming Tasks")).toBeDefined();
    expect(screen.getByText("Upcoming Task")).toBeDefined();
  });

  it("renders empty state when no upcoming tasks", () => {
    vi.mocked(useDashboard).mockReturnValue({
      state: {
        tasks: [],
        events: [],
        weeklyStats: mockWeeklyStats,
        sections: { todayTasks: [], pendingTasks: [], overdueTasks: [] },
        cardValues: { today: [], pending: [], overdue: [] },
      },
      loading: { tasks: false, summary: false },
      error: { tasks: null, summary: null },
      actions: { refresh: vi.fn() },
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/No Upcoming Tasks/i)).toBeDefined();
  });
});

