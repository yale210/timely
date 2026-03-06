import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import GradebookStatus from "@/components/gradebook/GradebookStatus";

describe("GradebookStatus Component", () => {
  it("renders loading state", () => {
    render(<GradebookStatus loading={true} gradesCount={0} filteredCount={0} />);
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("renders empty state when no grades exist", () => {
    render(<GradebookStatus loading={false} gradesCount={0} filteredCount={0} />);
    expect(screen.getByText("No grades yet. Add one above.")).toBeDefined();
  });

  it("renders filtered empty state when no grades match category", () => {
    render(<GradebookStatus loading={false} gradesCount={5} filteredCount={0} />);
    expect(screen.getByText("No grades found for this category.")).toBeDefined();
  });

  it("renders nothing when grades exist and match filters", () => {
    const { container } = render(<GradebookStatus loading={false} gradesCount={5} filteredCount={3} />);
    expect(container.firstChild).toBeNull();
  });
});
