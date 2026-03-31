import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminUserTablePaginationButton } from "@/components/admin/admin-user-table/AdminUserTablePagination";

describe("AdminUserTablePaginationButton Component", () => {
  it("renders with label and handles click", () => {
    const onClick = vi.fn();
    render(<AdminUserTablePaginationButton label="Test" onClick={onClick} disabled={false} />);

    const button = screen.getByRole("button", { name: "Test" });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it("is disabled when disabled prop is true", () => {
    const onClick = vi.fn();
    render(<AdminUserTablePaginationButton label="Test" onClick={onClick} disabled={true} />);

    const button = screen.getByRole("button", { name: "Test" });
    expect(button).toBeDisabled();
  });
});
