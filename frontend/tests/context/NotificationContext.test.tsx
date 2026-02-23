import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import * as api from "../../src/api/notifications";

// We need to import the actual module to test it, despite the global mock in setupTests.ts
const { NotificationProvider, useNotificationContext } = await vi.importActual<typeof import("../../src/context/NotificationContext")>("../../src/context/NotificationContext");

vi.mock("../../src/api/notifications", () => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAsUnread: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  deleteAllNotifications: vi.fn(),
}));

describe("NotificationContext Provider", () => {
  const mockNotifications = [
    { id: 1, title: "N1", message: "M1", is_read: false, timestamp: new Date().toISOString(), notification_type: "SYSTEM" as const, recipient: 1, sender: null, sender_username: null },
    { id: 2, title: "N2", message: "M2", is_read: true, timestamp: new Date().toISOString(), notification_type: "SYSTEM" as const, recipient: 1, sender: null, sender_username: null },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getNotifications).mockResolvedValue({
      results: mockNotifications,
      count: 2,
      next: null,
      previous: null,
    });
    vi.mocked(api.getUnreadCount).mockResolvedValue({ count: 1 });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  it("successfully fetches notifications on mount", async () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });
    expect(result.current.unreadCount).toBe(1);
    expect(api.getNotifications).toHaveBeenCalled();
  });

  it("successfully marks a notification as read", async () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => {
      await result.current.markRead(1);
    });

    expect(api.markAsRead).toHaveBeenCalledWith(1);
    expect(result.current.notifications.find(n => n.id === 1)?.is_read).toBe(true);
    // unreadCount should decrease from 1 to 0
    expect(result.current.unreadCount).toBe(0);
  });

  it("successfully marks a notification as unread", async () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => {
      await result.current.markUnread(2);
    });

    expect(api.markAsUnread).toHaveBeenCalledWith(2);
    expect(result.current.notifications.find(n => n.id === 2)?.is_read).toBe(false);
    // unreadCount should increase from 1 to 2
    expect(result.current.unreadCount).toBe(2);
  });

  it("successfully marks all as read", async () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => {
      await result.current.markAllRead();
    });

    expect(api.markAllAsRead).toHaveBeenCalled();
    expect(result.current.notifications.every(n => n.is_read)).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it("successfully deletes a notification", async () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => {
      await result.current.deleteNotification(1);
    });

    expect(api.deleteNotification).toHaveBeenCalledWith(1);
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications.find(n => n.id === 1)).toBeUndefined();
  });

  it("successfully deletes all notifications", async () => {
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => {
      await result.current.deleteAllNotifications();
    });

    expect(api.deleteAllNotifications).toHaveBeenCalled();
    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it("handles fetch errors gracefully", async () => {
    vi.mocked(api.getNotifications).mockRejectedValueOnce(new Error("Fetch failed"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    const { result } = renderHook(() => useNotificationContext(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.error).toBe("Failed to fetch notifications");
    });
    
    consoleSpy.mockRestore();
  });

  it("throws error if useNotificationContext is used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      const { result } = renderHook(() => useNotificationContext());
      return result.current;
    }).toThrow("useNotificationContext must be used within a NotificationProvider");
    consoleSpy.mockRestore();
  });
});
