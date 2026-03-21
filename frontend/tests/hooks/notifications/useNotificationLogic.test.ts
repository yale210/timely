import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useNotificationLogic } from "@/hooks/notifications/useNotificationLogic";
import * as notificationsApi from "@/api/notifications";
import { authStore, AUTH_CHANGE_EVENT } from "@/services/authService";
import type { Notification, NotificationListResponse } from "@/types";

// Mock API
vi.mock("@/api/notifications", () => ({
  deleteAllNotifications: vi.fn(),
  deleteNotification: vi.fn(),
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAllAsRead: vi.fn(),
  markAsRead: vi.fn(),
  markAsUnread: vi.fn(),
}));

// Mock WebSocket hook
vi.mock("@/hooks/common/useWebSocket", () => ({
  useWebSocket: vi.fn(),
}));

// Mock authStore
vi.mock("@/services/authService", () => ({
  authStore: {
    getToken: vi.fn(),
  },
  AUTH_CHANGE_EVENT: "auth-change",
}));

describe("useNotificationLogic", () => {
  const mockNotifications = [
    { id: 1, title: "N1", is_read: false },
    { id: 2, title: "N2", is_read: true },
  ] as Notification[];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authStore).getToken.mockReturnValue("mock-token");
    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({ 
      results: mockNotifications,
      count: 2,
      next: null,
      previous: null
    } as NotificationListResponse);
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 1 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initialises with expected state and fetches data if authenticated", async () => {
    const { result } = renderHook(() => useNotificationLogic());

    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.notifications).toEqual(mockNotifications);
      expect(result.current.unreadCount).toBe(1);
      expect(result.current.loading).toBe(false);
    });

    expect(notificationsApi.getNotifications).toHaveBeenCalled();
    expect(notificationsApi.getUnreadCount).toHaveBeenCalled();
  });

  it("handles auth changes correctly", async () => {
    const { result } = renderHook(() => useNotificationLogic());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(authStore).getToken.mockReturnValue(null);
    act(() => {
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    });

    await waitFor(() => {
      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.loading).toBe(false);
    });
  });

  it("handles markRead and updates local state", async () => {
    const { result } = renderHook(() => useNotificationLogic());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.unreadCount).toBe(1);
    });

    await act(async () => {
      await result.current.markRead(1);
    });

    expect(notificationsApi.markAsRead).toHaveBeenCalledWith(1);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications[0].is_read).toBe(true);
  });

  it("keeps item action callbacks stable across notification updates", async () => {
    vi.mocked(notificationsApi.markAsRead).mockResolvedValue(undefined);

    const { result } = renderHook(() => useNotificationLogic());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.unreadCount).toBe(1);
    });

    const initialMarkRead = result.current.markRead;
    const initialMarkUnread = result.current.markUnread;
    const initialDeleteNotification = result.current.deleteNotification;

    await act(async () => {
      await result.current.markRead(1);
    });

    expect(result.current.markRead).toBe(initialMarkRead);
    expect(result.current.markUnread).toBe(initialMarkUnread);
    expect(result.current.deleteNotification).toBe(initialDeleteNotification);
  });
});
