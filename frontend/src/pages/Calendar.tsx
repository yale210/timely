import React, { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer, type View, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { TaskSidebar } from "../components";
import AppLayout from "../layouts/AppLayout";
import * as taskService from "../services/taskService";
import { type Task, type Category, type TaskSubmission } from "../types";

const localizer = momentLocalizer(moment);

const CalendarPage: React.FC = () => {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
    fetchCategories();
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
      if (selectedTask && selectedTask.id !== 0) {
        await taskService.updateTask(selectedTask.id, data);
      } else {
        await taskService.createTask(data);
      }
      fetchTasks();
      setIsSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await taskService.deleteTask(id);
      fetchTasks();
      setIsSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const events = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    start: new Date(task.start_time),
    end: new Date(task.deadline),
    allDay: moment(task.deadline).diff(moment(task.start_time), "hours") >= 24,
  }));

  return (
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
              eventPropGetter={() => ({
                className:
                  "bg-blue-100 text-blue-700 font-medium border-l-4 border-blue-500 rounded-md px-2 py-1 text-xs",
                style: {
                  backgroundColor: undefined,
                  color: undefined,
                  border: undefined,
                },
              })}
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
          onSubmit={handleSubmitTask}
          onDelete={handleDeleteTask}
          initialData={selectedTask}
        />
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
