import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoryDropdown } from "@/components/categories/CategoryDropdown";

describe("CategoryDropdown", () => {
  it("renders options and forwards selection, actions, and create events", () => {
    const onSelectOption = vi.fn();
    const onCreate = vi.fn();
    const onMenuOpen = vi.fn();

    render(
      <CategoryDropdown
        isOpen
        dropdownPosition={{ top: 20, left: 30, width: 200 }}
        dropdownMaxHeight={180}
        filtered={[
          { id: 1, text: "Work", colour: "#ff0000" },
          { id: 2, text: "Study", colour: "#00ff00" },
        ]}
        selectedIds={[1]}
        defaultSwatch="#94a3b8"
        normalizedQuery="new"
        query="New"
        canCreate
        maxCategoryLength={20}
        isCreating={false}
        error={null}
        optionBaseClass="option-base"
        addBaseClass="add-base"
        onSelectOption={onSelectOption}
        onCreate={onCreate}
        onMenuOpen={onMenuOpen}
      />,
    );

    fireEvent.mouseDown(screen.getByText("Work ✓").closest("button")!);
    fireEvent.click(screen.getByLabelText("Open actions for Work"));
    fireEvent.mouseDown(screen.getByRole("button", { name: /add new category/i }));

    expect(onSelectOption).toHaveBeenCalledWith(1);
    expect(onCreate).toHaveBeenCalled();
    expect(onMenuOpen).toHaveBeenCalled();
  });
});
