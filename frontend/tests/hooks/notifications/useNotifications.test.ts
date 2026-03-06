import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead as apiMarkAsRead, 
  markAllAsRead as apiMarkAllAsRead, 
  deleteNotification as apiDeleteNotification 
} from "@/api/notifications";

// Mock API
vi.mock("@/api/notifications", () => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
}));

describe("useNotifications Hook", () => {
  const mockNotifications = [
    { id: 1, title: "N1", is_read: false },
    { id: 2, title: "N2", is_read: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (getNotifications as any).mockResolvedValue({ results: mockNotifications, next: "page2" });
    (getUnreadCount as any).mockResolvedValue({ count: 5 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches notifications and unread count on mount", async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toEqual(mockNotifications);
      expect(result.current.unreadCount).toBe(5);
      expect(result.current.hasMore).toBe(true);
    });

    expect(getNotifications).toHaveBeenCalledWith(1);
    expect(getUnreadCount).toHaveBeenCalled();
  });

  it("appends notifications when fetching next page", async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.notifications.length).toBe(2));

    const nextNotifications = [{ id: 3, title: "N3", is_read: false }];
    (getNotifications as any).mockResolvedValue({ results: nextNotifications, next: null });

    await act(async () => {
      await result.current.fetchNotifications(2);
    });

    expect(result.current.notifications.length).toBe(3);
    expect(result.current.notifications[2]).toEqual(nextNotifications[0]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.page).toBe(2);
  });

  it("sets error when fetchNotifications fails", async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (getNotifications as any).mockRejectedValue(new Error("Fetch failed"));

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.error).toBe("Failed to fetch notifications");
    });
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("handles errors in fetchUnreadCount", async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (getUnreadCount as any).mockRejectedValue(new Error("Count failed"));

    renderHook(() => useNotifications());

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch unread count', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it("marks a notification as read", async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.unreadCount).toBe(5));

    await act(async () => {
      await result.current.markRead(1);
    });

    expect(apiMarkAsRead).toHaveBeenCalledWith(1);
    expect(result.current.notifications[0].is_read).toBe(true);
    expect(result.current.unreadCount).toBe(4);
  });

  it("marks all notifications as read", async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.unreadCount).toBe(5));

    await act(async () => {
      await result.current.markAllRead();
    });

    expect(apiMarkAllAsRead).toHaveBeenCalled();
    expect(result.current.notifications.every(n => n.is_read)).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it("deletes a notification", async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.notifications.length).toBe(2));

    await act(async () => {
      await result.current.deleteNotification(1); // unread
    });

    expect(apiDeleteNotification).toHaveBeenCalledWith(1);
    expect(result.current.notifications.length).toBe(1);
    expect(result.current.unreadCount).toBe(4);
  });

  it("deletes a read notification", async () => {
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.notifications.length).toBe(2));

    await act(async () => {
      await result.current.deleteNotification(2); // read
    });

    expect(apiDeleteNotification).toHaveBeenCalledWith(2);
    expect(result.current.unreadCount).toBe(5); // unchanged
  });

  it("handles errors in markRead, markAllRead, deleteNotification", async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (apiMarkAsRead as any).mockRejectedValue(new Error("Error"));
    (apiMarkAllAsRead as any).mockRejectedValue(new Error("Error"));
    (apiDeleteNotification as any).mockRejectedValue(new Error("Error"));

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markRead(1);
      await result.current.markAllRead();
      await result.current.deleteNotification(1);
    });

    expect(consoleSpy).toHaveBeenCalledTimes(3);
    consoleSpy.mockRestore();
  });
});
