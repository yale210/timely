import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MiniCalendarPreview from "@/components/dashboard/MiniCalendarPreview";
import * as taskService from "@/services/taskService";
import type { Event, Task, WeeklyStats } from "@/types";
import { getOverrideColour, hexToRgba } from "@/utils/colorUtils";

interface DashboardOverviewProps {
  tasks: Task[];
  events: Event[];
  weeklyStats: WeeklyStats | null;
}

const WeeklyStatCard = ({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) => (
  <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
    <p className="text-sm text-gray-500">{title}</p>
    <div className="mt-3 text-2xl font-semibold text-gray-900">{value}</div>
    {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
  </div>
);

const UpcomingTasksCard = ({
  tasks,
  checkedOverrides,
  onToggle,
}: {
  tasks: Task[];
  checkedOverrides: Record<number, boolean | undefined>;
  onToggle: (task: Task, nextChecked: boolean) => void;
}) => (
  <div className="flex h-full flex-col rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
    <p className="text-lg font-semibold text-gray-900">Upcoming Tasks</p>
    <ul className="mt-4 space-y-3 overflow-hidden text-base text-gray-900">
      {tasks.length > 0 ? tasks.map((task) => {
        const isChecked = checkedOverrides[task.id] ?? task.completed;
        const overrideColour = getOverrideColour(task.categories);
        const baseColour = overrideColour ?? "#3b82f6";
        const backgroundColour = overrideColour ? hexToRgba(baseColour, 0.12) : hexToRgba(baseColour, 0.08);
        return (
          <li
            key={task.id}
            className="flex items-start gap-3 rounded-md border px-3 py-3"
            style={{
              borderColor: baseColour,
              backgroundColor: backgroundColour,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.02)",
            }}
          >
            <input
              id={`upcoming-task-${task.id}`}
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={isChecked}
              onChange={(event) => {
                void onToggle(task, event.target.checked);
              }}
            />
            <label
              className={`text-base font-medium leading-6 ${isChecked ? "text-gray-400 line-through" : "text-gray-900"}`}
              htmlFor={`upcoming-task-${task.id}`}
            >
              {task.title}
            </label>
          </li>
        );
      }) : (
        <li className="text-gray-400">No tasks.</li>
      )}
    </ul>
  </div>
);

/**
 * Renders the dashboard header, stat cards, and calendar shortcut.
 * @param props - Dashboard content props.
 * @param props.tasks - Tasks for mini calendar preview.
 * @param props.events - Events for mini calendar preview.
 * @param props.weeklyStats - Weekly summary stats for dashboard.
 * @returns The dashboard presentational layout.
 */
const DashboardOverview = ({
  tasks,
  events,
  weeklyStats,
}: DashboardOverviewProps) => {
  const [checkedOverrides, setCheckedOverrides] = useState<Record<number, boolean | undefined>>({});

  const recentTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const aTime = new Date(a.deadline).getTime();
      const bTime = new Date(b.deadline).getTime();
      return aTime - bTime;
    });
    return sorted.slice(0, 8);
  }, [tasks]);

  const handleToggleTask = (task: Task, nextChecked: boolean) => {
    setCheckedOverrides((prev) => ({ ...prev, [task.id]: nextChecked }));
    void (async () => {
      try {
        await taskService.updateTask(task.id, { completed: nextChecked });
      } catch (error) {
        console.error(error);
        setCheckedOverrides((prev) => ({ ...prev, [task.id]: task.completed }));
      }
    })();
  };

  return (
  <main className="min-h-screen w-full px-6 pt-2 pb-10 lg:px-10">
    <header className="mb-10 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        Overview
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Overview of your schedule and upcoming tasks
      </p>
    </header>

    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <WeeklyStatCard
        title="Tasks Planned"
        value={weeklyStats ? String(weeklyStats.total_tasks) : "Loading..."}
        subtitle={weeklyStats ? "Total tasks this week" : undefined}
      />
      <WeeklyStatCard
        title="Weekly Progress"
        value={weeklyStats ? `${weeklyStats.completion_percentage}%` : "Loading..."}
        subtitle={
          weeklyStats
            ? `${weeklyStats.completed_tasks}/${weeklyStats.total_tasks} tasks completed`
            : undefined
        }
      />
      <WeeklyStatCard
        title="Minutes Planned"
        value={weeklyStats ? String(weeklyStats.total_minutes_planned) : "Loading..."}
        subtitle={weeklyStats ? "Planned this week" : undefined}
      />
    </section>

    <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5 items-stretch">
      <section className="lg:col-span-3">
        <Link
          to="/calendar"
          className="block h-full w-full rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition hover:bg-gray-50 hover:ring-gray-300"
          aria-label="Open calendar page"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Weekly Agenda</h2>
              <p className="mt-1 text-sm text-gray-500">
                Your week at a glance. Click to open full calendar.
              </p>
            </div>
            <span className="material-icons text-2xl text-gray-500">calendar_view_week</span>
          </div>
          <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
            <div className="w-full">
              <MiniCalendarPreview tasks={tasks} events={events} useFullHeight />
            </div>
          </div>
        </Link>
      </section>

      <section className="lg:col-span-2">
        <UpcomingTasksCard
          tasks={recentTasks}
          checkedOverrides={checkedOverrides}
          onToggle={handleToggleTask}
        />
      </section>
    </section>
  </main>
  );
};

export default DashboardOverview;
