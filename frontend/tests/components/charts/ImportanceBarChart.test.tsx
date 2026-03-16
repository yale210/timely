import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ImportanceBarChart from "@/components/charts/ImportanceBarChart";
import type { WeeklyStats } from "@/types";

const stats: WeeklyStats = {
  total_tasks: 3,
  completed_tasks: 2,
  completion_percentage: 66.7,
  total_minutes_planned: 120,
  daily_stats: [],
  importance_stats: [{ level: 5, completed_count: 2 }],
};

describe("ImportanceBarChart", () => {
  it("renders a no-data state without importance stats", () => {
    const { container } = render(
      <ImportanceBarChart
        stats={{ ...stats, importance_stats: undefined as never }}
      />,
    );

    expect(container.textContent).toContain("No data");
  });

  it("renders the chart wrapper with stats", () => {
    const { container } = render(<ImportanceBarChart stats={stats} />);

    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });
});
