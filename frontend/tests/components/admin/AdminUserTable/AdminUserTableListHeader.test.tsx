import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminUserTableListHeader } from "@/components/admin/AdminUserTable/AdminUserTableListHeader";

describe("AdminUserTableListHeader Component", () => {
  it("renders headers and handles select all", () => {
    const onToggleSelectAll = vi.fn();
    render(
      <table>
        <AdminUserTableListHeader
          isAllVisibleSelected={true}
          isSubmitting={false}
          onToggleSelectAll={onToggleSelectAll}
        />
      </table>
    );

    expect(screen.getByText("User")).toBeDefined();
    expect(screen.getByText("Role")).toBeDefined();
    expect(screen.getByText("Status")).toBeDefined();

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(onToggleSelectAll).toHaveBeenCalledWith(false);
  });
});
