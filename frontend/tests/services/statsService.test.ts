import { it, describe, expect, vi, beforeEach } from "vitest";
import api from "@/services/api";
import * as statsService from "@/services/statsService";

vi.mock("@/services/api", () => ({ default: { get: vi.fn() } }));

describe("statsService", () => {
  beforeEach(() => vi.resetAllMocks());

  it("calls api WITHOUT date when no argument is provided", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValue({ data: {} });
    await statsService.getWeeklySummary();
    expect(spy).toHaveBeenCalledWith(expect.anything(), { params: {} });
  });

  it("calls api WITH date parameter when provided", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValue({ data: {} });
    await statsService.getWeeklySummary("2026-02-14");
    expect(spy).toHaveBeenCalledWith(expect.anything(), { params: { date: "2026-02-14" } });
  });
});