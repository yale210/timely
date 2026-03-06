import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AdminNotificationHistoryDetail } from "@/pages/Admin/Notifications/AdminNotificationHistoryDetail";
import { useAdminHistoryDetail } from "@/hooks/admin/notifications/useAdminHistoryDetail";

// Mock Hook
vi.mock("@/hooks/admin/notifications/useAdminHistoryDetail", () => ({
  useAdminHistoryDetail: vi.fn(),
}));

// Mock AppLayout
vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: any) => <div data-testid="app-layout">{children}</div>,
}));

// Mock ConfirmationModal
vi.mock("@/components/modals/ConfirmationModal", () => ({
  default: ({ isOpen, onConfirm, onClose }: any) => isOpen ? (
    <div data-testid="confirm-modal">
      <button onClick={onConfirm}>Confirm Retry</button>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}));

describe("AdminNotificationHistoryDetail Page", () => {
  const mockHandleRetry = vi.fn();
  const mockSetRetryConfirmOpen = vi.fn();

  const mockState = {
    detail: {
      id: 1,
      title: "Test Title",
      message: "Test Message",
      queued_at: "2023-01-01T10:00:00Z",
      recipients: [],
      recipient_count: 10,
      audience_snapshot: {
        target: "all",
        recipient_count: 10,
      }
    },
    status: {
      status: "COMPLETED",
      recipient_count: 10,
      delivered_count: 10,
      failed_count: 0,
    },
    isRetryConfirmOpen: false,
    failedRecipientsCount: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAdminHistoryDetail as any).mockReturnValue({
      state: mockState,
      loading: false,
      error: null,
      retryError: null,
      actions: {
        handleRetry: mockHandleRetry,
        setRetryConfirmOpen: mockSetRetryConfirmOpen,
      },
    });
  });

  it("renders loading state", () => {
    (useAdminHistoryDetail as any).mockReturnValue({
      loading: true,
    });
    render(
      <MemoryRouter>
        <AdminNotificationHistoryDetail />
      </MemoryRouter>
    );
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("renders error state", () => {
    (useAdminHistoryDetail as any).mockReturnValue({
      loading: false,
      error: "Detail load failed",
      state: {},
    });
    render(
      <MemoryRouter>
        <AdminNotificationHistoryDetail />
      </MemoryRouter>
    );
    expect(screen.getByText("Detail load failed")).toBeDefined();
  });

  it("renders detail state correctly", () => {
    render(
      <MemoryRouter>
        <AdminNotificationHistoryDetail />
      </MemoryRouter>
    );
    expect(screen.getByText("Test Title")).toBeDefined();
    expect(screen.getByText("Back to history")).toBeDefined();
    expect(screen.getByText("Retry failed recipients")).toBeDefined();
  });

  it("shows retry error when present", () => {
    (useAdminHistoryDetail as any).mockReturnValue({
      state: mockState,
      loading: false,
      error: null,
      retryError: "Retry failed miserably",
      actions: {
        handleRetry: mockHandleRetry,
        setRetryConfirmOpen: mockSetRetryConfirmOpen,
      },
    });
    render(
      <MemoryRouter>
        <AdminNotificationHistoryDetail />
      </MemoryRouter>
    );
    expect(screen.getByText("Retry failed miserably")).toBeDefined();
  });

  it("opens confirmation modal and triggers retry", () => {
    const { rerender } = render(
      <MemoryRouter>
        <AdminNotificationHistoryDetail />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText("Retry failed recipients"));
    expect(mockSetRetryConfirmOpen).toHaveBeenCalledWith(true);

    // Simulate modal open
    (useAdminHistoryDetail as any).mockReturnValue({
        state: { ...mockState, isRetryConfirmOpen: true },
        loading: false,
        actions: {
          handleRetry: mockHandleRetry,
          setRetryConfirmOpen: mockSetRetryConfirmOpen,
        },
    });
    rerender(
        <MemoryRouter>
          <AdminNotificationHistoryDetail />
        </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Confirm Retry"));
    expect(mockHandleRetry).toHaveBeenCalled();
  });

  it("disables retry button when no failed recipients", () => {
    (useAdminHistoryDetail as any).mockReturnValue({
        state: { ...mockState, failedRecipientsCount: 0 },
        loading: false,
        actions: {
          handleRetry: mockHandleRetry,
          setRetryConfirmOpen: mockSetRetryConfirmOpen,
        },
    });
    render(
      <MemoryRouter>
        <AdminNotificationHistoryDetail />
      </MemoryRouter>
    );
    expect(screen.getByText("Retry failed recipients")).toBeDisabled();
  });
});
