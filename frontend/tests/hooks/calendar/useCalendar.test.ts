import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCalendar } from "@/hooks/calendar/useCalendar";
import * as eventService from "@/services/eventService";
import * as categoryService from "@/services/categoryService";
import * as schedulerService from "@/services/schedulerService";
import * as taskService from "@/services/taskService";
import { preferenceService } from "@/services/preferenceService";
import type { Category, Event, Task } from "@/types";

vi.mock("react-big-calendar", () => ({
  Views: { MONTH: "month", WEEK: "week", DAY: "day", AGENDA: "agenda" },
}));

vi.mock("@/services/categoryService", () => ({
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));
vi.mock("react-big-calendar/lib/addons/dragAndDrop", () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock("@/services/taskService", () => ({
  getTasks: vi.fn(),
  getCategories: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock("@/services/eventService", () => ({
  getEvents: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  revertEventInstance: vi.fn(),
}));

vi.mock("@/services/schedulerService", () => ({
  scheduleTasks: vi.fn(),
  unscheduleTasks: vi.fn(),
}));

vi.mock("@/services/preferenceService", () => ({
  preferenceService: {
    getMyPreference: vi.fn(),
  },
}));

describe("useCalendar", () => {
  const mockTasks: Task[] = [
    {
      id: 1,
      title: "Task Entry",
      description: "",
      start_time: "2026-02-12T09:00:00.000Z",
      deadline: "2026-02-12T10:00:00.000Z",
      importance: 5,
      estimated_minutes: 60,
      completed: false,
      categories: [],
      allocation: [
        {
          start: "2026-02-12T09:00:00.000Z",
          end: "2026-02-12T10:00:00.000Z",
        },
      ],
    },
  ];
  const mockEvents: Event[] = [
    {
      id: 2,
      title: "Event Entry",
      start_time: "2026-02-12T11:00:00.000Z",
      end_time: "2026-02-12T12:00:00.000Z",
      categories: [],
      reminders: [],
      instance_id: "event-2-instance",
    },
  ];
  const mockCategories: Category[] = [{ id: 7, text: "Coursework" }];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(taskService.getTasks).mockResolvedValue(mockTasks);
    vi.mocked(taskService.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(eventService.getEvents).mockResolvedValue(mockEvents);
    vi.mocked(preferenceService).getMyPreference.mockResolvedValue({
      id: 1,
      day_start: "08:00:00",
      day_end: "22:00:00",
      max_hours_study_per_day: 4,
      days_off: [],
      day_schedule: [],
    } as never);
    vi.mocked(schedulerService.scheduleTasks).mockResolvedValue({
      start_date: "2026-02-12",
      scheduled_count: 1,
      failed_count: 0,
      results: [
        {
          task_id: 1,
          success: true,
          scheduled_start: "2026-02-12T09:00:00.000Z",
          scheduled_end: "2026-02-12T10:00:00.000Z",
        },
      ],
    });
    vi.mocked(schedulerService.unscheduleTasks).mockResolvedValue({ unscheduled_count: 1 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads tasks, categories, events, and memoized calendar entries", async () => {
    const { result } = renderHook(() => useCalendar());

    await waitFor(() => expect(result.current.loading.initializing).toBe(false));

    expect(taskService.getTasks).toHaveBeenCalledTimes(1);
    expect(taskService.getCategories).toHaveBeenCalledTimes(1);
    expect(eventService.getEvents).toHaveBeenCalledTimes(1);
    expect(result.current.state.calendarEntries.map((entry) => entry.title)).toEqual([
      "Task Entry",
      "Event Entry",
    ]);
    expect(result.current.error.tasks).toBeNull();
  });

  it("opens an event sidebar template when a slot is selected", async () => {
    const { result } = renderHook(() => useCalendar());

    await waitFor(() => expect(result.current.loading.initializing).toBe(false));

    act(() => {
      result.current.actions.selectSlot({ start: new Date("2026-02-12T10:00:00.000Z") });
    });

    expect(result.current.state.isSidebarOpen).toBe(true);
    expect(result.current.state.sidebarMode).toBe("event");
    expect(result.current.state.selectedItem).toMatchObject({ id: 0, title: "" });
  });

  it("reschedules tasks", async () => {
    const { result } = renderHook(() => useCalendar());

    await waitFor(() => expect(result.current.loading.initializing).toBe(false));

    await act(async () => {
      await result.current.actions.rescheduleTasks();
    });

    expect(schedulerService.scheduleTasks).toHaveBeenCalled();
    expect(result.current.state.scheduleOrder[1]).toBe(0);
  });

  it("creates a category and adds it to state", async () => {
    const created: Category = { id: 10, text: "New Category" };
    vi.mocked(categoryService.createCategory).mockResolvedValue(created);

    const { result } = renderHook(() => useCalendar());
    await waitFor(() => expect(result.current.loading.initializing).toBe(false));

    let returned: Category | undefined;
    await act(async () => {
      returned = await result.current.actions.createCategory("New Category");
    });

    expect(categoryService.createCategory).toHaveBeenCalledWith("New Category");
    expect(returned).toEqual(created);
    expect(result.current.state.categories.some((c) => c.id === 10)).toBe(true);
  });

  it("deletes a category and removes it from state", async () => {
    vi.mocked(categoryService.deleteCategory).mockResolvedValue();

    const { result } = renderHook(() => useCalendar());
    await waitFor(() => expect(result.current.loading.initializing).toBe(false));

    expect(result.current.state.categories).toHaveLength(1);

    await act(async () => {
      await result.current.actions.deleteCategory(7);
    });

    expect(categoryService.deleteCategory).toHaveBeenCalledWith(7);
    expect(result.current.state.categories).toHaveLength(0);
  });
});
