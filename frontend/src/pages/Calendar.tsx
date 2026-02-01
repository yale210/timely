import React, { useState, useEffect } from "react";
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
  repeat?: boolean;
  split?: boolean;
  setTime?: boolean;
}
/*
Categories - 
repeat,
split,
one-go
*/
const localizer = momentLocalizer(moment);

const CalendarPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      console.log("Fetching tasks.")
      const mockTasks: Task[] = [
          {
            id:1,
            task_message: "Badminton",
            start_time: new Date().toISOString(),
            deadline: new Date().toISOString(),
            importance: 3,
            completed: false,
            repeat: true,
          },
          {
            id: 2,
            task_message: "ITR revision",
            start_time: new Date().toISOString(),
            deadline: new Date().toISOString(),
            importance: 2,
            completed: false,
            split: true,
          },
          {
            id: 3,
            task_message: "Kolling lecture",
            start_time: new Date().toISOString(),
            deadline: new Date().toISOString(),
            importance: 100,
            completed: false,
            "one-go": true,
          },
      ];
      try {
        const res = await axios.get("/api/tasks/");
        console.log("Tasks response:", res.data);
        setTasks(res.data);
        const data = Array.isArray(res.data) ? res.data : [];
        setTasks(data.length ? data : mockTasks)
      } catch (err) {
        console.error(err);
        setTasks(mockTasks);
      }
    };

    fetchTasks();
  }, []);

  const events = tasks.map((task, index) => ({
    id: task.id,
    title: task.task_message,
    start: new Date(task.start_time),
    end: new Date(task.deadline),
    allDay: true,

    /*
    repeat: Boolean(task.repeat),
    split: Boolean(task.split),
    oneGo: Boolean(task["one-go"]),
    */
    repeat: index%3==0,
    split: index%2==0,
    setTime: index%3==1,
  }));

  return (
    <div style={{ height: "80vh", padding: "2rem" }}>
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
    </div>
  );
};

export default CalendarPage;