import { vi, describe, it, expect, beforeEach } from "vitest";
import { getShares, sendShare, replyShare } from "@/services/shareService";

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}));

// Mock api service
vi.mock("@/services/api", () => ({
  default: {
    get: mockGet,
    post: mockPost,
  },
}));

describe("shareService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
  });


  it("getShares calls api.get with correct URL", async () => {
    const mockData = [
        { id:1, sender:"user1" },
        { id:2, sender:"user2" },
    ];
    mockGet.mockResolvedValue({ status: 200, data: mockData });
    const result = await getShares();
    expect(mockGet).toHaveBeenCalledWith("/api/share_events/");
    expect(result).toBe(mockData);
  });

  it("sendShare calls api.post with correct URL", async () => {
    mockPost.mockResolvedValue({});
    
    await sendShare("user2", "1");
    expect(mockPost).toHaveBeenCalledWith("/api/share_send/", expect.any(Object));
  });

  it("acceptShare calls api.post with correct URL", async () => {
    mockPost.mockResolvedValue({});
    
    await replyShare("1", "user1");
    expect(mockPost).toHaveBeenCalledWith("/api/share_accept/", expect.any(Object));
  });

  

  
});
