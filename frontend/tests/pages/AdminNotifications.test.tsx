import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NotificationProvider } from "@/context/NotificationContext";

import { AdminNotifications } from "@/pages/Admin/Notifications/AdminNotifications";
import {
  getAdminUsers,
  sendAdminNotification,
  getAudienceCounts,
  getBroadcastStatus,
} from "@/api/notifications";

vi.mock("@/api/notifications", () => ({
  getAdminUsers: vi.fn(),
  sendAdminNotification: vi.fn(),
  getAudienceCounts: vi.fn(),
  getBroadcastStatus: vi.fn(),
}));

describe("AdminNotifications Page", () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <NotificationProvider>
          <AdminNotifications />
        </NotificationProvider>
      </MemoryRouter>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminUsers).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          username: "user-1",
          email: "user1@example.com",
          is_staff: false,
          is_superuser: false,
          is_active: true,
          date_joined: "2026-02-01T00:00:00Z",
          last_login: null,
        },
      ],
    });
    vi.mocked(getAudienceCounts).mockImplementation((userIds) =>
      Promise.resolve({
        all: 10,
        staff: 2,
        admin: 1,
        selected_users: userIds?.length ?? 0,
      }),
    );
    vi.mocked(sendAdminNotification).mockResolvedValue({
      status: "QUEUED",
      broadcast_id: 12,
      task_id: "task-123",
      queued_at: "2026-02-22T15:00:00Z",
      recipient_count: 1,
    });
    vi.mocked(getBroadcastStatus).mockResolvedValue({
      id: 12,
      status: "COMPLETED",
      recipient_count: 1,
      delivered_count: 1,
      failed_count: 0,
      queued_at: "2026-02-22T15:00:00Z",
      started_at: "2026-02-22T15:00:01Z",
      completed_at: "2026-02-22T15:00:02Z",
      task_id: "task-123",
      updated_at: "2026-02-22T15:00:02Z",
    });
  });

  it("sends notification to selected users after confirmation", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/Target audience/i), {
      target: { value: "users" },
    });

    await waitFor(() =>
      expect(getAdminUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 50 }),
      ),
    );

    const userRow = (await screen.findByText("user-1")).closest("tr");
    expect(userRow).not.toBeNull();
    fireEvent.click(within(userRow!).getByRole("checkbox"));

    // Wait for the recipient count to update (from getAudienceCounts mock)
    await screen.findByText(/Estimated recipients: 1/i);

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "Maintenance" },
    });
    fireEvent.change(screen.getByLabelText(/Message/i), {
      target: { value: "System update tonight." },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /I confirm/i }));

    fireEvent.click(screen.getByRole("button", { name: /^Send notification$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Send now$/i }));

    await waitFor(() =>
      expect(sendAdminNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          target: "users",
          user_ids: [1],
          title: "Maintenance",
          message: "System update tonight.",
        }),
      ),
    );

    expect(await screen.findByText("COMPLETED")).toBeInTheDocument();
  });

  it("filters and searches users correctly", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/Target audience/i), {
      target: { value: "users" },
    });

    const searchInput = screen.getByPlaceholderText(/Search by username or email/i);
    fireEvent.change(searchInput, { target: { value: "user-1" } });

    await waitFor(() => {
      expect(getAdminUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: "user-1", role: "all" }),
      );
    });

    const filterSelect = screen.getByDisplayValue("All roles");
    fireEvent.change(filterSelect, { target: { value: "staff" } });

    await waitFor(() => {
      expect(getAdminUsers).toHaveBeenCalledWith(
        expect.objectContaining({ role: "staff" }),
      );
    });
  });

  it("toggles all users selection", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/Target audience/i), {
      target: { value: "users" },
    });

    await screen.findByText("user-1");

    const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(selectAllCheckbox);

    // It should select all (only 1 result in our mock)
    expect(selectAllCheckbox).toBeChecked();
    
    fireEvent.click(selectAllCheckbox);
    expect(selectAllCheckbox).not.toBeChecked();
  });
});
