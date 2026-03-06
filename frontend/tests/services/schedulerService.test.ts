import { vi, describe, it, expect, beforeEach } from "vitest";
import { scheduleTasks, unscheduleTasks } from "@/services/schedulerService";
import api from "@/services/api";

// Mock api service
vi.mock("@/services/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

describe("schedulerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scheduleTasks calls api.post with correct URL and payload", async () => {
    const payload = { max_days_ahead: 7 };
    const mockResponse = { data: { scheduled_count: 5, unscheduled_count: 0, messages: [] } };
    (api.post as any).mockResolvedValue(mockResponse);

    const result = await scheduleTasks(payload);

    expect(api.post).toHaveBeenCalledWith("/api/schedule/", payload);
    expect(result).toEqual(mockResponse.data);
  });

  it("unscheduleTasks calls api.post with correct URL", async () => {
    const mockResponse = { data: { unscheduled_count: 3 } };
    (api.post as any).mockResolvedValue(mockResponse);

    const result = await unscheduleTasks();

    expect(api.post).toHaveBeenCalledWith("/api/unschedule/");
    expect(result).toEqual(mockResponse.data);
  });
});
