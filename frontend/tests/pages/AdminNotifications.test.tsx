import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import AdminNotifications from "../../src/pages/AdminNotifications";
import { getAdminUsers, sendAdminNotification } from "../../src/api/notifications";

vi.mock("../../src/api/notifications", () => ({
  getAdminUsers: vi.fn(),
  sendAdminNotification: vi.fn(),
}));

describe("AdminNotifications Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads paginated users and preserves selected IDs across pages", async () => {
    vi.mocked(getAdminUsers).mockImplementation((params) => {
      if (params.page === 2) {
        return Promise.resolve({
          count: 4,
          next: null,
          previous: "/api/admin/users/?page=1",
          results: [
            {
              id: 3,
              username: "user-3",
              email: "user3@example.com",
              is_staff: false,
              is_superuser: false,
              is_active: true,
              date_joined: "2026-02-01T00:00:00Z",
              last_login: null,
            },
            {
              id: 4,
              username: "user-4",
              email: "user4@example.com",
              is_staff: false,
              is_superuser: false,
              is_active: true,
              date_joined: "2026-02-01T00:00:00Z",
              last_login: null,
            },
          ],
        });
      }
      return Promise.resolve({
        count: 4,
        next: "/api/admin/users/?page=2",
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
          {
            id: 2,
            username: "user-2",
            email: "user2@example.com",
            is_staff: false,
            is_superuser: false,
            is_active: true,
            date_joined: "2026-02-01T00:00:00Z",
            last_login: null,
          },
        ],
      });
    });
    vi.mocked(sendAdminNotification).mockResolvedValue({
      task_id: "task-123",
      status: "Notification broadcast initiated",
    });

    render(<AdminNotifications />);

    fireEvent.change(screen.getByLabelText(/Target audience/i), {
      target: { value: "users" },
    });

    await waitFor(() =>
      expect(getAdminUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 50 }),
      ),
    );
    const pageOneRow = (await screen.findByText("user-1")).closest("tr");
    expect(pageOneRow).not.toBeNull();
    fireEvent.click(within(pageOneRow!).getByRole("checkbox"));

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    await waitFor(() =>
      expect(getAdminUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, pageSize: 50 }),
      ),
    );
    const pageTwoRow = (await screen.findByText("user-3")).closest("tr");
    expect(pageTwoRow).not.toBeNull();
    expect(screen.getByText("1 selected")).toBeDefined();
    fireEvent.click(within(pageTwoRow!).getByRole("checkbox"));
    expect(screen.getByText("2 selected")).toBeDefined();

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "Maintenance" },
    });
    fireEvent.change(screen.getByLabelText(/Message/i), {
      target: { value: "System update tonight." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send notification/i }));

    await waitFor(() => expect(sendAdminNotification).toHaveBeenCalledTimes(1));
    const sentPayload = vi.mocked(sendAdminNotification).mock.calls[0]?.[0];
    expect(sentPayload).toBeDefined();
    expect(sentPayload?.target).toBe("users");
    expect(sentPayload?.user_ids).toEqual(expect.arrayContaining([1, 3]));
  });
});
