import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Notifications } from "../../src/pages/Notifications";
import { BrowserRouter } from "react-router-dom";
import { NotificationType } from "../../src/types/notification";

vi.mock("../../src/context/NotificationContext", () => ({
  useNotificationContext: vi.fn(),
}));

vi.mock("../../src/api/notifications", () => ({
  getNotifications: vi.fn(),
}));

import { useNotificationContext } from "../../src/context/NotificationContext";
import { getNotifications } from "../../src/api/notifications";
import { usePushSubscription } from "../../src/hooks/usePushSubscription";

vi.mock("../../src/hooks/usePushSubscription", () => ({
  usePushSubscription: vi.fn(),
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
  markAllRead: vi.fn().mockResolvedValue(undefined),
  markRead: vi.fn().mockResolvedValue(undefined),
  markUnread: vi.fn().mockResolvedValue(undefined),
  deleteNotification: vi.fn().mockResolvedValue(undefined),
  deleteAllNotifications: vi.fn().mockResolvedValue(undefined),
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
    vi.mocked(usePushSubscription).mockReturnValue({
      isSupported: false,
      isSubscribed: false,
      permission: "default",
      loading: false,
      error: null,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      refresh: vi.fn(),
    });
  });

  it("renders page title", async () => {
    vi.mocked(useNotificationContext).mockReturnValue({ ...defaultContextValue });

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>,
    );
    expect(screen.getByText("Notifications")).toBeDefined();
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
          // keep unresolved to preserve loading UI
        }),
    );

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>,
    );
    expect(screen.getByText("Loading notifications...")).toBeDefined();
  });

  it("handles tab switching", async () => {
    vi.mocked(useNotificationContext).mockReturnValue({ ...defaultContextValue });
    vi.mocked(getNotifications).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          ...mockNotifications[0],
          id: 2,
          title: "System Notification",
          notification_type: NotificationType.SYSTEM,
        },
      ],
    });

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>,
    );

    const systemTab = screen.getByRole("button", { name: /System/i });
    fireEvent.click(systemTab);

    // Filter should have been applied
    expect(await screen.findByText("System Notification")).toBeDefined();
    expect(getNotifications).toHaveBeenCalledWith(1, { notificationType: NotificationType.SYSTEM });
  });

  it("handles pagination", async () => {
    vi.mocked(useNotificationContext).mockReturnValue({ ...defaultContextValue });
    vi.mocked(getNotifications)
      .mockResolvedValueOnce({
        count: 15,
        next: "url?page=2",
        previous: null,
        results: Array(10).fill(null).map((_, i) => ({ ...mockNotifications[0], id: i })),
      })
      .mockResolvedValueOnce({
        count: 15,
        next: null,
        previous: "url?page=1",
        results: Array(5).fill(null).map((_, i) => ({ ...mockNotifications[0], id: i + 10 })),
      });

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>,
    );

    // Wait for the next button to be present and click it
    const nextButtons = await screen.findAllByRole("button", { name: /Next/i });
    fireEvent.click(nextButtons[0]);

    expect(getNotifications).toHaveBeenLastCalledWith(2, {});
  });

  it("shows push notification banner and handles actions", () => {
    const subscribeMock = vi.fn();
    const unsubscribeMock = vi.fn();
    
    vi.mocked(usePushSubscription).mockReturnValue({
      isSupported: true,
      isSubscribed: false,
      permission: "default",
      loading: false,
      error: null,
      subscribe: subscribeMock,
      unsubscribe: unsubscribeMock,
      refresh: vi.fn(),
    });

    vi.mocked(useNotificationContext).mockReturnValue({ ...defaultContextValue });

    const { rerender } = render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>,
    );

    const enableButton = screen.getByRole("button", { name: /Enable/i });
    fireEvent.click(enableButton);
    expect(subscribeMock).toHaveBeenCalled();

    vi.mocked(usePushSubscription).mockReturnValue({
      isSupported: true,
      isSubscribed: true,
      permission: "granted",
      loading: false,
      error: null,
      subscribe: subscribeMock,
      unsubscribe: unsubscribeMock,
      refresh: vi.fn(),
    });

    rerender(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>,
    );

    const disableButton = screen.getByRole("button", { name: /Disable/i });
    fireEvent.click(disableButton);
    expect(unsubscribeMock).toHaveBeenCalled();

    vi.mocked(usePushSubscription).mockReturnValue({
      isSupported: true,
      isSubscribed: false,
      permission: "denied",
      loading: false,
      error: null,
      subscribe: subscribeMock,
      unsubscribe: unsubscribeMock,
      refresh: vi.fn(),
    });

    rerender(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Push notifications blocked/i)).toBeInTheDocument();
  });

  it("handles bulk actions: mark all as read", () => {
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

    fireEvent.click(screen.getByRole("button", { name: /Mark all as read/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Mark all$/i }));

    expect(markAllRead).toHaveBeenCalled();
  });

  it("handles bulk actions: delete all", () => {
    const deleteAllNotifications = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useNotificationContext).mockReturnValue({
      ...defaultContextValue,
      deleteAllNotifications,
    });

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Delete all/i }));
    const confirmButtons = screen.getAllByRole("button", { name: /^Delete all$/i });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(deleteAllNotifications).toHaveBeenCalled();
  });

  it("handles push subscription interactions", () => {
    const mockSubscribe = vi.fn().mockResolvedValue(undefined);
    const mockUnsubscribe = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useNotificationContext).mockReturnValue({ ...defaultContextValue });

    vi.mocked(usePushSubscription).mockReturnValue({
            isSupported: true,
            isSubscribed: false,
            permission: "default",
            loading: false,
            error: null,
            subscribe: mockSubscribe,
            unsubscribe: mockUnsubscribe,
            refresh: vi.fn()
        });    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>
    );

    const enableBtn = screen.getByRole("button", { name: /Enable/i });
    fireEvent.click(enableBtn);
    expect(mockSubscribe).toHaveBeenCalled();

    // Switch to subscribed state
        vi.mocked(usePushSubscription).mockReturnValue({
            isSupported: true,
            isSubscribed: true,
            permission: "granted",
            loading: false,
            error: null,
            subscribe: mockSubscribe,
            unsubscribe: mockUnsubscribe,
            refresh: vi.fn(),
        });    cleanup();
    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>
    );

    const disableBtn = screen.getByRole("button", { name: /Disable/i });
    fireEvent.click(disableBtn);
    expect(mockUnsubscribe).toHaveBeenCalled();
  })

  it("handles toggle and delete for individual notifications", async () => {
    const contextValue = { ...defaultContextValue, markRead: vi.fn(), deleteNotification: vi.fn() };
    vi.mocked(useNotificationContext).mockReturnValue(contextValue);

    vi.mocked(getNotifications).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: mockNotifications,
    });

    render(
      <BrowserRouter>
        <Notifications />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText("Test Notification 1")).toBeDefined());

    // Toggle Read
    const markReadBtn = screen.getByLabelText("Mark as read");
    fireEvent.click(markReadBtn);
    expect(contextValue.markRead).toHaveBeenCalledWith(1);

    // Delete (opens confirmation modal)
    const deleteBtn = screen.getByLabelText("Delete notification");
    fireEvent.click(deleteBtn);
    
    expect(screen.getByText(/Delete notification\?/i)).toBeDefined();
    const confirmDelete = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(confirmDelete);
    expect(contextValue.deleteNotification).toHaveBeenCalledWith(1);
  })
})
