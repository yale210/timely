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

const mockedUseParams = vi.mocked(useParams);
const mockedUseNavigate = vi.mocked(useNavigate);
const mockedUseNotificationContext = vi.mocked(useNotificationContext);

describe("useNotificationDetail Hook", () => {

  const mockId = "123";
  const mockNavigate = vi.fn();
  const mockMarkRead = vi.fn().mockResolvedValue(undefined);
  const mockMarkUnread = vi.fn().mockResolvedValue(undefined);
  const mockDeleteNotification = vi.fn().mockResolvedValue(undefined);
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
    mockedUseParams.mockReturnValue({ id: mockId });
    mockedUseNavigate.mockReturnValue(mockNavigate);
    mockedUseNotificationContext.mockReturnValue({
      markRead: mockMarkRead,
      markUnread: mockMarkUnread,
      deleteNotification: mockDeleteNotification,
      fetchNotifications: mockFetchNotifications,
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches notification on mount and handles read status", async () => {
    const unreadNotification = { ...mockNotification, is_read: false };
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: unreadNotification });

    const { result } = renderHook(() => useNotificationDetail());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.state.notification?.is_read).toBe(true);
    });

    expect(getSpy).toHaveBeenCalledWith(`/api/notifications/${mockId}/`);
    expect(mockMarkRead).toHaveBeenCalledWith(123);
  });

  it("sets error when fetch fails", async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new Error("Fetch failed"));

    const { result } = renderHook(() => useNotificationDetail());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe("Failed to fetch notification details");
    });
  });

  it("toggles read status from read to unread", async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: mockNotification });
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
    vi.spyOn(api, 'get').mockResolvedValue({ data: mockNotification });
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
    vi.spyOn(api, 'get').mockResolvedValue({ data: mockNotification });
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
    vi.spyOn(api, 'get').mockResolvedValue({ data: mockNotification });
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
    vi.spyOn(api, 'get').mockRejectedValue(new Error("Failed"));
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
    vi.spyOn(api, 'get').mockResolvedValue({ data: mockNotification });
    const { result } = renderHook(() => useNotificationDetail());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(mockMarkUnread).mockRejectedValue(new Error("Toggle failed"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { /* No-op */ });

    await act(async () => {
      await result.current.actions.handleToggleRead();
    });

    expect(consoleSpy).toHaveBeenCalledWith("Failed to toggle notification status", expect.any(Error));
    consoleSpy.mockRestore();
  });

  it("handles errors in handleDelete", async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: mockNotification });
    const { result } = renderHook(() => useNotificationDetail());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(mockDeleteNotification).mockRejectedValue(new Error("Delete failed"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { /* No-op */ });

    await act(async () => {
      await result.current.actions.handleDelete();
    });

    expect(consoleSpy).toHaveBeenCalledWith("Failed to delete notification", expect.any(Error));
    consoleSpy.mockRestore();
  });
});
