import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import StatCard from "@/components/dashboard/StatCard";

describe("StatCard Component", () => {
  it("renders the title correctly", () => {
    render(
      <MemoryRouter>
        <StatCard title="Test Title" value={["Task 1"]} />
      </MemoryRouter>
    );
    expect(screen.getByText("Test Title")).toBeDefined();
  });

  it("renders a list of tasks correctly", () => {
    const tasks = ["Task 1", "Task 2", "Task 3"];
    render(
      <MemoryRouter>
        <StatCard title="Test Title" value={tasks} />
      </MemoryRouter>
    );
    tasks.forEach((task) => {
      expect(screen.getByText(task)).toBeDefined();
    });
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(tasks.length);
  });

  it("renders 'No tasks.' when the value array is empty", () => {
    render(
      <MemoryRouter>
        <StatCard title="Test Title" value={[]} />
      </MemoryRouter>
    );
    expect(screen.getByText("No tasks.")).toBeDefined();
  });

  it("renders the 'See More' link with the default href", () => {
    render(
      <MemoryRouter>
        <StatCard title="Test Title" value={[]} />
      </MemoryRouter>
    );
    const link = screen.getByRole("link", { name: /see more/i });
    expect(link.getAttribute("href")).toBe("/tasks");
  });

  it("renders the 'See More' link with a custom href", () => {
    render(
      <MemoryRouter>
        <StatCard title="Test Title" value={[]} seeMoreHref="/custom-path" />
      </MemoryRouter>
    );
    const link = screen.getByRole("link", { name: /see more/i });
    expect(link.getAttribute("href")).toBe("/custom-path");
  });

  it("generates unique IDs for checkboxes based on title and index", () => {
    const title = "Daily Tasks";
    const tasks = ["Task A", "Task B"];
    render(
      <MemoryRouter>
        <StatCard title={title} value={tasks} />
      </MemoryRouter>
    );
    
    tasks.forEach((task, index) => {
      const expectedId = `daily-tasks-${index}`;
      const checkbox = screen.getAllByRole("checkbox")[index];
      const label = screen.getByText(task);
      
      expect(checkbox.id).toBe(expectedId);
      expect(label.getAttribute("for")).toBe(expectedId);
    });
  });
});
