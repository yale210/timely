import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type React from "react";
import * as api from "../../src/api/notifications";
import { useWebSocket } from "../../src/hooks/useWebSocket";
import type * as NotificationContextModule from "../../src/context/NotificationContext";

// We need to import the actual module to test it, despite the global mock in setupTests.ts
const { NotificationProvider, useNotificationContext } = await vi.importActual<typeof NotificationContextModule>("../../src/context/NotificationContext");

vi.mock("../../src/api/notifications", () => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAsUnread: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  deleteAllNotifications: vi.fn(),
}));

vi.mock("../../src/hooks/useWebSocket", () => ({
  useWebSocket: vi.fn(),
  ConnectionStatusValues: {
    CONNECTING: "CONNECTING",
    OPEN: "OPEN",
    CLOSING: "CLOSING",
    CLOSED: "CLOSED",
  },
}));

describe("NotificationContext Provider", () => {
  const mockNotifications = [
    { id: 1, title: "N1", message: "M1", is_read: false, timestamp: new Date().toISOString(), notification_type: "SYSTEM" as const, recipient: 1, sender: null, sender_username: null },
    { id: 2, title: "N2", message: "M2", is_read: true, timestamp: new Date().toISOString(), notification_type: "SYSTEM" as const, recipient: 1, sender: null, sender_username: null },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, "getNotifications").mockResolvedValue({
      results: mockNotifications,
      count: 2,
      next: null,
      previous: null,
    });
    vi.spyOn(api, "getUnreadCount").mockResolvedValue({ count: 1 });
    vi.spyOn(console, "error").mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  it("successfully fetches notifications on mount", async () => {
    const spy = vi.spyOn(api, "getNotifications");
    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });
    expect(result.current.unreadCount).toBe(1);
    expect(spy).toHaveBeenCalled();
  });

  it("successfully marks a notification as read", async () => {
    const spy = vi.spyOn(api, "markAsRead");
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => {
      await result.current.markRead(1);
    });

    expect(spy).toHaveBeenCalledWith(1);
    expect(result.current.notifications.find(n => n.id === 1)?.is_read).toBe(true);
    // unreadCount should decrease from 1 to 0
    expect(result.current.unreadCount).toBe(0);
  });

  it("does not decrease unread count when marking an already read notification as read", async () => {
    const spy = vi.spyOn(api, "markAsRead");
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => {
      await result.current.markRead(2); // notification 2 is already read
    });

    expect(spy).toHaveBeenCalledWith(2);
    // unreadCount should remain 1
    expect(result.current.unreadCount).toBe(1);
  });

  it("successfully marks a notification as unread", async () => {
    const spy = vi.spyOn(api, "markAsUnread");
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => {
      await result.current.markUnread(2);
    });

    expect(spy).toHaveBeenCalledWith(2);
    expect(result.current.notifications.find(n => n.id === 2)?.is_read).toBe(false);
    // unreadCount should increase from 1 to 2
    expect(result.current.unreadCount).toBe(2);
  });

  it("does not increase unread count when marking an already unread notification as unread", async () => {
    const spy = vi.spyOn(api, "markAsUnread");
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => {
      await result.current.markUnread(1); // notification 1 is already unread
    });

    expect(spy).toHaveBeenCalledWith(1);
    // unreadCount should remain 1
    expect(result.current.unreadCount).toBe(1);
  });

  it("successfully marks all as read", async () => {
    const spy = vi.spyOn(api, "markAllAsRead");
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => {
      await result.current.markAllRead();
    });

    expect(spy).toHaveBeenCalled();
    expect(result.current.notifications.every(n => n.is_read)).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it("successfully deletes a notification", async () => {
    const spy = vi.spyOn(api, "deleteNotification");
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => {
      await result.current.deleteNotification(1);
    });

    expect(spy).toHaveBeenCalledWith(1);
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications.find(n => n.id === 1)).toBeUndefined();
    expect(result.current.unreadCount).toBe(0);
  });

  it("deletes a notification not in current list (calls fetchUnreadCount)", async () => {
      const { result } = renderHook(() => useNotificationContext(), { wrapper });
      await waitFor(() => expect(result.current.notifications).toHaveLength(2));
      
      const unreadCountSpy = vi.spyOn(api, "getUnreadCount").mockResolvedValue({ count: 3 });
      
      await act(async () => {
        await result.current.deleteNotification(999);
      });
      
      expect(unreadCountSpy).toHaveBeenCalled();
      expect(result.current.unreadCount).toBe(3);
  });

  it("successfully deletes all notifications", async () => {
    const spy = vi.spyOn(api, "deleteAllNotifications");
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => {
      await result.current.deleteAllNotifications();
    });

    expect(spy).toHaveBeenCalled();
    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it("handles fetch errors gracefully", async () => {
    vi.spyOn(api, "getNotifications").mockRejectedValueOnce(new Error("Fetch failed"));
    
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.error).toBe("Failed to fetch notifications");
    });
    expect(console.error).toHaveBeenCalled();
  });

  it("handles fetchUnreadCount errors gracefully", async () => {
      vi.spyOn(api, "getUnreadCount").mockRejectedValueOnce(new Error("Count failed"));
      
      renderHook(() => useNotificationContext(), { wrapper });
      
      await waitFor(() => {
          expect(console.error).toHaveBeenCalledWith("Failed to fetch unread count", expect.anything());
      });
  });

  it("handles markRead errors gracefully", async () => {
      const { result } = renderHook(() => useNotificationContext(), { wrapper });
      await waitFor(() => expect(result.current.notifications).toHaveLength(2));
      
      vi.spyOn(api, "markAsRead").mockRejectedValueOnce(new Error("Mark failed"));
      
      await act(async () => {
          await result.current.markRead(1);
      });
      
      expect(console.error).toHaveBeenCalledWith("Failed to mark notification as read", expect.anything());
  });

  it("handles markUnread errors gracefully", async () => {
      const { result } = renderHook(() => useNotificationContext(), { wrapper });
      await waitFor(() => expect(result.current.notifications).toHaveLength(2));
      
      vi.spyOn(api, "markAsUnread").mockRejectedValueOnce(new Error("Mark failed"));
      
      await act(async () => {
          await result.current.markUnread(2);
      });
      
      expect(console.error).toHaveBeenCalledWith("Failed to mark notification as unread", expect.anything());
  });

  it("handles markAllRead errors gracefully", async () => {
      const { result } = renderHook(() => useNotificationContext(), { wrapper });
      await waitFor(() => expect(result.current.notifications).toHaveLength(2));
      
      vi.spyOn(api, "markAllAsRead").mockRejectedValueOnce(new Error("Mark all failed"));
      
      await act(async () => {
          await result.current.markAllRead();
      });
      
      expect(console.error).toHaveBeenCalledWith("Failed to mark all notifications as read", expect.anything());
  });

  it("handles deleteNotification errors gracefully", async () => {
      const { result } = renderHook(() => useNotificationContext(), { wrapper });
      await waitFor(() => expect(result.current.notifications).toHaveLength(2));
      
      vi.spyOn(api, "deleteNotification").mockRejectedValueOnce(new Error("Delete failed"));
      
      await act(async () => {
          await result.current.deleteNotification(1);
      });
      
      expect(console.error).toHaveBeenCalledWith("Failed to delete notification", expect.anything());
  });

  it("handles deleteAllNotifications errors gracefully", async () => {
      const { result } = renderHook(() => useNotificationContext(), { wrapper });
      await waitFor(() => expect(result.current.notifications).toHaveLength(2));
      
      vi.spyOn(api, "deleteAllNotifications").mockRejectedValueOnce(new Error("Delete all failed"));
      
      await act(async () => {
          await result.current.deleteAllNotifications();
      });
      
      expect(console.error).toHaveBeenCalledWith("Failed to delete all notifications", expect.anything());
  });

  it("handles WebSocket 'new_notification' message", async () => {
      let wsCallback: (data: unknown) => void = vi.fn();
      vi.mocked(useWebSocket).mockImplementation((_url, onMessage) => {
          wsCallback = onMessage;
          return { status: "OPEN", sendMessage: vi.fn(), history: [] };
      });
      
      const { result } = renderHook(() => useNotificationContext(), { wrapper });
      await waitFor(() => expect(result.current.notifications).toHaveLength(2));
      
      const newNotif = { id: 3, title: "N3", message: "M3", is_read: false };
      
      act(() => {
          wsCallback({ type: "new_notification", notification: newNotif, unread_count: 5 });
      });
      
      expect(result.current.notifications).toHaveLength(3);
      expect(result.current.notifications[0].id).toBe(3);
      expect(result.current.unreadCount).toBe(5);
  });

  it("ignores WebSocket 'new_notification' message if already exists", async () => {
      let wsCallback: (data: unknown) => void = vi.fn();
      vi.mocked(useWebSocket).mockImplementation((_url, onMessage) => {
          wsCallback = onMessage;
          return { status: "OPEN", sendMessage: vi.fn(), history: [] };
      });
      
      const { result } = renderHook(() => useNotificationContext(), { wrapper });
      await waitFor(() => expect(result.current.notifications).toHaveLength(2));
      
      const existingNotif = mockNotifications[0];
      
      act(() => {
          wsCallback({ type: "new_notification", notification: existingNotif, unread_count: 10 });
      });
      
      expect(result.current.notifications).toHaveLength(2);
      // But unread count might still update if that's what the message says
      expect(result.current.unreadCount).toBe(10);
  });

  it("handles WebSocket 'unread_count' message", async () => {
      let wsCallback: (data: unknown) => void = vi.fn();
      vi.mocked(useWebSocket).mockImplementation((_url, onMessage) => {
          wsCallback = onMessage;
          return { status: "OPEN", sendMessage: vi.fn(), history: [] };
      });
      
      const { result } = renderHook(() => useNotificationContext(), { wrapper });
      await waitFor(() => expect(result.current.notifications).toHaveLength(2));
      
      act(() => {
          wsCallback({ type: "unread_count", count: 42 });
      });
      
      expect(result.current.unreadCount).toBe(42);
  });

  it("limits notifications list to 20 when receiving via WebSocket", async () => {
    let wsCallback: (data: unknown) => void = vi.fn();
    vi.mocked(useWebSocket).mockImplementation((_url, onMessage) => {
        wsCallback = onMessage;
        return { status: "OPEN", sendMessage: vi.fn(), history: [] };
    });
    
    // Create 20 mock notifications
    const largeMock = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1, title: `N${i}`, message: `M${i}`, is_read: false, timestamp: new Date().toISOString(), notification_type: "SYSTEM" as const, recipient: 1, sender: null, sender_username: null
    }));
    vi.mocked(api.getNotifications).mockResolvedValue({
      results: largeMock,
      count: 20,
      next: null,
      previous: null,
    });

    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(20));
    
    // Add one more via WS
    act(() => {
        wsCallback({ 
            type: "new_notification", 
            notification: { id: 21, title: "N21", message: "M21", is_read: false },
            unread_count: 21
        });
    });
    
    expect(result.current.notifications).toHaveLength(20);
    expect(result.current.notifications[0].id).toBe(21);
    expect(result.current.notifications[19].id).toBe(19); // 20th item is the 19th from original list
  });

  it("throws error if useNotificationContext is used outside provider", () => {
    expect(() => {
      const { result } = renderHook(() => useNotificationContext());
      return result.current;
    }).toThrow("useNotificationContext must be used within a NotificationProvider");
  });
});
