import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminUserTableSearchInput } from "@/components/admin/admin-user-table/AdminUserTableControls";

describe("AdminUserTableSearchInput Component", () => {
  it("renders and handles changes", () => {
    const onSearchChange = vi.fn();
    render(
      <AdminUserTableSearchInput
        search="test"
        isSubmitting={false}
        onSearchChange={onSearchChange}
      />
    );

    const input = screen.getByPlaceholderText("Search by username or email");
    expect(input).toHaveValue("test");

    fireEvent.change(input, { target: { value: "new" } });
    expect(onSearchChange).toHaveBeenCalledWith("new");
  });
});
