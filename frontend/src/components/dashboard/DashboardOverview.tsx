import { useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { Link } from "react-router-dom";
import MiniCalendarPreview from "@/components/dashboard/MiniCalendarPreview";
import * as taskService from "@/services/taskService";
import { getMyProfile } from "@/services/profileService";
import type { Event, Task, WeeklyStats } from "@/types";
import { getOverrideColour, hexToRgba } from "@/utils/colorUtils";
import { emitXpGained } from "@/utils/xpEvents";
import completeSoundUrl from "@/assets/sounds/task-complete.mp3";
import { XP_GAINED_EVENT } from "@/utils/xpEvents";
import { emitLevelup } from "@/utils/levelUpEvent";

interface DashboardOverviewProps {
  tasks: Task[];
  events: Event[];
  weeklyStats: WeeklyStats | null;
}

type OverviewPeriod = "daily" | "weekly" | "monthly" | "yearly" | "all_time";

const WeeklyStatCard = ({
  title,
  value,
  subtitle,
  className,
  icon,
  iconClassName,
  valueClassName,
}: {
  title: string;
  value: string;
  subtitle?: string;
  className?: string;
  icon: string;
  iconClassName: string;
  valueClassName?: string;
}) => (
  <div className={`flex h-full flex-col rounded-xl p-5 shadow-sm ring-1 ring-gray-900/5 ${className ?? "bg-white"}`}>
    <div className="flex items-center justify-between gap-3">
      <p className="min-w-0 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
        {title}
      </p>
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
      >
        <span className="material-icons block text-xl leading-none">{icon}</span>
      </span>
    </div>
    <div className={`mt-5 text-[clamp(1.8rem,2.3vw,2.4rem)] font-semibold leading-[1.05] tracking-tight text-gray-900 ${valueClassName ?? ""}`}>
      {value}
    </div>
    {subtitle ? <p className="mt-2 text-sm text-gray-500">{subtitle}</p> : null}
  </div>
);

const MAX_UPCOMING_TASKS = 4;
const UPCOMING_TASK_ROW_HEIGHT = 52;
const UPCOMING_TASK_ROW_GAP = 12;
const getImportanceLabel = (importance: number) => {
  if (importance >= 9) return "Critical";
  if (importance >= 7) return "High";
  if (importance >= 5) return "Medium";
  if (importance >= 3) return "Low";
  return "Very low";
};

const formatDueDate = (isoString: string) => {
  const date = new Date(isoString);
  const dateText = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
  const timeText = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dateText} ${timeText}`;
};

const getRequiredExp = (level: number) => {
  const nextLevel = Math.max(1, level + 1);
  return Math.round(100 * nextLevel ** 1.5);
};

const UpcomingTasksCard = ({
  tasks,
  checkedOverrides,
  onToggle,
  periodLabel,
}: {
  tasks: Task[];
  checkedOverrides: Record<number, boolean | undefined>;
  onToggle: (task: Task, nextChecked: boolean) => void;
  periodLabel: string;
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
                className="task-circle-checkbox text-cyan-600"
                checked={isChecked}
                onChange={(event) => {
                  void onToggle(task, event.target.checked);
                }}
              />
              <span className="flex min-w-0 flex-col">
                <span className={`text-base font-medium leading-6 truncate ${isChecked ? "text-gray-400 line-through" : "text-gray-900"}`}>
                  {task.title}
                </span>
                <span className="mt-0 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center">
                    <span className="material-icons mr-1" style={{ fontSize: "22px" }}>event</span>
                    {formatDueDate(task.deadline)}
                  </span>
                  <span className="flex items-center text-xs text-gray-500">
                    <span className="material-icons mr-1" style={{ fontSize: "22px" }}>schedule</span>
                    {task.estimated_minutes}m
                  </span>
                  <span className="flex items-center text-xs text-gray-500">
                    <span className="material-icons mr-1" style={{ fontSize: "22px" }}>priority_high</span>
                    {getImportanceLabel(task.importance)}
                  </span>
                </span>
              </span>
            </label>
          </li>
        );
      }) : (
        <li className="flex h-full items-center justify-center text-lg text-gray-400">
          No Upcoming Tasks {periodLabel}
        </li>
      )}
    </ul>
  </div>
);

const XpProgressCard = ({ profileStats }: { profileStats: { exp: number; level: number } | null }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const level = profileStats?.level ?? 0;
  const exp = profileStats?.exp ?? 0;
  const requiredExp = getRequiredExp(level);
  const progress = requiredExp > 0 ? Math.min(100, (exp / requiredExp) * 100) : 0;

  useEffect(() => {
    setAnimatedProgress(0);
    const frame = window.requestAnimationFrame(() => {
      setAnimatedProgress(progress);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [progress]);

  if (!profileStats) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <p className="text-lg font-semibold text-gray-900">Experience</p>
        <p className="mt-2 text-sm text-gray-500">Loading XP...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-gray-900">Experience</p>
        <span className="text-sm font-semibold text-cyan-700">Level {level}</span>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        {exp} / {requiredExp} XP to next level
      </p>
      <div className="mt-4 h-3 w-full rounded-full bg-gray-100">
        <div
          className="h-3 rounded-full bg-cyan-500 transition-all duration-700"
          style={{ width: `${animatedProgress}%` }}
        />
      </div>
    </div>
  );
};

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
  const completeSoundRef = useRef<HTMLAudioElement | null>(
    typeof Audio === "undefined" ? null : new Audio(completeSoundUrl),
  );
  const [checkedOverrides, setCheckedOverrides] = useState<Record<number, boolean | undefined>>({});
  const [selectedPeriod, setSelectedPeriod] = useState<OverviewPeriod>("weekly");
  const [profileStats, setProfileStats] = useState<{ exp: number; level: number } | null>(null);

  const periodLabel = useMemo(() => {
    switch (selectedPeriod) {
      case "daily":
        return "Daily";
      case "monthly":
        return "Monthly";
      case "yearly":
        return "Yearly";
      case "all_time":
        return "All-Time";
      case "weekly":
      default:
        return "Weekly";
    }
  }, [selectedPeriod]);

  const periodEmptyLabel = useMemo(() => {
    switch (selectedPeriod) {
      case "daily":
        return "Today";
      case "monthly":
        return "This Month";
      case "yearly":
        return "This Year";
      case "all_time":
        return "All Time";
      case "weekly":
      default:
        return "This Week";
    }
  }, [selectedPeriod]);

  const periodRange = useMemo(() => {
    const now = moment();
    if (selectedPeriod === "all_time") {
      return { start: null, end: null };
    }
    if (selectedPeriod === "daily") {
      return { start: now.clone().startOf("day"), end: now.clone().endOf("day") };
    }
    if (selectedPeriod === "monthly") {
      return { start: now.clone().startOf("month"), end: now.clone().endOf("month") };
    }
    if (selectedPeriod === "yearly") {
      return { start: now.clone().startOf("year"), end: now.clone().endOf("year") };
    }
    return { start: now.clone().startOf("isoWeek"), end: now.clone().endOf("isoWeek") };
  }, [selectedPeriod]);

  const filteredTasks = useMemo(() => {
    if (!periodRange.start || !periodRange.end) return tasks;
    return tasks.filter((task) => {
      const startTime = moment(task.start_time);
      const deadline = moment(task.deadline);
      return (
        startTime.isBetween(periodRange.start, periodRange.end, undefined, "[]")
        || deadline.isBetween(periodRange.start, periodRange.end, undefined, "[]")
      );
    });
  }, [tasks, periodRange]);

  const recentTasks = useMemo(() => {
    const filtered = filteredTasks.filter((task) => {
      const effectiveCompleted = checkedOverrides[task.id] ?? task.completed;
      return !effectiveCompleted;
    });
    const sorted = [...filtered].sort((a, b) => {
      const aTime = new Date(a.deadline).getTime();
      const bTime = new Date(b.deadline).getTime();
      return aTime - bTime;
    });
    return sorted.slice(0, MAX_UPCOMING_TASKS);
  }, [filteredTasks, checkedOverrides]);

  const derivedStats = useMemo(() => {
    if (selectedPeriod === "weekly" && weeklyStats) return weeklyStats;
    if (filteredTasks.length === 0) {
      return {
        total_tasks: 0,
        completed_tasks: 0,
        completion_percentage: 0,
        total_minutes_planned: 0,
        daily_stats: [],
        importance_stats: [],
      } as WeeklyStats;
    }

    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter((task) => task.completed).length;
    const totalMinutes = filteredTasks.reduce(
      (sum, task) => sum + (task.estimated_minutes || 0),
      0,
    );
    const completionPercentage = totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 10000) / 100;

    return {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      completion_percentage: completionPercentage,
      total_minutes_planned: totalMinutes,
      daily_stats: [],
      importance_stats: [],
    } as WeeklyStats;
  }, [filteredTasks, selectedPeriod, weeklyStats]);

  const overdueCount = useMemo(() => {
    const now = moment();
    return filteredTasks.filter(
      (task) => !task.completed && moment(task.deadline).isBefore(now),
    ).length;
  }, [filteredTasks]);

  const minutesPlannedText = useMemo(() => {
    if (!derivedStats) return "Loading...";
    const totalMinutes = derivedStats.total_minutes_planned;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }, [derivedStats]);

  const averageCompletedPerDayText = useMemo(() => {
    if (!derivedStats) return "Loading...";
    if (selectedPeriod === "all_time") {
      const completed = tasks.filter((task) => task.completed);
      if (completed.length === 0) return "N/A";
      const firstCompleted = moment.min(completed.map((task) =>
        moment(task.start_time || task.deadline)
      ));
      const days = Math.max(1, moment().diff(firstCompleted, "days") + 1);
      const avg = completed.length / days;
      return `${avg.toFixed(1)} tasks/day`;
    }
    if (!periodRange.start || !periodRange.end) return "N/A";
    const days = Math.max(1, periodRange.end.diff(periodRange.start, "days") + 1);
    const avg = derivedStats.completed_tasks / days;
    return `${avg.toFixed(1)} tasks/day`;
  }, [derivedStats, periodRange, selectedPeriod, tasks]);

  const averageTaskDurationText = useMemo(() => {
    if (!derivedStats) return "Loading...";
    if (derivedStats.total_tasks === 0) return "0m avg";
    const avgMinutes = Math.round(derivedStats.total_minutes_planned / derivedStats.total_tasks);
    const hours = Math.floor(avgMinutes / 60);
    const minutes = avgMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m avg duration` : `${minutes}m avg duration`;
  }, [derivedStats]);

  const streakCount = useMemo(() => {
    const end = moment();
    const completedSource = selectedPeriod === "all_time" ? tasks : filteredTasks;
    if (completedSource.length === 0) return 0;
    const dayCount = selectedPeriod === "all_time"
      ? Math.max(1, end.diff(moment.min(completedSource.map((task) =>
        moment(task.start_time || task.deadline)
      )), "days") + 1)
      : (periodRange.start && periodRange.end
        ? Math.max(1, moment.min(end, periodRange.end).diff(periodRange.start, "days") + 1)
        : 0);
    if (dayCount === 0) return 0;
    const completedByDay = new Map<string, number>();
    completedSource.forEach((task) => {
      if (!task.completed) return;
      const dayKey = moment(task.start_time || task.deadline).format("YYYY-MM-DD");
      completedByDay.set(dayKey, (completedByDay.get(dayKey) ?? 0) + 1);
    });
    let streak = 0;
    for (let i = 0; i < dayCount; i += 1) {
      const dayKey = end.clone().subtract(i, "days").format("YYYY-MM-DD");
      if ((completedByDay.get(dayKey) ?? 0) > 0) {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  }, [filteredTasks, periodRange, selectedPeriod, tasks]);

  const overdueToneClass = useMemo(() => {
    if (overdueCount === 0) return "tone-ok";
    if (overdueCount === 1) return "tone-warn";
    if (overdueCount === 2) return "tone-alert";
    return "tone-danger";
  }, [overdueCount]);

  const streakToneClass = useMemo(() => {
    if (streakCount >= 3) return "tone-ok";
    if (streakCount === 2) return "tone-alert";
    if (streakCount === 1) return "tone-warn";
    return "tone-neutral";
  }, [streakCount]);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      try {
        const profile = await getMyProfile();
        if (!isActive) return;
        setProfileStats({ exp: profile.xp ?? 0, level: profile.level ?? 1 });
      } catch {
        if (!isActive) return;
        setProfileStats(null);
      }
    };

    void loadProfile();

    const handleXpGained = () => {
      void loadProfile();
    };

    window.addEventListener(XP_GAINED_EVENT, handleXpGained);
    return () => {
      isActive = false;
      window.removeEventListener(XP_GAINED_EVENT, handleXpGained);
    };
  }, []);

  const handleToggleTask = (task: Task, nextChecked: boolean) => {
    setCheckedOverrides((prev) => ({ ...prev, [task.id]: nextChecked }));
    if (nextChecked && !task.completed && completeSoundRef.current) {
      completeSoundRef.current.currentTime = 0;
      void completeSoundRef.current.play().catch(() => undefined);
    }
    void (async () => {
      try {
        //await taskService.updateTask(task.id, { completed: nextChecked });
        const response = await taskService.updateTask(task.id, {completed: nextChecked} )
        if (nextChecked && !task.completed) {
          const expDelta = 10 + 2 * task.importance;
          emitXpGained(expDelta);
        }

        if (response.level_up && response.new_level != null){
          emitLevelup(response.new_level)
        }
      } catch (error) {
        console.error(error);
        setCheckedOverrides((prev) => ({ ...prev, [task.id]: task.completed }));
      }
    })();
  };

  return (
  <main className="h-full min-h-0 w-full px-6 pt-4 pb-0 lg:px-10">
    <header className="mb-4 mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          {periodLabel} Overview
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500" htmlFor="overview-period">
          Period
        </label>
        <select
          id="overview-period"
          value={selectedPeriod}
          onChange={(event) => setSelectedPeriod(event.target.value as OverviewPeriod)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary focus:ring-primary"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="all_time">All-Time</option>
        </select>
      </div>
    </header>

    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            {periodLabel} Progress
          </p>
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700"
          >
            <span className="material-icons block text-xl leading-none">track_changes</span>
          </span>
        </div>
        <div className="mt-5 text-[clamp(1.8rem,2.3vw,2.4rem)] font-semibold leading-none tracking-tight text-gray-900">
          {derivedStats ? `${derivedStats.completion_percentage}%` : "Loading..."}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {derivedStats
            ? `${derivedStats.completed_tasks}/${derivedStats.total_tasks} tasks completed`
            : "Loading..."}
        </p>
        <div className="mt-5 h-3 w-full rounded-full bg-gray-100">
          <div
            className="h-3 rounded-full bg-cyan-500 transition-all"
            style={{
              width: derivedStats ? `${Math.min(100, derivedStats.completion_percentage)}%` : "0%",
            }}
          />
        </div>
      </div>
      <WeeklyStatCard
        title="Time Planned"
        value={minutesPlannedText}
        subtitle={derivedStats ? "Planned this period" : undefined}
        icon="schedule"
        iconClassName="bg-violet-100 text-violet-700"
      />
      <WeeklyStatCard
        title="Daily Averages"
        value={averageCompletedPerDayText}
        subtitle={averageTaskDurationText}
        icon="equalizer"
        iconClassName="bg-emerald-100 text-emerald-700"
        valueClassName="text-[clamp(1.65rem,2vw,2.15rem)]"
      />
      <WeeklyStatCard
        title="Overdue Tasks"
        value={String(overdueCount)}
        subtitle="Past deadline"
        className={overdueToneClass}
        icon="warning_amber"
        iconClassName="bg-amber-100 text-amber-700"
      />
      <WeeklyStatCard
        title="Streak"
        value={`${streakCount} day${streakCount === 1 ? "" : "s"}`}
        subtitle="Consecutive days completed"
        className={streakToneClass}
        icon="local_fire_department"
        iconClassName="bg-rose-100 text-rose-700"
      />
    </section>

    <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5 items-stretch">
      <section className="lg:col-span-3 min-h-[580px]">
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
        <div className="flex h-full flex-col gap-6">
          <UpcomingTasksCard
            tasks={recentTasks}
            checkedOverrides={checkedOverrides}
            onToggle={handleToggleTask}
            periodLabel={periodEmptyLabel}
          />
          <XpProgressCard profileStats={profileStats} />
        </div>
      </section>
    </section>
  </main>
  );
};

export default DashboardOverview;
