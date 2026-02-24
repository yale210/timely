import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Gradebook from "@/pages/Gradebook";
import { BrowserRouter } from "react-router-dom";
import useCategories from "@/hooks/useCategories";

// Mock AppLayout
vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

// Mock useCategories
vi.mock("@/hooks/useCategories", () => ({
  default: vi.fn(),
}));

// Mock CreateGradeModal
interface MockCreateGradeModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onUpdated: () => void;
  initialData?: { name?: string };
}

vi.mock("@/components/CreateGradeModal.tsx", () => ({
  default: ({ open, onClose, onCreated, onUpdated, initialData }: MockCreateGradeModalProps) => {
    if (!open) return null;
    return (
      <div data-testid="create-grade-modal">
        <button onClick={onClose}>Close</button>
        <button onClick={onCreated}>Create</button>
        <button onClick={onUpdated}>Update</button>
        {initialData && <div data-testid="edit-mode">Edit {initialData.name}</div>}
      </div>
    );
  },
}));

describe("Gradebook Page", () => {
  const mockCategories = [
    { id: 1, text: "Math" },
    { id: 2, text: "Science" },
  ];

  const mockGrades = [
    {
      id: 1,
      name: "Midterm",
      category: 1,
      category_name: "Math",
      score: 80,
      total_possible: 100,
      percentage: 80,
      date_achieved: "2023-01-01",
      time_spent_minutes: 60,
    },
    {
      id: 2,
      name: "Lab",
      category: 2,
      category_name: "Science",
      score: 40,
      total_possible: 100,
      percentage: 40,
      date_achieved: "2023-01-02",
      time_spent_minutes: 90,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCategories).mockReturnValue({
      categories: mockCategories,
      loading: false,
    });

    // Mock global fetch
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/grades/") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGrades),
        } as Response);
      }
      return Promise.resolve({ ok: true } as Response);
    });
  });

  it("renders the gradebook and fetches data", async () => {
    render(
      <BrowserRouter>
        <Gradebook />
      </BrowserRouter>
    );

    expect(screen.getByText("Gradebook")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText("Midterm")).toBeInTheDocument();
    });

    expect(screen.getByText("Lab")).toBeInTheDocument();
    // 60% average
    expect(screen.getByText(/60%/)).toBeInTheDocument();
  });

  it("filters grades by category", async () => {
    render(
      <BrowserRouter>
        <Gradebook />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByText("Midterm"));

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "1" } });

    expect(screen.getByText("Midterm")).toBeInTheDocument();
    expect(screen.queryByText("Lab")).not.toBeInTheDocument();
    // Use getAllByText and check that at least one exists, or check for specific area
    expect(screen.getAllByText(/80%/).length).toBeGreaterThanOrEqual(1);
  });

  it("handles deletion of a grade", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <BrowserRouter>
        <Gradebook />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByText("Midterm"));

    const deleteBtns = screen.getAllByLabelText(/Delete grade/i);
    fireEvent.click(deleteBtns[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith("/api/grades/1/", expect.objectContaining({ method: "DELETE" }));
  });

  it("opens modal for adding and updating", async () => {
    render(
      <BrowserRouter>
        <Gradebook />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText("Add grade"));
    expect(screen.getByTestId("create-grade-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("create-grade-modal")).not.toBeInTheDocument();

    await waitFor(() => screen.getByText("Midterm"));
    const editBtns = screen.getAllByLabelText(/Edit grade/i);
    fireEvent.click(editBtns[0]);

    expect(screen.getByTestId("edit-mode")).toHaveTextContent("Edit Midterm");
  });
});
