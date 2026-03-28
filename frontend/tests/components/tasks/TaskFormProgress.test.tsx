import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TaskFormProgress from "@/components/tasks/TaskFormProgress";

describe("TaskFormProgress", () => {
  it("renders progress values and forwards changes", () => {
    const setCompletedMinutes = vi.fn();

    render(
      <TaskFormProgress
        progressPercent={25}
        completedMinutes={15}
        normalizedEstimatedMinutes={60}
        errorClass="error"
        errors={{}}
        setCompletedMinutes={setCompletedMinutes}
      />,
    );

    expect(screen.getByText("/ 60 mins")).toBeDefined();

    fireEvent.change(screen.getByLabelText(/progress/i), {
      target: { value: "20" },
    });

    expect(setCompletedMinutes).toHaveBeenCalledWith(20);
  });

  it("shows validation message when completed minutes are invalid", () => {
    render(
      <TaskFormProgress
        progressPercent={0}
        completedMinutes=""
        normalizedEstimatedMinutes={60}
        errorClass="error"
        errors={{ completed_minutes: true }}
        setCompletedMinutes={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/completed minutes must be between 0 and the estimated minutes/i),
    ).toBeDefined();
  });
});