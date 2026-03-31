import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminUserTableControls } from "@/components/admin/admin-user-table/AdminUserTableControls";
import { type AdminUserRole } from "@/types";

describe("AdminUserTableControls Component", () => {
  const defaultProps = {
    selectedCount: 5,
    search: "initial search",
    roleFilter: "all" as AdminUserRole,
    isSubmitting: false,
    onSearchChange: vi.fn(),
    onRoleFilterChange: vi.fn(),
  };

  it("renders correctly with search and filter", () => {
    render(<AdminUserTableControls {...defaultProps} />);

    expect(screen.getByText("Select recipients")).toBeDefined();
    expect(screen.getByText("5 selected")).toBeDefined();
    expect(screen.getByPlaceholderText("Search by username or email")).toHaveValue("initial search");
    expect(screen.getByRole("combobox")).toHaveValue("all");
  });

  it("calls onSearchChange when search input changes", () => {
    const onSearchChange = vi.fn();
    render(<AdminUserTableControls {...defaultProps} onSearchChange={onSearchChange} />);

    const searchInput = screen.getByPlaceholderText("Search by username or email");
    fireEvent.change(searchInput, { target: { value: "new search" } });

    expect(onSearchChange).toHaveBeenCalledWith("new search");
  });

  it("calls onRoleFilterChange when role filter changes", () => {
    const onRoleFilterChange = vi.fn();
    render(<AdminUserTableControls {...defaultProps} onRoleFilterChange={onRoleFilterChange} />);

    const roleSelect = screen.getByRole("combobox");
    fireEvent.change(roleSelect, { target: { value: "staff" } });

    expect(onRoleFilterChange).toHaveBeenCalledWith("staff");
  });

  it("disables inputs when isSubmitting is true", () => {
    render(<AdminUserTableControls {...defaultProps} isSubmitting={true} />);

    expect(screen.getByPlaceholderText("Search by username or email")).toBeDisabled();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
