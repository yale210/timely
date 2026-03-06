import { render, screen, waitFor, act, renderHook, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { NotificationProvider, useNotificationContext } from "@/context/NotificationContext";
import * as notificationsApi from "@/api/notifications";
import { useWebSocket } from "@/hooks/common/useWebSocket";
import { authStore, AUTH_CHANGE_EVENT } from "@/services/authService";
import type { Notification, NotificationListResponse } from "@/types/notification";

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

describe("NotificationContext", () => {
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

  /**
   * Test component that uses NotificationContext
   */
  const TestComponent = () => {
    const { notifications, unreadCount, markRead, deleteNotification } = useNotificationContext();
    return (
      <div>
        <div data-testid="unread-count">{unreadCount}</div>
        <ul>
          {notifications.map(n => (
            <li key={n.id}>
              {n.title}
              <button onClick={() => { void markRead(n.id); }}>Read {n.id}</button>
              <button onClick={() => { void deleteNotification(n.id); }}>Delete {n.id}</button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  it("throws error when used outside provider", () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* empty */ });
    expect(() => render(<TestComponent />)).toThrow("useNotificationContext must be used within a NotificationProvider");
    consoleSpy.mockRestore();
  });

  it("fetches notifications and unread count on mount if authenticated", async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("N1")).toBeDefined();
      expect(screen.getByTestId("unread-count").textContent).toBe("1");
    });

    expect(notificationsApi.getNotifications).toHaveBeenCalled();
    expect(notificationsApi.getUnreadCount).toHaveBeenCalled();
  });

  it("clears state on auth change to unauthenticated", async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => expect(screen.getByText("N1")).toBeDefined());

    vi.mocked(authStore).getToken.mockReturnValue(null);
    act(() => {
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    });

    await waitFor(() => {
      expect(screen.queryByText("N1")).toBeNull();
      expect(screen.getByTestId("unread-count").textContent).toBe("0");
    });
  });

  it("handles markRead and updates local state", async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => expect(screen.getByText("N1")).toBeDefined());

    act(() => {
      fireEvent.click(screen.getByText("Read 1"));
    });

    await waitFor(() => {
      expect(notificationsApi.markAsRead).toHaveBeenCalledWith(1);
      expect(screen.getByTestId("unread-count").textContent).toBe("0");
    });
  });

  it("handles deleteNotification and updates local state", async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => expect(screen.getByText("N1")).toBeDefined());

    act(() => {
      fireEvent.click(screen.getByText("Delete 1"));
    });

    await waitFor(() => {
      expect(notificationsApi.deleteNotification).toHaveBeenCalledWith(1);
      expect(screen.queryByText("N1")).toBeNull();
      expect(screen.getByTestId("unread-count").textContent).toBe("0");
    });
  });

  it("handles markAllRead", async () => {
    const { result } = renderHook(() => useNotificationContext(), {
        wrapper: NotificationProvider
    });
    await waitFor(() => expect(result.current.notifications.length).toBe(2));

    await act(async () => {
        await result.current.markAllRead();
    });

    expect(notificationsApi.markAllAsRead).toHaveBeenCalled();
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every(n => n.is_read)).toBe(true);
  });

  it("handles deleteAllNotifications", async () => {
    const { result } = renderHook(() => useNotificationContext(), {
        wrapper: NotificationProvider
    });
    await waitFor(() => expect(result.current.notifications.length).toBe(2));

    await act(async () => {
        await result.current.deleteAllNotifications();
    });

    expect(notificationsApi.deleteAllNotifications).toHaveBeenCalled();
    expect(result.current.notifications.length).toBe(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it("handles WebSocket 'new_notification' message", async () => {
    let wsCallback: (data: unknown) => void = () => { /* empty */ };
    vi.mocked(useWebSocket).mockImplementation((_url: string | null, callback: (data: unknown) => void) => {
        wsCallback = callback;
    });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => expect(screen.getByText("N1")).toBeDefined());

    const newNotif = { id: 3, title: "N3", is_read: false } as Notification;
    act(() => {
        wsCallback({
            type: "new_notification",
            notification: newNotif,
            unread_count: 2
        });
    });

    await waitFor(() => {
        expect(screen.getByText("N3")).toBeDefined();
        expect(screen.getByTestId("unread-count").textContent).toBe("2");
    });
  });

  it("handles WebSocket 'unread_count' message", async () => {
    let wsCallback: (data: unknown) => void = () => { /* empty */ };
    vi.mocked(useWebSocket).mockImplementation((_url: string | null, callback: (data: unknown) => void) => {
        wsCallback = callback;
    });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => expect(screen.getByTestId("unread-count").textContent).toBe("1"));

    act(() => {
        wsCallback({
            type: "unread_count",
            count: 10
        });
    });

    await waitFor(() => {
        expect(screen.getByTestId("unread-count").textContent).toBe("10");
    });
  });

  it("handles fetch errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* empty */ });
    vi.mocked(notificationsApi.getNotifications).mockRejectedValue(new Error("Fetch failed"));
    
    render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
    );

    await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });

  it("returns empty state if not authenticated when fetching", async () => {
    vi.mocked(authStore).getToken.mockReturnValue(null);
    const { result } = renderHook(() => useNotificationContext(), {
        wrapper: NotificationProvider
    });
    
    await act(async () => {
        await result.current.fetchNotifications();
        await result.current.fetchUnreadCount();
    });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it("handles errors in fetchUnreadCount, markAllRead, deleteAllNotifications", async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* empty */ });
    vi.mocked(notificationsApi.getUnreadCount).mockRejectedValue(new Error("Err"));
    vi.mocked(notificationsApi.markAllAsRead).mockRejectedValue(new Error("Err"));
    vi.mocked(notificationsApi.deleteAllNotifications).mockRejectedValue(new Error("Err"));

    const { result } = renderHook(() => useNotificationContext(), {
        wrapper: NotificationProvider
    });

    await act(async () => {
        await result.current.fetchUnreadCount();
        await result.current.markAllRead();
        await result.current.deleteAllNotifications();
    });

    expect(consoleSpy).toHaveBeenCalledTimes(4); // unreadCount, markAllRead, deleteAllNotifications AND fetchNotifications on mount
    consoleSpy.mockRestore();
  });

  it("handles markUnread and updates unreadCount", async () => {
    const { result } = renderHook(() => useNotificationContext(), {
        wrapper: NotificationProvider
    });
    await waitFor(() => expect(result.current.notifications.length).toBe(2));

    await act(async () => {
        await result.current.markUnread(2); // Notification 2 is initially read
    });

    expect(notificationsApi.markAsUnread).toHaveBeenCalledWith(2);
    expect(result.current.unreadCount).toBe(2); // Was 1, now 2
  });

  it("handles markRead for a non-existing notification by refreshing count", async () => {
    const { result } = renderHook(() => useNotificationContext(), {
        wrapper: NotificationProvider
    });
    await waitFor(() => expect(result.current.notifications.length).toBe(2));

    await act(async () => {
        await result.current.markRead(999);
    });

    expect(notificationsApi.getUnreadCount).toHaveBeenCalledTimes(2); // 1 on mount, 1 on refresh
  });

  it("ignores duplicate notifications from WebSocket", async () => {
    let wsCallback: (data: unknown) => void = () => { /* empty */ };
    vi.mocked(useWebSocket).mockImplementation((_url: string | null, callback: (data: unknown) => void) => {
        wsCallback = callback;
    });

    const { result } = renderHook(() => useNotificationContext(), {
        wrapper: NotificationProvider
    });
    await waitFor(() => expect(result.current.notifications.length).toBe(2));

    act(() => {
        wsCallback({
            type: "new_notification",
            notification: mockNotifications[0], // Duplicate
            unread_count: 1
        });
    });

    expect(result.current.notifications.length).toBe(2);
  });
});

