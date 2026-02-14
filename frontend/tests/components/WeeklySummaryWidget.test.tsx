import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import WeeklySummaryWidget from "@/components/WeeklySummaryWidget";

describe("WeeklySummaryWidget", () => {
  it("shows loading when stats is null", () => {
    render(<WeeklySummaryWidget stats={null} />);
    expect(screen.getByText(/Loading/i)).toBeTruthy();
  });

  it("shows no data when total_tasks is zero", () => {
    render(
      <WeeklySummaryWidget
        stats={{
          total_tasks: 0,
          completed_tasks: 0,
          completion_percentage: 0,
          total_minutes_planned: 0,
          daily_stats: [
            { day: "Mon", completed_count: 0, total_minutes: 0 },
            { day: "Tue", completed_count: 0, total_minutes: 0 },
            { day: "Wed", completed_count: 0, total_minutes: 0 },
            { day: "Thu", completed_count: 0, total_minutes: 0 },
            { day: "Fri", completed_count: 0, total_minutes: 0 },
            { day: "Sat", completed_count: 0, total_minutes: 0 },
            { day: "Sun", completed_count: 0, total_minutes: 0 },
          ],
          difficulty_stats: Array.from({ length: 10 }, () => ({ level: 1, completed_count: 0 })),
        }}
      />
    );
    expect(screen.getByText(/You had no tasks planned/i)).toBeTruthy();
  });

  it("renders full statistics when valid data is provided", () => {
    const stats = { total_tasks: 5, completed_tasks: 2, completion_percentage: 40, total_minutes_planned: 100, daily_stats: [], difficulty_stats: [] } as any;
    render(<WeeklySummaryWidget stats={stats} />);
    expect(screen.getByText("40%"))
      .toBeInTheDocument();
    expect(screen.getByText("2/5")).toBeInTheDocument();
  });

  it("applies red colour when completion < 50%", () => {
    const stats = { total_tasks: 10, completed_tasks: 1, completion_percentage: 10, total_minutes_planned: 0, daily_stats: [], difficulty_stats: [] } as any;
    render(<WeeklySummaryWidget stats={stats} />);
    const el = screen.getByText("10%");
    expect(el.className).toContain("text-red-600");
  });

  it("applies amber colour when completion is 60%", () => {
    const stats = { total_tasks: 10, completed_tasks: 6, completion_percentage: 60, total_minutes_planned: 0, daily_stats: [], difficulty_stats: [] } as any;
    render(<WeeklySummaryWidget stats={stats} />);
    const el = screen.getByText("60%");
    expect(el.className).toContain("text-orange-500");
  });

  it("applies green colour when completion >= 70%", () => {
    const stats = { total_tasks: 5, completed_tasks: 5, completion_percentage: 100, total_minutes_planned: 0, daily_stats: [], difficulty_stats: [] } as any;
    render(<WeeklySummaryWidget stats={stats} />);
    const el = screen.getByText("100%");
    expect(el.className).toContain("text-green-600");
  });
});
