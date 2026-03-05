import { vi, describe, it, expect, afterEach } from "vitest";
import api from "../../src/services/api";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  subscribeToPush,
  unsubscribeFromPush,
  getVapidPublicKey,
  sendAdminNotification,
  getAudienceCounts,
  getBroadcastHistory,
  getBroadcastDetail,
  getBroadcastStatus,
  retryFailedBroadcast,
  getAdminUsers,
} from "../../src/api/notifications";

vi.mock("../../src/services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("notifications API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully fetches notifications with default parameters", async () => {
    const mockData = { count: 10, results: [] };
    const spy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: mockData });

    const result = await getNotifications();
    expect(spy).toHaveBeenCalledWith("/api/notifications/?page=1");
    expect(result).toEqual(mockData);
  });

  it("successfully fetches notifications with filters", async () => {
    const mockData = { count: 5, results: [] };
    const spy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: mockData });

    await getNotifications(2, { isRead: true, notificationType: "SYSTEM" });
    expect(spy).toHaveBeenCalledWith("/api/notifications/?page=2&is_read=true&notification_type=SYSTEM");
  });

  it("successfully fetches unread count", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: { count: 5 } });
    const result = await getUnreadCount();
    expect(spy).toHaveBeenCalledWith("/api/notifications/unread_count/");
    expect(result.count).toBe(5);
  });

  it("successfully marks a single notification as read", async () => {
    const spy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: {} });
    await markAsRead(123);
    expect(spy).toHaveBeenCalledWith("/api/notifications/123/mark_read/");
  });

  it("successfully marks a single notification as unread", async () => {
    const spy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: {} });
    await markAsUnread(123);
    expect(spy).toHaveBeenCalledWith("/api/notifications/123/mark_unread/");
  });

  it("successfully marks all notifications as read", async () => {
    const spy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: {} });
    await markAllAsRead();
    expect(spy).toHaveBeenCalledWith("/api/notifications/mark_all_read/");
  });

  it("successfully deletes a single notification", async () => {
    const spy = vi.spyOn(api, "delete").mockResolvedValueOnce({ data: {} });
    await deleteNotification(123);
    expect(spy).toHaveBeenCalledWith("/api/notifications/123/");
  });

  it("successfully deletes all notifications", async () => {
    const spy = vi.spyOn(api, "delete").mockResolvedValueOnce({ data: {} });
    await deleteAllNotifications();
    expect(spy).toHaveBeenCalledWith("/api/notifications/delete_all/");
  });

  it("successfully subscribes to push notifications", async () => {
    const payload = { endpoint: "https://example.com", p256dh: "a", auth: "b" };
    const spy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: {} });
    await subscribeToPush(payload);
    expect(spy).toHaveBeenCalledWith("/api/push/subscribe/", payload);
  });

  it("successfully unsubscribes from push notifications", async () => {
    const spy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: {} });
    await unsubscribeFromPush("https://example.com");
    expect(spy).toHaveBeenCalledWith("/api/push/unsubscribe/", { endpoint: "https://example.com" });
  });

  it("successfully fetches VAPID public key", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: { public_key: "key123" } });
    const result = await getVapidPublicKey();
    expect(spy).toHaveBeenCalledWith("/api/push/vapid_public_key/");
    expect(result.public_key).toBe("key123");
  });

  it("successfully sends an admin notification", async () => {
    const payload = { target: "all", title: "Test", message: "Push" } as const;
    const spy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: { task_id: "task1" } });
    const result = await sendAdminNotification(payload);
    expect(spy).toHaveBeenCalledWith("/api/admin/send_notification/", payload);
    expect(result.task_id).toBe("task1");
  });

  it("successfully fetches audience counts with user IDs", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: { all: 100 } });
    await getAudienceCounts([1, 2]);
    expect(spy).toHaveBeenCalledWith("/api/admin/audience_counts/", {
      params: { user_ids: "1,2" },
    });
  });

  it("successfully fetches broadcast history with various filters", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: { count: 1, results: [] } });
    await getBroadcastHistory({ page: 2, q: "test", target: "users", status: "completed" });
    expect(spy).toHaveBeenCalledWith("/api/admin/broadcasts/", {
      params: { page: 2, q: "test", target: "users", status: "completed" },
    });
  });

  it("successfully fetches broadcast detail", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: { id: 1 } });
    await getBroadcastDetail(1);
    expect(spy).toHaveBeenCalledWith("/api/admin/broadcasts/1/");
  });

  it("successfully fetches broadcast status", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: { status: "running" } });
    await getBroadcastStatus(1);
    expect(spy).toHaveBeenCalledWith("/api/admin/broadcasts/1/status/");
  });

  it("successfully retries a failed broadcast", async () => {
    const spy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: { task_id: "task2" } });
    await retryFailedBroadcast(1);
    expect(spy).toHaveBeenCalledWith("/api/admin/broadcasts/1/retry_failed/");
  });

  it("successfully fetches admin users with filters", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: { count: 50, results: [] } });
    await getAdminUsers({ search: "john", role: "users", page: 1, pageSize: 10 });
    expect(spy).toHaveBeenCalledWith("/api/admin/users/", {
      params: { search: "john", role: "users", page: 1, page_size: 10 },
    });
  });

  it("omits role filter for admin users if 'all' is selected", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: { count: 50, results: [] } });
    await getAdminUsers({ role: "all" });
    expect(spy).toHaveBeenCalledWith("/api/admin/users/", {
      params: { search: undefined, role: undefined, page: 1, page_size: undefined },
    });
  });
});
