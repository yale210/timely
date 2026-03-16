import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TaskUpcomingSection from "@/components/tasks/TaskUpcomingSection";
import type { Task } from "@/types";

vi.mock("@/components/tasks/TaskCard", () => ({
  default: ({
    task,
    onToggleComplete,
    onClick,
  }: {
    task: Task;
    onToggleComplete: (id: number) => void;
    onClick: (task: Task) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onClick(task)}>
        open:{task.title}
      </button>
      <button type="button" onClick={() => onToggleComplete(task.id)}>
        toggle:{task.id}
      </button>
    </div>
  ),
}));

const task: Task = {
  id: 1,
  title: "Essay",
  start_time: "2026-03-15T09:00:00.000Z",
  deadline: "2026-03-15T11:00:00.000Z",
  importance: 6,
  completed: false,
  categories: [],
  estimated_minutes: 60,
};

describe("TaskUpcomingSection", () => {
  it("renders grouped upcoming tasks and forwards interactions", () => {
    const onTaskClick = vi.fn();
    const onToggleComplete = vi.fn();

    render(
      <TaskUpcomingSection
        upcomingTasks={[task]}
        groupedUpcomingTasks={{ "2026-03-15": [task] }}
        sortedUpcomingDates={["2026-03-15"]}
        formatDayLabel={() => "Today"}
        onTaskClick={onTaskClick}
        onToggleComplete={onToggleComplete}
      />,
    );

    expect(screen.getByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "open:Essay" }));
    fireEvent.click(screen.getByRole("button", { name: "toggle:1" }));

    expect(onTaskClick).toHaveBeenCalledWith(task);
    expect(onToggleComplete).toHaveBeenCalledWith(1);
  });
});
