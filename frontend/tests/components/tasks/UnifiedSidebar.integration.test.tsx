/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom";

// Mock child forms and modals to keep the test focused on UnifiedSidebar behaviour
vi.mock("@/components/tasks/TaskForm", () => ({
  default: (props: { onSubmit: (data: any) => void; onCancel?: () => void }) => (
    <div>
      <button data-testid="task-submit" onClick={() => props.onSubmit({ title: "T", deadline: "2024-01-01" })}>
        submit-task
      </button>
      <button data-testid="task-cancel" onClick={props.onCancel}>cancel-task</button>
    </div>
  ),
}));

vi.mock("@/components/events/EventForm", () => ({
  default: (props: { onSubmit: (data: any) => void; onCancel?: () => void }) => (
    <div>
      <button data-testid="event-submit" onClick={() => props.onSubmit({ title: "E", start_time: "2024-01-01" })}>
        submit-event
      </button>
      <button data-testid="event-cancel" onClick={props.onCancel}>cancel-event</button>
    </div>
  ),
}));

vi.mock("@/components/modals/RecurrenceScopeModal", () => ({ default: () => <div data-testid="recurrence-modal" /> }));
vi.mock("@/components/modals/ScopeActionModal", () => ({ default: () => <div data-testid="scope-action-modal" /> }));
vi.mock("@/components/modals/ConfirmationModal", () => ({ default: () => <div data-testid="confirmation-modal" /> }));

import UnifiedSidebar from "@/components/tasks/UnifiedSidebar";

describe("UnifiedSidebar integration", () => {
  afterEach(() => vi.restoreAllMocks());

  it("toggles modes and submits task -> calls onSubmitTask and onClose", () => {
    const onSubmitTask = vi.fn();
    const onClose = vi.fn();

    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={onClose}
        categories={[]}
        onSubmitTask={onSubmitTask}
        onSubmitEvent={vi.fn()}
      />,
    );

    // default mode is task -> task submit should be present
    expect(screen.getByTestId("task-submit")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("task-submit"));
    expect(onSubmitTask).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("switches to event mode and submits event -> calls onSubmitEvent and onClose", () => {
    const onSubmitEvent = vi.fn();
    const onClose = vi.fn();

    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={onClose}
        categories={[]}
        onSubmitTask={vi.fn()}
        onSubmitEvent={onSubmitEvent}
      />,
    );

    // switch to event mode
    fireEvent.click(screen.getByTestId("mode-toggle-event"));
    expect(screen.getByTestId("event-submit")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("event-submit"));
    expect(onSubmitEvent).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("renders delete button for existing task and calls onDelete/onClose", () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    const initialData = { id: 10, title: "x", deadline: "2024-01-01" } as any;

    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={onClose}
        categories={[]}
        initialData={initialData}
        onSubmitTask={vi.fn()}
        onSubmitEvent={vi.fn()}
        onDelete={onDelete}
      />,
    );

    const deleteBtn = screen.getByRole("button", { name: /Delete Task/i });
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
