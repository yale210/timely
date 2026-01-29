import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";
interface Task {
  id: number;
  task_message: string;
  start_time: string;
  deadline: string;
  importance: number;
  completed: boolean;
}
const localizer = momentLocalizer(moment);
/**
 * A functional component that renders a calendar view of tasks.
 * @returns The rendered calendar page component.
 */
const CalendarPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get<Task[]>("/api/tasks/");
        setTasks(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    void fetchTasks();
  }, []);
  const events = tasks.map((task) => ({
    id: task.id,
    title: task.task_message,
    start: new Date(task.start_time),
    end: new Date(task.deadline),
    allDay: true,
  }));
  return (
    <div style={{ height: "80vh", padding: "2rem" }}>
      <h1>Task Calendar</h1>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
      />
    </div>
  );
};
export default CalendarPage;