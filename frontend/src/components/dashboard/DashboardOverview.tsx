import { useMemo, useState } from "react";
import moment from "moment";
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

const WeeklyStatCard = ({
  title,
  value,
  subtitle,
  className,
}: {
  title: string;
  value: string;
  subtitle?: string;
  className?: string;
}) => (
  <div className={`rounded-lg p-6 shadow-sm ring-1 ring-gray-900/5 ${className ?? "bg-white"}`}>
    <p className="text-sm text-gray-500">{title}</p>
    <div className="mt-3 text-2xl font-semibold text-gray-900">{value}</div>
    {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
  </div>
);

const MAX_UPCOMING_TASKS = 8;
const UPCOMING_TASK_ROW_HEIGHT = 52;
const UPCOMING_TASK_ROW_GAP = 12;

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
    <div className="flex items-center justify-between">
      <p className="text-lg font-semibold text-gray-900">Upcoming Tasks</p>
      <Link
        to="/tasks"
        className="text-sm font-semibold text-cyan-700 hover:text-cyan-800"
      >
        See all
      </Link>
    </div>
    <ul
      className="mt-4 flex flex-col gap-3 overflow-hidden text-base text-gray-900"
      style={{
        height: `calc(${MAX_UPCOMING_TASKS} * ${UPCOMING_TASK_ROW_HEIGHT}px + ${MAX_UPCOMING_TASKS - 1} * ${UPCOMING_TASK_ROW_GAP}px)`,
      }}
    >
      {tasks.length > 0 ? tasks.map((task) => {
        const isChecked = checkedOverrides[task.id] ?? task.completed;
        const overrideColour = getOverrideColour(task.categories);
        const baseColour = overrideColour ?? "#3b82f6";
        const backgroundColour = overrideColour ? hexToRgba(baseColour, 0.12) : hexToRgba(baseColour, 0.08);
        return (
          <li
            key={task.id}
            className="flex h-[52px] items-center gap-3 rounded-md border px-3"
            style={{
              borderColor: baseColour,
              backgroundColor: backgroundColour,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.02)",
            }}
          >
            <label
              className="flex h-full w-full cursor-pointer items-center gap-3"
              htmlFor={`upcoming-task-${task.id}`}
            >
              <input
                id={`upcoming-task-${task.id}`}
                type="checkbox"
                className="h-4 w-4"
                checked={isChecked}
                onChange={(event) => {
                  void onToggle(task, event.target.checked);
                }}
              />
              <span className={`text-base font-medium leading-6 ${isChecked ? "text-gray-400 line-through" : "text-gray-900"}`}>
                {task.title}
              </span>
            </label>
          </li>
        );
      }) : (
        <li className="flex h-full items-center justify-center text-lg text-gray-400">
          No Upcoming Tasks This Week
        </li>
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
    const filtered = tasks.filter((task) => {
      const effectiveCompleted = checkedOverrides[task.id] ?? task.completed;
      return !effectiveCompleted;
    });
    const sorted = [...filtered].sort((a, b) => {
      const aTime = new Date(a.deadline).getTime();
      const bTime = new Date(b.deadline).getTime();
      return aTime - bTime;
    });
    return sorted.slice(0, MAX_UPCOMING_TASKS);
  }, [tasks, checkedOverrides]);

  const overdueCount = useMemo(() => {
    const now = moment();
    return tasks.filter(
      (task) => !task.completed && moment(task.deadline).isBefore(now),
    ).length;
  }, [tasks]);

  const minutesPlannedText = useMemo(() => {
    if (!weeklyStats) return "Loading...";
    const totalMinutes = weeklyStats.total_minutes_planned;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }, [weeklyStats]);

  const averageCompletedPerDayText = useMemo(() => {
    if (!weeklyStats) return "Loading...";
    const avg = weeklyStats.completed_tasks / 7;
    return `${avg.toFixed(1)} tasks/day`;
  }, [weeklyStats]);

  const averageTaskDurationText = useMemo(() => {
    if (!weeklyStats) return "Loading...";
    if (weeklyStats.total_tasks === 0) return "0m average";
    const avgMinutes = Math.round(weeklyStats.total_minutes_planned / weeklyStats.total_tasks);
    const hours = Math.floor(avgMinutes / 60);
    const minutes = avgMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m average` : `${minutes}m average duration`;
  }, [weeklyStats]);

  const streakCount = useMemo(() => {
    if (!weeklyStats) return 0;
    const todayIndex = moment().isoWeekday() - 1;
    let count = 0;
    for (let i = todayIndex; i >= 0; i -= 1) {
      const completedCount = weeklyStats.daily_stats[i]?.completed_count ?? 0;
      if (completedCount > 0) {
        count += 1;
      } else {
        break;
      }
    }
    return count;
  }, [weeklyStats]);

  const overdueToneClass = useMemo(() => {
    if (overdueCount === 0) return "bg-emerald-50";
    if (overdueCount === 1) return "bg-yellow-50";
    if (overdueCount === 2) return "bg-orange-50";
    return "bg-red-50";
  }, [overdueCount]);

  const streakToneClass = useMemo(() => {
    if (streakCount >= 3) return "bg-emerald-50";
    if (streakCount === 2) return "bg-orange-50";
    if (streakCount === 1) return "bg-yellow-50";
    return "bg-red-50";
  }, [streakCount]);

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
  <main className="h-full min-h-0 w-full px-6 pt-4 pb-0 lg:px-10">
    <header className="mb-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        Weekly Overview
      </h1>
    </header>

    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <p className="text-sm text-gray-500">Weekly Progress</p>
        <div className="mt-3 text-2xl font-semibold text-gray-900">
          {weeklyStats ? `${weeklyStats.completion_percentage}%` : "Loading..."}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {weeklyStats
            ? `${weeklyStats.completed_tasks}/${weeklyStats.total_tasks} tasks completed`
            : "Loading..."}
        </p>
        <div className="mt-4 h-4 w-full rounded-full bg-gray-100">
          <div
            className="h-4 rounded-full bg-cyan-500 transition-all"
            style={{
              width: weeklyStats ? `${Math.min(100, weeklyStats.completion_percentage)}%` : "0%",
            }}
          />
        </div>
      </div>
      <WeeklyStatCard
        title="Time Planned"
        value={minutesPlannedText}
        subtitle={weeklyStats ? "Planned this week" : undefined}
      />
      <WeeklyStatCard
        title="Daily Average"
        value={averageCompletedPerDayText}
        subtitle={averageTaskDurationText}
      />
      <WeeklyStatCard
        title="Overdue Tasks"
        value={String(overdueCount)}
        subtitle="Past deadline"
        className={overdueToneClass}
      />
      <WeeklyStatCard
        title="Streak"
        value={weeklyStats ? `${streakCount} day${streakCount === 1 ? "" : "s"}` : "Loading..."}
        subtitle={weeklyStats ? "Consecutive days completed (this week)" : undefined}
        className={streakToneClass}
      />
    </section>

    <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5 items-stretch">
      <section className="lg:col-span-3">
        <Link
          to="/calendar"
          className="flex h-full w-full flex-col rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition hover:bg-gray-50 hover:ring-gray-300"
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
          <div className="mt-4 flex-1 overflow-hidden rounded-md border border-gray-200">
            <div className="h-full w-full min-h-0">
              <MiniCalendarPreview tasks={tasks} events={events} />
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
