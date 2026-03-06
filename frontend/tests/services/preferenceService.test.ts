import { vi, describe, it, expect, beforeEach } from "vitest";
import { preferenceService } from "@/services/preferenceService";
import api from "@/services/api";

// Mock api service
vi.mock("@/services/api", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("preferenceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getMyPreference calls api.get with correct URL", async () => {
    const mockData = { theme: "dark", font: "sans" };
    (api.get as any).mockResolvedValue({ data: mockData });

    const result = await preferenceService.getMyPreference();

    expect(api.get).toHaveBeenCalledWith("/api/preferences/me/");
    expect(result).toEqual(mockData);
  });

  it("updateMyPreference calls api.patch with correct URL and patch data", async () => {
    const patch = { theme: "light" };
    const mockData = { theme: "light", font: "sans" };
    (api.patch as any).mockResolvedValue({ data: mockData });

    const result = await preferenceService.updateMyPreference(patch);

    expect(api.patch).toHaveBeenCalledWith("/api/preferences/me/", patch);
    expect(result).toEqual(mockData);
  });
});
