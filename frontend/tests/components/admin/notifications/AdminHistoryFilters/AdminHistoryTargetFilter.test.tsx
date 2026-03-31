import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminHistoryTargetFilter } from "@/components/admin/notifications/AdminHistoryFilters";

describe("AdminHistoryTargetFilter Component", () => {
  it("renders and handles changes", () => {
    const onChange = vi.fn();
    render(<AdminHistoryTargetFilter value="all" onChange={onChange} />);

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("all");

    fireEvent.change(select, { target: { value: "staff" } });
    expect(onChange).toHaveBeenCalledWith("staff");
  });
});
