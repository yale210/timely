import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { useRecurrenceScopeActions } from "@/hooks/tasks/useRecurrenceScopeActions";
import type { Event, EventSubmission } from "@/types";

interface Props {
  selectedEvent?: Partial<Event> | undefined;
  submission?: Partial<EventSubmission> | null;
  onSubmitEvent?: (data: EventSubmission, context?: unknown) => void;
  onDelete?: (context?: unknown) => void;
  onRevertToSeries?: (context: unknown) => void;
  onClose?: () => void;
}

const TestHarness = ({
  selectedEvent,
  submission = null,
  onSubmitEvent = vi.fn(),
  onDelete = vi.fn(),
  onRevertToSeries = vi.fn(),
  onClose = vi.fn(),
}: Props) => {
  const hook = useRecurrenceScopeActions({
    selectedEvent: selectedEvent as Event | undefined,
    onSubmitEvent: onSubmitEvent as (d: EventSubmission, c?: unknown) => void,
    onDelete: onDelete as (c?: unknown) => void,
    onRevertToSeries: onRevertToSeries as (c: unknown) => void,
    onClose,
  });

  const sampleSubmission = (submission ?? { title: "T", recurrence_interval: "weekly" }) as EventSubmission;

  return (
    <div>
      <div data-testid="isScopeOpen">{String(hook.isScopeModalOpen)}</div>
      <div data-testid="isAdvancedOpen">{String(hook.isAdvancedScopeModalOpen)}</div>
      <div data-testid="pendingSubmission">{JSON.stringify(hook.pendingSubmission)}</div>
      <button onClick={() => hook.openSaveScope(sampleSubmission)}>open-save</button>
      <button onClick={() => hook.handleScopeSelect("this")}>select-this</button>
      <button onClick={() => hook.handleScopeSelect("following")}>select-following</button>
      <button onClick={() => hook.scopeActionModalProps.onConfirm()}>confirm-advanced</button>
      <button onClick={() => hook.openDeleteScope()}>open-delete</button>
      <button onClick={() => hook.openRevertModal()}>open-revert</button>
      <button onClick={() => hook.performRevert()}>perform-revert</button>
    </div>
  );
};

describe("useRecurrenceScopeActions hook", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("alerts and prevents 'this' save when recurrence pattern changed", () => {

    const onSubmit = vi.fn();
    const onClose = vi.fn();
    const alertSpy = vi.fn();
    // selected event has recurrence_interval 'daily', submission will have 'weekly' -> pattern changed
    const selectedEvent = { id: 1, recurrence_interval: "daily", start_time: "2020-01-01T00:00:00Z" } as unknown as Event;

    // stub alert
    vi.stubGlobal("alert", alertSpy);

    render(
      <TestHarness
        selectedEvent={selectedEvent}
        submission={{ recurrence_interval: "weekly" }}
        onSubmitEvent={onSubmit}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText("open-save"));
    // pendingSubmission should be set
    expect(screen.getByTestId("pendingSubmission").textContent).toContain("recurrence_interval");

    fireEvent.click(screen.getByText("select-this"));

    expect(alertSpy).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onSubmitEvent and onClose for 'this' when pattern unchanged", () => {

    const onSubmit = vi.fn();
    const onClose = vi.fn();
    const selectedEvent = { id: 2, recurrence_interval: "weekly", original_start_time: "2020-02-02T00:00:00Z" } as unknown as Event;

    render(
      <TestHarness
        selectedEvent={selectedEvent}
        submission={{ recurrence_interval: "weekly" }}
        onSubmitEvent={onSubmit}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText("open-save"));
    fireEvent.click(screen.getByText("select-this"));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    // ensure context contains scope and original_start_time
  const [[, context]] = onSubmit.mock.calls as unknown as [unknown, { scope?: string }][];
  expect(context).toBeDefined();
  expect(context.scope).toBe("this");
    expect(onClose).toHaveBeenCalled();
  });

  it("opens advanced scope for non-'this' selection and confirms save", () => {

    const onSubmit = vi.fn();
    const onClose = vi.fn();
    const selectedEvent = { id: 3, recurrence_interval: "weekly", start_time: "2020-03-03T00:00:00Z" } as unknown as Event;

    render(
      <TestHarness
        selectedEvent={selectedEvent}
        submission={{ recurrence_interval: "weekly" }}
        onSubmitEvent={onSubmit}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText("open-save"));
    fireEvent.click(screen.getByText("select-following"));

    // advanced modal should be opened (isAdvancedOpen true)
    expect(screen.getByTestId("isAdvancedOpen").textContent).toBe("true");

    fireEvent.click(screen.getByText("confirm-advanced"));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
  });

  it("handles delete flow via advanced scope", () => {

    const onDelete = vi.fn();
    const onClose = vi.fn();
    const selectedEvent = { id: 4, recurrence_interval: "weekly", start_time: "2020-04-04T00:00:00Z" } as unknown as Event;

    render(
      <TestHarness
        selectedEvent={selectedEvent}
        submission={{ recurrence_interval: "weekly" }}
        onDelete={onDelete}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText("open-delete"));
    // choose advanced scope
    fireEvent.click(screen.getByText("select-following"));
    fireEvent.click(screen.getByText("confirm-advanced"));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
  });

  it("performs revert when original anchor present", () => {

    const onRevert = vi.fn();
    const onClose = vi.fn();
    const selectedEvent = { id: 5, original_start_time: "2020-05-05T00:00:00Z" } as unknown as Event;

    render(
      <TestHarness selectedEvent={selectedEvent} onRevertToSeries={onRevert} onClose={onClose} />,
    );

    fireEvent.click(screen.getByText("open-revert"));
    fireEvent.click(screen.getByText("perform-revert"));

    expect(onRevert).toHaveBeenCalledTimes(1);
    const [[context]] = onRevert.mock.calls as unknown as [Record<string, unknown>][];
    expect(context.scope).toBe("this");
    expect(onClose).toHaveBeenCalled();
  });
});
