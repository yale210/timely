import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import GradebookHeader from "@/components/gradebook/GradebookHeader";

describe("GradebookHeader Component", () => {
  it("renders correctly", () => {
    const mockSetModalOpen = vi.fn();
    render(<GradebookHeader setModalOpen={mockSetModalOpen} />);
    
    expect(screen.getByText("Gradebook")).toBeDefined();
    expect(screen.getByRole("button", { name: /add grade/i })).toBeDefined();
  });

  it("calls setModalOpen(true) when button is clicked", () => {
    const mockSetModalOpen = vi.fn();
    render(<GradebookHeader setModalOpen={mockSetModalOpen} />);
    
    const button = screen.getByRole("button", { name: /add grade/i });
    fireEvent.click(button);
    
    expect(mockSetModalOpen).toHaveBeenCalledWith(true);
  });
});
