import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Notifications } from "@/pages/Notification/Notifications";
import type { useNotificationsPage as useNotificationsPageOriginal } from "@/hooks/notifications/useNotificationsPage";
import { useNotificationsPage } from "@/hooks/notifications/useNotificationsPage";
import type { ReactNode } from "react";

// Mock Hook
vi.mock("@/hooks/notifications/useNotificationsPage", () => ({
  useNotificationsPage: vi.fn(),
}));

// Mock AppLayout
vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

// Mock child components
vi.mock("@/components/notifications/NotificationsHeader", () => ({
  NotificationsHeader: ({ onMarkAllRead, onDeleteAll, onTabChange }: { onMarkAllRead: () => void, onDeleteAll: () => void, onTabChange: (tab: string) => void }) => (
    <div data-testid="notifications-header">
      <button onClick={() => onTabChange("all")}>Tab All</button>
      <button onClick={onMarkAllRead}>Mark All Read</button>
      <button onClick={onDeleteAll}>Delete All</button>
    </div>
  ),
}));

vi.mock("@/components/notifications/NotificationsList", () => ({
  NotificationsList: ({ onNotificationClick, onToggleRead, onDeleteRequest, onPageChange }: { onNotificationClick: (n: { id: number }) => void, onToggleRead: (n: { id: number }) => void, onDeleteRequest: (n: { id: number }) => void, onPageChange: (p: number) => void }) => (
    <div data-testid="notifications-list">
      <button onClick={() => onNotificationClick({ id: 1 })}>Click Notification</button>
      <button onClick={() => onToggleRead({ id: 1 })}>Toggle Read</button>
      <button onClick={() => onDeleteRequest({ id: 1 })}>Delete Request</button>
      <button onClick={() => onPageChange(2)}>Next Page</button>
    </div>
  ),
}));

vi.mock("@/components/notifications/PushNotificationBanner", () => ({
  PushNotificationBanner: () => <div data-testid="push-banner">Banner</div>,
}));

vi.mock("@/components/modals/ConfirmationModal", () => ({
  default: ({ isOpen, onConfirm, onClose, title }: { isOpen: boolean, onConfirm: () => void, onClose: () => void, title: string }) => isOpen ? (
    <div data-testid="confirm-modal">
      <span>{title}</span>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}));

type UseNotificationsPageReturn = ReturnType<typeof useNotificationsPageOriginal>;

describe("Notifications Page", () => {
  const mockSetTab = vi.fn();
  const mockSetConfirmAction = vi.fn();
  const mockHandleNotificationClick = vi.fn();
  const mockHandleToggleRead = vi.fn();
  const mockSetNotificationPendingDelete = vi.fn();
  const mockSetPage = vi.fn();
  const mockHandleConfirmBulkAction = vi.fn();
  const mockHandleDeleteNotification = vi.fn();

  const mockState = {
    activeTab: "all" as const,
    confirmAction: null,
    displayError: null,
    notifications: [],
    page: 1,
    totalPages: 1,
    paginationWindow: [1],
    loading: false,
    contextLoading: false,
    notificationPendingDelete: null,
    count: 0,
  };

  const mockActions = {
    setTab: mockSetTab,
    setConfirmAction: mockSetConfirmAction,
    handleNotificationClick: mockHandleNotificationClick,
    handleToggleRead: mockHandleToggleRead,
    setNotificationPendingDelete: mockSetNotificationPendingDelete,
    setPage: mockSetPage,
    handleConfirmBulkAction: mockHandleConfirmBulkAction,
    handleDeleteNotification: mockHandleDeleteNotification,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotificationsPage).mockReturnValue({
      state: mockState as UseNotificationsPageReturn["state"],
      actions: mockActions as UseNotificationsPageReturn["actions"],
    });
  });

  it("renders the main components", () => {
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    );
    expect(screen.getByTestId("app-layout")).toBeDefined();
    expect(screen.getByTestId("push-banner")).toBeDefined();
    expect(screen.getByTestId("notifications-header")).toBeDefined();
    expect(screen.getByTestId("notifications-list")).toBeDefined();
  });

  it("shows display error when present", () => {
    vi.mocked(useNotificationsPage).mockReturnValue({
      state: { ...mockState, displayError: "Something went wrong" } as UseNotificationsPageReturn["state"],
      actions: mockActions as UseNotificationsPageReturn["actions"],
    });
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    );
    expect(screen.getByText("Something went wrong")).toBeDefined();
  });

  it("triggers actions from header and list", () => {
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText("Tab All"));
    expect(mockSetTab).toHaveBeenCalledWith("all");

    fireEvent.click(screen.getByText("Mark All Read"));
    expect(mockSetConfirmAction).toHaveBeenCalledWith("mark_all_read");

    fireEvent.click(screen.getByText("Delete All"));
    expect(mockSetConfirmAction).toHaveBeenCalledWith("delete_all");

    fireEvent.click(screen.getByText("Click Notification"));
    expect(mockHandleNotificationClick).toHaveBeenCalledWith({ id: 1 });

    fireEvent.click(screen.getByText("Toggle Read"));
    expect(mockHandleToggleRead).toHaveBeenCalledWith({ id: 1 });

    fireEvent.click(screen.getByText("Delete Request"));
    expect(mockSetNotificationPendingDelete).toHaveBeenCalledWith({ id: 1 });

    fireEvent.click(screen.getByText("Next Page"));
    expect(mockSetPage).toHaveBeenCalledWith(2);
  });

  it("handles bulk action confirmation", () => {
    vi.mocked(useNotificationsPage).mockReturnValue({
        state: { ...mockState, confirmAction: "mark_all_read" } as UseNotificationsPageReturn["state"],
        actions: {
          ...mockActions,
          setConfirmAction: mockSetConfirmAction,
          handleConfirmBulkAction: mockHandleConfirmBulkAction,
        } as UseNotificationsPageReturn["actions"],
    });
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    );
    
    expect(screen.getByText("Mark all as read?")).toBeDefined();
    fireEvent.click(screen.getByText("Confirm"));
    expect(mockHandleConfirmBulkAction).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Close"));
    expect(mockSetConfirmAction).toHaveBeenCalledWith(null);
  });

  it("handles delete all confirmation", () => {
    vi.mocked(useNotificationsPage).mockReturnValue({
        state: { ...mockState, confirmAction: "delete_all" } as UseNotificationsPageReturn["state"],
        actions: {
          ...mockActions,
          setConfirmAction: mockSetConfirmAction,
          handleConfirmBulkAction: mockHandleConfirmBulkAction,
        } as UseNotificationsPageReturn["actions"],
    });
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    );
    
    expect(screen.getByText("Delete all notifications?")).toBeDefined();
    fireEvent.click(screen.getByText("Confirm"));
    expect(mockHandleConfirmBulkAction).toHaveBeenCalled();
  });

  it("handles single notification delete confirmation", () => {
    const pendingDelete = {
      id: 1,
      title: "Title",
      message: "Msg",
      is_read: false,
      timestamp: "2023-01-01",
      recipient: 1,
      sender: null,
      sender_username: null,
      notification_type: "SYSTEM" as const,
    };
    vi.mocked(useNotificationsPage).mockReturnValue({
        state: { ...mockState, notificationPendingDelete: pendingDelete } as UseNotificationsPageReturn["state"],
        actions: {
          ...mockActions,
          setNotificationPendingDelete: mockSetNotificationPendingDelete,
          handleDeleteNotification: mockHandleDeleteNotification,
        } as UseNotificationsPageReturn["actions"],
    });
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    );
    
    expect(screen.getByText("Delete notification?")).toBeDefined();
    fireEvent.click(screen.getByText("Confirm"));
    expect(mockHandleDeleteNotification).toHaveBeenCalledWith(pendingDelete);

    fireEvent.click(screen.getByText("Close"));
    expect(mockSetNotificationPendingDelete).toHaveBeenCalledWith(null);
  });
});
