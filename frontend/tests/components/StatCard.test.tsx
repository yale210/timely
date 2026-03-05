import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StatCard from "@/components/dashboard/StatCard";
import { BrowserRouter } from "react-router-dom";

describe("StatCard Component", () => {
  it("renders with basic props", () => {
    render(
      <BrowserRouter>
        <StatCard title="Test Stat" value={["Task 1", "Task 2"]} />
      </BrowserRouter>
    );

    expect(screen.getByText("Test Stat")).toBeInTheDocument();
    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
    expect(screen.getByText("See More")).toHaveAttribute("href", "/tasks");
  });

  it("renders 'No tasks' message when value is empty", () => {
    render(
      <BrowserRouter>
        <StatCard title="Empty Stat" value={[]} />
      </BrowserRouter>
    );

    expect(screen.getByText("No tasks.")).toBeInTheDocument();
  });

  it("renders custom 'See More' link", () => {
    render(
      <BrowserRouter>
        <StatCard title="Custom Link" value={["Task"]} seeMoreHref="/custom" />
      </BrowserRouter>
    );

    expect(screen.getByText("See More")).toHaveAttribute("href", "/custom");
  });
});
