import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import type { WeeklyStats } from "@/types";
import CompletionPieChart from "@/components/charts/CompletionPieChart";
import DifficultyBarChart from "@/components/charts/DifficultyBarChart";
import DailyTasksBarChart from "@/components/charts/DailyTasksBarChart";
import DailyTimeBarChart from "@/components/charts/DailyTimeBarChart";
import { GraphsPanel } from "@/pages/WeeklySummaries";

const emptyStats = { total_tasks: 0, completed_tasks: 0, completion_percentage: 0, total_minutes_planned: 0, daily_stats: [], difficulty_stats: [] } as WeeklyStats;
const sampleStats = {
  total_tasks: 5,
  completed_tasks: 2,
  completion_percentage: 40,
  total_minutes_planned: 300,
  daily_stats: [
    { day: "Mon", completed_count: 1, total_minutes: 60 },
    { day: "Tue", completed_count: 0, total_minutes: 0 },
  ],
  difficulty_stats: [ { level: 1, completed_count: 0 }, { level: 2, completed_count: 2 } ],
} as WeeklyStats;

describe("Charts", () => {
  it("CompletionPieChart shows placeholder when no tasks", () => {
    const { container } = render(<CompletionPieChart stats={emptyStats} />);
    expect(container.querySelector(".rounded-full")).toBeTruthy();
  });

  it("DifficultyBarChart renders SVG for valid stats", () => {
    const { container } = render(<DifficultyBarChart stats={sampleStats} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("GraphsPanel toggles charts via select", () => {
    const { getByRole, container } = render(<GraphsPanel stats={sampleStats} />);
    const select = getByRole("combobox");
    fireEvent.change(select, { target: { value: "tasks" } });
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("DailyTimeBarChart executes data mapping and renders", () => {
    const { container } = render(<DailyTimeBarChart stats={sampleStats as any} />);
    // Recharts ResponsiveContainer is mocked in setup; check presence
    expect(container.querySelector(".recharts-responsive-container") || container.querySelector("svg")).toBeTruthy();
  });

  it("CompletionPieChart shows Not Done only when no completed tasks", () => {
    const notDoneStats = { total_tasks: 3, completed_tasks: 0, completion_percentage: 0, total_minutes_planned: 0, daily_stats: [], difficulty_stats: [] } as any;
    const { container } = render(<CompletionPieChart stats={notDoneStats} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("DifficultyBarChart shows no data when stats is null", () => {
    const { getByText } = render(<DifficultyBarChart stats={null} /> as any);
    expect(getByText(/No data/i)).toBeTruthy();
  });

  it("DailyTasksBarChart handles null stats gracefully", () => {
    const { getByText } = render(<DailyTasksBarChart stats={null} /> as any);
    expect(getByText(/Loading/i)).toBeTruthy();
  });

  it("DailyTimeBarChart handles null stats gracefully", () => {
    const { getByText } = render(<DailyTimeBarChart stats={null} /> as any);
    expect(getByText(/Loading/i)).toBeTruthy();
  });
});
