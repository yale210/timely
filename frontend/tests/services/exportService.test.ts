import { vi, describe, it, expect, beforeEach } from "vitest";
import { exportEvents } from "@/services/exportService";

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

// Mock api service
vi.mock("@/services/api", () => ({
  default: {
    get: mockGet,
  },
}));

describe("exportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
  });


  it("calls api.get with correct URL", async () => {
    mockGet.mockResolvedValue({ status: 200, data: "data" });
    const result = await exportEvents();
    expect(mockGet).toHaveBeenCalledWith("/api/export/", expect.any(Object));
    expect(result).toBe("data");
  });

  it("throws an error when status != 200", async () => {
    mockGet.mockResolvedValue({ status: 401, data: "data" });
    await expect(exportEvents()).rejects.toThrow("Error Exporting Events");
  });

  
});
