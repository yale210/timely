import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminUserTableRoleFilter } from "@/components/admin/admin-user-table/AdminUserTableControls";

describe("AdminUserTableRoleFilter Component", () => {
  it("renders and handles changes", () => {
    const onRoleFilterChange = vi.fn();
    render(
      <AdminUserTableRoleFilter
        roleFilter="all"
        isSubmitting={false}
        onRoleFilterChange={onRoleFilterChange}
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("all");

    fireEvent.change(select, { target: { value: "staff" } });
    expect(onRoleFilterChange).toHaveBeenCalledWith("staff");
  });
});
