import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import TaskListToolbar from "@/components/tasks/TaskListToolbar";

// Polyfill ResizeObserver for Headless UI
vi.hoisted(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

describe("TaskListToolbar Component", () => {
  const mockCategories = [
    { id: 1, text: "Category 1", colour: "#ff0000" },
    { id: 2, text: "Category 2", colour: "#00ff00" },
  ];

  const defaultProps = {
    search: "",
    sortBy: "deadline",
    categories: mockCategories,
    filterCategory: null,
    filterCompleted: "all" as const,
    filterHighImportance: false,
    filterQuickWins: false,
    onSearchChange: vi.fn(),
    onSortChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onCompletedChange: vi.fn(),
    onToggleHighImportance: vi.fn(),
    onToggleQuickWins: vi.fn(),
  };

  it("handles search change", () => {
    render(<TaskListToolbar {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText("Search tasks...");
    fireEvent.change(searchInput, { target: { value: "test search" } });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith("test search");
  });

  it("handles filter changes - status", async () => {
    render(<TaskListToolbar {...defaultProps} />);
    
    // Open Filter menu
    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    
    // Select 'completed'
    const item = await screen.findByRole("menuitem", { name: /completed/i });
    fireEvent.click(item);
    expect(defaultProps.onCompletedChange).toHaveBeenCalledWith("completed");
  });

  it("handles filter changes - high importance", async () => {
    const { rerender } = render(<TaskListToolbar {...defaultProps} />);
    
    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    const item = await screen.findByRole("menuitem", { name: /high importance only/i });
    fireEvent.click(item);
    expect(defaultProps.onToggleHighImportance).toHaveBeenCalled();

    // Test with filter ON
    rerender(<TaskListToolbar {...defaultProps} filterHighImportance={true} />);
    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    const itemOn = await screen.findByRole("menuitem", { name: /high importance only/i });
    expect(itemOn.querySelector(".text-primary")).toBeDefined();
  });

  it("handles filter changes - quick wins", async () => {
    const { rerender } = render(<TaskListToolbar {...defaultProps} />);
    
    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    const item = await screen.findByRole("menuitem", { name: /quick wins/i });
    fireEvent.click(item);
    expect(defaultProps.onToggleQuickWins).toHaveBeenCalled();

    // Test with filter ON
    rerender(<TaskListToolbar {...defaultProps} filterQuickWins={true} />);
    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    const itemOn = await screen.findByRole("menuitem", { name: /quick wins/i });
    expect(itemOn.querySelector(".text-primary")).toBeDefined();
  });

  it("handles filter changes - categories", async () => {
    render(<TaskListToolbar {...defaultProps} />);
    
    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    
    // Select a category
    const cat1 = await screen.findByRole("menuitem", { name: /category 1/i });
    fireEvent.click(cat1);
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith(1);

    // Re-open and Select all categories
    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    const allCat = await screen.findByRole("menuitem", { name: /all categories/i });
    fireEvent.click(allCat);
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith(null);
  });

  it("handles sort changes", async () => {
    render(<TaskListToolbar {...defaultProps} />);
    
    // Open Sort menu
    fireEvent.click(screen.getByRole("button", { name: "sortSort" }));
    
    // Select Importance
    const impItem = await screen.findByRole("menuitem", { name: /importance/i });
    fireEvent.click(impItem);
    expect(defaultProps.onSortChange).toHaveBeenCalledWith("-importance");

    // Re-open and Select Estimated Time
    fireEvent.click(screen.getByRole("button", { name: "sortSort" }));
    const estItem = await screen.findByRole("menuitem", { name: /estimated time/i });
    fireEvent.click(estItem);
    expect(defaultProps.onSortChange).toHaveBeenCalledWith("estimated_minutes");
  });

  it("displays active filters correctly", async () => {
    render(
      <TaskListToolbar 
        {...defaultProps} 
        filterCompleted="completed"
        filterHighImportance={true}
        filterCategory={1}
      />
    );
    
    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    
    const completedItem = await screen.findByRole("menuitem", { name: /completed/i });
    expect(completedItem.className).toContain("font-bold");

    const highImportanceItem = await screen.findByRole("menuitem", { name: /high importance only/i });
    expect(highImportanceItem.className).toContain("font-bold");
    
    const categoryItem = await screen.findByRole("menuitem", { name: /category 1/i });
    expect(categoryItem.className).toContain("font-bold");
  });
});
