import { vi, describe, it, expect, beforeEach } from "vitest";
import * as notificationsApi from "@/api/notifications";
import api from "@/services/api";

// Mock api service
vi.mock("@/services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("notifications API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("calls api.get with default page and no filters", async () => {
      (api.get as any).mockResolvedValue({ data: { results: [], count: 0 } });
      await notificationsApi.getNotifications();
      expect(api.get).toHaveBeenCalledWith("/api/notifications/?page=1");
    });

    it("calls api.get with custom page and filters", async () => {
      (api.get as any).mockResolvedValue({ data: { results: [], count: 0 } });
      await notificationsApi.getNotifications(2, { isRead: true, notificationType: "system" });
      
      const callArg = (api.get as any).mock.calls[0][0];
      expect(callArg).toContain("page=2");
      expect(callArg).toContain("is_read=true");
      expect(callArg).toContain("notification_type=system");
    });

    it("handles isRead: false correctly", async () => {
        (api.get as any).mockResolvedValue({ data: { results: [], count: 0 } });
        await notificationsApi.getNotifications(1, { isRead: false });
        expect((api.get as any).mock.calls[0][0]).toContain("is_read=false");
    });
  });

  it("getUnreadCount calls correct URL", async () => {
    (api.get as any).mockResolvedValue({ data: { count: 5 } });
    const result = await notificationsApi.getUnreadCount();
    expect(api.get).toHaveBeenCalledWith("/api/notifications/unread_count/");
    expect(result.count).toBe(5);
  });

  it("markAsRead calls correct URL with POST", async () => {
    await notificationsApi.markAsRead(123);
    expect(api.post).toHaveBeenCalledWith("/api/notifications/123/mark_read/");
  });

  it("markAsUnread calls correct URL with POST", async () => {
    await notificationsApi.markAsUnread(123);
    expect(api.post).toHaveBeenCalledWith("/api/notifications/123/mark_unread/");
  });

  it("markAllAsRead calls correct URL with POST", async () => {
    await notificationsApi.markAllAsRead();
    expect(api.post).toHaveBeenCalledWith("/api/notifications/mark_all_read/");
  });

  it("deleteNotification calls correct URL with DELETE", async () => {
    await notificationsApi.deleteNotification(123);
    expect(api.delete).toHaveBeenCalledWith("/api/notifications/123/");
  });

  it("deleteAllNotifications calls correct URL with DELETE", async () => {
    await notificationsApi.deleteAllNotifications();
    expect(api.delete).toHaveBeenCalledWith("/api/notifications/delete_all/");
  });

  it("subscribeToPush calls correct URL with payload", async () => {
    const payload = { endpoint: "url", keys: { p256dh: "p", auth: "a" } };
    await notificationsApi.subscribeToPush(payload);
    expect(api.post).toHaveBeenCalledWith("/api/push/subscribe/", payload);
  });

  it("unsubscribeFromPush calls correct URL with endpoint", async () => {
    await notificationsApi.unsubscribeFromPush("my-endpoint");
    expect(api.post).toHaveBeenCalledWith("/api/push/unsubscribe/", { endpoint: "my-endpoint" });
  });

  it("getVapidPublicKey calls correct URL", async () => {
    (api.get as any).mockResolvedValue({ data: { public_key: "key" } });
    const result = await notificationsApi.getVapidPublicKey();
    expect(api.get).toHaveBeenCalledWith("/api/push/vapid_public_key/");
    expect(result.public_key).toBe("key");
  });

  it("sendAdminNotification calls correct URL with payload", async () => {
    const payload = { title: "T", content: "C", target: "all" as const };
    (api.post as any).mockResolvedValue({ data: { task_id: "1" } });
    const result = await notificationsApi.sendAdminNotification(payload);
    expect(api.post).toHaveBeenCalledWith("/api/admin/send_notification/", payload);
    expect(result.task_id).toBe("1");
  });

  describe("getAudienceCounts", () => {
    it("calls api.get without userIds", async () => {
      (api.get as any).mockResolvedValue({ data: {} });
      await notificationsApi.getAudienceCounts();
      expect(api.get).toHaveBeenCalledWith("/api/admin/audience_counts/", { params: { user_ids: undefined } });
    });

    it("calls api.get with userIds", async () => {
      (api.get as any).mockResolvedValue({ data: {} });
      await notificationsApi.getAudienceCounts([1, 2, 3]);
      expect(api.get).toHaveBeenCalledWith("/api/admin/audience_counts/", { params: { user_ids: "1,2,3" } });
    });
  });

  describe("getBroadcastHistory", () => {
    it("calls api.get with default params", async () => {
      (api.get as any).mockResolvedValue({ data: { results: [] } });
      await notificationsApi.getBroadcastHistory();
      expect(api.get).toHaveBeenCalledWith("/api/admin/broadcasts/", {
        params: { page: 1, q: undefined, target: undefined, status: undefined }
      });
    });

    it("calls api.get with provided params", async () => {
      (api.get as any).mockResolvedValue({ data: { results: [] } });
      await notificationsApi.getBroadcastHistory({ page: 2, q: "search", target: "staff", status: "FAILED" });
      expect(api.get).toHaveBeenCalledWith("/api/admin/broadcasts/", {
        params: { page: 2, q: "search", target: "staff", status: "FAILED" }
      });
    });
  });

  it("getBroadcastDetail calls correct URL", async () => {
    (api.get as any).mockResolvedValue({ data: { id: 1 } });
    const result = await notificationsApi.getBroadcastDetail(1);
    expect(api.get).toHaveBeenCalledWith("/api/admin/broadcasts/1/");
    expect(result.id).toBe(1);
  });

  it("getBroadcastStatus calls correct URL", async () => {
    (api.get as any).mockResolvedValue({ data: { status: "C" } });
    const result = await notificationsApi.getBroadcastStatus(1);
    expect(api.get).toHaveBeenCalledWith("/api/admin/broadcasts/1/status/");
    expect(result.status).toBe("C");
  });

  it("retryFailedBroadcast calls correct URL with POST", async () => {
    (api.post as any).mockResolvedValue({ data: { task_id: "2" } });
    const result = await notificationsApi.retryFailedBroadcast(1);
    expect(api.post).toHaveBeenCalledWith("/api/admin/broadcasts/1/retry_failed/");
    expect(result.task_id).toBe("2");
  });

  describe("getAdminUsers", () => {
    it("calls api.get with various params", async () => {
      (api.get as any).mockResolvedValue({ data: { results: [] } });
      await notificationsApi.getAdminUsers({ search: "u", role: "admin", page: 3, pageSize: 50 });
      expect(api.get).toHaveBeenCalledWith("/api/admin/users/", {
        params: { search: "u", role: "admin", page: 3, page_size: 50 }
      });
    });

    it("omits role if set to 'all'", async () => {
      (api.get as any).mockResolvedValue({ data: { results: [] } });
      await notificationsApi.getAdminUsers({ role: "all" });
      expect(api.get).toHaveBeenCalledWith("/api/admin/users/", expect.objectContaining({
        params: expect.objectContaining({ role: undefined })
      }));
    });
  });
});
