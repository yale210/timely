import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CategoryMultiSelect from "@/components/categories/CategoryMultiSelect";
import type { Category } from "@/types";

const categories: Category[] = [
  { id: 1, text: "Work", colour: "#ff0000" },
  { id: 2, text: "Study", colour: "#00ff00" },
];

describe("CategoryMultiSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("selects an existing category from the dropdown", () => {
    const onChange = vi.fn();

    render(
      <CategoryMultiSelect
        categories={categories}
        selectedIds={[1]}
        onChange={onChange}
        onCreateCategory={vi.fn()}
        onUpdateCategory={vi.fn()}
        onDeleteCategory={vi.fn()}
        variant="task"
      />,
    );

    const input = screen.getByPlaceholderText("Type to search or add category...");
    fireEvent.focus(input);
    fireEvent.mouseDown(screen.getByText("Study").closest("button")!);

    expect(onChange).toHaveBeenCalledWith([1, 2]);
  });

  it("creates a new category and assigns a fallback colour when needed", async () => {
    const onChange = vi.fn();
    const onCreateCategory = vi.fn().mockResolvedValue({
      id: 3,
      text: "Planning",
      colour: null,
    });
    const onUpdateCategory = vi.fn().mockResolvedValue({
      id: 3,
      text: "Planning",
      colour: "#ef4444",
    });

    render(
      <CategoryMultiSelect
        categories={categories}
        selectedIds={[1]}
        onChange={onChange}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={vi.fn()}
        variant="task"
      />,
    );

    const input = screen.getByPlaceholderText("Type to search or add category...");
    fireEvent.change(input, { target: { value: "Planning" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(onCreateCategory).toHaveBeenCalledWith("Planning"));
    await waitFor(() => expect(onUpdateCategory).toHaveBeenCalled());
    expect(onChange).toHaveBeenCalledWith([1, 3]);
  });
});
