import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import moment from "moment-timezone";
import { type View, Views } from "react-big-calendar";
import type { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import * as eventService from "@/services/eventService";
import * as schedulerService from "@/services/schedulerService";
import * as exportService from "@/services/exportService"
import * as importService from "@/services/importService"
import * as categoryService from "@/services/categoryService";
import * as taskService from "@/services/taskService";
import { preferenceService } from "@/services/preferenceService";
import type {
  Category,
  Event,
  EventMutationContext,
  EventSubmission,
  Preference,
  Task,
  TaskSubmission,
} from "@/types";
import { buildCalendarEntries, type CalendarEntry } from "@/utils/calendarAdapter";
import { hasTaskAllocationRescheduleConflict } from "@/utils/apiErrors";
import { getStoredUserTimezone, getZonedDateParts } from "@/utils/userTimezone";
import completeSoundUrl from "@/assets/sounds/task-complete.mp3";

interface CalendarState {
  tasks: Task[];
  categories: Category[];
  events: Event[];
  calendarEntries: CalendarEntry[];
  isSidebarOpen: boolean;
  selectedItem: Task | Event | undefined;
  view: View;
  date: Date;
  sidebarMode: "task" | "event";
  scheduleOrder: Record<number, number>;
  currentLabel: string;
  preference: Preference | null;
  dateStripDays: moment.Moment[];
  headerHeight: number;
  timeGutterWidth: number;
  isRescheduling: boolean;
  rescheduleWarnings: { taskId: number; title: string; reason: string }[];
}

interface CalendarLoading {
  initializing: boolean;
  tasks: boolean;
  categories: boolean;
  events: boolean;
  rescheduling: boolean;
  exporting: boolean;
  importing: boolean;
}

interface CalendarError {
  tasks: string | null;
  categories: string | null;
  events: string | null;
  rescheduling: string | null;
  exporting: string | null;
  importing: string | null;
}

interface CalendarActions {
  setView: (nextView: View) => void;
  setDate: (nextDate: Date) => void;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  selectSlot: (slot: { start: Date; end?: Date; slots?: Date[]; action?: "select" | "click" | "doubleClick" }) => void;
  selectEntry: (entry: CalendarEntry) => void;
  closeSidebar: () => void;
  submitTask: (data: TaskSubmission) => Promise<void>;
  submitEvent: (data: EventSubmission, context?: EventMutationContext) => Promise<void>;
  deleteSelected: (context?: EventMutationContext) => Promise<void>;
  revertSelectedEvent: (context: EventMutationContext) => Promise<void>;
  rescheduleTasks: () => Promise<void>;
  exportEvents: () => Promise<void>;
  importEvents: (file: File) => Promise<void>;
  createCategory: (text: string) => Promise<Category>;
  updateCategory: (id: number, patch: { colour?: string | null; colour_override?: boolean }) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  updateTaskCategories: (id: number, nextCategoryIds: number[]) => Promise<void>;
  handleEventDrop: (args: EventInteractionArgs<CalendarEntry>) => Promise<void>;
  handleEventResize: (args: EventInteractionArgs<CalendarEntry>) => Promise<void>;
  handleToggleTaskComplete: (taskId: number) => Promise<void>;
  setHeaderHeight: (height: number) => void;
  setTimeGutterWidth: (width: number) => void;
}

/**
 * Describes the structured calendar hook contract.
 */
export interface UseCalendarReturn {
  state: CalendarState;
  loading: CalendarLoading;
  error: CalendarError;
  actions: CalendarActions;
}

/**
 * Computes the inclusive date window to load for the current calendar view.
 * @param currentView - Active calendar view.
 * @param currentDate - Anchor date for the view.
 * @returns Date window formatted for API queries.
 */
export const getCalendarWindow = (
  currentView: View,
  currentDate: Date,
): { start_date: string; end_date: string } => {
  const anchor = moment(currentDate);
  if (currentView === Views.MONTH) {
    return {
      start_date: anchor.clone().startOf("month").startOf("week").format("YYYY-MM-DD"),
      end_date: anchor.clone().endOf("month").endOf("week").format("YYYY-MM-DD"),
    };
  }
  if (currentView === Views.WEEK) {
    return {
      start_date: anchor.clone().startOf("week").format("YYYY-MM-DD"),
      end_date: anchor.clone().endOf("week").format("YYYY-MM-DD"),
    };
  }
  if (currentView === Views.DAY) {
    return {
      start_date: anchor.clone().startOf("day").format("YYYY-MM-DD"),
      end_date: anchor.clone().endOf("day").format("YYYY-MM-DD"),
    };
  }
  return {
    start_date: anchor.clone().startOf("day").format("YYYY-MM-DD"),
    end_date: anchor.clone().add(30, "days").endOf("day").format("YYYY-MM-DD"),
  };
};

const getNavigationUnit = (view: View): "month" | "week" | "day" => {
  if (view === Views.MONTH) {
    return "month";
  }
  if (view === Views.DAY) {
    return "day";
  }
  return "week";
};

const parseClockMinutes = (value: string): number => {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number.parseInt(hourRaw ?? "0", 10);
  const minute = Number.parseInt(minuteRaw ?? "0", 10);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return 0;
  }

  return (hour * 60) + minute;
};

const normalizeInteractionStart = (value: Date): Date => {
  const next = new Date(value);
  next.setSeconds(0, 0);
  return next;
};

const normalizeInteractionEnd = (value: Date): Date => {
  const next = new Date(value);
  if (next.getSeconds() === 0 && next.getMilliseconds() === 0) {
    return next;
  }

  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);
  return next;
};

const getDayScheduleWindow = (preference: Preference, slotDate: Date): { start: string; end: string } => {
  const zonedParts = getZonedDateParts(slotDate, preference.timezone);
  const dayKey = (() => {
    const utcWeekday = new Date(Date.UTC(zonedParts.year, zonedParts.month - 1, zonedParts.day)).getUTCDay();
    return utcWeekday === 0 ? 7 : utcWeekday;
  })();
  const schedule = preference.day_schedule ?? [];
  const entry = schedule.find((item) => item.day === dayKey);
  if (entry?.start && entry?.end) {
    return { start: entry.start, end: entry.end };
  }
  return {
    start: preference.day_start,
    end: preference.day_end,
  };
};

/**
 * Returns true when a slot falls outside the preferred schedule window.
 * @param slotDate - Slot time to evaluate.
 * @param preference - User preference schedule, if available.
 */
export const isOutsidePreferredDayWindow = (slotDate: Date, preference: Preference | null): boolean => {
  if (!preference) {
    return false;
  }

  const { start, end } = getDayScheduleWindow(preference, slotDate);
  const startMinutes = parseClockMinutes(start);
  const endMinutes = parseClockMinutes(end);
  const zonedParts = getZonedDateParts(slotDate, preference.timezone);
  const slotMinutes = (zonedParts.hour * 60) + zonedParts.minute;

  if (startMinutes === endMinutes) {
    return false;
  }

  if (startMinutes < endMinutes) {
    return slotMinutes < startMinutes || slotMinutes >= endMinutes;
  }

  return slotMinutes >= endMinutes && slotMinutes < startMinutes;
};

/**
 * Provides the state and actions for the calendar page.
 * @returns Structured calendar state, loading, error, and actions.
 */
export const useCalendar = (): UseCalendarReturn => {
  const completeSoundRef = useRef<HTMLAudioElement | null>(
    typeof Audio === "undefined" ? null : new Audio(completeSoundUrl),
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [preference, setPreference] = useState<Preference | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Task | Event | undefined>(undefined);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [sidebarMode, setSidebarMode] = useState<"task" | "event">("event");
  const [scheduleOrder, setScheduleOrder] = useState<Record<number, number>>({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);
  const [reschedulingError, setReschedulingError] = useState<string | null>(null);
  const [rescheduleWarnings, setRescheduleWarnings] = useState<
    { taskId: number; title: string; reason: string }[]
  >([]);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [timeGutterWidth, setTimeGutterWidth] = useState(56);
  const [exportingError, setExportingError] = useState<string | null>(null);
  const [importingError, setImportingError] = useState<string | null>(null);
  const hasInitialized = useRef(false);
  const activeTimezone = preference?.timezone ?? getStoredUserTimezone();

  const fetchTasks = useCallback(async () => {
    setIsTasksLoading(true);
    try {
      const nextTasks = await taskService.getTasks();
      setTasks(nextTasks);
      setTaskError(null);
    } catch (error) {
      console.error(error);
      setTasks([]);
      setTaskError("Failed to load calendar tasks.");
    } finally {
      setIsTasksLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsCategoriesLoading(true);
    try {
      const nextCategories = await taskService.getCategories();
      setCategories(nextCategories);
      setCategoryError(null);
    } catch (error) {
      console.error(error);
      setCategories([]);
      setCategoryError("Failed to load categories.");
    } finally {
      setIsCategoriesLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async (activeView: View, activeDate: Date) => {
    setIsEventsLoading(true);
    try {
      const nextEvents = await eventService.getEvents(getCalendarWindow(activeView, activeDate));
      setEvents(nextEvents);
      setEventError(null);
    } catch (error) {
      console.error(error);
      setEvents([]);
      setEventError("Failed to load calendar events.");
    } finally {
      setIsEventsLoading(false);
    }
  }, []);

  const fetchPreference = useCallback(async () => {
    try {
      const nextPreference = await preferenceService.getMyPreference();
      setPreference(nextPreference);
    } catch (error) {
      console.error(error);
      setPreference(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      await Promise.all([
        fetchTasks(),
        fetchCategories(),
        fetchEvents(view, date),
        fetchPreference(),
      ]);
      if (isMounted) {
        hasInitialized.current = true;
        setIsInitializing(false);
      }
    };

    // Initial task/category/event loads happen together, then later effects react to date/view changes.
    void initialize();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount
  }, [fetchCategories, fetchEvents, fetchPreference, fetchTasks]);

  useEffect(() => {
    if (!hasInitialized.current) {
      return;
    }

    void fetchEvents(view, date);
  }, [date, fetchEvents, view]);

  const calendarEntries = useMemo(
    () => buildCalendarEntries({ tasks, events, scheduleOrder }),
    [events, scheduleOrder, tasks],
  );

  const currentLabel = useMemo(
    () => moment(date).tz(activeTimezone).format("MMMM YYYY"),
    [activeTimezone, date],
  );

  const dateStripDays = useMemo(() => {
    if (view === Views.WEEK) {
      const startOfWeek = moment(date).tz(activeTimezone).startOf("week");
      return Array.from({ length: 7 }, (_, index) => startOfWeek.clone().add(index, "day"));
    }

    if (view === Views.DAY) {
      return [moment(date).tz(activeTimezone)];
    }

    return [];
  }, [activeTimezone, date, view]);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    setSelectedItem(undefined);
    setSidebarMode("event");
  }, []);

  const selectSlot = useCallback(
    (slot: { start: Date; end?: Date; slots?: Date[]; action?: "select" | "click" | "doubleClick" }) => {
      if (isSidebarOpen && slot.action !== "select") {
        return;
      }
      if (!slot.start) {
        return;
      }
      const slotStart = slot.slots && slot.slots.length > 0 ? slot.slots[0] : slot.start;
      let slotEnd = slot.end ?? slotStart;
      if (slot.slots && slot.slots.length > 0) {
        slotEnd = slot.slots[slot.slots.length - 1];
      }
      if (slotEnd <= slotStart) {
        slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      }
      setSidebarMode("event");
      // Seed the sidebar with a placeholder event so the form opens in "create from slot" mode.
      setSelectedItem({
        id: 0,
        title: "",
        description: "",
        start_time: slotStart.toISOString(),
        end_time: slotEnd.toISOString(),
        location: "",
        recurrence_interval: null,
        recurrence_end: null,
        reminders: [],
        is_override: false,
        is_split_series: false,
        source_event_id: undefined,
        split_from_event_id: null,
        original_start_time: null,
        categories: [],
      });
      setIsSidebarOpen(true);
    },
    [isSidebarOpen],
  );

  const selectEntry = useCallback(
    (entry: CalendarEntry) => {
      if (entry.kind === "task") {
        const task = entry.taskData ?? tasks.find((item) => item.id === entry.sourceId);
        if (task) {
          setSidebarMode("task");
          setSelectedItem(task);
          setIsSidebarOpen(true);
        }
        return;
      }

      if (entry.eventData) {
        setSidebarMode("event");
        setSelectedItem(entry.eventData);
        setIsSidebarOpen(true);
      }
    },
    [tasks],
  );

  const submitTask = useCallback(
    async (data: TaskSubmission) => {
      try {
        if (selectedItem && "deadline" in selectedItem && selectedItem.id !== 0) {
          const bufferBeforeChanged =
            typeof data.buffer_before_minutes === "number" &&
            data.buffer_before_minutes !== (selectedItem.buffer_before_minutes ?? 0);
          const bufferAfterChanged =
            typeof data.buffer_after_minutes === "number" &&
            data.buffer_after_minutes !== (selectedItem.buffer_after_minutes ?? 0);
          const completedMinutesChanged =
            typeof data.completed_minutes === "number" &&
            data.completed_minutes !== (selectedItem.completed_minutes ?? 0);
          if (bufferBeforeChanged || bufferAfterChanged || completedMinutesChanged) {
            await taskService.saveAndRescheduleTask(
              selectedItem.id,
              data,
              moment(date).format("YYYY-MM-DD"),
            );
          } else {
            await taskService.updateTask(selectedItem.id, data);
          }
        } else {
          await taskService.createTask(data);
        }
        await fetchTasks();
        closeSidebar();
      } catch (error) {
        if (
          selectedItem
          && "deadline" in selectedItem
          && selectedItem.id !== 0
          && (selectedItem.allocation?.length ?? 0) > 0
          && hasTaskAllocationRescheduleConflict(error)
        ) {
          await taskService.saveAndRescheduleTask(
            selectedItem.id,
            data,
            moment(date).format("YYYY-MM-DD"),
          );
          await fetchTasks();
          closeSidebar();
          return;
        }
        console.error(error);
        throw error;
      }
    },
    [closeSidebar, date, fetchTasks, selectedItem],
  );

  const submitEvent = useCallback(
    async (data: EventSubmission, context?: EventMutationContext) => {
      try {
        if (selectedItem && "end_time" in selectedItem && selectedItem.id !== 0) {
          await eventService.updateEvent(selectedItem.id, data, context);
        } else {
          await eventService.createEvent(data);
        }
        await fetchEvents(view, date);
        closeSidebar();
      } catch (error) {
        console.error(error);
      }
    },
    [closeSidebar, date, fetchEvents, selectedItem, view],
  );

  const deleteSelected = useCallback(
    async (context?: EventMutationContext) => {
      try {
        if (!selectedItem?.id) {
          console.error("There is either no item, or its id is not valid.");
          return;
        }

        if ("end_time" in selectedItem) {
          await eventService.deleteEvent(selectedItem.id, context);
          await fetchEvents(view, date);
        } else {
          await taskService.deleteTask(selectedItem.id);
          await fetchTasks();
        }

        closeSidebar();
      } catch (error) {
        console.error(error);
      }
    },
    [closeSidebar, date, fetchEvents, fetchTasks, selectedItem, view],
  );

  const revertSelectedEvent = useCallback(
    async (context: EventMutationContext) => {
      try {
        if (!selectedItem || !("end_time" in selectedItem) || !context.original_start_time) {
          return;
        }

        await eventService.revertEventInstance(selectedItem.id, context.original_start_time);
        await fetchEvents(view, date);
        closeSidebar();
      } catch (error) {
        console.error(error);
      }
    },
    [closeSidebar, date, fetchEvents, selectedItem, view],
  );

  const rescheduleTasks = useCallback(async () => {
    setIsRescheduling(true);
    setReschedulingError(null);
    setRescheduleWarnings([]);

    try {
      const response = await schedulerService.scheduleTasks({
        start_date: moment(date).format("YYYY-MM-DD"),
        allow_split: true,
        replace_existing: true,
      });
      const nextOrder: Record<number, number> = {};
      // Preserve scheduler order so newly placed tasks can animate into the calendar in sequence.
      response.results
        .filter((result) => result.success && result.scheduled_start && result.scheduled_end)
        .forEach((result, index) => {
          nextOrder[result.task_id] = index;
        });
      setScheduleOrder(nextOrder);
      setRescheduleWarnings(
        response.results
          .filter((result) => !result.success)
          .map((result) => {
            const matchingTask = tasks.find((task) => task.id === result.task_id);
            return {
              taskId: result.task_id,
              title: matchingTask?.title ?? `Task #${result.task_id}`,
              reason: result.reason ?? "The scheduler could not find enough time before the deadline.",
            };
          }),
      );
      await fetchTasks();
    } catch (error) {
      console.error(error);
      setReschedulingError("Failed to reschedule tasks.");
    } finally {
      setIsRescheduling(false);
    }
  }, [date, fetchTasks, tasks]);

  const exportEvents = useCallback(async () => {
    setIsExporting(true);
    setExportingError(null);

    try {
      const response = await exportService.exportEvents();
    
      if (response) {
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement("a")
        link.href = url;
        link.setAttribute("download", "events.txt");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error(error);
      setExportingError("Failed to export events.");
    } finally {
      setIsExporting(false);
    }
  }, []);

  const importEvents = useCallback(async (file: File) => {
    setIsImporting(true);
    setImportingError(null);

    try {
      await importService.importEvents(file);
      
    } catch (error) {
      console.error(error);
      setImportingError("Failed to import events.");
    } finally {
      setIsImporting(false);
    }
    

  }, []);
    

  const goToToday = useCallback(() => {
    setDate(new Date());
  }, []);

  const goToPrevious = useCallback(() => {
    setDate((currentDate) => moment(currentDate).subtract(1, getNavigationUnit(view)).toDate());
  }, [view]);

  const goToNext = useCallback(() => {
    setDate((currentDate) => moment(currentDate).add(1, getNavigationUnit(view)).toDate());
  }, [view]);

  const createCategory = useCallback(async (text: string): Promise<Category> => {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error("Category name cannot be empty.");
    }
    const created = await categoryService.createCategory(trimmed);
    setCategories((prev) => {
      const exists = prev.some((category) => category.id === created.id);
      const next = exists ? prev : [...prev, created];
      return [...next].sort((a, b) => a.text.localeCompare(b.text));
    });
    return created;
  }, []);

  const updateCategory = useCallback(
    async (id: number, patch: { colour?: string | null; colour_override?: boolean }): Promise<Category> => {
      const updated = await categoryService.updateCategory(id, patch);
      setCategories((prev) =>
        prev.map((category) => (category.id === id ? { ...category, ...updated } : category)),
      );
      setTasks((prev) =>
        prev.map((task) => ({
          ...task,
          categories: task.categories.map((category) =>
            category.id === id ? { ...category, ...updated } : category,
          ),
        })),
      );
      setEvents((prev) =>
        prev.map((event) => ({
          ...event,
          categories: event.categories.map((category) =>
            category.id === id ? { ...category, ...updated } : category,
          ),
        })),
      );
      return updated;
    },
    [],
  );

  const deleteCategory = useCallback(async (id: number): Promise<void> => {
    await categoryService.deleteCategory(id);
    setCategories((prev) => prev.filter((category) => category.id !== id));
    setTasks((prev) =>
      prev.map((task) => ({
        ...task,
        categories: task.categories.filter((category) => category.id !== id),
      })),
    );
    setEvents((prev) =>
      prev.map((event) => ({
        ...event,
        categories: event.categories.filter((category) => category.id !== id),
      })),
    );
  }, []);

  const updateTaskCategories = useCallback(
    async (id: number, nextCategoryIds: number[]): Promise<void> => {
      const nextCategoryObjects = categories.filter((category) =>
        nextCategoryIds.includes(category.id),
      );
      // Update category chips locally first so the sidebar stays responsive.
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, categories: nextCategoryObjects } : task,
        ),
      );
      setSelectedItem((prev) => {
        if (!prev || !("deadline" in prev) || prev.id !== id) {
          return prev;
        }
        return { ...prev, categories: nextCategoryObjects };
      });
      try {
        await taskService.updateTask(id, { categories: nextCategoryIds });
      } catch (updateError) {
        console.error(updateError);
        await fetchTasks();
      }
    },
    [categories, fetchTasks],
  );

  const updateTaskAllocation = useCallback(
    async (entry: CalendarEntry, start: Date, end: Date) => {
      if (typeof entry.allocationIndex !== "number") {
        return;
      }
      const task = tasks.find((item) => item.id === entry.sourceId);
      if (!task) {
        return;
      }
      setScheduleOrder((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, task.id)) {
          return prev;
        }
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
      const nextAllocations = [...(task.allocation ?? [])];
      nextAllocations[entry.allocationIndex] = {
        start: start.toISOString(),
        end: end.toISOString(),
      };

      // Mirror the drag result locally first and recover with a refetch if the save fails.
      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? { ...item, allocation: nextAllocations } : item,
        ),
      );

      try {
        await taskService.updateTask(task.id, { allocation: nextAllocations });
      } catch (updateError) {
        console.error(updateError);
        await fetchTasks();
      }
    },
    [fetchTasks, tasks],
  );

  const updateCalendarEvent = useCallback(
    async (entry: CalendarEntry, start: Date, end: Date) => {
      const eventData =
        entry.eventData ??
        events.find(
          (item) =>
            item.id === entry.sourceId &&
            item.start_time === entry.start.toISOString(),
        );

      if (!eventData) {
        return;
      }

      const payload: Pick<Event, "start_time" | "end_time"> = {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      };

      // Recurring entries need the original occurrence timestamp so the backend can target this instance only.
      const context: EventMutationContext | undefined = eventData.recurrence_interval
        ? {
            scope: "this",
            original_start_time:
              eventData.original_start_time ?? eventData.start_time,
          }
        : undefined;

      setEvents((prev) =>
        prev.map((item) => {
          const isRecurringInstance =
            Boolean(eventData.instance_id) &&
            item.instance_id === eventData.instance_id &&
            item.original_start_time === eventData.original_start_time;
          const isSingleEvent =
            !eventData.instance_id &&
            item.id === eventData.id &&
            item.start_time === eventData.start_time;

          return isRecurringInstance || isSingleEvent
            ? { ...item, ...payload }
            : item;
        }),
      );

      try {
        await eventService.updateEvent(eventData.id, payload, context);
        await fetchEvents(view, date);
      } catch (updateError) {
        console.error(updateError);
        await fetchEvents(view, date);
      }
    },
    [date, events, fetchEvents, view],
  );

  const handleEventDrop = useCallback(
    async ({ event, start, end }: EventInteractionArgs<CalendarEntry>) => {
      if (Object.keys(scheduleOrder).length > 0) {
        setScheduleOrder({});
      }
      const nextStart = normalizeInteractionStart(new Date(start));
      const nextEnd = normalizeInteractionEnd(new Date(end));
      if (event.kind === "task") {
        await updateTaskAllocation(event, nextStart, nextEnd);
        return;
      }
      await updateCalendarEvent(event, nextStart, nextEnd);
    },
    [scheduleOrder, updateCalendarEvent, updateTaskAllocation],
  );

  const handleEventResize = useCallback(
    async ({ event, start, end }: EventInteractionArgs<CalendarEntry>) => {
      if (Object.keys(scheduleOrder).length > 0) {
        setScheduleOrder({});
      }
      const nextStart = normalizeInteractionStart(new Date(start));
      const nextEnd = normalizeInteractionEnd(new Date(end));
      if (event.kind === "task") {
        await updateTaskAllocation(event, nextStart, nextEnd);
        return;
      }
      await updateCalendarEvent(event, nextStart, nextEnd);
    },
    [scheduleOrder, updateCalendarEvent, updateTaskAllocation],
  );

  const handleToggleTaskComplete = useCallback(
    async (taskId: number) => {
      const task = tasks.find((entry) => entry.id === taskId);
      if (!task) return;
      const isSoundDisabled =
        preference?.disable_sound_effects ??
        (typeof window !== "undefined" && localStorage.getItem("disable_sound_effects") === "true");
      try {
        if (!task.completed && completeSoundRef.current && !isSoundDisabled) {
          completeSoundRef.current.currentTime = 0;
          void completeSoundRef.current.play().catch(() => undefined);
        }
        const nextCompleted = !task.completed;
        await taskService.updateTask(taskId, {
          completed: nextCompleted,
          completed_minutes: nextCompleted ? task.estimated_minutes : 0,
        });
        await fetchTasks();
      } catch (error) {
        console.error(error);
      }
    },
    [fetchTasks, preference?.disable_sound_effects, tasks],
  );

  return {
    state: {
      tasks,
      categories,
      events,
      calendarEntries,
      isSidebarOpen,
      selectedItem,
      view,
      date,
      sidebarMode,
      scheduleOrder,
      currentLabel,
      preference,
      dateStripDays,
      headerHeight,
      timeGutterWidth,
      isRescheduling,
      rescheduleWarnings,
    },
    loading: {
      initializing: isInitializing,
      tasks: isTasksLoading,
      categories: isCategoriesLoading,
      events: isEventsLoading,
      rescheduling: isRescheduling,
      exporting: isExporting,
      importing: isImporting,
    },
    error: {
      tasks: taskError,
      categories: categoryError,
      events: eventError,
      rescheduling: reschedulingError,
      exporting: exportingError,
      importing: importingError
    },
    actions: {
      setView,
      setDate,
      goToToday,
      goToPrevious,
      goToNext,
      selectSlot,
      selectEntry,
      closeSidebar,
      submitTask,
      submitEvent,
      deleteSelected,
      revertSelectedEvent,
      rescheduleTasks,
      exportEvents,
      importEvents,
      createCategory,
      updateCategory,
      deleteCategory,
      updateTaskCategories,
      handleEventDrop,
      handleEventResize,
      handleToggleTaskComplete,
      setHeaderHeight,
      setTimeGutterWidth,
    },
  };
};
