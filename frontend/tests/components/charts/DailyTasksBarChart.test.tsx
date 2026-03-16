import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DailyTasksBarChart from "@/components/charts/DailyTasksBarChart";
import type { WeeklyStats } from "@/types";

const stats: WeeklyStats = {
  total_tasks: 3,
  completed_tasks: 2,
  completion_percentage: 66.7,
  total_minutes_planned: 120,
  daily_stats: [{ day: "Mon", completed_count: 2, total_minutes: 60 }],
  importance_stats: [],
};

describe("DailyTasksBarChart", () => {
  it("renders a loading state without stats", () => {
    const { container } = render(<DailyTasksBarChart stats={null} />);

    expect(container.textContent).toContain("Loading");
  });

  it("renders the chart wrapper with stats", () => {
    const { container } = render(<DailyTasksBarChart stats={stats} />);

    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });
});
