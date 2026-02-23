import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import AdminNotifications from "../../src/pages/AdminNotifications";
import {
  getAdminUsers,
  sendAdminNotification,
  getAudienceCounts,
  getBroadcastStatus,
} from "../../src/api/notifications";

vi.mock("../../src/api/notifications", () => ({
  getAdminUsers: vi.fn(),
  sendAdminNotification: vi.fn(),
  getAudienceCounts: vi.fn(),
  getBroadcastStatus: vi.fn(),
}));

describe("AdminNotifications Page", () => {
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
    render(<AdminNotifications />);

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

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "Maintenance" },
    });
    fireEvent.change(screen.getByLabelText(/Message/i), {
      target: { value: "System update tonight." },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /I confirm/i }));

    const sendButton = screen.getByRole("button", { name: /Send notification/i });
    await waitFor(() => expect(sendButton).toBeEnabled());
    fireEvent.click(sendButton);

    expect(await screen.findByText("Send this broadcast?")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Send now/i }));

    await waitFor(() => expect(sendAdminNotification).toHaveBeenCalledTimes(1));
    const sentPayload = vi.mocked(sendAdminNotification).mock.calls[0]?.[0];
    expect(sentPayload?.target).toBe("users");
    expect(sentPayload?.user_ids).toEqual([1]);
    await waitFor(() => expect(getBroadcastStatus).toHaveBeenCalledWith(12));
  });
});
