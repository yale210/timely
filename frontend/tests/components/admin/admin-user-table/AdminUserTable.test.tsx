import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminUserTable } from "@/components/admin/admin-user-table/AdminUserTable";
import type { AdminUserSummary } from "@/types";

describe("AdminUserTable Component", () => {
  const mockUsers: AdminUserSummary[] = [
    { id: 1, username: "user1", email: "user1@test.com", is_staff: false, is_superuser: false, is_active: true, date_joined: "2023-01-01", last_login: null },
    { id: 2, username: "staff1", email: "staff1@test.com", is_staff: true, is_superuser: false, is_active: true, date_joined: "2023-01-01", last_login: null },
    { id: 3, username: "admin1", email: "admin1@test.com", is_staff: true, is_superuser: true, is_active: false, date_joined: "2023-01-01", last_login: null },
  ];

  const defaultProps = {
    target: "users" as const,
    users: mockUsers,
    selectedUserIds: [],
    usersPage: 1,
    usersCount: 3,
    usersPageSize: 10,
    search: "",
    roleFilter: "all" as const,
    userIdsInput: "",
    hasUsersNextPage: false,
    hasUsersPreviousPage: false,
    isUsersLoading: false,
    usersError: null,
    isSubmitting: false,
    isAllVisibleSelected: false,
    onSearchChange: vi.fn(),
    onRoleFilterChange: vi.fn(),
    onUsersPageChange: vi.fn(),
    onToggleSelectAll: vi.fn(),
    onToggleUserSelection: vi.fn(),
    onUserIdsInputChange: vi.fn(),
  };

  it("renders null if target is not 'users'", () => {
    const { container } = render(<AdminUserTable {...defaultProps} target="all" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the user table when target is 'users'", () => {
    render(<AdminUserTable {...defaultProps} />);
    expect(screen.getByText("Select recipients")).toBeDefined();
    expect(screen.getByText("user1")).toBeDefined();
    expect(screen.getByText("staff1")).toBeDefined();
    expect(screen.getByText("admin1")).toBeDefined();
  });

  it("handles search change", () => {
    render(<AdminUserTable {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText("Search by username or email");
    fireEvent.change(searchInput, { target: { value: "test query" } });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith("test query");
  });

  it("handles role filter change", () => {
    render(<AdminUserTable {...defaultProps} />);
    const roleSelect = screen.getByRole("combobox");
    fireEvent.change(roleSelect, { target: { value: "staff" } });
    expect(defaultProps.onRoleFilterChange).toHaveBeenCalledWith("staff");
  });

  it("handles toggle select all", () => {
    render(<AdminUserTable {...defaultProps} />);
    const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(selectAllCheckbox);
    expect(defaultProps.onToggleSelectAll).toHaveBeenCalled();
  });

  it("handles user selection toggle", () => {
    render(<AdminUserTable {...defaultProps} />);
    const userCheckbox = screen.getAllByRole("checkbox")[1]; // first user checkbox
    fireEvent.click(userCheckbox);
    expect(defaultProps.onToggleUserSelection).toHaveBeenCalledWith(1, true);
  });

  it("handles page change", () => {
    const { rerender } = render(<AdminUserTable {...defaultProps} hasUsersNextPage={true} />);
    const nextButton = screen.getAllByRole("button", { name: "Next" })[0];
    fireEvent.click(nextButton);
    expect(defaultProps.onUsersPageChange).toHaveBeenCalledWith(2);

    rerender(<AdminUserTable {...defaultProps} usersPage={2} hasUsersPreviousPage={true} />);
    const prevButton = screen.getAllByRole("button", { name: "Previous" })[0];
    fireEvent.click(prevButton);
    expect(defaultProps.onUsersPageChange).toHaveBeenCalledWith(1);
  });

  it("handles user IDs input change", () => {
    render(<AdminUserTable {...defaultProps} />);
    const idsInput = screen.getByLabelText("Or paste user IDs");
    fireEvent.change(idsInput, { target: { value: "1, 2, 3" } });
    expect(defaultProps.onUserIdsInputChange).toHaveBeenCalledWith("1, 2, 3");
  });

  it("shows loading state", () => {
    render(<AdminUserTable {...defaultProps} isUsersLoading={true} />);
    expect(screen.getByText("Loading users...")).toBeDefined();
  });

  it("shows error state", () => {
    render(<AdminUserTable {...defaultProps} usersError="Fetch failed" />);
    expect(screen.getByText("Fetch failed")).toBeDefined();
  });

  it("shows empty state", () => {
    render(<AdminUserTable {...defaultProps} users={[]} usersCount={0} />);
    expect(screen.getByText("No users match your search.")).toBeDefined();
  });

  it("correctly labels roles", () => {
    render(<AdminUserTable {...defaultProps} />);
    // Header + Row = 2
    expect(screen.getAllByText("User")).toHaveLength(2);
    // Option + Row = 2
    expect(screen.getAllByText("Staff")).toHaveLength(2);
    // Option is "Admins", Row is "Admin"
    expect(screen.getByText("Admins")).toBeDefined();
    expect(screen.getByText("Admin")).toBeDefined();
  });

  it("correctly labels status", () => {
    render(<AdminUserTable {...defaultProps} />);
    // 2 active users
    expect(screen.getAllByText("Active")).toHaveLength(2);
    expect(screen.getByText("Inactive")).toBeDefined();
  });
});

