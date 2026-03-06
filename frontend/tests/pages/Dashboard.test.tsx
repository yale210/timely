import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import moment from "moment";
import Dashboard from "@/pages/Dashboard";
import * as taskService from "@/services/taskService";
import type { Task } from "@/types";
import type { ReactNode } from "react";

// Mock services
vi.mock("@/services/taskService", () => ({
  getTasks: vi.fn(),
}));

// Mock components to avoid context/dependency bloat
vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

vi.mock("@/components/index", () => ({
  StatCard: ({ title, value }: { title: string; value: string[] }) => (
    <div data-testid="stat-card">
      <h3>{title}</h3>
      <ul>{value.map((v: string, i: number) => <li key={i}>{v}</li>)}</ul>
    </div>
  ),
}));

vi.mock("@/pages/index", () => ({
  CalendarPage: () => <div data-testid="calendar-page">Calendar</div>,
}));

describe("Dashboard Page", () => {
  const now = moment();
  const mockTasks = [
    { id: 1, title: "Today Task", deadline: now.toISOString(), completed: false },
    { id: 2, title: "Overdue Task", deadline: now.clone().subtract(1, "day").toISOString(), completed: false },
    { id: 3, title: "Pending Task", deadline: now.clone().add(2, "days").toISOString(), completed: false },
    { id: 4, title: "Completed Task", deadline: now.toISOString(), completed: true },
  ] as Task[];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and renders tasks in correct categories", async () => {
    vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks);
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId("app-layout")).toBeDefined();
    expect(screen.getByText("Dashboard")).toBeDefined();

    await waitFor(() => {
      expect(taskService.getTasks).toHaveBeenCalled();
    });

    // Check categories
    expect(screen.getByText("Today's Tasks")).toBeDefined();
    expect(screen.getByText("Pending Tasks")).toBeDefined();
    expect(screen.getByText("Overdue Tasks")).toBeDefined();

    // Check task mapping
    expect(screen.getByText("Today Task")).toBeDefined();
    expect(screen.getByText("Overdue Task")).toBeDefined();
    expect(screen.getByText("Pending Task")).toBeDefined();
    
    // Completed tasks should not be shown based on filter logic
    expect(screen.queryByText("Completed Task")).toBeNull();
    
    expect(screen.getByTestId("calendar-page")).toBeDefined();
  });

  it("handles fetch error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* empty */ });
    vi.mocked(taskService.getTasks).mockRejectedValue(new Error("API Error"));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(taskService.getTasks).toHaveBeenCalled();
    });

    expect(consoleSpy).toHaveBeenCalled();
    // Should show 0 tasks in each card
    const lists = screen.getAllByRole("list");
    lists.forEach(list => {
        expect(list.children.length).toBe(0);
    });
    
    consoleSpy.mockRestore();
  });
});

