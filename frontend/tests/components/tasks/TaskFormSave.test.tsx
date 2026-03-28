import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TaskFormSave from "@/components/tasks/TaskFormSave";

describe("TaskFormSave", () => {
  it("calls onCancel and shows Save Task when idle", () => {
    const onCancel = vi.fn();

    render(
      <TaskFormSave
        onCancel={onCancel}
        hasChanges
        isSubmitting={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /save task/i })).toBeDefined();
  });

  it("disables submit when there are no changes", () => {
    render(
      <TaskFormSave
        onCancel={vi.fn()}
        hasChanges={false}
        isSubmitting={false}
      />,
    );

    expect(screen.getByRole("button", { name: /save task/i })).toBeDisabled();
  });

  it("shows Saving... while submitting", () => {
    render(
      <TaskFormSave
        onCancel={vi.fn()}
        hasChanges
        isSubmitting
      />,
    );

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
  });
});