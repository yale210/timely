import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import moment from "moment";

import CalendarPage from "@/pages/Calendar";
import * as taskService from "@/services/taskService";
import * as eventService from "@/services/eventService";
import type {
  Task,
  Event,
  Category,
  TaskSubmission,
  EventMutationContext,
  EventSubmission,
} from "@/types";

// ----------------------
// Mocks
// ----------------------
vi.mock("@/services/taskService");
vi.mock("@/services/eventService");

// Mock react-big-calendar so we don't depend on rbc DOM internals.
// We provide 2 buttons:
// - Select Slot -> calls onSelectSlot
// - Each event is a button -> calls onSelectEvent(eventObject)
interface SlotInfo { start: Date };

interface MockCalendarEventLike {
  id: string;
  title: string;
}

interface MockRbcProps {
  events?: MockCalendarEventLike[];
  onSelectSlot?: (slotInfo: SlotInfo) => void;
  onSelectEvent?: (event: MockCalendarEventLike) => void;
}

vi.mock("react-big-calendar", () => {
  return {
    Views: { MONTH: "month", WEEK: "week", DAY: "day", AGENDA: "agenda" },
    momentLocalizer: () => ({}),
    Calendar: (props: MockRbcProps) => (
      <div data-testid="mock-rbc">
        <button
          data-testid="mock-select-slot"
          onClick={() =>
            props.onSelectSlot?.({ start: new Date("2026-02-12T10:00:00.000Z") })
          }
        >
          Select Slot
        </button>

        <div data-testid="mock-events">
          {(props.events ?? []).map((e) => (
            <button
              key={e.id}
              data-testid={`mock-event-${e.id}`}
              onClick={() => props.onSelectEvent?.(e)}
            >
              {e.title}
            </button>
          ))}
        </div>
      </div>
    ),
  };
});


// Capture sidebar props so tests can directly call handlers if needed
interface MockUnifiedSidebarProps {
  isOpen: boolean;
  initialMode: "task" | "event";
  onSubmitTask: (data: TaskSubmission) => void;
  onSubmitEvent: (data: EventSubmission, context?: EventMutationContext) => void;
  onDelete: (context?: EventMutationContext) => void;
  onClose: () => void;
  initialData?: Task | Event;
  categories: Category[];
}

let sidebarProps: MockUnifiedSidebarProps | null = null;

// Mock UnifiedSidebar to avoid rendering real sidebar UI.
// If isOpen is false -> render nothing.
// If isOpen is true -> render controls to trigger handlers.
vi.mock("@/components", async () => {
  const actual = await vi.importActual("@/components");
  return {
    ...actual,
    UnifiedSidebar: vi.fn((props: MockUnifiedSidebarProps) => {
      sidebarProps = props;
      if (!props.isOpen) return null;

      return (
        <div data-testid="mock-sidebar">
          <div data-testid="sidebar-mode">{props.initialMode}</div>

          <button
            data-testid="sidebar-submit-task"
            onClick={() =>
              props.onSubmitTask?.({
                title: "Task from sidebar",
                description: "",
                deadline: new Date().toISOString(),
                importance: 5,
                estimated_minutes: 30,
                categories: [],
              } satisfies TaskSubmission)
            }
          >
            Submit Task
          </button>

          <button
            data-testid="sidebar-submit-event"
            onClick={() =>
              props.onSubmitEvent?.({
                title: "Event from sidebar",
              } satisfies EventSubmission)
            }
          >
            Submit Event
          </button>

          <button data-testid="sidebar-delete" onClick={() => props.onDelete?.()}>
            Delete
          </button>

          <button data-testid="sidebar-close" onClick={() => props.onClose?.()}>
            Close
          </button>
        </div>
      );
    }),
  };
});

// Needed for react-big-calendar in jsdom sometimes
class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
  ResizeObserver;

// ----------------------
// Test data
// ----------------------
const mockTasks: Task[] = [
  {
    id: 1,
    title: "Test Task",
    description: "",
    start_time: new Date("2026-02-12T09:00:00.000Z").toISOString(),
    deadline: new Date("2026-02-12T10:00:00.000Z").toISOString(),
    importance: 5,
    estimated_minutes: 60,
    completed: false,
    categories: [],
    allocation: [
      {
        start: new Date("2026-02-12T09:00:00.000Z").toISOString(),
        end: new Date("2026-02-12T10:00:00.000Z").toISOString(),
      },
    ],
    total_task_allocations: 1,
  },
];

const mockEvents: Event[] = [
  {
    id: 1,
    title: "Test Event",
    start_time: new Date("2026-02-12T11:00:00.000Z").toISOString(),
    end_time: moment("2026-02-12T11:00:00.000Z").add(1, "hour").toISOString(),
    categories: [],
    recurrence_interval: null,
    recurrence_end: null,
    reminders: [],
  },
];

const mockCategories: Category[] = [{ id: 1, text: "Work" }];
const eventEntryTestId = `mock-event-event-${mockEvents[0].id}-${mockEvents[0].start_time}`;

// Helper render
const renderPage = () =>
  render(
    <MemoryRouter>
      <CalendarPage />
    </MemoryRouter>
  );

// ----------------------
// Suites
// ----------------------
describe("CalendarPage (lean tests)", () => {
  afterEach(() => {
    cleanup();
    sidebarProps = null;
    vi.clearAllMocks();
  });

  describe("renders + loads data", () => {
    beforeEach(() => {
      vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks);
      vi.mocked(taskService.getCategories).mockResolvedValue(mockCategories);
      vi.mocked(eventService.getEvents).mockResolvedValue(mockEvents);

      renderPage();
    });

    it("renders header + view buttons + current month", async () => {
      await waitFor(() => expect(screen.getByText("Calendar")).toBeTruthy());

      expect(screen.getByText("Today")).toBeTruthy();
      expect(screen.getByText("Month")).toBeTruthy();
      expect(screen.getByText("Week")).toBeTruthy();
      expect(screen.getByText("Day")).toBeTruthy();
      expect(screen.getByText("Agenda")).toBeTruthy();

      const currentMonthYear = moment().format("MMMM YYYY");
      expect(screen.getByText(currentMonthYear)).toBeTruthy();
    });

    it("calls task/event/category fetch on mount", async () => {
      await waitFor(() => {
        expect(taskService.getTasks).toHaveBeenCalledTimes(1);
        expect(eventService.getEvents).toHaveBeenCalledTimes(1);
        expect(taskService.getCategories).toHaveBeenCalledTimes(1);
      });
    });

    it("passes combined entries (task + event) to Calendar mock", async () => {
      // our mock renders each event title as a button
      await waitFor(() => {
        expect(screen.getByText("Test Task")).toBeTruthy();
        expect(screen.getByText("Test Event")).toBeTruthy();
      });
    });
  });

  describe("error handling", () => {
    it("handles getTasks error (logs + still renders)", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

      vi.mocked(taskService.getTasks).mockRejectedValue(new Error("tasks fail"));
      vi.mocked(taskService.getCategories).mockResolvedValue([]);
      vi.mocked(eventService.getEvents).mockResolvedValue([]);

      renderPage();

      await waitFor(() => expect(screen.getByText("Calendar")).toBeTruthy());
      await waitFor(() => expect(consoleSpy).toHaveBeenCalled());

      consoleSpy.mockRestore();
    });

    it("handles getEvents error (logs + still renders)", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

      vi.mocked(taskService.getTasks).mockResolvedValue([]);
      vi.mocked(taskService.getCategories).mockResolvedValue([]);
      vi.mocked(eventService.getEvents).mockRejectedValue(new Error("events fail"));

      renderPage();

      await waitFor(() => expect(screen.getByText("Calendar")).toBeTruthy());
      await waitFor(() => expect(consoleSpy).toHaveBeenCalled());

      consoleSpy.mockRestore();
    });

    it("handles getCategories error (logs + still renders)", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

      vi.mocked(taskService.getTasks).mockResolvedValue([]);
      vi.mocked(taskService.getCategories).mockRejectedValue(new Error("cats fail"));
      vi.mocked(eventService.getEvents).mockResolvedValue([]);

      renderPage();

      await waitFor(() => expect(screen.getByText("Calendar")).toBeTruthy());
      await waitFor(() => expect(consoleSpy).toHaveBeenCalled());

      consoleSpy.mockRestore();
    });
  });

  describe("sidebar interactions (slot + select + CRUD)", () => {
    beforeEach(() => {
      vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks);
      vi.mocked(taskService.getCategories).mockResolvedValue(mockCategories);
      vi.mocked(eventService.getEvents).mockResolvedValue(mockEvents);

      vi.mocked(taskService.createTask).mockResolvedValue({} as never);
      vi.mocked(taskService.updateTask).mockResolvedValue({} as never);
      vi.mocked(taskService.deleteTask).mockResolvedValue(undefined);

      vi.mocked(eventService.createEvent).mockResolvedValue({} as never);
      vi.mocked(eventService.updateEvent).mockResolvedValue({} as never);
      vi.mocked(eventService.deleteEvent).mockResolvedValue(undefined);

      renderPage();
    });

    it("opens sidebar on slot select (defaults to task mode)", async () => {
      await waitFor(() => expect(screen.getByText("Calendar")).toBeTruthy());

      fireEvent.click(screen.getByTestId("mock-select-slot"));

      await waitFor(() => expect(screen.getByTestId("mock-sidebar")).toBeTruthy());
      expect(screen.getByTestId("sidebar-mode").textContent).toBe("task");
    });

    it("opens sidebar in task mode when clicking a task entry", async () => {
      await waitFor(() => expect(screen.getByTestId("mock-event-task-1-0")).toBeTruthy());
      fireEvent.click(screen.getByTestId("mock-event-task-1-0"));

      await waitFor(() => expect(screen.getByTestId("mock-sidebar")).toBeTruthy());
      expect(screen.getByTestId("sidebar-mode").textContent).toBe("task");
    });

    it("opens sidebar in event mode when clicking an event entry", async () => {
      await waitFor(() => expect(screen.getByTestId(eventEntryTestId)).toBeTruthy());

      fireEvent.click(screen.getByTestId(eventEntryTestId));

      await waitFor(() => expect(screen.getByTestId("mock-sidebar")).toBeTruthy());
      expect(screen.getByTestId("sidebar-mode").textContent).toBe("event");
    });

    it("creates a task when slot selected (id=0) then submit-task", async () => {
      fireEvent.click(screen.getByTestId("mock-select-slot"));
      await waitFor(() => expect(screen.getByTestId("mock-sidebar")).toBeTruthy());

      fireEvent.click(screen.getByTestId("sidebar-submit-task"));

      await waitFor(() => expect(taskService.createTask).toHaveBeenCalledTimes(1));
      expect(taskService.updateTask).not.toHaveBeenCalled();
    });

    it("updates a task when existing task selected then submit-task", async () => {
      await waitFor(() => expect(screen.getByTestId("mock-event-task-1-0")).toBeTruthy());
      fireEvent.click(screen.getByTestId("mock-event-task-1-0"));
      await waitFor(() => expect(screen.getByTestId("mock-sidebar")).toBeTruthy());

      fireEvent.click(screen.getByTestId("sidebar-submit-task"));

      await waitFor(() => expect(taskService.updateTask).toHaveBeenCalledTimes(1));
      expect(taskService.createTask).not.toHaveBeenCalled();
    });

    it("updates an event when existing event selected then submit-event", async () => {
      await waitFor(() => expect(screen.getByTestId(eventEntryTestId)).toBeTruthy());
      fireEvent.click(screen.getByTestId(eventEntryTestId));
      await waitFor(() => expect(screen.getByTestId("mock-sidebar")).toBeTruthy());

      fireEvent.click(screen.getByTestId("sidebar-submit-event"));

      await waitFor(() => expect(eventService.updateEvent).toHaveBeenCalledTimes(1));
      expect(eventService.createEvent).not.toHaveBeenCalled();
    });

    it("delete returns early when no selected item", async () => {
        await waitFor(() => expect(sidebarProps).not.toBeNull());

        // Sidebar is closed initially and selectedItem is undefined.
        sidebarProps!.onDelete();

        expect(taskService.deleteTask).not.toHaveBeenCalled();
        expect(eventService.deleteEvent).not.toHaveBeenCalled();
    });


    it("deletes task when task selected then delete", async () => {
      await waitFor(() => expect(screen.getByTestId("mock-event-task-1-0")).toBeTruthy());
      fireEvent.click(screen.getByTestId("mock-event-task-1-0"));
      await waitFor(() => expect(screen.getByTestId("mock-sidebar")).toBeTruthy());

      fireEvent.click(screen.getByTestId("sidebar-delete"));

      await waitFor(() => expect(taskService.deleteTask).toHaveBeenCalledTimes(1));
      expect(eventService.deleteEvent).not.toHaveBeenCalled();
    });

    it("deletes event when event selected then delete", async () => {
      await waitFor(() => expect(screen.getByTestId(eventEntryTestId)).toBeTruthy());
      fireEvent.click(screen.getByTestId(eventEntryTestId));
      await waitFor(() => expect(screen.getByTestId("mock-sidebar")).toBeTruthy());

      fireEvent.click(screen.getByTestId("sidebar-delete"));

      await waitFor(() => expect(eventService.deleteEvent).toHaveBeenCalledTimes(1));
      expect(taskService.deleteTask).not.toHaveBeenCalled();
    });

    it("close button closes sidebar", async () => {
      fireEvent.click(screen.getByTestId("mock-select-slot"));
      await waitFor(() => expect(screen.getByTestId("mock-sidebar")).toBeTruthy());

      fireEvent.click(screen.getByTestId("sidebar-close"));

      await waitFor(() => {
        expect(screen.queryByTestId("mock-sidebar")).toBeNull();
      });
    });
  });
});
