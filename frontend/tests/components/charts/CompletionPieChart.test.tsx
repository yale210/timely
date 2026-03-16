import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CompletionPieChart from "@/components/charts/CompletionPieChart";
import type { WeeklyStats } from "@/types";

const stats: WeeklyStats = {
  total_tasks: 4,
  completed_tasks: 3,
  completion_percentage: 75,
  total_minutes_planned: 180,
  daily_stats: [],
  importance_stats: [],
};

describe("CompletionPieChart", () => {
  it("renders a loading state without stats", () => {
    const { container } = render(<CompletionPieChart stats={null} />);

    expect(container.textContent).toContain("Loading");
  });

  it("renders the pie chart when stats exist", () => {
    const { container } = render(<CompletionPieChart stats={stats} />);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
