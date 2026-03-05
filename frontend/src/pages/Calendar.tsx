import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import { useState, useEffect, useCallback, type CSSProperties } from "react";
import { Calendar, momentLocalizer, type View, Views } from "react-big-calendar";
import { UnifiedSidebar } from "@/components/index";
import AppLayout from "@/layouts/AppLayout";
import * as taskService from "@/services/taskService";
import * as categoryService from "@/services/categoryService";
import * as eventService from "@/services/eventService";
import * as schedulerService from "@/services/schedulerService";
import type { Task, Category, TaskSubmission, Event, EventSubmission, EventMutationContext} from "@/types";
import { getOverrideColour, hexToRgba } from "@/utils/colorUtils";

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

interface CalendarPageProps {
  showNavbar?: boolean;
  useLayout?: boolean;
}

const CalendarPage = ({ showNavbar = true, useLayout = true }: CalendarPageProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Task | Event| undefined>(undefined);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [sidebarMode, setSidebarMode] = useState<"task" | "event">("task");
  const [events, setEvents] = useState<Event[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isUnscheduling, setIsUnscheduling] = useState(false);
  const [scheduleOrder, setScheduleOrder] = useState<Record<number, number>>({});

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
      const data = await categoryService.getCategories();
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

  useEffect(() => {
    const init = async () => {
      await fetchTasks();
      await fetchCategories();
    };
    init().catch((err: unknown) => {
      console.error("Failed to initialise Calendar:", err);
    });
  }, [fetchTasks, fetchCategories]);

  useEffect(() => {
    void fetchEvents(view, date);
  }, [fetchEvents, view, date]);

  const handleSelectSlot = ({
    start,
    end,
    action,
  }: {
    start: Date;
    end: Date;
    action: "select" | "click" | "doubleClick";
  }) => {
    if (isSidebarOpen && action !== "select") {
      return;
    }
    setSidebarMode("event");
    setSelectedItem({
      id: 0,
      title: "",
      description: "",
      location: "",
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      categories: [],
      reminders: [],
      recurrence_interval: null,
      recurrence_end: null,
    });
    setIsSidebarOpen(true);
  };

  const handleSelectEvent = (entry: CalendarEntry) => {
    if (entry.kind==="task") {
      const task = tasks.find((t) =>t.id===entry.sourceId);
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

  const handleScheduleTasks = async () => {
    setIsScheduling(true);
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
      void response;
    } catch (err) {
      console.error(err);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleUnscheduleTasks = async () => {
    setIsUnscheduling(true);
    try {
      await schedulerService.unscheduleTasks();
      await fetchTasks();
      setScheduleOrder({});
    } catch (err) {
      console.error(err);
    } finally {
      setIsUnscheduling(false);
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
        split: allocations.length > 1,
        oneGo: allocations.length === 1,
        scheduleIndex: scheduleOrder[task.id],
        categories: task.categories,
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
    <div className="flex h-full flex-col overflow-hidden bg-white text-black">
      <header className="flex-none p-6 border-b border-gray-200 bg-white shadow-sm z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold tracking-tight text-black">
              Calendar
            </h1>
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
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { void handleScheduleTasks(); }}
                disabled={isScheduling || isUnscheduling}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm transition-colors ${
                  isScheduling || isUnscheduling
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-blue-300"
                }`}
              >
                <span className="material-icons text-lg mr-1.5">auto_awesome</span>
                {isScheduling ? "Scheduling..." : "Schedule Tasks"}
              </button>
              <button
                onClick={() => { void handleUnscheduleTasks(); }}
                disabled={isScheduling || isUnscheduling}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm transition-colors ${
                  isScheduling || isUnscheduling
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="material-icons text-lg mr-1.5">event_busy</span>
                {isUnscheduling ? "Unscheduling..." : "Unschedule Tasks"}
              </button>
            </div>
            <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() =>
                  setDate(moment(date).subtract(1, view as "month" | "week" | "day").toDate())
                }
                className="p-2 hover:bg-blue-100 text-gray-500 transition-colors border-r border-gray-200"
              >
                <span className="material-icons text-xl">chevron_left</span>
              </button>
              <button
                onClick={() => setDate(new Date())}
                className="px-4 py-2 font-medium text-black hover:bg-blue-100 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() =>
                  setDate(moment(date).add(1, view as "month" | "week" | "day").toDate())
                }
                className="p-2 hover:bg-blue-100 text-gray-500 transition-colors border-l border-gray-200"
              >
                <span className="material-icons text-xl">chevron_right</span>
              </button>
            </div>
            <h2 className="text-xl font-semibold w-48 text-center uppercase tracking-wide text-black">
              {moment(date).format("MMMM YYYY")}
            </h2>
          </div>
        </div>
      </header>

      <main className="grow flex overflow-hidden relative p-4 bg-white">
        <div className="grow bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <Calendar<CalendarEntry>
            localizer={localizer}
            events={calendarEntries}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={(e) => {
              handleSelectEvent(e)
            }}
            toolbar={false}
            className="h-full"
            eventPropGetter={(event: CalendarEntry) => {
              const className=[
                "event-slot",
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

              const style: CSSProperties = {};
              if (event.kind === "task" && typeof event.scheduleIndex === "number") {
                style.animationDelay = `${event.scheduleIndex * 120}ms`;
              }
              if (overrideColour) {
                style.backgroundColor = hexToRgba(overrideColour, 0.5);
                style.borderLeft = `4px solid ${overrideColour}`;
                style.color = "#000000";
              }

              return { className, style };
            }}
  />
        </div>
      </main>

      <UnifiedSidebar
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          setSelectedItem(undefined);
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
    <AppLayout showNavbar={showNavbar}>
      {content}
    </AppLayout>
  );
};

export default CalendarPage;
