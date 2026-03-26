import { vi, describe, it, expect, beforeEach } from "vitest";
import { importEvents } from "@/services/importService";

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

// Mock api service
vi.mock("@/services/api", () => ({
  default: {
    post: mockPost,
  },
}));

let reloadMock: ReturnType<typeof vi.fn>

describe("importService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");

    vi.spyOn(window, "alert").mockImplementation(() => undefined);

    reloadMock = vi.fn(() => undefined);

    

    Object.defineProperty(window, "location", { value: { ...window.location, reload: reloadMock, }, writable:true});
    
  });


  it("calls api.post with correct URL", async () => {
    const mockFile = new File(["content"], "events.txt", { type: "text" })

    mockPost.mockResolvedValue({status: 200, data: {message: "Import"}})

    
    const result = await importEvents(mockFile);

    expect(window.alert).toHaveBeenCalledWith("Import");
    expect(reloadMock).toHaveBeenCalled();
    expect(result).toBe("Import")
  });



  it("throws an error when status != 200", async () => {
      const mockFile = new File(["content"], "events.txt", { type: "text" })

        mockPost.mockResolvedValue({status: 401, data: {message: "Import"}})
        await expect(importEvents(mockFile)).rejects.toThrow("Error Importing Events");


    });
  


  

  
});
