import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminHistoryStatusFilter } from "@/components/admin/notifications/AdminHistoryFilters";

describe("AdminHistoryStatusFilter Component", () => {
  it("renders and handles changes", () => {
    const onChange = vi.fn();
    render(<AdminHistoryStatusFilter value="COMPLETED" onChange={onChange} />);

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("COMPLETED");

    fireEvent.change(select, { target: { value: "FAILED" } });
    expect(onChange).toHaveBeenCalledWith("FAILED");
  });
});
