import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import type { ReactNode } from "react";
import CreateGradeModal from "@/components/modals/CreateGradeModal";
import useCategories from "@/hooks/tasks/useCategories";

vi.mock("@headlessui/react", () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogPanel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Transition: ({ show, children }: { show: boolean; children: ReactNode }) =>
    show ? <>{children}</> : null,
  TransitionChild: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Mock useCategories hook
vi.mock("@/hooks/tasks/useCategories", () => ({
  default: vi.fn()
}));

describe("CreateGradeModal Component", () => {
  const mockOnClose = vi.fn();
  const mockOnCreated = vi.fn();
  const mockOnUpdated = vi.fn();
  const mockCategories = [
    { id: 1, text: "Category 1" },
    { id: 2, text: "Category 2" }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCategories).mockReturnValue({
      categories: mockCategories,
      loading: false
    });
    // Mock fetch
    global.fetch = vi.fn();
    // Mock document.cookie
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "csrftoken=mock-token"
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <CreateGradeModal open={false} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders 'Create grade' title when no initialData is provided", () => {
    render(<CreateGradeModal open={true} onClose={mockOnClose} />);
    expect(screen.getAllByText("Create grade").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Create grade" })).toBeDefined();
  });

  it("renders 'Edit grade' title when initialData is provided", () => {
    const initialData = { id: 1, name: "Existing Grade", score: 80, total: 100, date: "2023-01-01" };
    render(<CreateGradeModal open={true} onClose={mockOnClose} initialData={initialData} />);
    expect(screen.getByText("Edit grade")).toBeDefined();
    expect(screen.getByRole("button", { name: "Update grade" })).toBeDefined();
    expect(screen.getByPlaceholderText("Assessment name")).toHaveValue("Existing Grade");
  });

  it("updates fields on input change", () => {
    render(<CreateGradeModal open={true} onClose={mockOnClose} />);
    
    const nameInput = screen.getByPlaceholderText("Assessment name");
    fireEvent.change(nameInput, { target: { value: "New Grade" } });
    expect(nameInput).toHaveValue("New Grade");

    const scoreInput = screen.getByPlaceholderText("Score");
    fireEvent.change(scoreInput, { target: { value: "90" } });
    expect(scoreInput).toHaveValue(90);

    const totalInput = screen.getByPlaceholderText("Total");
    fireEvent.change(totalInput, { target: { value: "100" } });
    expect(totalInput).toHaveValue(100);
  });

  it("displays error when score is greater than total", () => {
    render(<CreateGradeModal open={true} onClose={mockOnClose} />);
    
    fireEvent.change(screen.getByPlaceholderText("Score"), { target: { value: "110" } });
    fireEvent.change(screen.getByPlaceholderText("Total"), { target: { value: "100" } });
    fireEvent.change(screen.getByPlaceholderText("Assessment name"), { target: { value: "Test" } });
    
    fireEvent.submit(screen.getByRole("button", { name: "Create grade" }));
    
    expect(screen.getByText("Score must be less than or equal to total.")).toBeDefined();
  });

  it("calls fetch with POST when creating a new grade", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as Response);
    render(<CreateGradeModal open={true} onClose={mockOnClose} onCreated={mockOnCreated} />);
    
    fireEvent.change(screen.getByPlaceholderText("Assessment name"), { target: { value: "New Grade" } });
    fireEvent.change(screen.getByPlaceholderText("Score"), { target: { value: "90" } });
    fireEvent.change(screen.getByPlaceholderText("Total"), { target: { value: "100" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });
    // Date input by id because type="date"
    const dateInput = document.getElementById("grade-date-input");
    fireEvent.change(dateInput!, { target: { value: "2023-10-10" } });

    fireEvent.submit(screen.getByRole("button", { name: "Create grade" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith("/api/grades/", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        name: "New Grade",
        category: 1,
        score: 90,
        total_possible: 100,
        date_achieved: "2023-10-10"
      })
    }));
    expect(mockOnCreated).toHaveBeenCalled();
  });

  it("calls fetch with PUT when updating an existing grade", async () => {
    const initialData = { id: 123, name: "Old Grade", score: 70, total: 100, date: "2023-01-01" };
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as Response);
    render(<CreateGradeModal open={true} onClose={mockOnClose} onUpdated={mockOnUpdated} initialData={initialData} />);
    
    fireEvent.change(screen.getByPlaceholderText("Assessment name"), { target: { value: "Updated Grade" } });
    fireEvent.submit(screen.getByRole("button", { name: "Update grade" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith("/api/grades/123/", expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({
        name: "Updated Grade",
        category: null,
        score: 70,
        total_possible: 100,
        date_achieved: "2023-01-01"
      })
    }));
    expect(mockOnUpdated).toHaveBeenCalled();
  });

  it("displays error when fetch fails during creation", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response);
    render(<CreateGradeModal open={true} onClose={mockOnClose} />);
    
    fireEvent.change(screen.getByPlaceholderText("Assessment name"), { target: { value: "New Grade" } });
    fireEvent.change(screen.getByPlaceholderText("Score"), { target: { value: "90" } });
    fireEvent.change(screen.getByPlaceholderText("Total"), { target: { value: "100" } });
    fireEvent.submit(screen.getByRole("button", { name: "Create grade" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to create grade.")).toBeDefined();
    });
  });

  it("displays error when fetch fails during update", async () => {
    const initialData = { id: 123, name: "Old Grade", score: 70, total: 100, date: "2023-01-01" };
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response);
    render(<CreateGradeModal open={true} onClose={mockOnClose} initialData={initialData} />);
    
    fireEvent.submit(screen.getByRole("button", { name: "Update grade" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to update grade.")).toBeDefined();
    });
  });

  it("calls onClose when Cancel button is clicked", () => {
    render(<CreateGradeModal open={true} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("handles empty score and total values", () => {
    render(<CreateGradeModal open={true} onClose={mockOnClose} />);
    
    // Simulate clearing the number inputs
    fireEvent.change(screen.getByPlaceholderText("Score"), { target: { value: "" } });
    fireEvent.change(screen.getByPlaceholderText("Total"), { target: { value: "" } });
    
    fireEvent.submit(screen.getByRole("button", { name: "Create grade" }));
    
    expect(screen.getByText("Please provide numeric values for score and total.")).toBeDefined();
  });
});
