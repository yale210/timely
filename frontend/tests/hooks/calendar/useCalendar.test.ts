import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Views } from "react-big-calendar";
import { getCalendarWindow, isOutsidePreferredDayWindow } from "@/hooks/calendar/calendarTypes";
import { useCalendarState } from "@/hooks/calendar/useCalendarState";
import { useCalendar } from "@/hooks/calendar/useCalendar";
import { useCalendarData } from "@/hooks/calendar/useCalendarData";
import { buildDraftCalendarEvent } from "@/hooks/calendar/useCalendarInteractions";
import { buildRescheduleWarnings, shouldRescheduleTaskSave } from "@/hooks/calendar/calendarMutationHelpers";
import * as eventService from "@/services/eventService";
import * as categoryService from "@/services/categoryService";
import * as schedulerService from "@/services/schedulerService";
import * as taskService from "@/services/taskService";
import { preferenceService } from "@/services/preferenceService";
import { setStoredUserTimezone } from "@/utils/userTimezone";
import { setStoredWeekStartsOn } from "@/utils/userPreferences";
import type { Category, Event, Task } from "@/types";

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

    expect(taskService.getTasks).toHaveBeenCalled();
    expect(taskService.getCategories).toHaveBeenCalled();
    expect(eventService.getEvents).toHaveBeenCalled();
    expect(result.current.state.calendarEntries.map((entry) => entry.title)).toEqual([
      "Task Entry",
      "Event Entry",
    ]);
    expect(result.current.error.tasks).toBeNull();
  });

  it("loads the initial event window after server preferences arrive", async () => {
    setStoredUserTimezone("America/Los_Angeles");
    setStoredWeekStartsOn("sunday");
    vi.mocked(preferenceService).getMyPreference.mockResolvedValue({
      id: 1,
      timezone: "Europe/London",
      week_starts_on: "monday",
      day_start: "08:00:00",
      day_end: "22:00:00",
      max_hours_study_per_day: 4,
      max_days_ahead: 7,
      drag_snap_minutes: 15,
      days_off: [],
    } as never);

    const { result } = renderHook(() => useCalendarData(Views.WEEK, new Date("2026-03-18T12:00:00.000Z")));

    await waitFor(() => expect(result.current.loading.initializing).toBe(false));

    expect(eventService.getEvents).toHaveBeenCalledWith({
      start_date: "2026-03-16",
      end_date: "2026-03-22",
    });
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

describe("calendar preference helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    setStoredUserTimezone("America/Los_Angeles");
    setStoredWeekStartsOn("monday");
  });

  it("uses the saved week-start when computing week fetch windows", () => {
    const window = getCalendarWindow(Views.WEEK, new Date("2026-03-18T12:00:00.000Z"), {
      id: 1,
      timezone: "Europe/London",
      week_starts_on: "monday",
      day_start: "08:00:00",
      day_end: "22:00:00",
      max_hours_study_per_day: 4,
      max_days_ahead: 7,
      drag_snap_minutes: 15,
      days_off: [],
    });

    expect(window).toEqual({
      start_date: "2026-03-16",
      end_date: "2026-03-22",
    });
  });

  it("derives toolbar strip days from the saved timezone and week-start", () => {
    const { result } = renderHook(() => useCalendarState());

    act(() => {
      result.current.actions.setView(Views.WEEK);
      result.current.actions.setDate(new Date("2026-03-16T00:30:00.000Z"));
    });

    expect(result.current.state.currentLabel).toBe("March 2026");
    expect(result.current.state.dateStripDays.map((day) => day.format("YYYY-MM-DD"))).toEqual([
      "2026-03-09",
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
      "2026-03-13",
      "2026-03-14",
      "2026-03-15",
    ]);
  });
});

describe("isOutsidePreferredDayWindow", () => {
  it("evaluates slots using the preference timezone instead of the browser timezone", () => {
    const preference = {
      id: 1,
      timezone: "America/New_York",
      day_start: "08:00:00",
      day_end: "22:00:00",
      day_schedule: [
        { day: 1, start: "08:00", end: "22:00" },
        { day: 2, start: "08:00", end: "22:00" },
        { day: 3, start: "08:00", end: "22:00" },
        { day: 4, start: "08:00", end: "22:00" },
        { day: 5, start: "08:00", end: "22:00" },
        { day: 6, start: "08:00", end: "22:00" },
        { day: 7, start: "08:00", end: "22:00" },
      ],
      max_hours_study_per_day: 4,
      max_days_ahead: 7,
      drag_snap_minutes: 15,
      days_off: [],
    } as never;

    expect(
      isOutsidePreferredDayWindow(new Date("2026-03-27T12:00:00.000Z"), preference),
    ).toBe(false);
    expect(
      isOutsidePreferredDayWindow(new Date("2026-03-27T10:00:00.000Z"), preference),
    ).toBe(true);
  });
});

describe("calendar interaction helpers", () => {
  it("builds a draft event from slot selections and falls back to a one-hour window", () => {
    const draft = buildDraftCalendarEvent({
      start: new Date("2026-04-03T09:00:00.000Z"),
      end: new Date("2026-04-03T09:00:00.000Z"),
      slots: [
        new Date("2026-04-03T09:00:00.000Z"),
        new Date("2026-04-03T09:30:00.000Z"),
      ],
    });

    expect(draft).toMatchObject({
      id: 0,
      title: "",
      start_time: "2026-04-03T09:00:00.000Z",
      end_time: "2026-04-03T09:30:00.000Z",
      categories: [],
    });

    const fallbackDraft = buildDraftCalendarEvent({
      start: new Date("2026-04-03T09:00:00.000Z"),
      end: new Date("2026-04-03T08:00:00.000Z"),
    });

    expect(fallbackDraft.end_time).toBe("2026-04-03T10:00:00.000Z");
  });
});

describe("calendar mutation helpers", () => {
  it("detects when editing a task should trigger save-and-reschedule", () => {
    expect(
      shouldRescheduleTaskSave(
        {
          id: 4,
          title: "Essay",
          deadline: "2026-04-03T12:00:00.000Z",
          start_time: "2026-04-03T09:00:00.000Z",
          importance: 4,
          completed: false,
          estimated_minutes: 120,
          buffer_before_minutes: 10,
          buffer_after_minutes: 15,
          completed_minutes: 20,
          categories: [],
        },
        {
          buffer_before_minutes: 10,
          buffer_after_minutes: 20,
          completed_minutes: 20,
        },
      ),
    ).toBe(true);

    expect(
      shouldRescheduleTaskSave(
        {
          id: 4,
          title: "Essay",
          deadline: "2026-04-03T12:00:00.000Z",
          start_time: "2026-04-03T09:00:00.000Z",
          importance: 4,
          completed: false,
          estimated_minutes: 120,
          buffer_before_minutes: 10,
          buffer_after_minutes: 15,
          completed_minutes: 20,
          categories: [],
        },
        {
          title: "Essay draft",
        },
      ),
    ).toBe(false);
  });

  it("builds scheduler warnings with fallback titles and reasons", () => {
    expect(
      buildRescheduleWarnings(
        [
          {
            task_id: 1,
            success: false,
            scheduled_start: null,
            scheduled_end: null,
            reason: "Conflicts with working hours.",
          },
          {
            task_id: 2,
            success: false,
            scheduled_start: null,
            scheduled_end: null,
          },
          {
            task_id: 3,
            success: true,
            scheduled_start: "2026-04-03T09:00:00.000Z",
            scheduled_end: "2026-04-03T10:00:00.000Z",
          },
        ],
        [
          {
            id: 1,
            title: "Essay",
            deadline: "2026-04-03T12:00:00.000Z",
            start_time: "2026-04-03T09:00:00.000Z",
            importance: 4,
            completed: false,
            estimated_minutes: 120,
            categories: [],
          },
        ],
      ),
    ).toEqual([
      {
        taskId: 1,
        title: "Essay",
        reason: "Conflicts with working hours.",
      },
      {
        taskId: 2,
        title: "Task #2",
        reason: "The scheduler could not find enough time before the deadline.",
      },
    ]);
  });
});
