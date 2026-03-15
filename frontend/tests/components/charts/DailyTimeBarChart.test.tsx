import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DailyTimeBarChart from "@/components/charts/DailyTimeBarChart";
import type { WeeklyStats } from "@/types";

const stats: WeeklyStats = {
  total_tasks: 3,
  completed_tasks: 2,
  completion_percentage: 66.7,
  total_minutes_planned: 120,
  daily_stats: [{ day: "Mon", completed_count: 2, total_minutes: 90 }],
  importance_stats: [],
};

describe("DailyTimeBarChart", () => {
  it("renders a loading state without stats", () => {
    const { container } = render(<DailyTimeBarChart stats={null} />);

    expect(container.textContent).toContain("Loading");
  });

  it("renders the chart wrapper with stats", () => {
    const { container } = render(<DailyTimeBarChart stats={stats} />);

    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });
});
