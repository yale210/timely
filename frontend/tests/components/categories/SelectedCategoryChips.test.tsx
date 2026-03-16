import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SelectedCategoryChips } from "@/components/categories/SelectedCategoryChips";

describe("SelectedCategoryChips", () => {
  it("renders selected categories and toggles on click", () => {
    const onToggle = vi.fn();

    render(
      <SelectedCategoryChips
        selectedCategories={[
          { id: 1, text: "Work", colour: "#ff0000" },
          { id: 2, text: "Study", colour: "#00ff00" },
        ]}
        defaultSwatch="#94a3b8"
        onToggle={onToggle}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /work/i }));
    fireEvent.click(screen.getByRole("button", { name: /study/i }));

    expect(onToggle).toHaveBeenCalledWith(1);
    expect(onToggle).toHaveBeenCalledWith(2);
  });
});
