import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import GradebookTable from "@/components/gradebook/GradebookTable";
import type { Grade } from "@/components/gradebook/GradebookTable";

describe("GradebookTable Component", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const mockGrades: Grade[] = [
    {
      id: 1,
      name: "Assignment 1",
      category_name: "Math",
      score: 80,
      total_possible: 100,
      percentage: 80,
      date_achieved: "2023-01-01",
      time_spent_minutes: 125,
    },
    {
      id: 2,
      name: "Quiz 1",
      category_name: null,
      score: 40,
      total_possible: 100,
      percentage: 40,
      date_achieved: "2023-01-02",
      time_spent_minutes: 30,
    },
    {
        id: 3,
        name: "Test 1",
        category_name: "Science",
        score: 65,
        total_possible: 100,
        percentage: 65,
        date_achieved: "2023-01-03",
        time_spent_minutes: 0,
      },
  ];

  it("renders null when loading", () => {
    const { container } = render(
      <GradebookTable loading={true} filteredGrades={mockGrades} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders null when filteredGrades is empty", () => {
    const { container } = render(
      <GradebookTable loading={false} filteredGrades={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders grade rows correctly", () => {
    render(
      <GradebookTable loading={false} filteredGrades={mockGrades} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.getByText("Assignment 1")).toBeDefined();
    expect(screen.getByText("Math")).toBeDefined();
    expect(screen.getByText("80/100")).toBeDefined();
    expect(screen.getByText("80%")).toBeDefined();
    expect(screen.getByText("2h 5m")).toBeDefined();

    expect(screen.getByText("Quiz 1")).toBeDefined();
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1); // For null category
    expect(screen.getByText("40%")).toBeDefined();
    expect(screen.getByText("0h 30m")).toBeDefined();

    expect(screen.getByText("65%")).toBeDefined();
    expect(screen.getByText("0m")).toBeDefined(); // For 0 minutes
  });

  it("applies correct CSS classes based on percentage", () => {
    render(
      <GradebookTable loading={false} filteredGrades={mockGrades} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    const highGrade = screen.getByText("80%");
    expect(highGrade.className).toContain("bg-green-100");

    const midGrade = screen.getByText("65%");
    expect(midGrade.className).toContain("bg-orange-100");

    const lowGrade = screen.getByText("40%");
    expect(lowGrade.className).toContain("bg-red-100");
  });

  it("calls onEdit when edit button is clicked", () => {
    render(
      <GradebookTable loading={false} filteredGrades={mockGrades} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    const editButtons = screen.getAllByLabelText("Edit grade");
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockGrades[0]);
  });

  it("calls onDelete when delete button is clicked", () => {
    render(
      <GradebookTable loading={false} filteredGrades={mockGrades} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    const deleteButtons = screen.getAllByLabelText("Delete this grade");
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockGrades[0].id);
  });
});
