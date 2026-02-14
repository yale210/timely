import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import type { WeeklyStats } from "@/types";
import CompletionPieChart from "@/components/charts/CompletionPieChart";
import DifficultyBarChart from "@/components/charts/DifficultyBarChart";
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
});
