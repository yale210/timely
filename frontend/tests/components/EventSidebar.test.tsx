import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import EventSidebar from "@/components/events/EventSidebar";
import type { Event } from "@/types";
import { getServerTime } from "@/services/eventService";

vi.mock("@/services/eventService", () => ({
  getServerTime: vi.fn(),
}));

const recurringEvent: Event = {
  id: 7,
  title: "Recurring Lecture",
  description: "Weekly recurring event",
  location: "Room A",
  start_time: "2026-02-20T10:00:00.000Z",
  end_time: "2026-02-20T11:00:00.000Z",
  recurrence_interval: "weekly",
  recurrence_end: "2026-05-01",
  categories: [],
  reminders: [],
  original_start_time: "2026-02-20T10:00:00.000Z",
};

describe("EventSidebar Component", () => {
  const onCreateCategory = vi.fn().mockResolvedValue({ id: 1, text: "Work" });
  const onUpdateCategory = vi.fn().mockResolvedValue({ id: 1, text: "Work" });
  const onDeleteCategory = vi.fn().mockResolvedValue(undefined);

  it("renders Add New Event when no initialData id", () => {
    render(
      <EventSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={[]}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByText("Add New Event")).toBeDefined();
  });

  it("handles non-recurring submission", () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(
      <EventSidebar
        isOpen={true}
        onClose={onClose}
        categories={[]}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: "New Event" } });
    fireEvent.click(screen.getByRole("button", { name: /save event/i }));

    expect(onSubmit).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("handles non-recurring deletion", () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    const nonRecurringEvent = { ...recurringEvent, recurrence_interval: undefined };
    
    render(
      <EventSidebar
        isOpen={true}
        onClose={onClose}
        categories={[]}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={vi.fn()}
        onDelete={onDelete}
        initialData={nonRecurringEvent}
      />
    );

    fireEvent.click(screen.getByTitle("Delete Event"));
    expect(screen.getByText(/Are you sure you want to delete this event/i)).toBeDefined();
    
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    
    expect(onDelete).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <EventSidebar
        isOpen={true}
        onClose={onClose}
        categories={[]}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("close"));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("EventSidebar recurrence scope", () => {
  const onCreateCategory = vi.fn().mockResolvedValue({ id: 1, text: "Work" });
  const onUpdateCategory = vi.fn().mockResolvedValue({ id: 1, text: "Work" });
  const onDeleteCategory = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getServerTime).mockResolvedValue({ server_time: new Date().toISOString() });
  });

  it("shows modified-instance badge for override events", () => {
    render(
      <EventSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={[]}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={vi.fn()}
        initialData={{ ...recurringEvent, is_override: true }}
      />,
    );

    expect(screen.getByText("Modified Instance")).toBeInTheDocument();
  });

  it("shows split-series badge for split recurring events", () => {
    render(
      <EventSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={[]}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={vi.fn()}
        initialData={{ ...recurringEvent, is_split_series: true }}
      />,
    );

    expect(screen.getByText("Split Series")).toBeInTheDocument();
  });

  it("opens scope modal on recurring save and passes context", async () => {
    const onSubmit = vi.fn();

    render(
      <EventSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={[]}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={onSubmit}
        initialData={recurringEvent}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "Recurring Lecture Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save event/i }));
    expect(screen.getByText("Choose scope")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "This event" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.any(Object),
      {
        scope: "this",
        original_start_time: recurringEvent.original_start_time,
      },
    );
  });

  it("opens scope modal on recurring delete and passes context", async () => {
    const onDelete = vi.fn();

    render(
      <EventSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={[]}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={vi.fn()}
        onDelete={onDelete}
        initialData={recurringEvent}
      />,
    );

    fireEvent.click(screen.getByTitle("Delete Event"));
    expect(screen.getByText("Choose scope")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All events" }));
    expect(screen.getByText("Delete all events in this series?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete All Events" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
    expect(onDelete).toHaveBeenCalledWith({
      scope: "all",
      original_start_time: recurringEvent.original_start_time,
    });
  });

  it("shows revert action for override instances and calls onRevertToSeries", async () => {
    const onRevertToSeries = vi.fn();

    render(
      <EventSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={[]}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={vi.fn()}
        onRevertToSeries={onRevertToSeries}
        initialData={{ ...recurringEvent, is_override: true }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Revert To Series" }));
    fireEvent.click(screen.getByRole("button", { name: "Revert" }));

    await waitFor(() => expect(onRevertToSeries).toHaveBeenCalledTimes(1));
    expect(onRevertToSeries).toHaveBeenCalledWith({
      scope: "this",
      original_start_time: recurringEvent.original_start_time,
    });
  });

  it("updates the form when switching to another instance with the same base id", () => {
    const { rerender } = render(
      <EventSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={[]}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={vi.fn()}
        initialData={recurringEvent}
      />,
    );

    expect(screen.getByLabelText("Title")).toHaveValue("Recurring Lecture");

    const anotherInstance: Event = {
      ...recurringEvent,
      title: "Recurring Lecture Override",
      start_time: "2026-02-27T10:00:00.000Z",
      end_time: "2026-02-27T11:00:00.000Z",
      original_start_time: "2026-02-27T10:00:00.000Z",
      instance_id: "7:2026-02-27T10:00:00+00:00:override",
    };

    rerender(
      <EventSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={[]}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={vi.fn()}
        initialData={anotherInstance}
      />,
    );

    expect(screen.getByLabelText("Title")).toHaveValue("Recurring Lecture Override");
  });

  it("disables this-event scope when recurrence pattern changes", () => {
    render(
      <EventSidebar
        isOpen={true}
        onClose={vi.fn()}
        categories={[]}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        onSubmit={vi.fn()}
        initialData={recurringEvent}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Interval/i), {
      target: { value: "monthly" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save event/i }));

    const thisEventButton = screen.getByRole("button", { name: "This event" });
    expect(thisEventButton).toBeDisabled();
    expect(
      screen.getByText(/Pattern changes require This and following or All events/i),
    ).toBeInTheDocument();
  });
});
