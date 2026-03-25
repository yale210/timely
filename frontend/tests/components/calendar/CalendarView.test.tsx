import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Views } from "react-big-calendar";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CalendarView from "@/components/calendar/CalendarView";
import type { CalendarEntry } from "@/utils/calendarAdapter";

vi.mock("react-dnd", () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-dnd-html5-backend", () => ({
  HTML5Backend: {},
}));

vi.mock("react-big-calendar/lib/addons/dragAndDrop", () => ({
  default: <T,>(Component: T) => Component,
}));

vi.mock("react-big-calendar", () => ({
  Views: { MONTH: "month", WEEK: "week", DAY: "day", AGENDA: "agenda" },
  momentLocalizer: () => ({}),
  Calendar: (props: {
    events: CalendarEntry[];
    components?: {
      event?: (args: { event: CalendarEntry }) => React.ReactNode;
    };
    onSelectSlot?: (slot: { start: Date }) => void;
    onSelectEvent?: (entry: CalendarEntry) => void;
    onEventDrop?: (args: { event: CalendarEntry; start: Date; end: Date }) => void;
    onEventResize?: (args: { event: CalendarEntry; start: Date; end: Date }) => void;
  }) => {
    const EventComponent = props.components?.event;
    return (
      <div data-testid="mock-calendar">
        <div
          className="rbc-time-gutter"
          ref={(node) => {
            if (!node) {
              return;
            }
            node.getBoundingClientRect = () =>
              ({
                width: 64,
                height: 0,
                top: 0,
                left: 0,
                right: 64,
                bottom: 0,
                x: 0,
                y: 0,
                toJSON: () => ({}),
              }) as DOMRect;
          }}
        />
        <button type="button" onClick={() => props.onSelectSlot?.({ start: new Date() })}>
          select-slot
        </button>
        <button
          type="button"
          className="rbc-event"
          data-testid="calendar-entry"
          onClick={() => props.onSelectEvent?.(props.events[0])}
        >
          select-entry
        </button>
        <button
          type="button"
          onClick={() =>
            props.onEventDrop?.({
              event: props.events[0],
              start: new Date(),
              end: new Date(),
            })
          }
        >
          drop-entry
        </button>
        <button
          type="button"
          onClick={() =>
            props.onEventResize?.({
              event: props.events[0],
              start: new Date(),
              end: new Date(),
            })
          }
        >
          resize-entry
        </button>
        {EventComponent ? <div>{EventComponent({ event: props.events[0] })}</div> : null}
      </div>
    );
  },
}));

const taskEntry: CalendarEntry = {
  id: "task-1-0",
  title: "Essay",
  start: new Date("2026-03-15T09:00:00.000Z"),
  end: new Date("2026-03-15T10:00:00.000Z"),
  actualEnd: new Date("2026-03-15T10:00:00.000Z"),
  allDay: false,
  kind: "task",
  sourceId: 1,
  taskData: {
    id: 1,
    title: "Essay",
    start_time: "2026-03-15T09:00:00.000Z",
    deadline: "2026-03-15T10:00:00.000Z",
    importance: 5,
    completed: false,
    categories: [],
    estimated_minutes: 60,
  },
  categories: [],
  scheduleIndex: 0,
};

describe("CalendarView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
  });

  it("renders the calendar and forwards interactions", async () => {
    const actions = {
      setView: vi.fn(),
      setDate: vi.fn(),
      selectSlot: vi.fn(),
      selectEntry: vi.fn(),
      handleEventDrop: vi.fn(),
      handleEventResize: vi.fn(),
      handleToggleTaskComplete: vi.fn(),
      setTimeGutterWidth: vi.fn(),
    };

    const { container } = render(
      <CalendarView
        state={{
          calendarEntries: [taskEntry],
          view: Views.WEEK,
          date: new Date("2026-03-15T00:00:00.000Z"),
          preference: {
            id: 1,
            day_start: "08:00:00",
            day_end: "22:00:00",
            max_hours_study_per_day: 4,
            max_days_ahead: 7,
            drag_snap_minutes: 15,
            days_off: [],
          },
          headerHeight: 64,
        }}
        actions={actions}
      />,
    );

    expect(container.querySelector("main")).toHaveStyle({ paddingTop: "64px" });

    await waitFor(() => expect(actions.setTimeGutterWidth).toHaveBeenCalledWith(64));

    fireEvent.click(screen.getByRole("button", { name: "select-slot" }));
    fireEvent.click(screen.getByTestId("calendar-entry"));
    fireEvent.click(screen.getByRole("button", { name: "drop-entry" }));
    fireEvent.click(screen.getByRole("button", { name: "resize-entry" }));
    fireEvent.click(screen.getByLabelText("Mark task complete"));

    expect(actions.selectSlot).toHaveBeenCalled();
    expect(actions.selectEntry).toHaveBeenCalledWith(taskEntry);
    expect(actions.handleEventDrop).toHaveBeenCalled();
    expect(actions.handleEventResize).toHaveBeenCalled();
    expect(actions.handleToggleTaskComplete).toHaveBeenCalledWith(1);
  });

  it("sets and clears the dragging dataset flag", () => {
    render(
      <CalendarView
        state={{
          calendarEntries: [taskEntry],
          view: Views.WEEK,
          date: new Date("2026-03-15T00:00:00.000Z"),
          preference: null,
          headerHeight: 0,
        }}
        actions={{
          setView: vi.fn(),
          setDate: vi.fn(),
          selectSlot: vi.fn(),
          selectEntry: vi.fn(),
          handleEventDrop: vi.fn(),
          handleEventResize: vi.fn(),
          handleToggleTaskComplete: vi.fn(),
          setTimeGutterWidth: vi.fn(),
        }}
      />,
    );

    fireEvent.mouseDown(screen.getByTestId("calendar-entry"));
    expect(document.documentElement.dataset.calendarDragging).toBe("true");

    fireEvent.mouseUp(window);
    expect(document.documentElement.dataset.calendarDragging).toBeUndefined();
  });
});
