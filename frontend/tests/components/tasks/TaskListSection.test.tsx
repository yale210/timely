import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TaskListSection from "@/components/tasks/TaskListSection";
import { type Task } from "@/types";

describe("TaskListSection Component", () => {
  const mockTasks: Task[] = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `Task ${i + 1}`,
    importance: 2,
    completed: false,
    created_at: "2023-01-01",
    updated_at: "2023-01-01",
    user: 1,
    allocation: [],
    deadline: "2023-01-01",
    start_time: "2023-01-01",
    categories: [],
    estimated_minutes: 30
  }));

  const defaultProps = {
    title: "Test Section",
    tasks: mockTasks.slice(0, 3),
    onToggleComplete: vi.fn(),
    onTaskClick: vi.fn(),
  };

  it("renders tasks correctly", () => {
    render(<TaskListSection {...defaultProps} />);
    expect(screen.getByText("Test Section")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined(); // Task count
    expect(screen.getByText("Task 1")).toBeDefined();
  });

  it("shows 'View More' when tasks exceed initialVisible", () => {
    render(<TaskListSection {...defaultProps} tasks={mockTasks} initialVisible={5} />);
    expect(screen.getByText("Task 1")).toBeDefined();
    expect(screen.queryByText("Task 6")).toBeNull();
    
    const viewMore = screen.getByText("View More");
    fireEvent.click(viewMore);
    
    expect(screen.getByText("Task 6")).toBeDefined();
  });

  it("handles collapsible behavior", () => {
    render(<TaskListSection {...defaultProps} isCollapsible={true} />);
    const header = screen.getByRole("button", { expanded: true });
    
    expect(screen.getByText("Task 1")).toBeDefined();
    
    fireEvent.click(header);
    expect(screen.queryByText("Task 1")).toBeNull();
    
    fireEvent.click(header);
    expect(screen.getByText("Task 1")).toBeDefined();
  });

  it("handles keyboard interaction for collapsible", () => {
    render(<TaskListSection {...defaultProps} isCollapsible={true} />);
    const header = screen.getByRole("button", { expanded: true });
    
    fireEvent.keyDown(header, { key: "Enter" });
    expect(screen.queryByText("Task 1")).toBeNull();
    
    fireEvent.keyDown(header, { key: " " });
    expect(screen.getByText("Task 1")).toBeDefined();

    fireEvent.keyDown(header, { key: "Escape" }); // Should do nothing
    expect(screen.getByText("Task 1")).toBeDefined();
  });

  it("renders empty state", () => {
    render(<TaskListSection {...defaultProps} tasks={[]} />);
    expect(screen.getByText("No tasks in this section.")).toBeDefined();
  });

  it("renders as default collapsed", () => {
    render(<TaskListSection {...defaultProps} isCollapsible={true} defaultCollapsed={true} />);
    expect(screen.queryByText("Task 1")).toBeNull();
  });
});
