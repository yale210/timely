import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import EventListToolbar from "@/components/events/EventListToolbar";

// Polyfill ResizeObserver for Headless UI
vi.hoisted(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

describe("EventListToolbar Component", () => {
  const mockCategories = [
    { id: 1, text: "Category 1" },
    { id: 2, text: "Category 2" },
  ];

  const defaultProps = {
    search: "",
    sortBy: "start_time",
    categories: mockCategories,
    filterCategory: null,
    filterRecurring: false,
    onSearchChange: vi.fn(),
    onSortChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onToggleRecurring: vi.fn(),
  };

  it("handles search change", async () => {
    const user = userEvent.setup();
    render(<EventListToolbar {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText("Search events...");
    await user.type(searchInput, "test search");
    // onSearchChange is called for each keystroke
    expect(defaultProps.onSearchChange).toHaveBeenCalled();
  });

  it("handles filter changes - recurring", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<EventListToolbar {...defaultProps} />);
    
    // Open Filter menu
    await user.click(screen.getByRole("button", { name: "filter_listFilter" }));
    
    const item = await screen.findByRole("menuitem", { name: /recurring only/i });
    await user.click(item);
    expect(defaultProps.onToggleRecurring).toHaveBeenCalled();

    // Test with filter ON
    rerender(<EventListToolbar {...defaultProps} filterRecurring={true} />);
    await user.click(screen.getByRole("button", { name: "filter_listFilter" }));
    const itemOn = await screen.findByRole("menuitem", { name: /recurring only/i });
    expect(itemOn.querySelector(".text-orange-600")).toBeDefined();
    expect(itemOn.textContent).toContain("check_box");
  });

  it("handles filter changes - categories", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<EventListToolbar {...defaultProps} />);
    
    await user.click(screen.getByRole("button", { name: "filter_listFilter" }));
    
    // Select a category
    const cat1 = await screen.findByRole("menuitem", { name: /category 1/i });
    await user.click(cat1);
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith(1);

    // Re-open Filter menu
    await user.click(screen.getByRole("button", { name: "filter_listFilter" }));
    const allCat = await screen.findByRole("menuitem", { name: /all categories/i });
    await user.click(allCat);
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith(null);

    // Test with category selected (visual state)
    rerender(<EventListToolbar {...defaultProps} filterCategory={1} />);
    await user.click(screen.getByRole("button", { name: "filter_listFilter" }));
    const cat1On = await screen.findByRole("menuitem", { name: /category 1/i });
    expect(cat1On.className).toContain("font-bold");
  });

  it("handles sort changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<EventListToolbar {...defaultProps} />);
    
    // Open Sort menu
    await user.click(screen.getByRole("button", { name: "sortSort" }));
    
    // Select Title
    const titleItem = await screen.findByRole("menuitem", { name: /title \(a-z\)/i });
    await user.click(titleItem);
    expect(defaultProps.onSortChange).toHaveBeenCalledWith("title");

    // Test with title sort selected
    rerender(<EventListToolbar {...defaultProps} sortBy="title" />);
    await user.click(screen.getByRole("button", { name: "sortSort" }));
    const titleItemOn = await screen.findByRole("menuitem", { name: /title \(a-z\)/i });
    expect(titleItemOn.className).toContain("font-bold");
  });
});
