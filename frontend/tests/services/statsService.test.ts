import { it, describe, expect, vi, beforeEach } from "vitest";
import api from "@/services/api";
import { type WeeklyStats } from "@/types";

vi.mock("@/services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

import * as statsService from "@/services/statsService";

describe("statsService", () => {
  beforeEach(() => vi.resetAllMocks());

  it("getWeeklySummary should call api.get and return data", async () => {
    const mock: WeeklyStats = {
      total_tasks: 2,
      completed_tasks: 1,
      completion_percentage: 50.0,
      total_minutes_planned: 90,
      daily_stats: [
        { day: "Mon", completed_count: 1, total_minutes: 60 },
        { day: "Tue", completed_count: 0, total_minutes: 30 },
        { day: "Wed", completed_count: 0, total_minutes: 0 },
        { day: "Thu", completed_count: 0, total_minutes: 0 },
        { day: "Fri", completed_count: 0, total_minutes: 0 },
        { day: "Sat", completed_count: 0, total_minutes: 0 },
        { day: "Sun", completed_count: 0, total_minutes: 0 },
      ],
      difficulty_stats: Array.from({ length: 10 }, (_, i) => ({ level: i + 1, completed_count: i === 2 ? 1 : 0 })),
    };
    const spy = vi.spyOn(api, "get").mockResolvedValue({ data: mock });
  const result = await statsService.getWeeklySummary();
  expect(spy).toHaveBeenCalledWith("/api/stats/weekly/", { params: {} });
    expect(result).toEqual(mock);
  });
});
