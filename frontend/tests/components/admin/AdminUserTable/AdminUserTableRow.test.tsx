import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminUserTableRow } from "@/components/admin/AdminUserTable/AdminUserTableRow";
import { type AdminUserSummary } from "@/types";

describe("AdminUserTableRow Component", () => {
  const mockUser: AdminUserSummary = {
    id: 1,
    username: "testuser",
    email: "test@example.com",
    is_staff: false,
    is_superuser: false,
    is_active: true,
    date_joined: "2023-01-01",
    last_login: null,
  };

  const defaultProps = {
    user: mockUser,
    isSelected: false,
    isSubmitting: false,
    onToggleUserSelection: vi.fn(),
  };

  it("renders user information correctly", () => {
    render(
      <table>
        <tbody>
          <AdminUserTableRow {...defaultProps} />
        </tbody>
      </table>
    );

    expect(screen.getByText("testuser")).toBeDefined();
    expect(screen.getByText("test@example.com")).toBeDefined();
    expect(screen.getByText("User")).toBeDefined();
    expect(screen.getByText("Active")).toBeDefined();
  });

  it("calls onToggleUserSelection when checkbox is clicked", () => {
    const onToggleUserSelection = vi.fn();
    render(
      <table>
        <tbody>
          <AdminUserTableRow {...defaultProps} onToggleUserSelection={onToggleUserSelection} />
        </tbody>
      </table>
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onToggleUserSelection).toHaveBeenCalledWith(1, true);
  });

  it("renders correct labels for staff and superusers", () => {
    const { rerender } = render(
      <table>
        <tbody>
          <AdminUserTableRow {...defaultProps} user={{ ...mockUser, is_staff: true }} />
        </tbody>
      </table>
    );
    expect(screen.getByText("Staff")).toBeDefined();

    rerender(
      <table>
        <tbody>
          <AdminUserTableRow {...defaultProps} user={{ ...mockUser, is_superuser: true }} />
        </tbody>
      </table>
    );
    expect(screen.getByText("Admin")).toBeDefined();
  });

  it("renders inactive status correctly", () => {
    render(
      <table>
        <tbody>
          <AdminUserTableRow {...defaultProps} user={{ ...mockUser, is_active: false }} />
        </tbody>
      </table>
    );
    expect(screen.getByText("Inactive")).toBeDefined();
  });
});
