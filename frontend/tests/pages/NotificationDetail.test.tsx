import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { NotificationDetail } from "@/pages/NotificationDetail"
import api from "@/services/api"
import { useNotificationContext } from "@/context/NotificationContext"
import type { NotificationContextValue } from "@/context/NotificationContext"

// Mock dependencies
vi.mock("@/services/api")
vi.mock("@/context/NotificationContext")

describe("NotificationDetail", () => {
  const mockNotification = {
    id: 1,
    title: "Test Notification",
    message: "Test Message",
    timestamp: "2023-01-01T00:00:00Z",
    is_read: false,
    notification_type: "INFO",
    sender_username: "admin"
  }

  const mockContext: Partial<NotificationContextValue> = {
    markRead: vi.fn(),
    markUnread: vi.fn(),
    deleteNotification: vi.fn(),
    fetchNotifications: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotificationContext).mockReturnValue(mockContext as NotificationContextValue)
  })

  it("successfully fetches and displays notification details", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: mockNotification })

    render(
      <MemoryRouter initialEntries={["/notifications/1"]}>
        <Routes>
          <Route path="/notifications/:id" element={<NotificationDetail />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Test Notification")).toBeInTheDocument()
      expect(screen.getByText("Test Message")).toBeInTheDocument()
    })

    // It should mark as read if initially unread
    expect(mockContext.markRead).toHaveBeenCalledWith(1)
  })

  it("displays error message if fetching fails", async () => {
    vi.spyOn(api, "get").mockRejectedValue(new Error("Failed"))

    render(
      <MemoryRouter initialEntries={["/notifications/1"]}>
        <Routes>
          <Route path="/notifications/:id" element={<NotificationDetail />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch notification details/i)).toBeInTheDocument()
    })
  })

  it("toggles read status successfully", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: { ...mockNotification, is_read: true } })

    render(
      <MemoryRouter initialEntries={["/notifications/1"]}>
        <Routes>
          <Route path="/notifications/:id" element={<NotificationDetail />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText("Test Notification")).toBeInTheDocument())

    const toggleButton = screen.getByLabelText(/Mark as unread/i)
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(mockContext.markUnread).toHaveBeenCalledWith(1)
    })
  })

  it("successfully deletes the notification after confirmation", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: mockNotification })

    render(
      <MemoryRouter initialEntries={["/notifications/1"]}>
        <Routes>
          <Route path="/notifications/:id" element={<NotificationDetail />} />
          <Route path="/notifications" element={<div>Notifications List</div>} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText("Test Notification")).toBeInTheDocument())

    const deleteButton = screen.getByLabelText(/Delete notification/i)
    fireEvent.click(deleteButton)

    // Wait for modal and confirm
    expect(screen.getByText(/Delete notification\?/i)).toBeInTheDocument()
    
    // Using a more specific selector if multiple buttons exist
    const confirmButton = screen.getByRole("button", { name: /^Delete$/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockContext.deleteNotification).toHaveBeenCalledWith(1)
      expect(screen.getByText(/Notifications List/i)).toBeInTheDocument()
    })
  })
})
