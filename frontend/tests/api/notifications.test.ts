import { describe, it, expect, vi, beforeEach } from "vitest";
import api from "@/services/api";
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
} from "@/api/notifications";
import { NotificationType } from "@/types";

vi.mock("@/services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("notifications API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getNotifications fetches with correct query params", async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: { results: [], count: 0 } });
    
    await getNotifications(2, { isRead: true, notificationType: NotificationType.SYSTEM });
    
    expect(getSpy).toHaveBeenCalledWith("/api/notifications/?page=2&is_read=true&notification_type=SYSTEM");
  });

  it("getUnreadCount fetches correctly", async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: { count: 5 } });
    const res = await getUnreadCount();
    expect(getSpy).toHaveBeenCalledWith("/api/notifications/unread_count/");
    expect(res.count).toBe(5);
  });

  it("markAsRead posts correctly", async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
    await markAsRead(123);
    expect(postSpy).toHaveBeenCalledWith("/api/notifications/123/mark_read/");
  });

  it("markAsUnread posts correctly", async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
    await markAsUnread(123);
    expect(postSpy).toHaveBeenCalledWith("/api/notifications/123/mark_unread/");
  });

  it("markAllAsRead posts correctly", async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
    await markAllAsRead();
    expect(postSpy).toHaveBeenCalledWith("/api/notifications/mark_all_read/");
  });

  it("deleteNotification deletes correctly", async () => {
    const deleteSpy = vi.spyOn(api, 'delete').mockResolvedValue({ data: {} });
    await deleteNotification(123);
    expect(deleteSpy).toHaveBeenCalledWith("/api/notifications/123/");
  });

  it("deleteAllNotifications deletes correctly", async () => {
    const deleteSpy = vi.spyOn(api, 'delete').mockResolvedValue({ data: {} });
    await deleteAllNotifications();
    expect(deleteSpy).toHaveBeenCalledWith("/api/notifications/delete_all/");
  });

  it("subscribeToPush posts correctly", async () => {
    const payload = { endpoint: "ep", p256dh: "k1", auth: "k2" };
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
    await subscribeToPush(payload);
    expect(postSpy).toHaveBeenCalledWith("/api/push/subscribe/", payload);
  });

  it("unsubscribeFromPush posts correctly", async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
    await unsubscribeFromPush("ep");
    expect(postSpy).toHaveBeenCalledWith("/api/push/unsubscribe/", { endpoint: "ep" });
  });

  it("getVapidPublicKey fetches correctly", async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: { public_key: "pk" } });
    const res = await getVapidPublicKey();
    expect(getSpy).toHaveBeenCalledWith("/api/push/vapid_public_key/");
    expect(res.public_key).toBe("pk");
  });

  it("sendAdminNotification posts correctly", async () => {
    const payload = { title: "T", message: "M", target: "all" as const };
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: { task_id: "1", status: "QUEUED", broadcast_id: 1, recipient_count: 0 } });
    await sendAdminNotification(payload);
    expect(postSpy).toHaveBeenCalledWith("/api/admin/send_notification/", payload);
  });

  it("getAudienceCounts fetches with user_ids if provided", async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: {} });
    await getAudienceCounts([1, 2]);
    expect(getSpy).toHaveBeenCalledWith("/api/admin/audience_counts/", {
      params: { user_ids: "1,2" }
    });

    await getAudienceCounts();
    expect(getSpy).toHaveBeenLastCalledWith("/api/admin/audience_counts/", {
      params: { user_ids: undefined }
    });
  });

  it("getBroadcastHistory fetches with correct params", async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: {} });
    await getBroadcastHistory({ page: 2, q: "search", target: "staff", status: "FAILED" });
    expect(getSpy).toHaveBeenCalledWith("/api/admin/broadcasts/", {
      params: { page: 2, q: "search", target: "staff", status: "FAILED" }
    });
  });

  it("getBroadcastDetail fetches correctly", async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: {} });
    await getBroadcastDetail(123);
    expect(getSpy).toHaveBeenCalledWith("/api/admin/broadcasts/123/");
  });

  it("getBroadcastStatus fetches correctly", async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: {} });
    await getBroadcastStatus(123);
    expect(getSpy).toHaveBeenCalledWith("/api/admin/broadcasts/123/status/");
  });

  it("retryFailedBroadcast posts correctly", async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
    await retryFailedBroadcast(123);
    expect(postSpy).toHaveBeenCalledWith("/api/admin/broadcasts/123/retry_failed/");
  });

  it("getAdminUsers fetches with correct params", async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: {} });
    await getAdminUsers({ search: "s", role: "staff", page: 3, pageSize: 50 });
    expect(getSpy).toHaveBeenCalledWith("/api/admin/users/", {
      params: { search: "s", role: "staff", page: 3, page_size: 50 }
    });

    await getAdminUsers({ role: "all" });
    expect(getSpy).toHaveBeenLastCalledWith("/api/admin/users/", {
      params: { search: undefined, role: undefined, page: 1, page_size: undefined }
    });
  });
});

