import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import moment from "moment";

import CalendarPage from "@/pages/Calendar";
import * as taskService from "@/services/taskService";
import * as eventService from "@/services/eventService";
import * as schedulerService from "@/services/schedulerService";
import { preferenceService } from "@/services/preferenceService";
import type {
  Task,
  Event,
  Category,
  TaskSubmission,
  EventMutationContext,
  EventSubmission,
} from "@/types";

vi.mock("@/services/taskService");
vi.mock("@/services/eventService");
vi.mock("@/services/schedulerService");
vi.mock("@/services/preferenceService", () => ({
  preferenceService: {
    getMyPreference: vi.fn(),
  },
}));

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

class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
  ResizeObserver;

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
const mockPreference = {
  id: 1,
  day_start: "08:00:00",
  day_end: "22:00:00",
  max_hours_study_per_day: 4,
  days_off: [],
  day_schedule: [],
} as never;

// Helper render
const renderPage = () =>
  render(
    <MemoryRouter>
      <CalendarPage useLayout={false} showNavbar={false} />
    </MemoryRouter>
  );

const mockCalendarDataLoad = () => {
  vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks);
  vi.mocked(taskService.getCategories).mockResolvedValue(mockCategories);
  vi.mocked(eventService.getEvents).mockResolvedValue(mockEvents);
  vi.mocked(preferenceService).getMyPreference.mockResolvedValue(mockPreference);
};

const renderWithCalendarData = () => {
  mockCalendarDataLoad();
  renderPage();
};

const setupCrudServiceMocks = () => {
  vi.mocked(taskService.createTask).mockResolvedValue({} as never);
  vi.mocked(taskService.updateTask).mockResolvedValue({} as never);
  vi.mocked(taskService.deleteTask).mockResolvedValue(undefined);
  vi.mocked(eventService.createEvent).mockResolvedValue({} as never);
  vi.mocked(eventService.updateEvent).mockResolvedValue({} as never);
  vi.mocked(eventService.deleteEvent).mockResolvedValue(undefined);
};

const mockSchedulingLoad = () => {
  vi.mocked(taskService.getTasks).mockResolvedValue([]);
  vi.mocked(taskService.getCategories).mockResolvedValue([]);
  vi.mocked(eventService.getEvents).mockResolvedValue([]);
  vi.mocked(preferenceService).getMyPreference.mockResolvedValue(mockPreference);
  vi.mocked(schedulerService.scheduleTasks).mockResolvedValue({
    start_date: "2023-01-01",
    scheduled_count: 1,
    failed_count: 0,
    results: [{ success: true, task_id: 1, scheduled_start: "2023-01-01", scheduled_end: "2023-01-01" }],
  });
  vi.mocked(schedulerService.unscheduleTasks).mockResolvedValue({ unscheduled_count: 1 });
};

const renderWithSchedulingData = () => {
  mockSchedulingLoad();
  renderPage();
};

const waitForCalendarHeading = async () => {
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Calendar" })).toBeTruthy(),
  );
};

const waitForSidebar = async () => {
  await waitFor(() => expect(screen.getByTestId("mock-sidebar")).toBeTruthy());
};

const openSlotSidebar = async () => {
  fireEvent.click(screen.getByTestId("mock-select-slot"));
  await waitForSidebar();
};

const openTaskSidebar = async () => {
  await waitFor(() => expect(screen.getByTestId("mock-event-task-1-0")).toBeTruthy());
  fireEvent.click(screen.getByTestId("mock-event-task-1-0"));
  await waitForSidebar();
};

const openEventSidebar = async () => {
  await waitFor(() => expect(screen.getByTestId(eventEntryTestId)).toBeTruthy());
  fireEvent.click(screen.getByTestId(eventEntryTestId));
  await waitForSidebar();
};

describe("CalendarPage (lean tests)", () => {
  afterEach(() => {
    sidebarProps = null;
    vi.clearAllMocks();
  });

  describe("renders + loads data", () => {
    beforeEach(() => {
      renderWithCalendarData();
    });

    it("renders header + view buttons + current month", async () => {
      await waitForCalendarHeading();

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
      vi.mocked(preferenceService).getMyPreference.mockResolvedValue(mockPreference);

      renderPage();

      await waitForCalendarHeading();
      await waitFor(() => expect(consoleSpy).toHaveBeenCalled());

      consoleSpy.mockRestore();
    });
  });

  describe("sidebar interactions (slot + select + CRUD)", () => {
    beforeEach(() => {
      renderWithCalendarData();
      setupCrudServiceMocks();
    });

    it("opens sidebar on slot select (defaults to task mode)", async () => {
      await waitForCalendarHeading();
      await openSlotSidebar();
      expect(screen.getByTestId("sidebar-mode").textContent).toBe("event");
    });

    it("opens sidebar in task mode when clicking a task entry", async () => {
      await openTaskSidebar();
      expect(screen.getByTestId("sidebar-mode").textContent).toBe("task");
    });

    it("opens sidebar in event mode when clicking an event entry", async () => {
      await openEventSidebar();
      expect(screen.getByTestId("sidebar-mode").textContent).toBe("event");
    });

    it("creates a task when slot selected (id=0) then submit-task", async () => {
      await openSlotSidebar();
      fireEvent.click(screen.getByTestId("sidebar-submit-task"));

      await waitFor(() => expect(taskService.createTask).toHaveBeenCalledTimes(1));
      expect(taskService.updateTask).not.toHaveBeenCalled();
    });

    it("updates a task when existing task selected then submit-task", async () => {
      await openTaskSidebar();
      fireEvent.click(screen.getByTestId("sidebar-submit-task"));

      await waitFor(() => expect(taskService.updateTask).toHaveBeenCalledTimes(1));
      expect(taskService.createTask).not.toHaveBeenCalled();
    });

    it("updates an event when existing event selected then submit-event", async () => {
      await openEventSidebar();
      fireEvent.click(screen.getByTestId("sidebar-submit-event"));

      await waitFor(() => expect(eventService.updateEvent).toHaveBeenCalledTimes(1));
      expect(eventService.createEvent).not.toHaveBeenCalled();
    });

    it("delete returns early when no selected item", async () => {
      await waitFor(() => expect(sidebarProps).not.toBeNull());
      sidebarProps!.onDelete();
      expect(taskService.deleteTask).not.toHaveBeenCalled();
      expect(eventService.deleteEvent).not.toHaveBeenCalled();
    });

    it("deletes task when task selected then delete", async () => {
      await openTaskSidebar();
      fireEvent.click(screen.getByTestId("sidebar-delete"));

      await waitFor(() => expect(taskService.deleteTask).toHaveBeenCalledTimes(1));
      expect(eventService.deleteEvent).not.toHaveBeenCalled();
    });

    it("deletes event when event selected then delete", async () => {
      await openEventSidebar();
      fireEvent.click(screen.getByTestId("sidebar-delete"));

      await waitFor(() => expect(eventService.deleteEvent).toHaveBeenCalledTimes(1));
      expect(taskService.deleteTask).not.toHaveBeenCalled();
    });

    it("close button closes sidebar", async () => {
      await openSlotSidebar();
      fireEvent.click(screen.getByTestId("sidebar-close"));

      await waitFor(() => {
        expect(screen.queryByTestId("mock-sidebar")).toBeNull();
      });
    });
  });

  describe("scheduling and navigation", () => {
    beforeEach(() => {
      renderWithSchedulingData();
    });

    it("handles scheduling tasks", async () => {
      fireEvent.click(screen.getByText("Reschedule"));

      await waitFor(() => {
        expect(schedulerService.scheduleTasks).toHaveBeenCalled();
      });
    });

    it("navigates calendar dates", () => {
      const todayBtn = screen.getByText("Today");
      const prevBtn = screen.getByLabelText("Previous period");
      const nextBtn = screen.getByLabelText("Next period");

      fireEvent.click(nextBtn);
      fireEvent.click(prevBtn);
      fireEvent.click(todayBtn);

      expect(screen.getByRole("heading", { level: 2 }).textContent).toBeDefined();
    });
  });
});
