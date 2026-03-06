import { vi, describe, it, expect, beforeEach } from "vitest";
import * as notificationsApi from "@/api/notifications";

// Mock api service
const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  default: {
    get: mockGet,
    post: mockPost,
    delete: mockDelete,
  },
}));

describe("notifications API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("calls api.get with default page and no filters", async () => {
      mockGet.mockResolvedValue({ data: { results: [], count: 0 } });
      await notificationsApi.getNotifications();
      expect(mockGet).toHaveBeenCalledWith("/api/notifications/?page=1");
    });

    it("calls api.get with custom page and filters", async () => {
      mockGet.mockResolvedValue({ data: { results: [], count: 0 } });
      await notificationsApi.getNotifications(2, { isRead: true, notificationType: "system" });
      
      const callArg = mockGet.mock.calls[0][0] as string;
      expect(callArg).toContain("page=2");
      expect(callArg).toContain("is_read=true");
      expect(callArg).toContain("notification_type=system");
    });

    it("handles isRead: false correctly", async () => {
        mockGet.mockResolvedValue({ data: { results: [], count: 0 } });
        await notificationsApi.getNotifications(1, { isRead: false });
        expect(mockGet.mock.calls[0][0] as string).toContain("is_read=false");
    });
  });

  it("getUnreadCount calls correct URL", async () => {
    mockGet.mockResolvedValue({ data: { count: 5 } });
    const result = await notificationsApi.getUnreadCount();
    expect(mockGet).toHaveBeenCalledWith("/api/notifications/unread_count/");
    expect(result.count).toBe(5);
  });

  it("markAsRead calls correct URL with POST", async () => {
    await notificationsApi.markAsRead(123);
    expect(mockPost).toHaveBeenCalledWith("/api/notifications/123/mark_read/");
  });

  it("markAsUnread calls correct URL with POST", async () => {
    await notificationsApi.markAsUnread(123);
    expect(mockPost).toHaveBeenCalledWith("/api/notifications/123/mark_unread/");
  });

  it("markAllAsRead calls correct URL with POST", async () => {
    await notificationsApi.markAllAsRead();
    expect(mockPost).toHaveBeenCalledWith("/api/notifications/mark_all_read/");
  });

  it("deleteNotification calls correct URL with DELETE", async () => {
    await notificationsApi.deleteNotification(123);
    expect(mockDelete).toHaveBeenCalledWith("/api/notifications/123/");
  });

  it("deleteAllNotifications calls correct URL with DELETE", async () => {
    await notificationsApi.deleteAllNotifications();
    expect(mockDelete).toHaveBeenCalledWith("/api/notifications/delete_all/");
  });

  it("subscribeToPush calls correct URL with payload", async () => {
    const payload = { endpoint: "url", keys: { p256dh: "p", auth: "a" } };
    await notificationsApi.subscribeToPush(payload);
    expect(mockPost).toHaveBeenCalledWith("/api/push/subscribe/", payload);
  });

  it("unsubscribeFromPush calls correct URL with endpoint", async () => {
    await notificationsApi.unsubscribeFromPush("my-endpoint");
    expect(mockPost).toHaveBeenCalledWith("/api/push/unsubscribe/", { endpoint: "my-endpoint" });
  });

  it("getVapidPublicKey calls correct URL", async () => {
    mockGet.mockResolvedValue({ data: { public_key: "key" } });
    const result = await notificationsApi.getVapidPublicKey();
    expect(mockGet).toHaveBeenCalledWith("/api/push/vapid_public_key/");
    expect(result.public_key).toBe("key");
  });

  it("sendAdminNotification calls correct URL with payload", async () => {
    const payload = { title: "T", content: "C", target: "all" as const };
    mockPost.mockResolvedValue({ data: { task_id: "1" } });
    const result = await notificationsApi.sendAdminNotification(payload);
    expect(mockPost).toHaveBeenCalledWith("/api/admin/send_notification/", payload);
    expect(result.task_id).toBe("1");
  });

  describe("getAudienceCounts", () => {
    it("calls api.get without userIds", async () => {
      mockGet.mockResolvedValue({ data: {} });
      await notificationsApi.getAudienceCounts();
      expect(mockGet).toHaveBeenCalledWith("/api/admin/audience_counts/", { params: { user_ids: undefined } });
    });

    it("calls api.get with userIds", async () => {
      mockGet.mockResolvedValue({ data: {} });
      await notificationsApi.getAudienceCounts([1, 2, 3]);
      expect(mockGet).toHaveBeenCalledWith("/api/admin/audience_counts/", { params: { user_ids: "1,2,3" } });
    });
  });

  describe("getBroadcastHistory", () => {
    it("calls api.get with default params", async () => {
      mockGet.mockResolvedValue({ data: { results: [] } });
      await notificationsApi.getBroadcastHistory();
      expect(mockGet).toHaveBeenCalledWith("/api/admin/broadcasts/", {
        params: { page: 1, q: undefined, target: undefined, status: undefined }
      });
    });

    it("calls api.get with provided params", async () => {
      mockGet.mockResolvedValue({ data: { results: [] } });
      await notificationsApi.getBroadcastHistory({ page: 2, q: "search", target: "staff", status: "FAILED" });
      expect(mockGet).toHaveBeenCalledWith("/api/admin/broadcasts/", {
        params: { page: 2, q: "search", target: "staff", status: "FAILED" }
      });
    });
  });

  it("getBroadcastDetail calls correct URL", async () => {
    mockGet.mockResolvedValue({ data: { id: 1 } });
    const result = await notificationsApi.getBroadcastDetail(1);
    expect(mockGet).toHaveBeenCalledWith("/api/admin/broadcasts/1/");
    expect(result.id).toBe(1);
  });

  it("getBroadcastStatus calls correct URL", async () => {
    mockGet.mockResolvedValue({ data: { status: "C" } });
    const result = await notificationsApi.getBroadcastStatus(1);
    expect(mockGet).toHaveBeenCalledWith("/api/admin/broadcasts/1/status/");
    expect(result.status).toBe("C");
  });

  it("retryFailedBroadcast calls correct URL with POST", async () => {
    mockPost.mockResolvedValue({ data: { task_id: "2" } });
    const result = await notificationsApi.retryFailedBroadcast(1);
    expect(mockPost).toHaveBeenCalledWith("/api/admin/broadcasts/1/retry_failed/");
    expect(result.task_id).toBe("2");
  });

  describe("getAdminUsers", () => {
    it("calls api.get with various params", async () => {
      mockGet.mockResolvedValue({ data: { results: [] } });
      await notificationsApi.getAdminUsers({ search: "u", role: "admin", page: 3, pageSize: 50 });
      expect(mockGet).toHaveBeenCalledWith("/api/admin/users/", {
        params: { search: "u", role: "admin", page: 3, page_size: 50 }
      });
    });

    it("omits role if set to 'all'", async () => {
      mockGet.mockResolvedValue({ data: { results: [] } });
      await notificationsApi.getAdminUsers({ role: "all" });
      expect(mockGet).toHaveBeenCalledWith("/api/admin/users/", expect.objectContaining({
        params: expect.objectContaining({ role: undefined }) as unknown
      }));
    });
  });
});

