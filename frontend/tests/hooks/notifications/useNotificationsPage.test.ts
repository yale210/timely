import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useNotificationsPage } from "@/hooks/notifications/useNotificationsPage";
import { useNotificationContext } from "@/context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { getNotifications } from "@/api/notifications";
import { NotificationType, type Notification, type NotificationListResponse } from "@/types/notification";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

// Mock context
vi.mock("@/context/NotificationContext", () => ({
  useNotificationContext: vi.fn(),
}));

// Mock API
vi.mock("@/api/notifications", () => ({
  getNotifications: vi.fn(),
}));

describe("useNotificationsPage Hook", () => {
  const mockNavigate = vi.fn();
  const mockMarkRead = vi.fn();
  const mockMarkUnread = vi.fn();
  const mockMarkAllRead = vi.fn();
  const mockDeleteNotification = vi.fn();
  const mockDeleteAllNotifications = vi.fn();
  const mockFetchNotifications = vi.fn();

  const mockContext = {
    notifications: [] as Notification[],
    loading: false,
    unreadCount: 0,
    error: null,
    markRead: mockMarkRead,
    markUnread: mockMarkUnread,
    markAllRead: mockMarkAllRead,
    deleteNotification: mockDeleteNotification,
    deleteAllNotifications: mockDeleteAllNotifications,
    fetchNotifications: mockFetchNotifications,
    fetchUnreadCount: vi.fn().mockResolvedValue(undefined),
  };

  const mockResponse = {
    results: [{ id: 1, title: "N1", is_read: false }] as Notification[],
    count: 25, // Enough for 3 pages
    next: null,
    previous: null
  } as NotificationListResponse;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useNotificationContext).mockReturnValue(mockContext);
    vi.mocked(getNotifications).mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches page data on mount", async () => {
    const { result } = renderHook(() => useNotificationsPage());

    expect(result.current.state.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
      expect(result.current.state.notifications).toEqual(mockResponse.results);
    });

    expect(getNotifications).toHaveBeenCalledWith(1, {});
  });

  it("handles tab changes and resets page", async () => {
    const { result } = renderHook(() => useNotificationsPage());
    await waitFor(() => expect(result.current.state.loading).toBe(false));

    act(() => {
      result.current.actions.setTab("unread");
    });

    expect(result.current.state.activeTab).toBe("unread");
    expect(result.current.state.page).toBe(1);
    expect(getNotifications).toHaveBeenLastCalledWith(1, { isRead: false });

    act(() => {
        result.current.actions.setTab("system");
    });
    expect(getNotifications).toHaveBeenLastCalledWith(1, { notificationType: NotificationType.SYSTEM });

    act(() => {
        result.current.actions.setTab("tasks");
    });
    expect(getNotifications).toHaveBeenLastCalledWith(1, { notificationType: NotificationType.TASK });

    act(() => {
        result.current.actions.setTab("calendar");
    });
    expect(getNotifications).toHaveBeenLastCalledWith(1, { notificationType: NotificationType.CALENDAR });
  });

  it("handles page changes", async () => {
    const { result } = renderHook(() => useNotificationsPage());
    await waitFor(() => expect(result.current.state.loading).toBe(false));

    act(() => {
      result.current.actions.setPage(2);
    });

    expect(result.current.state.page).toBe(2);
    expect(getNotifications).toHaveBeenLastCalledWith(2, {});
  });

  it("handles handleNotificationClick", async () => {
    const { result } = renderHook(() => useNotificationsPage());
    await waitFor(() => expect(result.current.state.loading).toBe(false));

    const notification = { id: 1, is_read: false } as Notification;
    await act(async () => {
      await result.current.actions.handleNotificationClick(notification);
    });

    expect(mockMarkRead).toHaveBeenCalledWith(1);
    expect(mockFetchNotifications).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/notifications/1");
  });

  it("handles handleToggleRead", async () => {
    const { result } = renderHook(() => useNotificationsPage());
    await waitFor(() => expect(result.current.state.loading).toBe(false));

    const unread = { id: 1, is_read: false } as Notification;
    await act(async () => {
      await result.current.actions.handleToggleRead(unread);
    });
    expect(mockMarkRead).toHaveBeenCalledWith(1);

    const read = { id: 2, is_read: true } as Notification;
    await act(async () => {
      await result.current.actions.handleToggleRead(read);
    });
    expect(mockMarkUnread).toHaveBeenCalledWith(2);
  });

  it("handles handleDeleteNotification and pagination adjustment", async () => {
    const { result } = renderHook(() => useNotificationsPage());
    await waitFor(() => expect(result.current.state.loading).toBe(false));

    // Case: last item on page > 1
    act(() => {
        result.current.actions.setPage(2);
    });
    await waitFor(() => expect(result.current.state.page).toBe(2));

    // To simulate "last item on page", we need notifications.length === 1
    // It's already 1 from mockResponse.results
    
    await act(async () => {
      await result.current.actions.handleDeleteNotification({ id: 1 } as Notification);
    });

    expect(mockDeleteNotification).toHaveBeenCalledWith(1);
    expect(result.current.state.page).toBe(1);
  });

  it("handles handleConfirmBulkAction for mark_all_read", async () => {
    const { result } = renderHook(() => useNotificationsPage());
    await waitFor(() => expect(result.current.state.loading).toBe(false));

    act(() => {
      result.current.actions.setConfirmAction("mark_all_read");
    });

    await act(async () => {
      await result.current.actions.handleConfirmBulkAction();
    });

    expect(mockMarkAllRead).toHaveBeenCalled();
    expect(getNotifications).toHaveBeenCalled();
  });

  it("handles handleConfirmBulkAction for delete_all", async () => {
    const { result } = renderHook(() => useNotificationsPage());
    await waitFor(() => expect(result.current.state.loading).toBe(false));

    act(() => {
      result.current.actions.setConfirmAction("delete_all");
    });

    await act(async () => {
      await result.current.actions.handleConfirmBulkAction();
    });

    expect(mockDeleteAllNotifications).toHaveBeenCalled();
    expect(result.current.state.page).toBe(1);
  });

  it("sets error if fetchPage fails", async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* empty */ });
    vi.mocked(getNotifications).mockRejectedValue(new Error("Fail"));
    const { result } = renderHook(() => useNotificationsPage());

    await waitFor(() => {
      expect(result.current.state.displayError).toBe("Failed to load notifications.");
    });
    consoleSpy.mockRestore();
  });

  it("updates pagination window correctly", async () => {
    vi.mocked(getNotifications).mockResolvedValue({ results: [], count: 100, next: null, previous: null }); // 10 pages
    const { result } = renderHook(() => useNotificationsPage());
    await waitFor(() => expect(result.current.state.totalPages).toBe(10));

    act(() => {
        result.current.actions.setPage(5);
    });

    expect(result.current.state.paginationWindow).toEqual([3, 4, 5, 6, 7]);
  });

  it("syncs with context notification changes", async () => {
    const { rerender } = renderHook(() => useNotificationsPage());
    await waitFor(() => expect(getNotifications).toHaveBeenCalledTimes(1));

    // Change context notifications
    vi.mocked(useNotificationContext).mockReturnValue({
        ...mockContext,
        notifications: [{ id: 99 }] as Notification[],
    });
    
    rerender();

    await waitFor(() => {
        expect(getNotifications).toHaveBeenCalledTimes(2);
    });
  });
});

