import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import GradebookFilterCategories from "@/components/gradebook/GradebookFilterCategories";
import type { Grade } from "@/components/gradebook/GradebookTable";

describe("GradebookFilterCategories Component", () => {
  const mockGrades: Grade[] = [
    {
      id: 1,
      name: "G1",
      category: 1,
      category_name: "Math",
      percentage: 80,
      score: 80,
      total_possible: 100,
      date_achieved: "2023-01-01",
      time_spent_minutes: 0,
    },
    {
      id: 2,
      name: "G2",
      category: 2,
      category_name: "Science",
      percentage: 40,
      score: 40,
      total_possible: 100,
      date_achieved: "2023-01-02",
      time_spent_minutes: 0,
    },
  ];

  it("renders null when loading", () => {
    const { container } = render(
      <GradebookFilterCategories
        loading={true}
        grades={mockGrades}
        filteredGrades={mockGrades}
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
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders average and category filter correctly", () => {
    render(
      <GradebookFilterCategories
        loading={false}
        grades={mockGrades}
        filteredGrades={mockGrades}
      />
    );

    expect(screen.getByText("Average Percentage")).toBeDefined();
    expect(screen.getByText("60%")).toBeDefined(); // (80 + 40) / 2
    expect(screen.getByText(/you’re passing - now aim higher\./i)).toBeDefined();
  });

  it("applies different tone classes based on average", () => {
    const { rerender } = render(
      <GradebookFilterCategories
        loading={false}
        grades={mockGrades}
        filteredGrades={[{ percentage: 40 } as Grade]}
      />
    );
    expect(screen.getByText("40%").parentElement?.className).toContain("bg-red-200");

    rerender(
      <GradebookFilterCategories
        loading={false}
        grades={mockGrades}
        filteredGrades={[{ percentage: 60 } as Grade]}
      />
    );
    expect(screen.getByText("60%").parentElement?.className).toContain("bg-orange-200");

    rerender(
      <GradebookFilterCategories
        loading={false}
        grades={mockGrades}
        filteredGrades={[{ percentage: 90 } as Grade]}
      />
    );
    expect(screen.getByText("90%").parentElement?.className).toContain("bg-green-200");
  });
});
