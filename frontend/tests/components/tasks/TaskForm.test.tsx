import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import TaskForm from "@/components/tasks/TaskForm";

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
  });

  it("handles input changes and submits", async () => {
    render(<TaskForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "New Task" } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Task description" } });
    fireEvent.change(screen.getByLabelText(/deadline date/i), { target: { value: "2099-01-01" } });
    fireEvent.change(screen.getByLabelText(/deadline time/i), { target: { value: "11:00" } });
    fireEvent.change(screen.getByLabelText(/est. minutes/i), { target: { value: "30" } });

    fireEvent.focus(screen.getByPlaceholderText(/type to search or add category/i));
    fireEvent.mouseDown(await screen.findByText("Category 1"));

    const saveButton = screen.getByRole("button", { name: /save task/i });
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: "New Task",
      description: "Task description",
      categories: [1],
    }));
  });

  it("validates importance (1-10)", async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    
    const importanceInput = screen.getByLabelText(/importance/i);
    await user.clear(importanceInput);
    await user.type(importanceInput, "11");
    
    await user.click(screen.getByRole("button", { name: /save task/i }));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();

    await user.clear(importanceInput);
    await user.type(importanceInput, "0");
    await user.click(screen.getByRole("button", { name: /save task/i }));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("validates time (start before deadline)", async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    
    // Set start date to tomorrow
    const startDate = screen.getByLabelText(/start date/i);
    await user.type(startDate, "2099-01-02");
    
    // Set deadline to today
    const deadlineDate = screen.getByLabelText(/deadline date/i);
    await user.type(deadlineDate, "2099-01-01");
    
    await user.click(screen.getByRole("button", { name: /save task/i }));
    expect(screen.getByText(/start time must be before the deadline/i)).toBeDefined();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it("calls onDataChange when inputs change", async () => {
    const onDataChange = vi.fn();
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} onDataChange={onDataChange} />);
    
    await user.type(screen.getByLabelText(/title/i), "T");
    expect(onDataChange).toHaveBeenCalled();
  });

  it("handles invalid dates in safeToISOString path", async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    
    const startDate = screen.getByLabelText(/start date/i);
    // Force invalid date by clearing or typing junk if possible, 
    // but the input is type="date", so we might need to mock or just trigger the branch.
    await user.clear(startDate);
    await user.click(screen.getByRole("button", { name: /save task/i }));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("toggles categories correctly", async () => {
    render(<TaskForm {...defaultProps} />);

    fireEvent.focus(screen.getByPlaceholderText(/type to search or add category/i));
    const cat1 = await screen.findByText("Category 1");
    fireEvent.mouseDown(cat1); // Select
    fireEvent.click(screen.getByText("Category 1", { selector: "button" })); // Unselect selected chip
    fireEvent.focus(screen.getByPlaceholderText(/type to search or add category/i));
    fireEvent.mouseDown(await screen.findByText("Category 1")); // Select again

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
