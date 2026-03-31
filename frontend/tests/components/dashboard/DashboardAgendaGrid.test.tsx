import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardAgendaGrid from "@/components/dashboard/DashboardAgendaGrid";
import type { Event, Task } from "@/types";

vi.mock("@/components/dashboard/DashboardWeeklyAgendaCard", () => ({
  default: () => <div data-testid="weekly-agenda-card" />,
}));

vi.mock("@/components/dashboard/DashboardUpcomingTasksCard", () => ({
  default: () => <div data-testid="upcoming-tasks-card" />,
}));

vi.mock("@/components/dashboard/DashboardXpProgressCard", () => ({
  default: () => <div data-testid="xp-progress-card" />,
}));

const tasks: Task[] = [
  {
    id: 1,
    title: "Essay",
    start_time: "2026-03-28T09:00:00.000Z",
    deadline: "2026-03-28T11:00:00.000Z",
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
    start_time: "2026-03-28T13:00:00.000Z",
    end_time: "2026-03-28T14:00:00.000Z",
    categories: [],
    reminders: [],
  },
];

describe("DashboardAgendaGrid", () => {
  it("renders the extracted agenda subcomponents", () => {
    render(
      <DashboardAgendaGrid
        tasks={tasks}
        events={events}
        recentTasks={tasks}
        checkedOverrides={{}}
        periodLabel="This Week"
        profileStats={{ exp: 40, level: 1 }}
        onToggleTask={vi.fn()}
      />,
    );

    expect(screen.getByTestId("weekly-agenda-card")).toBeInTheDocument();
    expect(screen.getByTestId("upcoming-tasks-card")).toBeInTheDocument();
    expect(screen.getByTestId("xp-progress-card")).toBeInTheDocument();
  });
});
