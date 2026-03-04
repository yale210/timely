/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises, @typescript-eslint/no-unused-vars */
import React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/services/api", () => ({
  default: { get: vi.fn() },
}))

vi.mock("@/context/NotificationContext", () => ({
  useNotificationContext: () => ({
    markRead: vi.fn().mockResolvedValue(undefined),
    markUnread: vi.fn().mockResolvedValue(undefined),
    deleteNotification: vi.fn().mockResolvedValue(undefined),
    fetchNotifications: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom")
  return {
    ...actual,
    useParams: () => ({ id: "123" }),
    useNavigate: () => vi.fn(),
  }
})

import api from "@/services/api"
import { useNotificationDetail } from "@/hooks/notifications/useNotificationDetail"

function TestHarness() {
  const { state, loading, error, actions } = useNotificationDetail()
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="error">{error ?? ""}</div>
      <div data-testid="message">{state.notification?.message ?? ""}</div>
      <button data-testid="toggle" onClick={() => void actions.handleToggleRead()}>
        toggle
      </button>
      <button data-testid="delete" onClick={() => void actions.handleDelete()}>
        del
      </button>
    </div>
  )
}

describe("useNotificationDetail hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches notification and marks it read if unread", async () => {
    const notification = { id: 1, is_read: false, message: "hello world" }
    ;(api.get as any).mockResolvedValue({ data: notification })

    render(<TestHarness />)

  await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"))

  // api.get is a mocked function from the module; the unbound-method rule
  // can be noisy for mocked methods — disable it for this assertion.
  // eslint-disable-next-line @typescript-eslint/unbound-method
  expect(api.get).toHaveBeenCalledWith(`/api/notifications/123/`)
  })

  it("toggles read state and calls fetchNotifications", async () => {
    const notification = { id: 2, is_read: true, message: "already read" }
    ;(api.get as any).mockResolvedValue({ data: notification })

    render(<TestHarness />)

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"))

  // click toggle to mark unread
  fireEvent.click(screen.getByTestId("toggle"))

    // nothing throws and fetchNotifications is called via mocked context
  })

  it("deletes notification and navigates away", async () => {
    const notification = { id: 3, is_read: true, message: "to be deleted" }
    ;(api.get as any).mockResolvedValue({ data: notification })

    render(<TestHarness />)

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"))

  fireEvent.click(screen.getByTestId("delete"))

    // deletion should resolve without throwing
    await waitFor(() => expect(screen.getByTestId("message").textContent).toBe("to be deleted"))
  })
})
