import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { NotificationDetail } from "@/pages/Notification/NotificationDetail";
import { useNotificationDetail } from "@/hooks/notifications/useNotificationDetail";

// Mock Hook
vi.mock("@/hooks/notifications/useNotificationDetail", () => ({
  useNotificationDetail: vi.fn(),
}));

// Mock child components
vi.mock("@/components/notifications/NotificationDetailHeader", () => ({
  NotificationDetailHeader: ({ onToggleRead, onDelete }: { onToggleRead: () => void, onDelete: () => void }) => (
    <div data-testid="detail-header">
      <button onClick={onToggleRead}>Toggle Read</button>
      <button onClick={onDelete}>Delete</button>
    </div>
  ),
}));

vi.mock("@/components/notifications/NotificationDetailBody", () => ({
  NotificationDetailBody: ({ message }: { message: string }) => <div data-testid="detail-body">{message}</div>,
}));

vi.mock("@/components/modals/ConfirmationModal", () => ({
  default: ({ isOpen, onConfirm, onClose }: { isOpen: boolean, onConfirm: () => void, onClose: () => void }) => isOpen ? (
    <div data-testid="confirm-modal">
      <button onClick={onConfirm}>Confirm Delete</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}));

describe("NotificationDetail Page", () => {
  const mockHandleToggleRead = vi.fn();
  const mockHandleDelete = vi.fn();
  const mockSetDeleteOpen = vi.fn();

  const mockNotification = {
    id: 1,
    title: "Test Notification",
    message: "Test Message content",
    is_read: false,
    timestamp: "2023-01-01T10:00:00Z",
    recipient: 1,
    sender: null,
    sender_username: null,
    notification_type: "SYSTEM" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotificationDetail).mockReturnValue({
      state: {
        notification: mockNotification,
        isDeleteOpen: false,
      },
      loading: false,
      error: null,
      actions: {
        handleToggleRead: mockHandleToggleRead,
        handleDelete: mockHandleDelete,
        setDeleteOpen: mockSetDeleteOpen,
      },
    });
  });

  it("renders loading state", () => {
    vi.mocked(useNotificationDetail).mockReturnValue({
      loading: true,
      error: null,
      state: { notification: null, isDeleteOpen: false },
      actions: { handleToggleRead: vi.fn(), handleDelete: vi.fn(), setDeleteOpen: vi.fn() }
    });
    render(
      <MemoryRouter>
        <NotificationDetail />
      </MemoryRouter>
    );
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("renders error state", () => {
    vi.mocked(useNotificationDetail).mockReturnValue({
      loading: false,
      error: "Error message",
      state: { notification: null, isDeleteOpen: false },
      actions: { handleToggleRead: vi.fn(), handleDelete: vi.fn(), setDeleteOpen: vi.fn() }
    });
    render(
      <MemoryRouter>
        <NotificationDetail />
      </MemoryRouter>
    );
    expect(screen.getByText("Error message")).toBeDefined();
  });

  it("renders notification detail correctly", () => {
    render(
      <MemoryRouter>
        <NotificationDetail />
      </MemoryRouter>
    );
    expect(screen.getByText("Back to notifications")).toBeDefined();
    expect(screen.getByTestId("detail-header")).toBeDefined();
    expect(screen.getByText("Test Message content")).toBeDefined();
  });

  it("triggers toggle read action", () => {
    render(
      <MemoryRouter>
        <NotificationDetail />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Toggle Read"));
    expect(mockHandleToggleRead).toHaveBeenCalled();
  });

  it("opens delete confirmation and triggers delete", () => {
    const { rerender } = render(
      <MemoryRouter>
        <NotificationDetail />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText("Delete"));
    expect(mockSetDeleteOpen).toHaveBeenCalledWith(true);

    // Mock open state
    vi.mocked(useNotificationDetail).mockReturnValue({
        state: {
          notification: mockNotification,
          isDeleteOpen: true,
        },
        loading: false,
        error: null,
        actions: {
          handleToggleRead: mockHandleToggleRead,
          handleDelete: mockHandleDelete,
          setDeleteOpen: mockSetDeleteOpen,
        },
    });
    rerender(
        <MemoryRouter>
          <NotificationDetail />
        </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Confirm Delete"));
    expect(mockHandleDelete).toHaveBeenCalled();
  });
});
