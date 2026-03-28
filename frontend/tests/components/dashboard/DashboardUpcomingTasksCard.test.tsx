import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import DashboardUpcomingTasksCard from "@/components/dashboard/DashboardUpcomingTasksCard";
import type { Task } from "@/types";

const task: Task = {
  id: 1,
  title: "Essay draft",
  start_time: "2026-03-28T09:00:00.000Z",
  deadline: "2026-03-28T11:00:00.000Z",
  importance: 8,
  completed: false,
  categories: [],
  estimated_minutes: 90,
};

describe("DashboardUpcomingTasksCard", () => {
  it("renders upcoming task details and toggles completion", () => {
    const onToggleTask = vi.fn();

    render(
      <MemoryRouter>
        <DashboardUpcomingTasksCard
          tasks={[task]}
          checkedOverrides={{}}
          periodLabel="This Week"
          onToggleTask={onToggleTask}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Upcoming Tasks")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See all" })).toHaveAttribute("href", "/tasks");
    expect(screen.getByText("Essay draft")).toBeInTheDocument();
    expect(screen.getByText("90m")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox"));

    expect(onToggleTask).toHaveBeenCalledWith(task, true);
  });

  it("renders the empty state when there are no upcoming tasks", () => {
    render(
      <MemoryRouter>
        <DashboardUpcomingTasksCard
          tasks={[]}
          checkedOverrides={{}}
          periodLabel="Today"
          onToggleTask={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("No Upcoming Tasks Today")).toBeInTheDocument();
  });
});
