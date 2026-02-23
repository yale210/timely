import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateGradeModal from "@/components/CreateGradeModal";
import useCategories from "@/hooks/useCategories";

// Mock useCategories
vi.mock("@/hooks/useCategories", () => ({
  default: vi.fn(),
}));

describe("CreateGradeModal Component", () => {
  const mockCategories = [
    { id: 1, text: "Math" },
    { id: 2, text: "Science" },
  ];

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onCreated: vi.fn(),
    onUpdated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCategories).mockReturnValue({
      categories: mockCategories,
      loading: false,
    });
    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    // Mock document.cookie for CSRF
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrftoken=testtoken',
    });
  });

  it("does not render when closed", () => {
    render(<CreateGradeModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Create grade")).not.toBeInTheDocument();
  });

  it("renders correctly in create mode", () => {
    render(<CreateGradeModal {...defaultProps} />);
    expect(screen.getByText("Create grade")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Assessment name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Score")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Total")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create/i })).toBeInTheDocument();
  });

  it("renders correctly in edit mode with initial data", () => {
    const initialData = {
      id: 123,
      name: "Old Assignment",
      score: 15,
      total: 20,
      date: "2023-11-01",
      categoryId: 2,
    };
    render(<CreateGradeModal {...defaultProps} initialData={initialData} />);
    expect(screen.getByText("Edit grade")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Old Assignment")).toBeInTheDocument();
    expect(screen.getByDisplayValue("15")).toBeInTheDocument();
    expect(screen.getByDisplayValue("20")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2023-11-01")).toBeInTheDocument();
    
    const select = screen.getByLabelText("Category") as HTMLSelectElement;
    expect(select.value).toBe("2");
    
    expect(screen.getByRole("button", { name: /Update/i })).toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", () => {
    render(<CreateGradeModal {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("submits the form successfully in create mode", async () => {
    render(<CreateGradeModal {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText("Assessment name"), { target: { value: "Exam 1" } });
    fireEvent.change(screen.getByPlaceholderText("Score"), { target: { value: "90" } });
    fireEvent.change(screen.getByPlaceholderText("Total"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "1" } });
    
    const dateInput = document.getElementById("grade-date-input") as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2023-12-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/grades/",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-CSRFToken": "testtoken",
          }),
          body: JSON.stringify({
            name: "Exam 1",
            category: 1,
            score: 90,
            total_possible: 100,
            date_achieved: "2023-12-01",
          }),
        })
      );
      expect(defaultProps.onCreated).toHaveBeenCalled();
    });
  });

  it("submits the form successfully in edit mode", async () => {
    const initialData = {
      id: 50,
      name: "Old Grade",
      score: 10,
      total: 10,
      date: "2023-01-01",
      categoryId: null,
    };
    render(<CreateGradeModal {...defaultProps} initialData={initialData} />);

    fireEvent.change(screen.getByDisplayValue("Old Grade"), { target: { value: "Updated Grade" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/grades/50/",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"name":"Updated Grade"'),
        })
      );
      expect(defaultProps.onUpdated).toHaveBeenCalled();
    });
  });

  it("shows error if score > total", async () => {
    render(<CreateGradeModal {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText("Assessment name"), { target: { value: "Invalid Grade" } });
    fireEvent.change(screen.getByPlaceholderText("Score"), { target: { value: "110" } });
    fireEvent.change(screen.getByPlaceholderText("Total"), { target: { value: "100" } });
    
    // date fill via id
    const dateInput = document.getElementById("grade-date-input") as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2023-12-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Score must be less than or equal to total.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows error if numeric values are missing", async () => {
    render(<CreateGradeModal {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText("Assessment name"), { target: { value: "Missing data" } });
    
    // date fill
    const dateInput = document.getElementById("grade-date-input") as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2023-12-01" } });

    // Submit the form directly to bypass HTML validation (required)
    fireEvent.submit(screen.getByRole("form", { name: "grade-form" }));

    expect(await screen.findByText("Please provide numeric values for score and total.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("handles fetch error when creating", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    } as Response);
    
    render(<CreateGradeModal {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText("Assessment name"), { target: { value: "Failed Exam" } });
    fireEvent.change(screen.getByPlaceholderText("Score"), { target: { value: "50" } });
    fireEvent.change(screen.getByPlaceholderText("Total"), { target: { value: "100" } });
    
    // date fill
    const dateInput = document.getElementById("grade-date-input") as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2023-12-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Failed to create grade")).toBeInTheDocument();
  });

  it("handles fetch error when updating", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    } as Response);
    
    render(<CreateGradeModal {...defaultProps} initialData={{ id: 99, name: "EditMe", score: 10, total: 20, date: "2023-11-01" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    expect(await screen.findByText("Failed to update grade")).toBeInTheDocument();
  });
});
