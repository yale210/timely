import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as importService from "@/services/importService";

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  default: {
    post: mockPost,
  },
}));

let reloadSpy: ReturnType<typeof vi.spyOn>;

describe("importService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    vi.spyOn(window, "alert").mockImplementation(() => undefined);

    reloadSpy = vi
      .spyOn(importService.pageReloader, "reload")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    reloadSpy.mockRestore();
  });

  it("calls api.post with correct URL", async () => {
    const mockFile = new File(["content"], "events.txt", { type: "text" });

    mockPost.mockResolvedValue({ status: 200, data: { message: "Import" } });

    const result = await importService.importEvents(mockFile);

    expect(window.alert).toHaveBeenCalledWith("Import");
    expect(reloadSpy).toHaveBeenCalled();
    expect(result).toBe("Import");
  });

  it("throws an error when status != 200", async () => {
    const mockFile = new File(["content"], "events.txt", { type: "text" });

    mockPost.mockResolvedValue({ status: 401, data: { message: "Import" } });

    await expect(importService.importEvents(mockFile)).rejects.toThrow("Error Importing Events");
  });
});
