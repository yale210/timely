import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, vi, expect } from "vitest";

vi.mock("@/services/statsService", () => ({
  getWeeklySummary: vi.fn(),
}));

import { getWeeklySummary } from "@/services/statsService";
import WeeklySummaries from "@/pages/WeeklySummaries";

describe("WeeklySummaries page", () => {
  it("fetches data on mount", async () => {
    vi.mocked(getWeeklySummary).mockResolvedValue({
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
    });
    render(<MemoryRouter><WeeklySummaries /></MemoryRouter>);
    await waitFor(() => expect(getWeeklySummary).toHaveBeenCalled());
  });
});
