import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import DashboardWeeklyAgendaCard from "@/components/dashboard/DashboardWeeklyAgendaCard";
import type { Event, Task } from "@/types";

vi.mock("@/components/dashboard/MiniCalendarPreview", () => ({
  default: () => <div data-testid="mini-calendar-preview" />,
}));

const tasks: Task[] = [
  {
    id: 1,
    title: "Essay",
    start_time: "2026-03-28T09:00:00.000Z",
    deadline: "2026-03-28T11:00:00.000Z",
    importance: 5,
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

describe("DashboardWeeklyAgendaCard", () => {
  it("renders the agenda shortcut and embedded mini calendar", () => {
    render(
      <MemoryRouter>
        <DashboardWeeklyAgendaCard tasks={tasks} events={events} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Open calendar page" })).toHaveAttribute(
      "href",
      "/calendar",
    );
    expect(screen.getByText("Weekly Agenda")).toBeInTheDocument();
    expect(screen.getByTestId("mini-calendar-preview")).toBeInTheDocument();
  });
});
