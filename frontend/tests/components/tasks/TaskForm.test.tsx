import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import TaskForm from "@/components/tasks/TaskForm";

describe("TaskForm Component", () => {
  const mockCategories = [
    { id: 1, text: "Category 1" },
    { id: 2, text: "Category 2" },
  ];

  const defaultProps = {
    categories: mockCategories,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  it("renders with default values", () => {
    render(<TaskForm {...defaultProps} />);
    expect(screen.getByLabelText(/title/i)).toHaveValue("");
    expect(screen.getByLabelText(/importance/i)).toHaveValue(5);
    expect(screen.getByLabelText(/est. minutes/i)).toHaveValue(30);
  });

  it("handles input changes and submits", async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    
    await user.type(screen.getByLabelText(/title/i), "New Task");
    await user.type(screen.getByLabelText(/description/i), "Task description");
    
    // Toggle a category
    await user.click(screen.getByText("Category 1"));
    
    const saveButton = screen.getByRole("button", { name: /save task/i });
    expect(saveButton).not.toBeDisabled();
    
    await user.click(saveButton);
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
    
    const saveButton = screen.getByRole("button", { name: /save task/i });
    expect(saveButton).toBeDisabled();

    await user.clear(importanceInput);
    await user.type(importanceInput, "0");
    expect(saveButton).toBeDisabled();
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
    
    expect(screen.getByText(/start time must be before the deadline/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /save task/i })).toBeDisabled();
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
    // Invalid date should make it disabled
    expect(screen.getByRole("button", { name: /save task/i })).toBeDisabled();
  });

  it("toggles categories correctly", async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    
    const cat1 = screen.getByText("Category 1");
    await user.click(cat1); // Select
    await user.click(cat1); // Unselect
    await user.click(cat1); // Select again
    
    await user.type(screen.getByLabelText(/title/i), "Task");
    await user.click(screen.getByRole("button", { name: /save task/i }));
    
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
