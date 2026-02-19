import { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer, type View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { UnifiedSidebar } from "../components";
import "../index.css"
import AppLayout from "../layouts/AppLayout";
import * as taskService from "../services/taskService";
import * as eventService from "@/services/eventService";
import * as schedulerService from "../services/schedulerService";
import type {
  Task,
  Category,
  TaskSubmission,
  Event,
  EventSubmission,
} from "../types";

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
}

const CalendarPage = () => {
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
      /*try {
        //const res = await axios.get("/api/tasks/");
        setTasks(res.data);
        const data = Array.isArray(res.data) ? res.data : [];
        setTasks(data.length ? data : mockTasks)
      } catch (err) {
        console.error(err);
        setTasks(mockTasks);
      }
      console.error(err);*/
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

  const fetchEvents = useCallback(async () => {
    try {
      const data = await eventService.getEvents();
      setEvents(data);
    } catch(err) {
      console.error(err);
      setEvents([]);
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await fetchTasks();
      await fetchEvents();
      await fetchCategories();
    };
    init().catch((err: unknown) => {
      console.error("Failed to initialise Calendar:", err);
    });
  }, [fetchTasks, fetchEvents, fetchCategories]);

  const handleSelectSlot = ({ start }: { start: Date }) => {
    // Create a template for a new task
    setSidebarMode("task");
    setSelectedItem({
      id: 0,
      title: "",
      description: "",
      start_time: start.toISOString(),
      deadline: moment(start).add(1, "hour").toISOString(),
      importance: 5,
      completed: false,
      categories: [],
      estimated_minutes: 30,
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
    const event = events.find((ev) => ev.id===entry.sourceId);
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

  const handleDeleteTask = async (id: number) => {
    try {
      await taskService.deleteTask(id);
      await fetchTasks();
      setIsSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitEvent = async (data: EventSubmission) => {
    try {
      if (selectedItem && "end_time" in selectedItem && selectedItem.id !== 0) {
        await eventService.updateEvent(selectedItem.id, data);
      } else {
        await eventService.createEvent(data);
      }
      await fetchEvents();
      setIsSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      if (!selectedItem?.id) {
        console.error("There is either no item, or its id is not valid.");
        return ;
      }
      if ("end_time" in selectedItem) {
        await eventService.deleteEvent(selectedItem.id);
        await fetchEvents();
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
      }));
    }),
    ...events.map((event) => ({
      id: `event-${event.id}`,
      title: event.title,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      allDay: false,
      kind: "event" as const,
      sourceId: event.id,
      oneGo: true,
    })),
  ];
  return (
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
    <AppLayout>
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

        <main className="flex-grow flex overflow-hidden relative p-4 bg-white">
          <div className="flex-grow bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                const style = event.kind === "task" && typeof event.scheduleIndex === "number"
                  ? { animationDelay: `${event.scheduleIndex * 120}ms` }
                  : undefined;
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
          initialData={selectedItem}
          initialMode={sidebarMode}
          onSubmitTask={(data) => { void handleSubmitTask(data); }}
          onSubmitEvent={(data) => { void handleSubmitEvent(data); }}
          onDelete={() => { void handleDeleteSelected(); }}
        />
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
