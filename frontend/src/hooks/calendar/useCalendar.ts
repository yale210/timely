import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { type View, Views } from "react-big-calendar";
import type { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import * as eventService from "@/services/eventService";
import * as schedulerService from "@/services/schedulerService";
import * as categoryService from "@/services/categoryService";
import * as taskService from "@/services/taskService";
import type {
  Category,
  Event,
  EventMutationContext,
  EventSubmission,
  Task,
  TaskSubmission,
} from "@/types";
import { buildCalendarEntries, type CalendarEntry } from "@/utils/calendarAdapter";

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
}

interface CalendarLoading {
  initializing: boolean;
  tasks: boolean;
  categories: boolean;
  events: boolean;
  scheduling: boolean;
  unscheduling: boolean;
}

interface CalendarError {
  tasks: string | null;
  categories: string | null;
  events: string | null;
  scheduling: string | null;
  unscheduling: string | null;
}

interface CalendarActions {
  setView: (nextView: View) => void;
  setDate: (nextDate: Date) => void;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  selectSlot: (slot: { start: Date; end?: Date; action?: "select" | "click" | "doubleClick" }) => void;
  selectEntry: (entry: CalendarEntry) => void;
  closeSidebar: () => void;
  submitTask: (data: TaskSubmission) => Promise<void>;
  submitEvent: (data: EventSubmission, context?: EventMutationContext) => Promise<void>;
  deleteSelected: (context?: EventMutationContext) => Promise<void>;
  revertSelectedEvent: (context: EventMutationContext) => Promise<void>;
  scheduleTasks: () => Promise<void>;
  unscheduleTasks: () => Promise<void>;
  createCategory: (text: string) => Promise<Category>;
  updateCategory: (id: number, patch: { colour?: string | null; colour_override?: boolean }) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  updateTaskCategories: (id: number, nextCategoryIds: number[]) => Promise<void>;
  handleEventDrop: (args: EventInteractionArgs<CalendarEntry>) => Promise<void>;
  handleEventResize: (args: EventInteractionArgs<CalendarEntry>) => Promise<void>;
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

const getCalendarWindow = (
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

/**
 * Provides the state and actions for the calendar page.
 * @returns Structured calendar state, loading, error, and actions.
 */
export const useCalendar = (): UseCalendarReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Task | Event | undefined>(undefined);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [sidebarMode, setSidebarMode] = useState<"task" | "event">("task");
  const [scheduleOrder, setScheduleOrder] = useState<Record<number, number>>({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isUnscheduling, setIsUnscheduling] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);
  const [schedulingError, setSchedulingError] = useState<string | null>(null);
  const [unschedulingError, setUnschedulingError] = useState<string | null>(null);
  const hasInitialized = useRef(false);

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

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      await Promise.all([fetchTasks(), fetchCategories(), fetchEvents(view, date)]);
      if (isMounted) {
        hasInitialized.current = true;
        setIsInitializing(false);
      }
    };

    void initialize();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once on mount
  }, [fetchCategories, fetchEvents, fetchTasks]);

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

  const currentLabel = useMemo(() => moment(date).format("MMMM YYYY"), [date]);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    setSelectedItem(undefined);
  }, []);

  const selectSlot = useCallback(
    (slot: { start: Date; end?: Date; action?: "select" | "click" | "doubleClick" }) => {
      if (isSidebarOpen && slot.action !== "select") {
        return;
      }
      const safeEnd = slot.end ?? slot.start;
      setSidebarMode("task");
      setSelectedItem({
        id: 0,
        title: "",
        description: "",
        start_time: slot.start.toISOString(),
        deadline: safeEnd.toISOString(),
        importance: 5,
        completed: false,
        categories: [],
        estimated_minutes: Math.max(
          1,
          Math.round((safeEnd.getTime() - slot.start.getTime()) / 60000),
        ),
      });
      setIsSidebarOpen(true);
    },
    [isSidebarOpen],
  );

  const selectEntry = useCallback(
    (entry: CalendarEntry) => {
      if (entry.kind === "task") {
        const task = tasks.find((item) => item.id === entry.sourceId);
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
          await taskService.updateTask(selectedItem.id, data);
        } else {
          await taskService.createTask(data);
        }
        await fetchTasks();
        closeSidebar();
      } catch (error) {
        console.error(error);
      }
    },
    [closeSidebar, fetchTasks, selectedItem],
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

  const scheduleTasks = useCallback(async () => {
    setIsScheduling(true);
    setSchedulingError(null);

    try {
      const response = await schedulerService.scheduleTasks({
        start_date: moment(date).format("YYYY-MM-DD"),
      });
      const nextOrder: Record<number, number> = {};
      response.results
        .filter((result) => result.success && result.scheduled_start && result.scheduled_end)
        .forEach((result, index) => {
          nextOrder[result.task_id] = index;
        });
      setScheduleOrder(nextOrder);
      await fetchTasks();
    } catch (error) {
      console.error(error);
      setSchedulingError("Failed to schedule tasks.");
    } finally {
      setIsScheduling(false);
    }
  }, [date, fetchTasks]);

  const unscheduleTasks = useCallback(async () => {
    setIsUnscheduling(true);
    setUnschedulingError(null);

    try {
      await schedulerService.unscheduleTasks();
      await fetchTasks();
      setScheduleOrder({});
    } catch (error) {
      console.error(error);
      setUnschedulingError("Failed to unschedule tasks.");
    } finally {
      setIsUnscheduling(false);
    }
  }, [fetchTasks]);

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
      const nextAllocations = [...(task.allocation ?? [])];
      nextAllocations[entry.allocationIndex] = {
        start: start.toISOString(),
        end: end.toISOString(),
      };

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
      if (event.kind === "task") {
        await updateTaskAllocation(event, new Date(start), new Date(end));
        return;
      }
      await updateCalendarEvent(event, new Date(start), new Date(end));
    },
    [updateCalendarEvent, updateTaskAllocation],
  );

  const handleEventResize = useCallback(
    async ({ event, start, end }: EventInteractionArgs<CalendarEntry>) => {
      if (event.kind === "task") {
        await updateTaskAllocation(event, new Date(start), new Date(end));
        return;
      }
      await updateCalendarEvent(event, new Date(start), new Date(end));
    },
    [updateCalendarEvent, updateTaskAllocation],
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
    },
    loading: {
      initializing: isInitializing,
      tasks: isTasksLoading,
      categories: isCategoriesLoading,
      events: isEventsLoading,
      scheduling: isScheduling,
      unscheduling: isUnscheduling,
    },
    error: {
      tasks: taskError,
      categories: categoryError,
      events: eventError,
      scheduling: schedulingError,
      unscheduling: unschedulingError,
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
      scheduleTasks,
      unscheduleTasks,
      createCategory,
      updateCategory,
      deleteCategory,
      updateTaskCategories,
      handleEventDrop,
      handleEventResize,
    },
  };
};
