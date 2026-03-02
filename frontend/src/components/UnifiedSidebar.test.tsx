import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import '@testing-library/jest-dom'
import UnifiedSidebar from "./UnifiedSidebar";
import { type Category, type Task, type Event, type TaskSubmission, type EventSubmission } from "../types";

const mockCategories: Category[] = [
  { id: 1, text: "Work" },
  { id: 2, text: "Personal" },
];

interface MockTaskFormProps {
  initialData: Partial<Task>;
  onDataChange: (data: Partial<Task>) => void;
  onSubmit: (data: TaskSubmission) => void;
  onCancel: () => void;
}

interface MockEventFormProps {
  initialData: Partial<Event>;
  onDataChange: (data: Partial<Event>) => void;
  onSubmit: (data: EventSubmission) => void;
  onCancel: () => void;
}

vi.mock("./TaskForm", () => ({
  default: ({ initialData, onDataChange, onSubmit, onCancel }: MockTaskFormProps) => (
    <div data-testid="mock-task-form">
      <label htmlFor="task-title">Title</label>
      <input
        id="task-title"
        value={initialData?.title ?? ""}
        onChange={(e) => onDataChange({ title: e.target.value })}
      />
      <label htmlFor="task-description">Description</label>
      <input
        id="task-description"
        value={initialData?.description ?? ""}
        onChange={(e) => onDataChange({ description: e.target.value })}
      />
      <button onClick={() => onSubmit({ title: "Submitted Task" })}>Save Task</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

vi.mock("./EventForm", () => ({
  default: ({ initialData, onDataChange, onSubmit, onCancel }: MockEventFormProps) => (
    <div data-testid="mock-event-form">
      <label htmlFor="event-title">Title</label>
      <input
        id="event-title"
        value={initialData?.title ?? ""}
        onChange={(e) => onDataChange({ title: e.target.value })}
      />
      <label htmlFor="event-description">Description</label>
      <input
        id="event-description"
        value={initialData?.description ?? ""}
        onChange={(e) => onDataChange({ description: e.target.value })}
      />
      <button onClick={() => onSubmit({ title: "Submitted Event" })}>Save Event</button>
      <button
        onClick={() =>
          onSubmit({
            title: "Submitted Event",
            recurrence_interval: "monthly",
          })
        }
      >
        Save Event Recurrence
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

describe("UnifiedSidebar", () => {
  afterEach(() => {
    cleanup();
  });

  it("preserves shared fields when switching from Task to Event mode", () => {
    const onSubmitTask = vi.fn();
    const onSubmitEvent = vi.fn();
    const onClose = vi.fn();

    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={onClose}
        categories={mockCategories}
        onSubmitTask={onSubmitTask}
        onSubmitEvent={onSubmitEvent}
      />
    );

    // Start in Task mode
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: "Shared Title" } });
    
    const descInput = screen.getByLabelText(/Description/i);
    fireEvent.change(descInput, { target: { value: "Shared Description" } });

    // Switch to Event mode
    const eventButton = screen.getByTestId("mode-toggle-event");
    fireEvent.click(eventButton);

    // Check if fields are preserved
    expect(screen.getByLabelText(/Title/i)).toHaveValue("Shared Title");
    expect(screen.getByLabelText(/Description/i)).toHaveValue("Shared Description");
  });

  it("preserves shared fields when switching from Event to Task mode", () => {
    const onSubmitTask = vi.fn();
    const onSubmitEvent = vi.fn();
    const onClose = vi.fn();

    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={onClose}
        initialMode="event"
        categories={mockCategories}
        onSubmitTask={onSubmitTask}
        onSubmitEvent={onSubmitEvent}
      />
    );

    // Start in Event mode
    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: "Event Title" } });

    // Switch to Task mode
    const taskButton = screen.getByTestId("mode-toggle-task");
    fireEvent.click(taskButton);

    // Check if fields are preserved
    expect(screen.getByLabelText(/Title/i)).toHaveValue("Event Title");
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <UnifiedSidebar
        isOpen={false}
        onClose={vi.fn()}
        categories={mockCategories}
        onSubmitTask={vi.fn()}
        onSubmitEvent={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("handles initialData for a Task", () => {
    const task: Task = {
      id: 1,
      title: "Existing Task",
      description: "Task Desc",
      start_time: new Date().toISOString(),
      deadline: new Date().toISOString(),
      importance: 5,
      completed: false,
      categories: [],
      estimated_minutes: 30
    };
    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        initialData={task}
        onSubmitTask={vi.fn()}
        onSubmitEvent={vi.fn()}
      />
    );
    expect(screen.getByText(/Edit Task/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toHaveValue("Existing Task");
  });

  it("handles initialData for an Event", () => {
    const event: Event = {
      id: 1,
      title: "Existing Event",
      description: "Event Desc",
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      categories: [],
      reminders: []
    };
    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        initialData={event}
        initialMode="event"
        onSubmitTask={vi.fn()}
        onSubmitEvent={vi.fn()}
      />
    );
    expect(screen.getByText(/Edit Event/i)).toBeInTheDocument();
    expect(screen.getByTestId("mock-event-form")).toBeInTheDocument();
  });

  it("shows modified-instance badge for override event instances", () => {
    const event: Event = {
      id: 1,
      title: "Existing Event",
      description: "Event Desc",
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      categories: [],
      reminders: [],
      is_override: true,
    };

    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        initialData={event}
        initialMode="event"
        onSubmitTask={vi.fn()}
        onSubmitEvent={vi.fn()}
      />
    );

    expect(screen.getByText("Modified Instance")).toBeInTheDocument();
  });

  it("shows split-series badge for split recurring events", () => {
    const event: Event = {
      id: 1,
      title: "Split Event",
      description: "Event Desc",
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      categories: [],
      reminders: [],
      is_split_series: true,
    };

    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        initialData={event}
        initialMode="event"
        onSubmitTask={vi.fn()}
        onSubmitEvent={vi.fn()}
      />
    );

    expect(screen.getByText("Split Series")).toBeInTheDocument();
  });

  it("shows revert action for override event instances and calls onRevertToSeries", () => {
    const onRevertToSeries = vi.fn();
    const event: Event = {
      id: 1,
      title: "Existing Event",
      description: "Event Desc",
      start_time: "2026-02-20T10:00:00.000Z",
      end_time: "2026-02-20T11:00:00.000Z",
      categories: [],
      reminders: [],
      is_override: true,
      original_start_time: "2026-02-20T10:00:00.000Z",
    };

    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        initialData={event}
        initialMode="event"
        onSubmitTask={vi.fn()}
        onSubmitEvent={vi.fn()}
        onRevertToSeries={onRevertToSeries}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Revert To Series" }));
    fireEvent.click(screen.getByRole("button", { name: "Revert" }));

    expect(onRevertToSeries).toHaveBeenCalledWith({
      scope: "this",
      original_start_time: event.original_start_time,
    });
  });

  it("handles initialData without id (Create mode)", () => {
    const template: Partial<Event> = {
      title: "Template Title",
      start_time: new Date().toISOString(),
    };
    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        initialData={template as Event}
        onSubmitTask={vi.fn()}
        onSubmitEvent={vi.fn()}
      />
    );
    // Should show "Create New" not "Edit Event"
    expect(screen.getByText(/Create New/i)).toBeInTheDocument();
    // Mode toggle should be visible
    expect(screen.getByTestId("mode-toggle-task")).toBeInTheDocument();
    expect(screen.getByTestId("mode-toggle-event")).toBeInTheDocument();
    // Template data should be pre-filled
    expect(screen.getByLabelText(/Title/i)).toHaveValue("Template Title");
  });

  it("calls onDelete when delete button is clicked", () => {
    const onDelete = vi.fn();
    const task: Task = {
      id: 1,
      title: "Task",
      start_time: new Date().toISOString(),
      deadline: new Date().toISOString(),
      importance: 5,
      completed: false,
      categories: [],
      estimated_minutes: 30
    };
    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        initialData={task}
        onSubmitTask={vi.fn()}
        onSubmitEvent={vi.fn()}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByText(/Delete Task/i));
    expect(onDelete).toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={onClose}
        categories={mockCategories}
        onSubmitTask={vi.fn()}
        onSubmitEvent={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("close")); // material icon text
    expect(onClose).toHaveBeenCalled();
  });

  it("disables this-event scope when recurrence pattern changes", () => {
    const event: Event = {
      id: 1,
      title: "Recurring Event",
      description: "Event Desc",
      start_time: "2026-02-20T10:00:00.000Z",
      end_time: "2026-02-20T11:00:00.000Z",
      recurrence_interval: "weekly",
      recurrence_end: "2026-05-01",
      categories: [],
      reminders: [],
      original_start_time: "2026-02-20T10:00:00.000Z",
    };

    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={mockCategories}
        initialData={event}
        initialMode="event"
        onSubmitTask={vi.fn()}
        onSubmitEvent={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Event Recurrence" }));

    expect(screen.getByRole("button", { name: "This event" })).toBeDisabled();
    expect(
      screen.getByText(/Pattern changes require This and following or All events/i),
    ).toBeInTheDocument();
  });

  it("uses in-app scope confirmation for recurring delete", () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    const event: Event = {
      id: 1,
      title: "Recurring Event",
      description: "Event Desc",
      start_time: "2026-02-20T10:00:00.000Z",
      end_time: "2026-02-20T11:00:00.000Z",
      recurrence_interval: "weekly",
      recurrence_end: "2026-05-01",
      categories: [],
      reminders: [],
      original_start_time: "2026-02-20T10:00:00.000Z",
    };

    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={onClose}
        categories={mockCategories}
        initialData={event}
        initialMode="event"
        onSubmitTask={vi.fn()}
        onSubmitEvent={vi.fn()}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Delete Event/i }));
    fireEvent.click(screen.getByRole("button", { name: "All events" }));

    expect(screen.getByText("Delete all events in this series?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete All Events" }));

    expect(onDelete).toHaveBeenCalledWith({
      scope: "all",
      original_start_time: event.original_start_time,
    });
    expect(onClose).toHaveBeenCalled();
  });
});
