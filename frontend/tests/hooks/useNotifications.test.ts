import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useNotifications } from "@/hooks/useNotifications"
import * as api from "@/api/notifications"

// Mock the API module
vi.mock("@/api/notifications")

describe("useNotifications hook", () => {
  const mockNotificationsResponse = {
    results: [
      { id: 1, title: "Test 1", is_read: false, timestamp: "2023-01-01" },
      { id: 2, title: "Test 2", is_read: true, timestamp: "2023-01-02" }
    ],
    next: "some-url",
    count: 2
  }

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getNotifications as any).mockResolvedValue(mockNotificationsResponse);
    (api.getUnreadCount as any).mockResolvedValue({ count: 1 })
  })

  it("successfully fetches notifications and unread count on mount", async () => {
    const { result } = renderHook(() => useNotifications())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.notifications.length).toBe(2)
      expect(result.current.unreadCount).toBe(1)
      expect(result.current.loading).toBe(false)
    })
  })

  it("handles fetch errors gracefully", async () => {
    (api.getNotifications as any).mockRejectedValue(new Error("Failed"))
    const { result } = renderHook(() => useNotifications())

    await waitFor(() => {
      expect(result.current.error).toBe("Failed to fetch notifications")
      expect(result.current.loading).toBe(false)
    })
  })

  it("successfully marks a single notification as read", async () => {
    const { result } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.notifications.length).toBe(2))

    await act(async () => {
      await result.current.markRead(1)
    })

    expect(api.markAsRead).toHaveBeenCalledWith(1)
    expect(result.current.notifications[0].is_read).toBe(true)
    expect(result.current.unreadCount).toBe(0)
  })

  it("successfully marks all notifications as read", async () => {
    const { result } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.notifications.length).toBe(2))

    await act(async () => {
      await result.current.markAllRead()
    })

    expect(api.markAllAsRead).toHaveBeenCalled()
    expect(result.current.notifications.every(n => n.is_read)).toBe(true)
    expect(result.current.unreadCount).toBe(0)
  })

  it("successfully deletes a notification", async () => {
    const { result } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.notifications.length).toBe(2))

    await act(async () => {
      await result.current.deleteNotification(1)
    })

    expect(api.deleteNotification).toHaveBeenCalledWith(1)
    expect(result.current.notifications.length).toBe(1)
    expect(result.current.unreadCount).toBe(0)
  })

  it("successfully fetches more pages and appends notifications", async () => {
    const { result } = renderHook(() => useNotifications())
    await waitFor(() => expect(result.current.notifications.length).toBe(2))

    const secondPageResponse = {
      results: [{ id: 3, title: "Test 3", is_read: false, timestamp: "2023-01-03" }],
      next: null,
      count: 3
    }
    ;(api.getNotifications as any).mockResolvedValue(secondPageResponse)

    await act(async () => {
      await result.current.fetchNotifications(2)
    })

    expect(result.current.notifications.length).toBe(3)
    expect(result.current.hasMore).toBe(false)
  })
})
