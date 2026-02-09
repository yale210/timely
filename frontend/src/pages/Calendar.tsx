import { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer, type View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { TaskSidebar } from "../components";
import "../index.css"
import AppLayout from "../layouts/AppLayout";
import * as taskService from "../services/taskService";
import { type Task, type Category, type TaskSubmission } from "../types";

const localizer = momentLocalizer(moment);
/**
 * A functional component that renders a calendar view of tasks.
 * @returns The rendered calendar page component.
 */

type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay: Boolean;
  repeat?: Boolean;
  split?: Boolean;
  oneGo?: Boolean;
}

const CalendarPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

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

  useEffect(() => {
    const init = async () => {
      await fetchTasks();
      await fetchCategories();
    };
    init().catch((err: unknown) => {
      console.error("Failed to initialise Calendar:", err);
    });
  }, [fetchTasks, fetchCategories]);

  const handleSelectSlot = ({ start }: { start: Date }) => {
    // Create a template for a new task
    setSelectedTask({
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

  const handleSelectEvent = (event: { id: number }) => {
    const task = tasks.find((t) => t.id === event.id);
    if (task) {
      setSelectedTask(task);
      setIsSidebarOpen(true);
    }
  };

  const handleSubmitTask = async (data: TaskSubmission) => {
    try {
      if (selectedTask?.id && selectedTask.id !== 0) {
        await taskService.updateTask(selectedTask.id, data);
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

  const events: CalendarEvent[] = tasks.map((task, index) => ({
    id: task.id,
    title: task.title,
    start: new Date(task.start_time),
    end: new Date(task.deadline),
    /*
    repeat: Boolean(task.repeat),
    split: Boolean(task.split),
    oneGo: Boolean(task["one-go"]),
    */
    repeat: index%3==0,
    split: index%2==0,
    setTime: index%3==1,
    oneGo: index%3==1,
    allDay: moment(task.deadline).diff(moment(task.start_time), "hours") >= 24,
  }));
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
                Task Calendar
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
              events={events}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              toolbar={false}
              className="h-full"
              eventPropGetter={(event: CalendarEvent) => {
                /*className:
                  "bg-blue-100 text-blue-700 font-medium border-l-4 border-blue-500 rounded-md px-2 py-1 text-xs",
                style: {
                  backgroundColor: undefined,
                  color: undefined,
                  border: undefined,
                },*/
                const className=[
                  "event-slot",
                  event.repeat ? "is-repeat": "",
                  event.split ? "is-split" : "",
                  event.oneGo ? "is-onego" : "",
                ]
                .filter(Boolean)
                .join(" ");
                return { className };
              }}
            />
          </div>
        </main>

        <TaskSidebar
          isOpen={isSidebarOpen}
          onClose={() => {
            setIsSidebarOpen(false);
            setSelectedTask(undefined);
          }}
          categories={categories}
          onSubmit={(data) => { void handleSubmitTask(data); }}
          onDelete={(id) => { void handleDeleteTask(id); }}
          initialData={selectedTask}
        />
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
