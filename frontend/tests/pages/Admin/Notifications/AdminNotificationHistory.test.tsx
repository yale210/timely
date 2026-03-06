import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { AdminNotificationHistory } from "@/pages/Admin/Notifications/AdminNotificationHistory";
import { useAdminHistory } from "@/hooks/admin/notifications/useAdminHistory";
import type { ReactNode } from "react";

// Mock useNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock useAdminHistory
vi.mock("@/hooks/admin/notifications/useAdminHistory", () => ({
  useAdminHistory: vi.fn(),
}));

// Mock AppLayout
vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

describe("AdminNotificationHistory Page", () => {
  const mockNavigate = vi.fn();
  const mockSetSearch = vi.fn();
  const mockSetStatusFilter = vi.fn();
  const mockSetTargetFilter = vi.fn();
  const mockSetPage = vi.fn();

  const mockState = {
    items: [
      {
        id: 1,
        title: "Broadcast 1",
        target: "all",
        sender: 1,
        sender_username: "admin",
        status: "COMPLETED" as const,
        queued_at: "2023-01-01",
        completed_at: "2023-01-01",
        recipient_count: 10,
        delivered_count: 10,
        failed_count: 0,
      },
    ],
    search: "",
    statusFilter: "",
    targetFilter: "",
    page: 1,
    count: 1,
    totalPages: 1,
  };

  const mockActions = {
    setSearch: mockSetSearch,
    setStatusFilter: mockSetStatusFilter,
    setTargetFilter: mockSetTargetFilter,
    setPage: mockSetPage,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useAdminHistory).mockReturnValue({
      state: mockState,
      loading: false,
      error: null,
      actions: mockActions,
    });
  });

  it("renders the page title and layout", () => {
    render(
      <MemoryRouter>
        <AdminNotificationHistory />
      </MemoryRouter>
    );
    expect(screen.getByTestId("app-layout")).toBeDefined();
    expect(screen.getByText("Notification history")).toBeDefined();
  });

  it("navigates to new notification page on button click", () => {
    render(
      <MemoryRouter>
        <AdminNotificationHistory />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("New notification"));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/notifications");
  });

  it("displays error message when error is present", () => {
    vi.mocked(useAdminHistory).mockReturnValue({
      state: mockState,
      loading: false,
      error: "Some error occurred",
      actions: mockActions,
    });
    render(
      <MemoryRouter>
        <AdminNotificationHistory />
      </MemoryRouter>
    );
    expect(screen.getByText("Some error occurred")).toBeDefined();
  });

  it("navigates to detail page when an item is selected", () => {
    render(
      <MemoryRouter>
        <AdminNotificationHistory />
      </MemoryRouter>
    );
    // Find the row or the item title and click it
    fireEvent.click(screen.getByText("Broadcast 1"));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/notifications/history/1");
  });

  it("calls setPage on pagination", () => {
    vi.mocked(useAdminHistory).mockReturnValue({
      state: { ...mockState, page: 2, totalPages: 3 },
      loading: false,
      error: null,
      actions: mockActions,
    });
    render(
      <MemoryRouter>
        <AdminNotificationHistory />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText("Previous"));
    expect(mockSetPage).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText("Next"));
    expect(mockSetPage).toHaveBeenCalledWith(3);
  });
});
