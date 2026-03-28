import { fireEvent, render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import type { ReactNode } from "react";
import TaskForm from "@/components/tasks/TaskForm";

vi.mock("@/components", async () => {
  const actual = await vi.importActual<object>("@/components");
  return {
    ...actual,
    Tooltip: ({ children }: { children: ReactNode }) => children,
    CategoryColourPicker: () => null,
  };
});

vi.mock("@/components/categories/CategoryMultiSelect", () => ({
  default: ({ categories, selectedIds, onChange }: {
    categories: { id: number; text: string }[];
    selectedIds: number[];
    onChange: (nextIds: number[]) => void;
  }) => (
    <div>
      <input placeholder="Type to search or add category..." readOnly />
      {categories.map((category) => {
        const isSelected = selectedIds.includes(category.id);
        return (
          <button
            key={category.id}
            type="button"
            onMouseDown={() =>
              onChange(
                isSelected
                  ? selectedIds.filter((id) => id !== category.id)
                  : [...selectedIds, category.id],
              )
            }
          >
            {category.text}
          </button>
        );
      })}
    </div>
  ),
}));

describe("TaskForm Component", () => {
  const mockCategories = [
    { id: 1, text: "Category 1" },
    { id: 2, text: "Category 2" },
  ];

  const onCreateCategory = vi.fn().mockResolvedValue({ id: 3, text: "Category 3" });
  const onUpdateCategory = vi.fn().mockResolvedValue({ id: 1, text: "Category 1" });
  const onDeleteCategory = vi.fn().mockResolvedValue(undefined);

  const defaultProps = {
    categories: mockCategories,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    onCreateCategory,
    onUpdateCategory,
    onDeleteCategory,
  };

  beforeEach(() => {
    defaultProps.onSubmit.mockClear();
    defaultProps.onCancel.mockClear();
  });

  it("renders with default values", () => {
    render(<TaskForm {...defaultProps} />);
    expect(screen.getByLabelText(/title/i)).toHaveValue("");
    expect(screen.getByLabelText(/importance/i)).toHaveValue(5);
    expect(screen.getByLabelText(/est. minutes/i)).toHaveValue(null);
    expect(screen.getByLabelText(/importance/i)).toHaveValue(5);
    expect(screen.getByLabelText(/progress/i)).toBeDefined();
  });

  it("handles input changes and submits", () => {
    render(<TaskForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "New Task" } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Task description" } });
    fireEvent.change(screen.getByLabelText(/deadline date/i), { target: { value: "2099-01-01" } });
    fireEvent.change(screen.getByLabelText(/deadline time/i), { target: { value: "11:00" } });
    fireEvent.change(screen.getByLabelText(/est. minutes/i), { target: { value: "30" } });

    fireEvent.mouseDown(screen.getByText("Category 1"));

    const saveButton = screen.getByRole("button", { name: /save task/i });
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: "New Task",
      description: "Task description",
      categories: [1],
      estimated_minutes: 30,
    }));
  });

  it("validates importance (1-10)", () => {
    render(<TaskForm {...defaultProps} />);
    
    const importanceInput = screen.getByLabelText(/importance/i);
    fireEvent.change(importanceInput, { target: { value: "11" } });
    
    fireEvent.click(screen.getByRole("button", { name: /save task/i }));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();

    fireEvent.change(importanceInput, { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /save task/i }));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("validates time (start before deadline)", () => {
    render(<TaskForm {...defaultProps} />);
    
    const startDate = screen.getByLabelText(/start date/i);
    fireEvent.change(startDate, { target: { value: "2099-01-02" } });
    
    const deadlineDate = screen.getByLabelText(/deadline date/i);
    fireEvent.change(deadlineDate, { target: { value: "2099-01-01" } });
    
    fireEvent.click(screen.getByRole("button", { name: /save task/i }));
    expect(screen.getByText(/start time must be before the deadline/i)).toBeDefined();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(<TaskForm {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it("calls onDataChange when inputs change", () => {
    const onDataChange = vi.fn();
    render(<TaskForm {...defaultProps} onDataChange={onDataChange} />);
    
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "T" } });
    expect(onDataChange).toHaveBeenCalled();
  });

  it("handles invalid dates in safeToISOString path", () => {
    render(<TaskForm {...defaultProps} />);
    
    const startDate = screen.getByLabelText(/start date/i);
    fireEvent.change(startDate, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /save task/i }));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("toggles categories correctly", async () => {
    render(<TaskForm {...defaultProps} />);

    fireEvent.focus(screen.getByPlaceholderText(/type to search or add category/i));
    const cat1 = await screen.findByText("Category 1");
    fireEvent.mouseDown(cat1);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Task" } });
    fireEvent.change(screen.getByLabelText(/deadline date/i), { target: { value: "2099-01-01" } });
    fireEvent.change(screen.getByLabelText(/deadline time/i), { target: { value: "11:00" } });
    fireEvent.change(screen.getByLabelText(/est. minutes/i), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: /save task/i }));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      categories: [1],
    }));
  });

  it("renders with initialData in edit mode", () => {
    const initialData = {
      id: 1,
      title: "Existing Task",
      description: "Existing Desc",
      start_time: "2023-01-01T10:00:00Z",
      deadline: "2023-01-01T11:00:00Z",
      importance: 8,
      estimated_minutes: 45,
      completed: true,
      categories: [{ id: 1, text: "Category 1" }],
      user: 1,
      created_at: "2023-01-01T10:00:00Z",
      updated_at: "2023-01-01T10:00:00Z",
      allocation: []
    };
    render(<TaskForm {...defaultProps} initialData={initialData} />);
    
    expect(screen.getByLabelText(/title/i)).toHaveValue("Existing Task");
    expect(screen.getByLabelText(/description/i)).toHaveValue("Existing Desc");
    expect(screen.getByLabelText(/importance/i)).toHaveValue(8);
    expect(screen.getByLabelText(/est. minutes/i)).toHaveValue(45);
  });
});
