import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useNotificationDetail } from "@/hooks/notifications/useNotificationDetail";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useNotificationContext } from "@/context/NotificationContext";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));

// Mock api
vi.mock("@/services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock context
vi.mock("@/context/NotificationContext", () => ({
  useNotificationContext: vi.fn(),
}));

describe("useNotificationDetail Hook", () => {
  const mockId = "123";
  const mockNavigate = vi.fn();
  const mockMarkRead = vi.fn();
  const mockMarkUnread = vi.fn();
  const mockDeleteNotification = vi.fn();
  const mockFetchNotifications = vi.fn();

  const mockNotification = {
    id: 123,
    title: "Test",
    content: "Content",
    is_read: true,
    created_at: "2023-01-01",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as any).mockReturnValue({ id: mockId });
    (useNavigate as any).mockReturnValue(mockNavigate);
    (useNotificationContext as any).mockReturnValue({
      markRead: mockMarkRead,
      markUnread: mockMarkUnread,
      deleteNotification: mockDeleteNotification,
      fetchNotifications: mockFetchNotifications,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches notification on mount and handles read status", async () => {
    const unreadNotification = { ...mockNotification, is_read: false };
    (api.get as any).mockResolvedValue({ data: unreadNotification });

    const { result } = renderHook(() => useNotificationDetail());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.state.notification?.is_read).toBe(true);
    });

    expect(api.get).toHaveBeenCalledWith(`/api/notifications/${mockId}/`);
    expect(mockMarkRead).toHaveBeenCalledWith(123);
  });

  it("sets error when fetch fails", async () => {
    (api.get as any).mockRejectedValue(new Error("Fetch failed"));

    const { result } = renderHook(() => useNotificationDetail());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe("Failed to fetch notification details");
    });
  });

  it("toggles read status from read to unread", async () => {
    (api.get as any).mockResolvedValue({ data: mockNotification });
    const { result } = renderHook(() => useNotificationDetail());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.actions.handleToggleRead();
    });

    expect(mockMarkUnread).toHaveBeenCalledWith(123);
    expect(result.current.state.notification?.is_read).toBe(false);
    expect(mockFetchNotifications).toHaveBeenCalled();
  });

  it("toggles read status from unread to read", async () => {
    (api.get as any).mockResolvedValue({ data: mockNotification });
    const { result } = renderHook(() => useNotificationDetail());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Manually set to unread for test
    await act(async () => {
        await result.current.actions.handleToggleRead(); // to unread
    });
    expect(result.current.state.notification?.is_read).toBe(false);

    await act(async () => {
      await result.current.actions.handleToggleRead(); // back to read
    });

    expect(mockMarkRead).toHaveBeenCalledTimes(1); 
    expect(result.current.state.notification?.is_read).toBe(true);
  });

  it("handles deletion", async () => {
    (api.get as any).mockResolvedValue({ data: mockNotification });
    const { result } = renderHook(() => useNotificationDetail());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.actions.handleDelete();
    });

    expect(mockDeleteNotification).toHaveBeenCalledWith(123);
    expect(mockFetchNotifications).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/notifications");
  });

  it("toggles delete modal open state", () => {
    (api.get as any).mockResolvedValue({ data: mockNotification });
    const { result } = renderHook(() => useNotificationDetail());

    act(() => {
      result.current.actions.setDeleteOpen(true);
    });
    expect(result.current.state.isDeleteOpen).toBe(true);

    act(() => {
      result.current.actions.setDeleteOpen(false);
    });
    expect(result.current.state.isDeleteOpen).toBe(false);
  });

  it("does nothing in actions if notification is null", async () => {
    // Force notification to stay null by rejecting fetch
    (api.get as any).mockRejectedValue(new Error("Failed"));
    const { result } = renderHook(() => useNotificationDetail());
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    await act(async () => {
        await result.current.actions.handleToggleRead();
        await result.current.actions.handleDelete();
    });

    expect(mockMarkRead).not.toHaveBeenCalled();
    expect(mockDeleteNotification).not.toHaveBeenCalled();
  });

  it("handles errors in handleToggleRead", async () => {
    (api.get as any).mockResolvedValue({ data: mockNotification });
    const { result } = renderHook(() => useNotificationDetail());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockMarkUnread.mockRejectedValue(new Error("Toggle failed"));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      await result.current.actions.handleToggleRead();
    });

    expect(consoleSpy).toHaveBeenCalledWith("Failed to toggle notification status", expect.any(Error));
    consoleSpy.mockRestore();
  });

  it("handles errors in handleDelete", async () => {
    (api.get as any).mockResolvedValue({ data: mockNotification });
    const { result } = renderHook(() => useNotificationDetail());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockDeleteNotification.mockRejectedValue(new Error("Delete failed"));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      await result.current.actions.handleDelete();
    });

    expect(consoleSpy).toHaveBeenCalledWith("Failed to delete notification", expect.any(Error));
    consoleSpy.mockRestore();
  });
});
