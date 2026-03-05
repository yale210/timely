/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-empty-function, react/display-name */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Headless UI Transition to avoid requiring `show` prop in tests
vi.mock("@headlessui/react", async () => {
  const actual = await vi.importActual<any>("@headlessui/react");
  const Transition = (props: any) => <div>{props.children}</div>;
  // attach Child and Root so components referencing Transition.Child / Transition.Root don't fail
  (Transition as any).Child = (props: any) => <div>{props.children}</div>;
  (Transition as any).Root = Transition;

  const Dialog = (props: any) => <div>{props.children}</div>;

  return {
    ...actual,
    Transition,
    Dialog,
  };
});

// Mock TaskForm and EventForm to keep tests focused on UnifiedSidebar branches
vi.mock("@/components/tasks/TaskForm", () => ({
  __esModule: true,
  default: (props: any) => (
    <div>
      <button data-testid="submit-task" onClick={() => props.onSubmit({ title: "t" })}>
        submit-task
      </button>
    </div>
  ),
}));

vi.mock("@/components/events/EventForm", () => ({
  __esModule: true,
  default: (props: any) => (
    <div>
      <button data-testid="submit-event" onClick={() => props.onSubmit({ title: "e" })}>
        submit-event
      </button>
    </div>
  ),
}));

// Mock modal components to avoid headlessui rendering in tests
vi.mock("@/components/modals/RecurrenceScopeModal", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="recurrence-scope-modal" {...props} />,
}));

vi.mock("@/components/modals/ScopeActionModal", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="scope-action-modal" {...props} />,
}));

vi.mock("@/components/modals/ConfirmationModal", async () => {
  const shim = await import("../../../tests/utils/ConfirmationModalShim");
  return { __esModule: true, default: shim.default };
});

describe("UnifiedSidebar branch coverage targets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Modified Instance and calls openRevertModal when provided", async () => {
    const openRevertModal = vi.fn();

    // Mock the recurrence hook to provide our openRevertModal
    vi.resetModules();
    vi.doMock("@/hooks/tasks/useRecurrenceScopeActions", () => ({
      useRecurrenceScopeActions: () => ({
        isEditingRecurringEvent: false,
        openSaveScope: vi.fn(),
        openDeleteScope: vi.fn(),
        openRevertModal,
        recurrenceScopeModalProps: {},
        scopeActionModalProps: {},
        revertModalProps: {},
      }),
    }));

  const { default: UnifiedSidebar } = await import("@/components/tasks/UnifiedSidebar");

    const fakeEvent = {
      id: 42,
      title: "An event",
      description: "d",
      start_time: "2026-03-04T10:00:00Z",
      end_time: "2026-03-04T11:00:00Z",
      is_override: true,
    } as any;

    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={() => {}}
        initialMode="event"
        categories={[]}
        initialData={fakeEvent}
        onSubmitTask={() => {}}
        onSubmitEvent={() => {}}
        onDelete={() => {}}
        onRevertToSeries={() => {}}
      />
    );

    // Modified Instance badge should be present
    expect(screen.getByText(/Modified Instance/i)).toBeTruthy();

    // Revert To Series button should be present and call openRevertModal
    const btn = screen.getByRole("button", { name: /Revert To Series/i });
    await userEvent.click(btn);
    expect(openRevertModal).toHaveBeenCalled();
  });

  it("opens save scope on event submit when editing recurring event is true", async () => {
    const openSaveScope = vi.fn();
    const onSubmitEvent = vi.fn();

    vi.resetModules();
    vi.doMock("@/hooks/tasks/useRecurrenceScopeActions", () => ({
      useRecurrenceScopeActions: () => ({
        isEditingRecurringEvent: true,
        openSaveScope,
        openDeleteScope: vi.fn(),
        openRevertModal: vi.fn(),
        recurrenceScopeModalProps: {},
        scopeActionModalProps: {},
        revertModalProps: {},
      }),
    }));

  const { default: UnifiedSidebar } = await import("@/components/tasks/UnifiedSidebar");

    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={() => {}}
        initialMode="event"
        categories={[]}
        onSubmitTask={() => {}}
        onSubmitEvent={onSubmitEvent}
      />
    );

    // click the mocked EventForm submit button
    await userEvent.click(screen.getByTestId("submit-event"));

    // should call openSaveScope instead of onSubmitEvent directly
    expect(openSaveScope).toHaveBeenCalled();
    expect(onSubmitEvent).not.toHaveBeenCalled();
  });

  it("opens delete scope when deleting an event that is recurring", async () => {
    const openDeleteScope = vi.fn();
    const onDelete = vi.fn();

    vi.resetModules();
    vi.doMock("@/hooks/tasks/useRecurrenceScopeActions", () => ({
      useRecurrenceScopeActions: () => ({
        isEditingRecurringEvent: true,
        openSaveScope: vi.fn(),
        openDeleteScope,
        openRevertModal: vi.fn(),
        recurrenceScopeModalProps: {},
        scopeActionModalProps: {},
        revertModalProps: {},
      }),
    }));

  const { default: UnifiedSidebar } = await import("@/components/tasks/UnifiedSidebar");

    const fakeEvent = {
      id: 50,
      title: "Delete me",
      start_time: "2026-03-04T10:00:00Z",
      end_time: "2026-03-04T11:00:00Z",
    } as any;

    render(
      <UnifiedSidebar
        isOpen={true}
        onClose={() => {}}
        initialMode="event"
        categories={[]}
        initialData={fakeEvent}
        onSubmitTask={() => {}}
        onSubmitEvent={() => {}}
        onDelete={onDelete}
      />
    );

    const delBtn = screen.getByRole("button", { name: /Delete Event/i });
    await userEvent.click(delBtn);

    expect(openDeleteScope).toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
