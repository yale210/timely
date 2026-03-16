import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TaskListHeader from "@/components/tasks/TaskListHeader";

describe("TaskListHeader", () => {
  it("renders the header copy and opens a new task", () => {
    const onNewTask = vi.fn();

    render(<TaskListHeader onNewTask={onNewTask} />);

    expect(screen.getByText("My Tasks")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /new task/i }));

    expect(onNewTask).toHaveBeenCalled();
  });
});
