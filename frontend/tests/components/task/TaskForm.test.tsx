import { it, describe, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { TaskForm } from "@/components/index"
import { type TaskSubmission, type Task } from "@/types"

describe("TaskForm", () => {
  afterEach(cleanup)

  const categories = [
    { id: 1, text: "Work" },
    { id: 2, text: "Personal" },
  ]

  it("should render form fields", () => {
    render(
      <TaskForm
        categories={categories}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/Title/i)).toBeDefined()
    expect(screen.getByLabelText(/Description/i)).toBeDefined()
    expect(screen.getByText(/Work/i)).toBeDefined()
    expect(screen.getByText(/Personal/i)).toBeDefined()
  })

  it("should call onSubmit with form data", () => {
    const onSubmit = vi.fn()
    render(
      <TaskForm
        categories={categories}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "New Task" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Save Task/i }))

    expect(onSubmit).toHaveBeenCalled()
    const callData = onSubmit.mock.calls[0][0] as TaskSubmission
    expect(callData.title).toBe("New Task")
  })

  it("should call onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn()
    render(
      <TaskForm
        categories={categories}
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it("should call onDataChange when title changes", () => {
    const onDataChange = vi.fn()
    render(
      <TaskForm
        categories={categories}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        onDataChange={onDataChange}
      />
    )
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "Updated" },
    })
    expect(onDataChange).toHaveBeenCalled()
  })

  it("should populate form with initialData", () => {
    const initialData: Task = {
      id: 1,
      title: "Initial",
      description: "Desc",
      importance: 8,
      estimated_minutes: 45,
      categories: [{ id: 1, text: "Work" }],
      start_time: "2023-01-01T10:00:00Z",
      deadline: "2023-01-01T11:00:00Z",
      completed: false,
    }
    render(
      <TaskForm
        categories={categories}
        initialData={initialData}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/Title/i)).toHaveValue("Initial")
    expect(screen.getByLabelText(/Description/i)).toHaveValue("Desc")
  })

  it("should toggle categories", () => {
    render(<TaskForm categories={categories} onSubmit={vi.fn()} onCancel={vi.fn()} />)
    const workCheckbox = screen.getByLabelText("Work")
    fireEvent.click(workCheckbox)
    expect(workCheckbox).toBeChecked()
    fireEvent.click(workCheckbox)
    expect(workCheckbox).not.toBeChecked()
  })

  it("should handle all field changes and trigger onDataChange", () => {
    const onDataChange = vi.fn()
    render(
      <TaskForm
        categories={categories}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        onDataChange={onDataChange}
      />
    )

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "Task" },
    })
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Desc" },
    })
    fireEvent.change(screen.getByLabelText(/Importance/i), {
      target: { value: "7" },
    })
    fireEvent.change(screen.getByLabelText(/Est. Minutes/i), {
      target: { value: "30" },
    })
    fireEvent.change(screen.getByLabelText(/Start Date/i), {
      target: { value: "2023-10-10" },
    })
    fireEvent.change(screen.getByLabelText(/Start Time/i), {
      target: { value: "10:00" },
    })
    fireEvent.change(screen.getByLabelText(/Deadline Date/i), {
      target: { value: "2023-10-11" },
    })
    fireEvent.change(screen.getByLabelText(/Deadline Time/i), {
      target: { value: "12:00" },
    })

    expect(onDataChange).toHaveBeenCalled()
  })

  it("should show error when deadline is before start time", () => {
    render(<TaskForm categories={categories} onSubmit={vi.fn()} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/Start Date/i), {
      target: { value: "2023-10-10" },
    })
    fireEvent.change(screen.getByLabelText(/Deadline Date/i), {
      target: { value: "2023-10-09" },
    })

    expect(screen.getByText(/Start time must be before the deadline/i)).toBeDefined()
    expect(screen.getByRole("button", { name: /Save Task/i })).toBeDisabled()
  })

  it("disables Save Task until at least one field changes", () => {
    render(
      <TaskForm
        categories={categories}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        initialData={{
          id: 1,
          title: "Existing Task",
          description: "Task description",
          start_time: "2026-02-20T10:00:00.000Z",
          deadline: "2026-02-20T11:00:00.000Z",
          importance: 5,
          completed: false,
          categories: [],
          estimated_minutes: 30,
        }}
      />
    )

    const saveButton = screen.getByRole("button", { name: /Save Task/i })
    expect(saveButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: "Existing Task Updated" } })
    expect(saveButton).not.toBeDisabled()
  })
})
