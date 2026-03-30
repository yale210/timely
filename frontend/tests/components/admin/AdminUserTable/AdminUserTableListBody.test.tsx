import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminUserTableListBody } from "@/components/admin/AdminUserTable/AdminUserTableList";
import { type AdminUserSummary } from "@/types";

describe("AdminUserTableListBody Component", () => {
  const mockUsers: AdminUserSummary[] = [
    { id: 1, username: "user1", email: "user1@test.com", is_staff: false, is_superuser: false, is_active: true, date_joined: "2023-01-01", last_login: null },
  ];

  const defaultProps = {
    users: mockUsers,
    selectedUserIds: [],
    isUsersLoading: false,
    usersError: null,
    isSubmitting: false,
    onToggleUserSelection: vi.fn(),
  };

  it("renders rows correctly", () => {
    render(
      <table>
        <AdminUserTableListBody {...defaultProps} />
      </table>
    );
    expect(screen.getByText("user1")).toBeDefined();
  });

  it("renders loading state", () => {
    render(
      <table>
        <AdminUserTableListBody {...defaultProps} isUsersLoading={true} />
      </table>
    );
    expect(screen.getByText("Loading users...")).toBeDefined();
  });

  it("renders error state", () => {
    render(
      <table>
        <AdminUserTableListBody {...defaultProps} usersError="Fail" />
      </table>
    );
    expect(screen.getByText("Fail")).toBeDefined();
  });

  it("renders empty state", () => {
    render(
      <table>
        <AdminUserTableListBody {...defaultProps} users={[]} />
      </table>
    );
    expect(screen.getByText("No users match your search.")).toBeDefined();
  });
});
