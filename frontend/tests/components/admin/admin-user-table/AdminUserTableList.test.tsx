import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminUserTableList } from "@/components/admin/admin-user-table/AdminUserTableList";
import { type AdminUserSummary } from "@/types";

describe("AdminUserTableList Component", () => {
  const mockUsers: AdminUserSummary[] = [
    { id: 1, username: "user1", email: "user1@test.com", is_staff: false, is_superuser: false, is_active: true, date_joined: "2023-01-01", last_login: null },
  ];

  const defaultProps = {
    users: mockUsers,
    selectedUserIds: [],
    isUsersLoading: false,
    usersError: null,
    isSubmitting: false,
    isAllVisibleSelected: false,
    onToggleSelectAll: vi.fn(),
    onToggleUserSelection: vi.fn(),
  };

  it("renders users when not loading and no error", () => {
    render(<AdminUserTableList {...defaultProps} />);
    expect(screen.getByText("user1")).toBeDefined();
  });

  it("shows loading state", () => {
    render(<AdminUserTableList {...defaultProps} isUsersLoading={true} />);
    expect(screen.getByText("Loading users...")).toBeDefined();
  });

  it("shows error state", () => {
    render(<AdminUserTableList {...defaultProps} usersError="Error message" />);
    expect(screen.getByText("Error message")).toBeDefined();
  });

  it("shows empty state", () => {
    render(<AdminUserTableList {...defaultProps} users={[]} />);
    expect(screen.getByText("No users match your search.")).toBeDefined();
  });

  it("handles select all toggle", () => {
    const onToggleSelectAll = vi.fn();
    render(<AdminUserTableList {...defaultProps} onToggleSelectAll={onToggleSelectAll} />);
    
    const checkbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(checkbox);
    expect(onToggleSelectAll).toHaveBeenCalled();
  });
});
