import { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer, type View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { UnifiedSidebar } from "../components";
import AppLayout from "../layouts/AppLayout";
import * as taskService from "../services/taskService";
import * as eventService from "../services/eventService";
import { type Task, type Category, type TaskSubmission, type Event, type EventSubmission } from "../types";

const localizer = momentLocalizer(moment);

/**
 * A functional component that renders a calendar view of tasks and events.
 * @returns The rendered calendar page component.
 */
const CalendarPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Task | Event | undefined>(undefined);
  const [sidebarMode, setSidebarMode] = useState<"task" | "event">("event");
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  const fetchTasks = useCallback(async () => {
    try {
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await eventService.getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await taskService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchTasks(), fetchEvents(), fetchCategories()]);
    };
    init().catch((err: unknown) => {
      console.error("Failed to initialise Calendar:", err);
    });
  }, [fetchTasks, fetchEvents, fetchCategories]);

  interface CalendarEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    isEvent: boolean;
    allDay?: boolean;
  }

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setSelectedItem(undefined);
    setSidebarMode("event");
    // We can pass initial start_time via sharedData in UnifiedSidebar if we wanted,
    // but here we'll just set it in the template if needed.
    // Actually, UnifiedSidebar handles initialData.
    const template: Partial<Event> = {
      start_time: start.toISOString(),
      end_time: moment(start).add(1, "hour").toISOString(),
    };
    setSelectedItem(template as Event);
    setIsSidebarOpen(true);
  };

  const handleSelectEvent = (calendarEvent: CalendarEvent) => {
    if (calendarEvent.isEvent) {
      const event = events.find((e) => e.id === calendarEvent.id);
      if (event) {
        setSelectedItem(event);
        setSidebarMode("event");
        setIsSidebarOpen(true);
      }
    } else {
      const task = tasks.find((t) => t.id === calendarEvent.id);
      if (task) {
        setSelectedItem(task);
        setSidebarMode("task");
        setIsSidebarOpen(true);
      }
    }
  };

  const handleSubmitTask = async (data: TaskSubmission) => {
    try {
      if (selectedItem?.id && "deadline" in selectedItem) {
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

  const handleSubmitEvent = async (data: EventSubmission) => {
    try {
      if (selectedItem?.id && "end_time" in selectedItem) {
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

  const handleDelete = async () => {
    if (!selectedItem?.id) return;
    try {
      if ("deadline" in selectedItem) {
        await taskService.deleteTask(selectedItem.id);
        await fetchTasks();
      } else {
        await eventService.deleteEvent(selectedItem.id);
        await fetchEvents();
      }
      setIsSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const expandRecurrence = (eventsToExpand: Event[]): CalendarEvent[] => {
    const expanded: CalendarEvent[] = [];
    const twoYearsFromNow = moment().add(2, "years");

    eventsToExpand.forEach((event) => {
      // If not recurring, add as-is
      if (!event.recurrence_interval) {
        expanded.push({
          id: event.id,
          title: event.title,
          start: new Date(event.start_time),
          end: new Date(event.end_time),
          isEvent: true,
        });
        return;
      }

      // For recurring events, expand with 2-year hard limit
      const currentStart = moment(event.start_time);
      const currentEnd = moment(event.end_time);
      // If recurrence_end is null ("never"), use the 2-year window as the limit
      const recurrenceEnd = event.recurrence_end ? moment(event.recurrence_end) : twoYearsFromNow;
      const limit = moment.min(recurrenceEnd, twoYearsFromNow);

      while (currentStart.isBefore(limit) || currentStart.isSame(limit, "day")) {
        expanded.push({
          id: event.id,
          title: event.title,
          start: currentStart.toDate(),
          end: currentEnd.toDate(),
          isEvent: true,
        });

        if (event.recurrence_interval === "daily") {
          currentStart.add(1, "day");
          currentEnd.add(1, "day");
        } else if (event.recurrence_interval === "weekly") {
          currentStart.add(1, "week");
          currentEnd.add(1, "week");
        } else if (event.recurrence_interval === "monthly") {
          currentStart.add(1, "month");
          currentEnd.add(1, "month");
        } else if (event.recurrence_interval === "yearly") {
          currentStart.add(1, "year");
          currentEnd.add(1, "year");
        } else {
          break;
        }
      }
    });
    return expanded;
  };

  const calendarEvents: CalendarEvent[] = [
    ...tasks.map((task) => ({
      id: task.id,
      title: task.title,
      start: new Date(task.start_time),
      end: new Date(task.deadline),
      isEvent: false,
      allDay: moment(task.deadline).diff(moment(task.start_time), "hours") >= 24,
    })),
    ...expandRecurrence(events),
  ];

  return (
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
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              toolbar={false}
              className="h-full"
              eventPropGetter={(event) => ({
                className: "font-medium border-l-4 rounded-md px-2 py-1 text-xs shadow-sm",
                style: {
                  backgroundColor: event.isEvent ? "#f97316" : "#3b82f6", // orange-500 : blue-500
                  color: "#ffffff",
                  borderColor: event.isEvent ? "#c2410c" : "#1d4ed8", // orange-700 : blue-700
                },
              })}
            />
          </div>
        </main>

        <UnifiedSidebar
          isOpen={isSidebarOpen}
          onClose={() => {
            setIsSidebarOpen(false);
            setSelectedItem(undefined);
          }}
          initialMode={sidebarMode}
          categories={categories}
          initialData={selectedItem}
          onSubmitTask={(data) => { void handleSubmitTask(data); }}
          onSubmitEvent={(data) => { void handleSubmitEvent(data); }}
          onDelete={() => { void handleDelete(); }}
        />
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
