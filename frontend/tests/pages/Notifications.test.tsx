import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Notifications } from "@/pages/Notification/Notifications";
import { BrowserRouter } from "react-router-dom";
import { NotificationType } from "@/types/notification";

vi.mock("@/context/NotificationContext", () => ({
  useNotificationContext: vi.fn(),
}));

vi.mock("@/api/notifications", () => ({
  getNotifications: vi.fn(),
}));

import { useNotificationContext } from "@/context/NotificationContext";
import { getNotifications } from "@/api/notifications";

vi.mock("@/hooks/usePushSubscription", () => ({
  usePushSubscription: () => ({
    isSupported: false,
    isSubscribed: false,
    permission: "default" as const,
    loading: false,
    error: null,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockNotifications = [
  {
    id: 1,
    title: "Test Notification 1",
    message: "Message 1",
    is_read: false,
    timestamp: new Date().toISOString(),
    notification_type: NotificationType.SYSTEM,
    recipient: 1,
    sender: null,
    sender_username: null,
  },
];

const defaultContextValue = {
  notifications: [] as typeof mockNotifications,
  unreadCount: 0,
  loading: false,
  error: null,
  fetchNotifications: vi.fn(),
  fetchUnreadCount: vi.fn(),
  markAllRead: vi.fn(),
  markRead: vi.fn(),
  markUnread: vi.fn(),
  deleteNotification: vi.fn(),
  deleteAllNotifications: vi.fn(),
};

describe("Notifications Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getNotifications).mockResolvedValue({
      count: mockNotifications.length,
      next: null,
      previous: null,
      results: mockNotifications,
    });
  });

  it("renders page title", async () => {
    vi.mocked(useNotificationContext).mockReturnValue({ ...defaultContextValue });

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>,
    );
    expect(screen.getByRole("heading", { name: "Notifications" })).toBeDefined();
    expect(await screen.findByText("Test Notification 1")).toBeDefined();
  });

  it("displays loading state", () => {
    vi.mocked(useNotificationContext).mockReturnValue({
      ...defaultContextValue,
      loading: true,
    });
    vi.mocked(getNotifications).mockImplementation(
      () =>
        new Promise(() => {
          return;
        }),
    );

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>,
    );
    expect(screen.getByText("Loading notifications...")).toBeDefined();
  });

  it("displays notifications list", async () => {
    vi.mocked(useNotificationContext).mockReturnValue({
      ...defaultContextValue,
    });

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>,
    );
    expect(await screen.findByText("Test Notification 1")).toBeDefined();
  });

  it("calls markAllRead when action is confirmed", async () => {
    const markAllRead = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useNotificationContext).mockReturnValue({
      ...defaultContextValue,
      markAllRead,
    });

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>,
    );

    fireEvent.click(await screen.findByLabelText("Mark all as read"));
    fireEvent.click(await screen.findByText("Mark all"));
    expect(markAllRead).toHaveBeenCalledTimes(1);
  });
});
