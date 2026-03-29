import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TaskFormSplitter from "@/components/tasks/TaskFormSplitter";

describe("TaskFormSplitter", () => {
  const baseProps = {
    allowSplit: true,
    setAllowSplit: vi.fn(),
    baseInputClass: "input",
    errorClass: "error",
    minSplitMinutes: "30",
    setMinSplitMinutes: vi.fn(),
    maxSplitMinutes: "60",
    setMaxSplitMinutes: vi.fn(),
    errors: {},
  };

  it("renders split controls when enabled", () => {
    render(<TaskFormSplitter {...baseProps} />);

    expect(screen.getByLabelText(/minimum split block minutes/i)).toHaveValue(30);
    expect(screen.getByLabelText(/maximum split block minutes/i)).toHaveValue(60);
  });

  it("hides split inputs when disabled", () => {
    render(
      <TaskFormSplitter
        {...baseProps}
        allowSplit={false}
      />,
    );

    expect(screen.queryByLabelText(/minimum split block minutes/i)).toBeNull();
    expect(screen.queryByLabelText(/maximum split block minutes/i)).toBeNull();
  });

  it("forwards toggle and input changes", () => {
    const setAllowSplit = vi.fn();
    const setMinSplitMinutes = vi.fn();
    const setMaxSplitMinutes = vi.fn();

    render(
      <TaskFormSplitter
        {...baseProps}
        setAllowSplit={setAllowSplit}
        setMinSplitMinutes={setMinSplitMinutes}
        setMaxSplitMinutes={setMaxSplitMinutes}
      />,
    );

    fireEvent.click(screen.getByRole("button", { pressed: true }));
    expect(setAllowSplit).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText(/minimum split block minutes/i), {
      target: { value: "45" },
    });
    expect(setMinSplitMinutes).toHaveBeenCalledWith("45");

    fireEvent.change(screen.getByLabelText(/maximum split block minutes/i), {
      target: { value: "90" },
    });
    expect(setMaxSplitMinutes).toHaveBeenCalledWith("90");
  });

  it("shows validation messages when errors are present", () => {
    render(
      <TaskFormSplitter
        {...baseProps}
        errors={{
          min_split_minutes: true,
          max_split_minutes: true,
        }}
      />,
    );

    expect(screen.getByText(/minimum split block minutes must be between 15 and 240/i)).toBeDefined();
    expect(screen.getByText(/maximum split block minutes must be between 15 and 1440/i)).toBeDefined();
  });
});