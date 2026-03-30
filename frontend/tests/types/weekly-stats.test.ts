import { describe, expectTypeOf, it } from "vitest";
import type { WeeklyStats } from "@/types/weekly-stats";

describe("weekly-stats types", () => {
  it("defines the weekly stats shape", () => {
    const stats = {
      total_tasks: 8,
      completed_tasks: 5,
      completion_percentage: 62.5,
      total_minutes_planned: 240,
      daily_stats: [
        { day: "Mon", completed_count: 1, total_minutes: 45 },
        { day: "Tue", completed_count: 2, total_minutes: 60 },
      ],
      importance_stats: [
        { level: 5, completed_count: 2 },
        { level: 8, completed_count: 1 },
      ],
    } satisfies WeeklyStats;

    expectTypeOf(stats).toMatchTypeOf<WeeklyStats>();
  });
});
