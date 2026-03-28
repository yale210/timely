import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardStatsGrid from "@/components/dashboard/DashboardStatsGrid";
import type { WeeklyStats } from "@/types";

const derivedStats: WeeklyStats = {
  total_tasks: 8,
  completed_tasks: 6,
  completion_percentage: 75,
  total_minutes_planned: 420,
  daily_stats: [],
  importance_stats: [],
};

describe("DashboardStatsGrid", () => {
  it("renders the main dashboard metrics for the selected period", () => {
    render(
      <DashboardStatsGrid
        derivedStats={derivedStats}
        periodLabel="Weekly"
        minutesPlannedText="7h 0m"
        averageCompletedPerDayText="1.2 tasks/day"
        averageTaskDurationText="52m avg duration"
        overdueCount={2}
        overdueToneClass="tone-alert"
        streakCount={3}
        streakToneClass="tone-ok"
      />,
    );

    expect(screen.getByText("Weekly Progress")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("6/8 tasks completed")).toBeInTheDocument();
    expect(screen.getByText("Time Planned")).toBeInTheDocument();
    expect(screen.getByText("7h 0m")).toBeInTheDocument();
    expect(screen.getByText("Daily Averages")).toBeInTheDocument();
    expect(screen.getByText("1.2 tasks/day")).toBeInTheDocument();
    expect(screen.getByText("52m avg duration")).toBeInTheDocument();
    expect(screen.getByText("Overdue Tasks")).toBeInTheDocument();
    expect(screen.getByText("Streak")).toBeInTheDocument();
    expect(screen.getByText("3 days")).toBeInTheDocument();
  });

  it("shows loading placeholders when derived stats are not available yet", () => {
    render(
      <DashboardStatsGrid
        derivedStats={null}
        periodLabel="Daily"
        minutesPlannedText="Loading..."
        averageCompletedPerDayText="Loading..."
        averageTaskDurationText="Loading..."
        overdueCount={0}
        overdueToneClass="tone-ok"
        streakCount={0}
        streakToneClass="tone-neutral"
      />,
    );

    expect(screen.getAllByText("Loading...").length).toBeGreaterThan(0);
    expect(screen.getByText("0 days")).toBeInTheDocument();
  });
});
