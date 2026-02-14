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
    };
    const spy = vi.spyOn(api, "get").mockResolvedValue({ data: mock });
  const result = await statsService.getWeeklySummary();
  expect(spy).toHaveBeenCalledWith("/api/stats/weekly/", { params: {} });
    expect(result).toEqual(mock);
  });
});
