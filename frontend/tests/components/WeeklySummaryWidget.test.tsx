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
});
