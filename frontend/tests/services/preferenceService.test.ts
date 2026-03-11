import { vi, describe, it, expect, beforeEach } from "vitest";
import { preferenceService } from "@/services/preferenceService";

const { mockGet, mockPatch } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPatch: vi.fn(),
}));

// Mock api service
vi.mock("@/services/api", () => ({
  default: {
    get: mockGet,
    patch: mockPatch,
  },
}));

describe("preferenceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getMyPreference calls api.get with correct URL", async () => {
    const mockData = { day_start: "08:00:00", max_hours_study_per_day: 4 };
    mockGet.mockResolvedValue({ data: mockData });

    const result = await preferenceService.getMyPreference();

    expect(mockGet).toHaveBeenCalledWith("/api/preferences/me/");
    expect(result).toEqual(mockData);
  });

  it("updateMyPreference calls api.patch with correct URL and patch data", async () => {
    const patch = { max_hours_study_per_day: 6 };
    const mockData = { day_start: "08:00:00", max_hours_study_per_day: 6 };
    mockPatch.mockResolvedValue({ data: mockData });

    const result = await preferenceService.updateMyPreference(patch);

    expect(mockPatch).toHaveBeenCalledWith("/api/preferences/me/", patch);
    expect(result).toEqual(mockData);
  });
});
