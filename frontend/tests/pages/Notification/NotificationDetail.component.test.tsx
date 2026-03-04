/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"

// We'll stub the hook to exercise branches in the component
vi.mock("@/hooks/notifications/useNotificationDetail", () => ({
  useNotificationDetail: vi.fn(),
}))

vi.mock("@/components/notifications/NotificationDetailHeader", () => ({
  NotificationDetailHeader: ({ notification }: { notification?: { id?: number } | null }) => (
    <div data-testid="hdr">{notification?.id ?? "no"}</div>
  ),
}))

vi.mock("@/components/notifications/NotificationDetailBody", () => ({
  NotificationDetailBody: ({ message }: { message?: string | null }) => <div data-testid="body">{message}</div>,
}))

// Mock Link to avoid requiring full router context for the Link implementation
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom")
  return {
    ...actual,
    Link: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  }
})

import { NotificationDetail } from "@/pages/Notification/NotificationDetail"
import { MemoryRouter } from "react-router-dom"
import { useNotificationDetail } from "@/hooks/notifications/useNotificationDetail"

describe("NotificationDetail component", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders loading state", () => {
    ;(useNotificationDetail as any).mockReturnValue({
      state: { notification: null, isDeleteOpen: false },
      loading: true,
      error: null,
      actions: { setDeleteOpen: vi.fn(), handleDelete: vi.fn(), handleToggleRead: vi.fn() },
    })

    render(
      <MemoryRouter>
        <NotificationDetail />
      </MemoryRouter>
    )
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
  })

  it("renders error state", () => {
    ;(useNotificationDetail as any).mockReturnValue({
      state: { notification: null, isDeleteOpen: false },
      loading: false,
      error: "Failed to fetch notification details",
      actions: { setDeleteOpen: vi.fn(), handleDelete: vi.fn(), handleToggleRead: vi.fn() },
    })

    render(<NotificationDetail />)
    expect(screen.getByText(/Failed to fetch notification details/)).toBeInTheDocument()
  })

  it("renders header and body when notification exists", () => {
    const notification = { id: 5, message: "hello", is_read: true }
    ;(useNotificationDetail as any).mockReturnValue({
      state: { notification, isDeleteOpen: false },
      loading: false,
      error: null,
      actions: { setDeleteOpen: vi.fn(), handleDelete: vi.fn(), handleToggleRead: vi.fn() },
    })

    render(<NotificationDetail />)
    expect(screen.getByTestId("hdr")).toBeInTheDocument()
    expect(screen.getByTestId("body")).toHaveTextContent("hello")
  })
})
