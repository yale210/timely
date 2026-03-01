import { useCallback, useEffect, useState } from "react";
import moment from "moment";
import AppLayout from "../layouts/AppLayout";
import * as taskService from "../services/taskService";
import type { Task } from "../types";
import { StatCard } from "../components/index";
import { CalendarPage } from "./index";

/**
 * Renders the main dashboard page with stat cards and an embedded calendar.
 */
export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
      setTasks([]);
    }
  }, []);

   
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTasks();
  }, [fetchTasks]);

  const now = moment();
  const overdueTasks = tasks.filter((t) => !t.completed && moment(t.deadline).isBefore(now));
  const todayTasks = tasks.filter(
    (t) =>
      !t.completed &&
      moment(t.deadline).isSame(now, "day") &&
      !overdueTasks.some((ot) => ot.id === t.id)
  );
  const pendingTasks = tasks.filter(
    (t) =>
      !t.completed &&
      moment(t.deadline).isAfter(now) &&
      !moment(t.deadline).isSame(now, "day")
  );
  
  return (
    <AppLayout>
      <main className="w-full px-6 lg:px-10 pt-2 pb-10 min-h-screen bg-">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Overview of your schedule and upcoming tasks
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Today's Tasks"
            value={todayTasks.map((t) => t.title)}
            seeMoreHref="/tasks"
          />
          <StatCard
            title="Pending Tasks"
            value={pendingTasks.map((t) => t.title)}
            seeMoreHref="/tasks"
          />
          <StatCard
            title="Overdue Tasks"
            value={overdueTasks.map((t) => t.title)}
            seeMoreHref="/tasks"
          />

          <section className="col-span-3">
            <div className="w-full rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
              <CalendarPage showNavbar={false} />
            </div>
          </section>
        </section>
      </main>
    </AppLayout>
  );
}
