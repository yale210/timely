import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import * as taskService from "@/services/taskService";
import type { Event, Task, WeeklyStats } from "@/types";
import moment from "moment";

vi.mock("@/components/dashboard/MiniCalendarPreview", () => ({
  default: () => <div data-testid="mini-calendar-preview" />,
}));

vi.mock("@/services/taskService", () => ({
  updateTask: vi.fn(),
}));

const tasks: Task[] = [
  {
    id: 1,
    title: "Essay",
    start_time: moment().startOf("day").add(9, "hours").toISOString(),
    deadline: moment().startOf("day").add(11, "hours").toISOString(),
    importance: 6,
    completed: false,
    categories: [],
    estimated_minutes: 60,
  },
];

const events: Event[] = [
  {
    id: 1,
    title: "Seminar",
    start_time: moment().startOf("day").add(13, "hours").toISOString(),
    end_time: moment().startOf("day").add(14, "hours").toISOString(),
    categories: [],
    reminders: [],
  },
];

const weeklyStats: WeeklyStats = {
  total_tasks: 1,
  completed_tasks: 0,
  completion_percentage: 0,
  total_minutes_planned: 60,
  daily_stats: [],
  importance_stats: [],
};

describe("DashboardOverview", () => {
  it("renders stat cards, the calendar shortcut, and updates task completion", async () => {
    vi.mocked(taskService.updateTask).mockResolvedValue({} as never);

    render(
      <MemoryRouter>
        <DashboardOverview tasks={tasks} events={events} weeklyStats={weeklyStats} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Weekly Overview")).toBeInTheDocument();
    expect(screen.getByText("Weekly Agenda")).toBeInTheDocument();
    expect(screen.getByTestId("mini-calendar-preview")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Period"), {
      target: { value: "daily" },
    });
    expect(screen.getByText("Daily Overview")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() =>
      expect(taskService.updateTask).toHaveBeenCalledWith(1, { completed: true }),
    );
  });
});
