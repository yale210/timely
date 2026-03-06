import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import GradebookFilterCategories from "@/components/gradebook/GradebookFilterCategories";

describe("GradebookFilterCategories Component", () => {
  const mockSetSelectedCategoryId = vi.fn();
  const mockCategories = [
    { id: 1, text: "Math" },
    { id: 2, text: "Science" },
  ];
  const mockGrades = [
    { id: 1, name: "G1", percentage: 80 },
    { id: 2, name: "G2", percentage: 40 },
  ];

  it("renders null when loading", () => {
    const { container } = render(
      <GradebookFilterCategories
        loading={true}
        grades={mockGrades as any}
        filteredGrades={mockGrades as any}
        selectedCategoryId={null}
        setSelectedCategoryId={mockSetSelectedCategoryId}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders null when grades is null", () => {
    const { container } = render(
      <GradebookFilterCategories
        loading={false}
        grades={null}
        filteredGrades={[]}
        selectedCategoryId={null}
        setSelectedCategoryId={mockSetSelectedCategoryId}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders average and category filter correctly", () => {
    render(
      <GradebookFilterCategories
        loading={false}
        grades={mockGrades as any}
        filteredGrades={mockGrades as any}
        selectedCategoryId={null}
        setSelectedCategoryId={mockSetSelectedCategoryId}
        categories={mockCategories}
      />
    );

    expect(screen.getByText("Average Percentage")).toBeDefined();
    expect(screen.getByText("60%")).toBeDefined(); // (80 + 40) / 2
    expect(screen.getByText("Filter by Category")).toBeDefined();
    expect(screen.getByRole("combobox")).toBeDefined();
    expect(screen.getByRole("option", { name: "Math" })).toBeDefined();
    expect(screen.getByRole("option", { name: "Science" })).toBeDefined();
  });

  it("calls setSelectedCategoryId when selection changes", () => {
    render(
      <GradebookFilterCategories
        loading={false}
        grades={mockGrades as any}
        filteredGrades={mockGrades as any}
        selectedCategoryId={null}
        setSelectedCategoryId={mockSetSelectedCategoryId}
        categories={mockCategories}
      />
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "1" } });
    expect(mockSetSelectedCategoryId).toHaveBeenCalledWith(1);

    fireEvent.change(select, { target: { value: "" } });
    expect(mockSetSelectedCategoryId).toHaveBeenCalledWith(null);
  });

  it("applies different tone classes based on average", () => {
    const { rerender } = render(
      <GradebookFilterCategories
        loading={false}
        grades={mockGrades as any}
        filteredGrades={[{ percentage: 40 }] as any}
        selectedCategoryId={null}
        setSelectedCategoryId={mockSetSelectedCategoryId}
      />
    );
    expect(screen.getByText("40%").parentElement?.className).toContain("bg-red-100");

    rerender(
      <GradebookFilterCategories
        loading={false}
        grades={mockGrades as any}
        filteredGrades={[{ percentage: 60 }] as any}
        selectedCategoryId={null}
        setSelectedCategoryId={mockSetSelectedCategoryId}
      />
    );
    expect(screen.getByText("60%").parentElement?.className).toContain("bg-orange-100");

    rerender(
      <GradebookFilterCategories
        loading={false}
        grades={mockGrades as any}
        filteredGrades={[{ percentage: 90 }] as any}
        selectedCategoryId={null}
        setSelectedCategoryId={mockSetSelectedCategoryId}
      />
    );
    expect(screen.getByText("90%").parentElement?.className).toContain("bg-green-100");
  });
});
