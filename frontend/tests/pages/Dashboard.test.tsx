import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Dashboard from "@/pages/Dashboard";
import * as taskService from "@/services/taskService";
import { BrowserRouter } from "react-router-dom";
import moment from "moment";

// Mock AppLayout to just render children
vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

// Mock taskService
vi.mock("@/services/taskService", () => ({
  getTasks: vi.fn(),
  getTaskById: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

// Mock components
vi.mock("@/components/index", async (importActual) => {
  const actual = await importActual<typeof import("@/components/index")>();
  return {
    ...actual,
    StatCard: ({ title, value }: { title: string; value: string[] }) => (
      <div data-testid={"stat-card-" + title}>
        <h3>{title}</h3>
        <ul>{value.map((v, i) => <li key={i}>{v}</li>)}</ul>
      </div>
    ),
  };
});

// Mock CalendarPage to avoid heavy rendering
vi.mock("@/pages/index", async (importActual) => {
  const actual = await importActual<typeof import("@/pages/index")>();
  return {
    ...actual,
    CalendarPage: () => <div data-testid="calendar-mock">Calendar</div>,
  };
});

describe("Dashboard Page", () => {
  const now = moment();
  const mockTasks = [
    {
      id: 1,
      title: "Today's Task",
      deadline: now.format(), // Today
      completed: false,
    },
    {
      id: 2,
      title: "Pending Task",
      deadline: now.clone().add(2, "days").format(), // Future
      completed: false,
    },
    {
      id: 3,
      title: "Overdue Task",
      deadline: now.clone().subtract(2, "days").format(), // Past
      completed: false,
    },
    {
      id: 4,
      title: "Completed Task",
      deadline: now.format(),
      completed: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dashboard with tasks categorized correctly", async () => {
    vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks as any);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(taskService.getTasks).toHaveBeenCalled();
    });

    const todayCard = screen.getByTestId("stat-card-Today's Tasks");
    expect(todayCard).toHaveTextContent("Today's Task");

    const pendingCard = screen.getByTestId("stat-card-Pending Tasks");
    expect(pendingCard).toHaveTextContent("Pending Task");

    const overdueCard = screen.getByTestId("stat-card-Overdue Tasks");
    expect(overdueCard).toHaveTextContent("Overdue Task");

    // Completed task should be filtered out
    expect(screen.queryByText("Completed Task")).not.toBeInTheDocument();
    expect(screen.getByTestId("calendar-mock")).toBeInTheDocument();
  });

  it("handles fetch error gracefully", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(taskService.getTasks).mockRejectedValue(new Error("Fetch failed"));

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(taskService.getTasks).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    });

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    errorSpy.mockRestore();
  });
});
