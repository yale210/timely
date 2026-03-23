import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminUserTablePagination } from "@/components/admin/AdminUserTable/AdminUserTablePagination";

describe("AdminUserTablePagination Component", () => {
  const defaultProps = {
    usersPage: 2,
    usersCount: 25,
    usersPageSize: 10,
    hasUsersNextPage: true,
    hasUsersPreviousPage: true,
    isUsersLoading: false,
    isSubmitting: false,
    onUsersPageChange: vi.fn(),
  };

  it("renders correctly with page info", () => {
    render(<AdminUserTablePagination {...defaultProps} />);

    expect(screen.getByText("Page 2 of 3")).toBeDefined();
    expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
  });

  it("calls onUsersPageChange when Next is clicked", () => {
    const onUsersPageChange = vi.fn();
    render(<AdminUserTablePagination {...defaultProps} onUsersPageChange={onUsersPageChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onUsersPageChange).toHaveBeenCalledWith(3);
  });

  it("calls onUsersPageChange when Previous is clicked", () => {
    const onUsersPageChange = vi.fn();
    render(<AdminUserTablePagination {...defaultProps} onUsersPageChange={onUsersPageChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onUsersPageChange).toHaveBeenCalledWith(1);
  });

  it("disables buttons when loading or submitting", () => {
    const { rerender } = render(<AdminUserTablePagination {...defaultProps} isUsersLoading={true} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

    rerender(<AdminUserTablePagination {...defaultProps} isSubmitting={true} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  });

  it("disables buttons based on hasNext/hasPrevious", () => {
    render(<AdminUserTablePagination {...defaultProps} hasUsersNextPage={false} hasUsersPreviousPage={false} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  });
});
