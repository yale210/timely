import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TaskCard from "@/components/tasks/TaskCard";
import { type Task } from "@/types";

describe("TaskCard Component", () => {
  const mockTask: Task = {
    id: 1,
    title: "Test Task",
    description: "Short description",
    importance: 5,
    completed: false,
    created_at: "2023-01-01T10:00:00Z",
    updated_at: "2023-01-01T10:00:00Z",
    user: 1,
    deadline: "2099-01-01T10:00:00Z", // Future date
    start_time: "2023-01-01T10:00:00Z",
    categories: [{ id: 1, text: "Cat 1" }],
    estimated_minutes: 30,
    allocation: []
  };

  const defaultProps = {
    task: mockTask,
    onToggleComplete: vi.fn(),
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders basic task info", () => {
    render(<TaskCard {...defaultProps} />);
    expect(screen.getByText("Test Task")).toBeDefined();
    expect(screen.getByText("Cat 1")).toBeDefined();
    expect(screen.getByText("30m")).toBeDefined();
    expect(screen.getByText("Medium")).toBeDefined();
  });

  it("handles click on card", () => {
    render(<TaskCard {...defaultProps} />);
    fireEvent.click(screen.getByText("Test Task"));
    expect(defaultProps.onClick).toHaveBeenCalledWith(mockTask);
  });

  it("handles checkbox toggle", () => {
    render(<TaskCard {...defaultProps} />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(defaultProps.onToggleComplete).toHaveBeenCalledWith(mockTask.id);
  });

  it("shows overdue state", () => {
    const overdueTask = { ...mockTask, deadline: "2020-01-01T10:00:00Z" };
    render(<TaskCard {...defaultProps} task={overdueTask} />);
    expect(screen.getByText("Overdue")).toBeDefined();
  });

  it("shows completed state", () => {
    const completedTask = { ...mockTask, completed: true };
    render(<TaskCard {...defaultProps} task={completedTask} />);
    expect(screen.getByText("Test Task").className).toContain("line-through");
  });

  it("handles hover/focus to show description and numeric importance", () => {
    render(<TaskCard {...defaultProps} />);
    const card = screen.getByText("Test Task").closest("div[tabindex='0']")!;
    
    fireEvent.mouseEnter(card);
    expect(screen.getByText("Short description")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined(); // Numeric importance on hover

    fireEvent.mouseLeave(card);
    expect(screen.queryByText("Short description")).toBeNull();

    fireEvent.focus(card);
    expect(screen.getByText("Short description")).toBeDefined();

    fireEvent.blur(card);
    expect(screen.queryByText("Short description")).toBeNull();
  });

  it("handles long description expansion", () => {
    const longDesc = "A".repeat(100);
    const longTask = { ...mockTask, description: longDesc };
    render(<TaskCard {...defaultProps} task={longTask} />);
    const card = screen.getByText("Test Task").closest("div[tabindex='0']")!;
    
    fireEvent.mouseEnter(card);
    const showMore = screen.getByText("Show More");
    fireEvent.click(showMore);
    
    expect(screen.getByText("Show Less")).toBeDefined();
    expect(screen.getByText(longDesc).className).not.toContain("line-clamp-2");

    fireEvent.click(screen.getByText("Show Less"));
    expect(screen.getByText("Show More")).toBeDefined();
  });

  it("covers all importance levels", () => {
    const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // 11 triggers default
    const { rerender } = render(<TaskCard {...defaultProps} task={{ ...mockTask, importance: 1 }} />);
    
    levels.forEach(level => {
      rerender(<TaskCard {...defaultProps} task={{ ...mockTask, importance: level }} />);
    });
  });

  it("renders correctly when estimated_minutes is 0", () => {
    render(<TaskCard {...defaultProps} task={{ ...mockTask, estimated_minutes: 0 }} />);
    expect(screen.queryByText(/^\d+m$/)).toBeNull();
  });
});
