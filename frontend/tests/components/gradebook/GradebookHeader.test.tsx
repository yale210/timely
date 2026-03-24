import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import GradebookHeader from "@/components/gradebook/GradebookHeader";

describe("GradebookHeader Component", () => {
  const baseProps = {
    search: "",
    sortBy: "date_desc" as const,
    performanceFilter: "all" as const,
    selectedCategoryId: null,
    categories: [],
    onSearchChange: vi.fn(),
    onSortChange: vi.fn(),
    onPerformanceFilterChange: vi.fn(),
    onCategoryChange: vi.fn(),
  };

  it("renders correctly", () => {
    const mockSetModalOpen = vi.fn();
    render(<GradebookHeader setModalOpen={mockSetModalOpen} {...baseProps} />);
    
    expect(screen.getByText("Gradebook")).toBeDefined();
    expect(screen.getByPlaceholderText("Search grades")).toBeDefined();
    expect(screen.getByRole("button", { name: /filter/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /sort/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /add grade/i })).toBeDefined();
  });

  it("calls setModalOpen(true) when button is clicked", () => {
    const mockSetModalOpen = vi.fn();
    render(<GradebookHeader setModalOpen={mockSetModalOpen} {...baseProps} />);
    
    const button = screen.getByRole("button", { name: /add grade/i });
    fireEvent.click(button);
    
    expect(mockSetModalOpen).toHaveBeenCalledWith(true);
  });
});
