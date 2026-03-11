import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminHistoryFilters } from "@/components/admin/notifications/AdminHistoryFilters";

describe("AdminHistoryFilters Component", () => {
  const mockOnSearchChange = vi.fn();
  const mockOnTargetFilterChange = vi.fn();
  const mockOnStatusFilterChange = vi.fn();

  const defaultProps = {
    search: "",
    targetFilter: "",
    statusFilter: "",
    onSearchChange: mockOnSearchChange,
    onTargetFilterChange: mockOnTargetFilterChange,
    onStatusFilterChange: mockOnStatusFilterChange,
  };

  it("renders with default values", () => {
    render(<AdminHistoryFilters {...defaultProps} />);
    
    expect(screen.getByPlaceholderText("Search title...")).toHaveValue("");
    expect(screen.getByDisplayValue("All audiences")).toBeDefined();
    expect(screen.getByDisplayValue("All statuses")).toBeDefined();
  });

  it("renders with provided values", () => {
    render(
      <AdminHistoryFilters
        {...defaultProps}
        search="test query"
        targetFilter="staff"
        statusFilter="COMPLETED"
      />
    );
    
    expect(screen.getByPlaceholderText("Search title...")).toHaveValue("test query");
    expect(screen.getByDisplayValue("Staff")).toBeDefined();
    expect(screen.getByDisplayValue("Completed")).toBeDefined();
  });

  it("calls onSearchChange when search input changes", () => {
    render(<AdminHistoryFilters {...defaultProps} />);
    
    const input = screen.getByPlaceholderText("Search title...");
    fireEvent.change(input, { target: { value: "new search" } });
    
    expect(mockOnSearchChange).toHaveBeenCalledWith("new search");
  });

  it("calls onTargetFilterChange when target filter changes", () => {
    render(<AdminHistoryFilters {...defaultProps} />);
    
    const select = screen.getByDisplayValue("All audiences");
    fireEvent.change(select, { target: { value: "admin" } });
    
    expect(mockOnTargetFilterChange).toHaveBeenCalledWith("admin");
  });

  it("calls onStatusFilterChange when status filter changes", () => {
    render(<AdminHistoryFilters {...defaultProps} />);
    
    const select = screen.getByDisplayValue("All statuses");
    fireEvent.change(select, { target: { value: "FAILED" } });
    
    expect(mockOnStatusFilterChange).toHaveBeenCalledWith("FAILED");
  });
});
