import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import moment from "moment";
import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect, type CSSProperties } from "react";
import { Calendar, momentLocalizer, type Components, type View, Views } from "react-big-calendar";
import withDragAndDrop, {
  type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { UnifiedSidebar } from "@/components/index";
import AppLayout from "@/layouts/AppLayout";
import * as taskService from "@/services/taskService";
import * as categoryService from "@/services/categoryService";
import * as eventService from "@/services/eventService";
import * as schedulerService from "@/services/schedulerService";
import { preferenceService } from "@/services/preferenceService";
import type { Task, Category, TaskSubmission, Event, EventSubmission, EventMutationContext, Preference } from "@/types";
import { getOverrideColour, hexToRgba } from "@/utils/colorUtils";
import completeSoundUrl from "@/assets/sounds/task-complete.mp3";

const localizer = momentLocalizer(moment);
/**
 * A functional component that renders a calendar view of tasks.
 * @returns The rendered calendar page component.
 */

interface CalendarEntry {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  kind: "task" | "event";
  sourceId: number;
  repeat?: boolean;
  split?: boolean;
  oneGo?: boolean;
  scheduleIndex?: number;
  eventData?: Event;
  categories?: Category[];
  allocationIndex?: number;
  taskData?: Task;
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

const parseClockMinutes = (value: string): number => {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number.parseInt(hourRaw ?? "0", 10);
  const minute = Number.parseInt(minuteRaw ?? "0", 10);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return 0;
  }

  return (hour * 60) + minute;
};

const getDayScheduleWindow = (preference: Preference, slotDate: Date): { start: string; end: string } => {
  const dayKey = slotDate.getDay() === 0 ? 7 : slotDate.getDay();
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

const isOutsidePreferredDayWindow = (slotDate: Date, preference: Preference | null): boolean => {
  if (!preference) {
    return false;
  }

  const { start, end } = getDayScheduleWindow(preference, slotDate);
  const startMinutes = parseClockMinutes(start);
  const endMinutes = parseClockMinutes(end);
  const slotMinutes = (slotDate.getHours() * 60) + slotDate.getMinutes();

  if (startMinutes === endMinutes) {
    return false;
  }

  if (startMinutes < endMinutes) {
    return slotMinutes < startMinutes || slotMinutes >= endMinutes;
  }

  return slotMinutes >= endMinutes && slotMinutes < startMinutes;
};

interface CalendarPageProps {
  showNavbar?: boolean;
  useLayout?: boolean;
}

const CalendarPage = ({ showNavbar = true, useLayout = true }: CalendarPageProps) => {
  const completeSoundRef = useRef<HTMLAudioElement | null>(
    typeof Audio === "undefined" ? null : new Audio(completeSoundUrl),
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Task | Event| undefined>(undefined);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [sidebarMode, setSidebarMode] = useState<"task" | "event">("event");
  const [events, setEvents] = useState<Event[]>([]);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [scheduleOrder, setScheduleOrder] = useState<Record<number, number>>({});
  const [preference, setPreference] = useState<Preference | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [timeGutterWidth, setTimeGutterWidth] = useState(56);
  const headerRef = useRef<HTMLElement | null>(null);
  const calendarShellRef = useRef<HTMLDivElement | null>(null);
  const DragAndDropCalendar = withDragAndDrop<CalendarEntry>(Calendar);
  const calendarHeaderTopClass = showNavbar && useLayout ? "top-10" : "top-0";
  const dateStripDays = useMemo(() => {
    if (view === Views.WEEK) {
      const startOfWeek = moment(date).startOf("week");
      return Array.from({ length: 7 }, (_, index) => startOfWeek.clone().add(index, "day"));
    }

    if (view === Views.DAY) {
      return [moment(date)];
    }

    return [];
  }, [date, view]);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (err) {
      console.log("Fetching tasks.")
      const mockTasks: Task[] = [
          {
            id:1,
            title: "Badminton",
            description: "Placeholder",
            start_time: new Date().toISOString(),
            deadline: new Date().toISOString(),
            importance: 3,
            completed: false,
            estimated_minutes: 120,
            categories: [{id: 1, text: "sport"}],
            //repeat: true,
          },
          {
            id: 2,
            title: "ITR revision",
            description: "Placeholder",
            start_time: new Date().toISOString(),
            deadline: new Date().toISOString(),
            importance: 2,
            completed: false,
            estimated_minutes: 120,
            categories: [{id: 2, text: "revision"}],
            //split: true,
          },
          {
            id: 3,
            title: "Kolling lecture",
            description: "Placeholder",
            start_time: new Date().toISOString(),
            deadline: new Date().toISOString(),
            importance: 100,
            completed: false,
            estimated_minutes: 120,
            categories: [{id: 3, text: "lecture"}],
          },
      ];
      console.error(err);
      setTasks(mockTasks);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await taskService.getCategories();
      setCategories(data);
    } catch (err) {
      setCategories([])
      console.error(err);
    }
  }, []);

  const createCategory = useCallback(async (text: string) => {
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

  const updateCategory = useCallback(async (id: number, patch: { colour?: string | null; colour_override?: boolean }) => {
    const updated = await categoryService.updateCategory(id, patch);
    setCategories((prev) => prev.map((category) => (
      category.id === id ? { ...category, ...updated } : category
    )));
    setTasks((prev) => prev.map((task) => ({
      ...task,
      categories: task.categories.map((category) =>
        category.id === id ? { ...category, ...updated } : category
      ),
    })));
    setEvents((prev) => prev.map((event) => ({
      ...event,
      categories: event.categories.map((category) =>
        category.id === id ? { ...category, ...updated } : category
      ),
    })));
    return updated;
  }, []);

  const updateTaskCategories = useCallback(async (id: number, nextCategoryIds: number[]) => {
    const nextCategoryObjects = categories.filter((category) => nextCategoryIds.includes(category.id));
    setTasks((prev) => prev.map((task) => (
      task.id === id ? { ...task, categories: nextCategoryObjects } : task
    )));
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
  }, [categories, fetchTasks]);

  const deleteCategory = useCallback(async (id: number) => {
    await categoryService.deleteCategory(id);
    setCategories((prev) => prev.filter((category) => category.id !== id));
    setTasks((prev) => prev.map((task) => ({
      ...task,
      categories: task.categories.filter((category) => category.id !== id),
    })));
    setEvents((prev) => prev.map((event) => ({
      ...event,
      categories: event.categories.filter((category) => category.id !== id),
    })));
  }, []);

  const fetchEvents = useCallback(async (activeView: View, activeDate: Date) => {
    try {
      const data = await eventService.getEvents(getCalendarWindow(activeView, activeDate));
      setEvents(data);
    } catch(err) {
      console.error(err);
      setEvents([]);
    }
  }, [])

  const fetchPreference = useCallback(async () => {
    try {
      const data = await preferenceService.getMyPreference();
      setPreference(data);
    } catch (err) {
      console.error(err);
      setPreference(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchTasks();
      await fetchCategories();
      await fetchPreference();
    };
    init().catch((err: unknown) => {
      console.error("Failed to initialise Calendar:", err);
    });
  }, [fetchTasks, fetchCategories, fetchPreference]);

  useEffect(() => {
    void fetchEvents(view, date);
  }, [fetchEvents, view, date]);

  useEffect(() => {
    const element = headerRef.current;
    if (!element) {
      return;
    }

    const updateHeaderHeight = () => {
      setHeaderHeight(element.getBoundingClientRect().height);
    };

    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        updateHeaderHeight();
      });
      observer.observe(element);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", updateHeaderHeight);
      };
    }

    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  useLayoutEffect(() => {
    if (view !== Views.WEEK && view !== Views.DAY) {
      return;
    }

    const measureGutter = () => {
      const shell = calendarShellRef.current;
      if (!shell) {
        return;
      }
      const gutter = shell.querySelector(".rbc-time-gutter");
      if (!(gutter instanceof HTMLElement)) {
        return;
      }
      const nextWidth = Math.ceil(gutter.getBoundingClientRect().width);
      if (nextWidth > 0) {
        setTimeGutterWidth(nextWidth);
      }
    };

    const frame = window.requestAnimationFrame(measureGutter);
    window.addEventListener("resize", measureGutter);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureGutter);
    };
  }, [view, date, tasks.length, events.length]);


  useEffect(() => {
    if (view !== Views.WEEK && view !== Views.DAY) {
      return;
    }

    const shell = calendarShellRef.current;
    if (!shell) {
      return;
    }

    const getScrollableAncestor = (element: HTMLElement): HTMLElement | null => {
      let current: HTMLElement | null = element;
      while (current) {
        const style = window.getComputedStyle(current);
        const canScroll = current.scrollHeight > current.clientHeight + 1;
        const overflowScrollable = style.overflowY === "auto" || style.overflowY === "scroll";
        if (canScroll && overflowScrollable) {
          return current;
        }
        current = current.parentElement;
      }

      return (document.scrollingElement instanceof HTMLElement) ? document.scrollingElement : null;
    };

    const scrollToCurrentHour = () => {
      const slotGroups = shell.querySelectorAll(".rbc-time-gutter .rbc-timeslot-group");
      if (slotGroups.length === 0) {
        return;
      }

      const currentHour = new Date().getHours();
      const targetIndex = Math.min(Math.max(currentHour, 0), slotGroups.length - 1);
      const targetSlot = slotGroups[targetIndex];
      if (!(targetSlot instanceof HTMLElement)) {
        return;
      }

      const scroller = getScrollableAncestor(targetSlot);
      if (!scroller) {
        return;
      }

      const slotRect = targetSlot.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      scroller.scrollTop += Math.round(slotRect.top - scrollerRect.top);
    };

    const frame = window.requestAnimationFrame(scrollToCurrentHour);
    const timer = window.setTimeout(scrollToCurrentHour, 120);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [view, date, tasks.length, events.length]);

  const handleSelectSlot = ({
    start,
    end,
    slots,
    action,
  }: {
    start: Date;
    end: Date;
    slots?: Date[];
    action: "select" | "click" | "doubleClick";
  }) => {
    if (isSidebarOpen && action !== "select") {
      return;
    }
    if (!start) {
      return;
    }
    const slotStart = slots && slots.length > 0 ? slots[0] : start;
    let slotEnd = end ?? slotStart;
    if (slots && slots.length > 0) {
      slotEnd = slots[slots.length - 1];
    }
    if (slotEnd <= slotStart) {
      slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
    }
    setSidebarMode("event");
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
  };

  const handleSelectEvent = (entry: CalendarEntry) => {
    if (entry.kind==="task") {
      const task = entry.taskData ?? tasks.find((t) => t.id === entry.sourceId);
      if (task) {
        setSidebarMode("task");
        setSelectedItem(task);
        setIsSidebarOpen(true);
      }
      return;
    }
    const event = entry.eventData;
    if (event) {
      setSidebarMode("event");
      setSelectedItem(event);
      setIsSidebarOpen(true);
    }
  };

  const handleSubmitTask = async (data: TaskSubmission) => {
    try {
      if (selectedItem && "deadline" in selectedItem && selectedItem.id !== 0) {
        await taskService.updateTask(selectedItem.id, data);
      } else {
        await taskService.createTask(data);
      }
      await fetchTasks();
      setIsSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitEvent = async (
    data: EventSubmission,
    context?: EventMutationContext,
  ) => {
    try {
      if (selectedItem && "end_time" in selectedItem && selectedItem.id !== 0) {
        await eventService.updateEvent(selectedItem.id, data, context);
      } else {
        await eventService.createEvent(data);
      }
      await fetchEvents(view, date);
      setIsSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSelected = async (context?: EventMutationContext) => {
    try {
      if (!selectedItem?.id) {
        console.error("There is either no item, or its id is not valid.");
        return ;
      }
      if ("end_time" in selectedItem) {
        await eventService.deleteEvent(selectedItem.id, context);
        await fetchEvents(view, date);
      } else {
        await taskService.deleteTask(selectedItem.id);
        await fetchTasks();
      }
      setIsSidebarOpen(false);
      setSelectedItem(undefined);
    } catch (error) {
      console.error(error);
    }
  }

  const handleRevertSelectedEvent = async (context: EventMutationContext) => {
    try {
      if (!selectedItem || !("end_time" in selectedItem)) {
        return;
      }
      if (!context.original_start_time) {
        return;
      }

      await eventService.revertEventInstance(selectedItem.id, context.original_start_time);
      await fetchEvents(view, date);
      setIsSidebarOpen(false);
      setSelectedItem(undefined);
    } catch (error) {
      console.error(error);
    }
  };

  const updateTaskAllocation = useCallback(
    async (entry: CalendarEntry, start: Date, end: Date) => {
      if (entry.taskData?.completed || entry.taskData?.locked) {
        return;
      }
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
          item.id === task.id ? { ...item, allocation: nextAllocations } : item
        )
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
        })
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

  const handleToggleTaskComplete = useCallback(
    async (taskId: number) => {
      const task = tasks.find((entry) => entry.id === taskId);
      if (!task) return;
      try {
        if (!task.completed && completeSoundRef.current) {
          completeSoundRef.current.currentTime = 0;
          void completeSoundRef.current.play().catch(() => undefined);
        }
        await taskService.updateTask(taskId, { completed: !task.completed });
        await fetchTasks();
      } catch (err) {
        console.error(err);
      }
    },
    [fetchTasks, tasks, completeSoundRef],
  );

  const formatEventTime = (dateValue: Date) => {
    const hours24 = dateValue.getHours();
    const minutes = dateValue.getMinutes();
    const isPm = hours24 >= 12;
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const suffix = isPm ? "pm" : "am";
    if (minutes === 0) {
      return `${hours12}${suffix}`;
    }
    const padded = String(minutes).padStart(2, "0");
    return `${hours12}:${padded}${suffix}`;
  };

  const components = useMemo<Components<CalendarEntry>>(
    () => ({
      event: ({ event }: { event: CalendarEntry }) => {
        const timeLabel = `${formatEventTime(event.start)} - ${formatEventTime(event.end)}`;
        if (event.kind !== "task") {
          return (
            <div className="flex h-full w-full items-start gap-2">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[20px] font-medium">{event.title}</span>
                <span className="truncate text-[15px] text-gray-700">{timeLabel}</span>
                {event.eventData?.location && (
                  <span className="truncate text-[13px] text-gray-600">
                    {event.eventData.location}
                  </span>
                )}
              </div>
            </div>
          );
        }
        return (
          <div className="flex h-full w-full items-start gap-2">
            <input
              type="checkbox"
              checked={Boolean(event.taskData?.completed)}
              onChange={(e) => {
                e.stopPropagation();
                void handleToggleTaskComplete(event.sourceId);
              }}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 task-event-checkbox"
              aria-label="Mark task complete"
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[20px] font-medium">{event.title}</span>
              <span className="truncate text-[15px] text-gray-600">{timeLabel}</span>
            </div>
          </div>
        );
      },
    }),
    [handleToggleTaskComplete],
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

  const handleRescheduleTasks = async () => {
    setIsRescheduling(true);
    try {
      await schedulerService.unscheduleTasks();
      const response = await schedulerService.scheduleTasks({
        start_date: moment(date).format("YYYY-MM-DD"),
        allow_split: true,
      });
      const nextOrder: Record<number, number> = {};
      response.results
        .filter((result) => result.success && result.scheduled_start && result.scheduled_end)
        .forEach((result, index) => {
          nextOrder[result.task_id] = index;
        });
      setScheduleOrder(nextOrder);
      await fetchTasks();
      void response;
    } catch (err) {
      console.error(err);
    } finally {
      setIsRescheduling(false);
    }
  };

  const calendarEntries: CalendarEntry[] = [
    ...tasks.flatMap((task) => {
      const allocations = task.allocation ?? [];
      if (allocations.length === 0) {
        return [];
      }
      return allocations.map((slot, index) => ({
        id: `task-${task.id}-${index}`,
        title: task.title,
        start: new Date(slot.start),
        end: new Date(slot.end),
        allDay: moment(slot.end).diff(moment(slot.start), "hours") >= 24,
        kind: "task" as const,
        sourceId: task.id,
        taskData: task,
        split: allocations.length > 1,
        oneGo: allocations.length === 1,
        scheduleIndex: scheduleOrder[task.id],
        categories: task.categories,
        allocationIndex: index,
      }));
    }),
    ...events.map((event) => ({
      id: event.instance_id ?? `event-${event.id}-${event.start_time}`,
      title: event.title,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      allDay: false,
      kind: "event" as const,
      sourceId: event.id,
      oneGo: true,
      eventData: event,
    })),
  ];
  const content = (
    /*<div style={{ height: "80vh", padding: "2rem" }}>
      <h1>Task Calendar</h1>
      <div style={{ marginBottom: "1rem"}}>
        <h2 style={{ fontWeight: 600}}>Debug</h2>
        <p>Tasks loaded: {tasks.length}</p>
        <pre style={{ fontSize: 12, background: "#f5f5f5", padding: 12, borderRadius: 8}}>
          {JSON.stringify(tasks.slice(0, 3), null, 2)}
        </pre>
      </div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
      />
    </div>*/
    <div className="flex h-full min-h-0 flex-col bg-white text-black">
      <header
        ref={headerRef}
        className={`calendar-header fixed left-0 right-0 z-20 flex-none border-b border-gray-200 bg-white pt-2 pb-0 shadow-sm ${calendarHeaderTopClass}`}
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 px-4">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold tracking-tight text-black">
              Calendar
            </h1>
            <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() =>
                  setDate(moment(date).subtract(1, view as "month" | "week" | "day").toDate())
                }
                className="flex h-8 w-8 items-center justify-center hover:bg-blue-100 text-gray-500 transition-colors border-r border-gray-200"
              >
                <span className="material-icons text-xl">chevron_left</span>
              </button>
              <button
                onClick={() => setDate(new Date())}
                className="hidden h-8 items-center justify-center px-4 text-sm font-medium text-black hover:bg-blue-100 transition-colors sm:flex"
              >
                Today
              </button>
              <button
                onClick={() =>
                  setDate(moment(date).add(1, view as "month" | "week" | "day").toDate())
                }
                className="flex h-8 w-8 items-center justify-center hover:bg-blue-100 text-gray-500 transition-colors border-l border-gray-200"
              >
                <span className="material-icons text-xl">chevron_right</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { void handleRescheduleTasks(); }}
                disabled={isRescheduling}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm transition-colors ${
                  isRescheduling
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-blue-300"
                }`}
              >
                <span className="material-icons text-lg mr-1.5">update</span>
                {isRescheduling ? "Rescheduling..." : "Reschedule"}
              </button>
            </div>
            <div className="hidden md:flex bg-gray-100 p-1 rounded-lg">
              {(
                [
                  { label: "Month", value: Views.MONTH },
                  { label: "Week", value: Views.WEEK },
                  { label: "Day", value: Views.DAY },
                  { label: "Agenda", value: Views.AGENDA },
                ] as const
              ).map((v) => (
                <button
                  key={v.value}
                  onClick={() => setView(v.value)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                    view === v.value
                      ? "bg-white shadow-sm text-black"
                      : "text-gray-500 hover:bg-blue-100 hover:text-black"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <h2 className="text-xl font-semibold w-48 text-center uppercase tracking-wide text-black">
              {moment(date).format("MMMM YYYY")}
            </h2>
          </div>
        </div>
        {dateStripDays.length > 0 && (
          <div
            className="mt-2 grid border-t border-gray-200 bg-white"
            style={{
              gridTemplateColumns: `${timeGutterWidth}px repeat(${dateStripDays.length}, minmax(0, 1fr))`,
            }}
          >
            <div className="border-r border-gray-200 bg-gray-50" />
            {dateStripDays.map((dayMoment) => {
              const isToday = dayMoment.isSame(moment(), "day");
              const isActiveDay = view === Views.DAY && dayMoment.isSame(moment(date), "day");
              return (
                <div
                  key={dayMoment.format("YYYY-MM-DD")}
                  className={`border-l border-gray-200 px-3 py-2 text-center ${
                    isToday || isActiveDay
                      ? "bg-blue-50 text-black"
                      : "bg-white text-gray-700"
                  }`}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {dayMoment.format("ddd")}
                  </p>
                  <p className="text-sm font-semibold">
                    {dayMoment.format("D MMM")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </header>

      <main
        className="relative flex min-h-0 grow overflow-hidden bg-white"
        style={{ paddingTop: `${headerHeight}px` }}
      >
        <div
          ref={calendarShellRef}
          className="calendar-grid-shell grow min-h-0 overflow-hidden bg-white"
        >
          <DndProvider backend={HTML5Backend}>
            <DragAndDropCalendar
              localizer={localizer}
              events={calendarEntries}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              step={60}
              timeslots={1}
              slotPropGetter={(slotDate: Date) => {
                if ((view !== Views.WEEK && view !== Views.DAY) || !isOutsidePreferredDayWindow(slotDate, preference)) {
                  return {};
                }

                return {
                  className: "calendar-off-hours-slot",
                };
              }}
              selectable="ignoreEvents"
              onSelectSlot={handleSelectSlot}
              onSelectEvent={(e) => {
                handleSelectEvent(e)
              }}
              draggableAccessor={(entry) =>
                entry.kind === "event" ||
                (entry.kind === "task" && !entry.taskData?.completed && !entry.taskData?.locked)
              }
              resizableAccessor={(entry) =>
                entry.kind === "event" ||
                (entry.kind === "task" && !entry.taskData?.completed && !entry.taskData?.locked)
              }
              onEventDrop={(args) => {
                void handleEventDrop(args);
              }}
              onEventResize={(args) => {
                void handleEventResize(args);
              }}
              toolbar={false}
              className="h-full"
              components={components}
              eventPropGetter={(event: CalendarEntry) => {
                const className=[
                  "event-slot",
                  event.kind === "task" ? "task-event" : "",
                  event.repeat ? "is-repeat": "",
                  event.split ? "is-split" : "",
                  event.oneGo ? "is-onego" : "",
                  event.kind === "event" ? "is-event" : "",
                  event.kind === "task" && typeof event.scheduleIndex === "number" ? "is-just-scheduled" : "",
                ]
                .filter(Boolean)
                .join(" ");
                const overrideColour =
                  event.kind === "task"
                    ? getOverrideColour(event.categories)
                    : getOverrideColour(event.eventData?.categories);
                const fallbackColour =
                  event.kind === "task"
                    ? event.taskData?.colour ?? "#3b82f6"
                    : event.eventData?.colour ?? "#f97316";
                const appliedColour = overrideColour ?? fallbackColour;

                const style: CSSProperties = {};
                if (event.kind === "task" && typeof event.scheduleIndex === "number") {
                  style.animationDelay = `${event.scheduleIndex * 120}ms`;
                }
                if (appliedColour) {
                  style.backgroundColor = hexToRgba(appliedColour, 0.5);
                  style.borderLeft = `4px solid ${appliedColour}`;
                  (style as Record<string, string>)["--event-stripe-color"] = hexToRgba(
                    appliedColour,
                    0.6,
                  );
                  style.color = "#000000";
                }

                return { className, style };
              }}
            />
          </DndProvider>
        </div>
      </main>

      <UnifiedSidebar
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          setSelectedItem(undefined);
          setSidebarMode("event");
        }}
        categories={categories}
        onCreateCategory={createCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        onTaskCategoryChange={(id, nextCategories) => {
          void updateTaskCategories(id, nextCategories);
        }}
        initialData={selectedItem}
        initialMode={sidebarMode}
        onSubmitTask={(data) => { void handleSubmitTask(data); }}
        onSubmitEvent={(data, context) => { void handleSubmitEvent(data, context); }}
        onDelete={(context) => { void handleDeleteSelected(context); }}
        onRevertToSeries={(context) => { void handleRevertSelectedEvent(context); }}
      />
    </div>
  );

  if (!useLayout) {
    return content;
  }

  return (
    <AppLayout showNavbar={showNavbar} disableMainScroll>
      {content}
    </AppLayout>
  );
};

export default CalendarPage;
