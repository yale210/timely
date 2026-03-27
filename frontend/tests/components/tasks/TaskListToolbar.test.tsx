import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import TaskListToolbar from "@/components/tasks/TaskListToolbar";

const getMenuButton = (name: RegExp | string) => screen.getByText(name).closest("button");

// Polyfill ResizeObserver for Headless UI
vi.hoisted(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

vi.mock("@headlessui/react", () => ({
  Menu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MenuButton: ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>{children}</button>
  ),
  MenuItems: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  MenuItem: ({ children }: { children: (bag: { focus: boolean }) => ReactNode }) => (
    <div role="menuitem">{children({ focus: false })}</div>
  ),
}));

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

  it("handles filter changes - status", () => {
    render(<TaskListToolbar {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    fireEvent.click(getMenuButton(/^completed$/i)!);
    expect(defaultProps.onCompletedChange).toHaveBeenCalledWith("completed");
  });

  it("handles filter changes - high importance", () => {
    const { rerender } = render(<TaskListToolbar {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    fireEvent.click(getMenuButton(/^high importance only$/i)!);
    expect(defaultProps.onToggleHighImportance).toHaveBeenCalled();

    rerender(<TaskListToolbar {...defaultProps} filterHighImportance={true} />);
    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    const itemOn = getMenuButton(/^high importance only$/i)!;
    expect(itemOn.className).toContain("text-primary");
  });

  it("handles filter changes - quick wins", async () => {
    const { rerender } = render(<TaskListToolbar {...defaultProps} />);
    
    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    const item = getMenuButton(/quick wins/i)!;
    fireEvent.click(item);
    expect(defaultProps.onToggleQuickWins).toHaveBeenCalled();

    // Test with filter ON
    rerender(<TaskListToolbar {...defaultProps} filterQuickWins={true} />);
    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    const itemOn = getMenuButton(/quick wins/i)!;
    expect(itemOn.className).toContain("text-primary");
  });

  it("handles filter changes - categories", () => {
    render(<TaskListToolbar {...defaultProps} />);
    
    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    
    fireEvent.click(getMenuButton(/^Category 1$/i)!);
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    fireEvent.click(getMenuButton(/^All Categories$/i)!);
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith(null);
  });

  it("handles sort changes", () => {
    render(<TaskListToolbar {...defaultProps} />);
    
    // Open Sort menu
    fireEvent.click(screen.getByRole("button", { name: "sortSort" }));
    
    fireEvent.click(getMenuButton(/^Importance$/i)!);
    expect(defaultProps.onSortChange).toHaveBeenCalledWith("-importance");

    fireEvent.click(screen.getByRole("button", { name: "sortSort" }));
    fireEvent.click(getMenuButton(/^Estimated Time$/i)!);
    expect(defaultProps.onSortChange).toHaveBeenCalledWith("estimated_minutes");
  });

  it("displays active filters correctly", () => {
    render(
      <TaskListToolbar 
        {...defaultProps} 
        filterCompleted="completed"
        filterHighImportance={true}
        filterCategory={1}
      />
    );
    
    fireEvent.click(screen.getByRole("button", { name: "filter_listFilter" }));
    
    const completedItem = getMenuButton(/^completed$/i)!;
    expect(completedItem.className).toContain("font-bold");

    const highImportanceItem = getMenuButton(/^high importance only$/i)!;
    expect(highImportanceItem.className).toContain("font-bold");
    
    const categoryItem = getMenuButton(/^Category 1$/i)!;
    expect(categoryItem.className).toContain("font-bold");
  });
});
