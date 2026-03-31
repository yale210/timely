import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TaskFormScheduler from "@/components/tasks/TaskFormScheduler";

describe("TaskFormScheduler", () => {
  it("toggles auto schedule and updates lock state", () => {
    const setAutoSchedule = vi.fn();
    const setIsTaskLocked = vi.fn();

    render(
      <TaskFormScheduler
        autoSchedule
        setAutoSchedule={setAutoSchedule}
        setIsTaskLocked={setIsTaskLocked}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /explain auto-schedule/i }));
    fireEvent.click(screen.getByRole("button", { pressed: true }));

    expect(setAutoSchedule).toHaveBeenCalledTimes(1);

    const updater = setAutoSchedule.mock.calls[0][0] as (prev: boolean) => boolean;
    expect(updater(true)).toBe(false);
    expect(setIsTaskLocked).toHaveBeenCalledWith(true);
  });
});