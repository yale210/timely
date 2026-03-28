import { useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import DashboardAgendaGrid from "@/components/dashboard/DashboardAgendaGrid";
import DashboardOverviewHeader from "@/components/dashboard/DashboardOverviewHeader";
import DashboardStatsGrid from "@/components/dashboard/DashboardStatsGrid";
import {
  type DashboardOverviewProps,
  type OverviewPeriod,
  type ProfileStats,
} from "@/components/dashboard/dashboardOverviewTypes";
import { MAX_UPCOMING_TASKS } from "@/components/dashboard/dashboardOverviewUtils";
import * as taskService from "@/services/taskService";
import { getMyProfile } from "@/services/profileService";
import type { Task, WeeklyStats } from "@/types";
import { emitXpGained } from "@/utils/xpEvents";
import completeSoundUrl from "@/assets/sounds/task-complete.mp3";
import { XP_GAINED_EVENT } from "@/utils/xpEvents";
import { emitLevelup } from "@/utils/levelUpEvent";
import { useUserTimezone } from "@/utils/userTimezone";

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
  useUserTimezone();
  const completeSoundRef = useRef<HTMLAudioElement | null>(
    typeof Audio === "undefined" ? null : new Audio(completeSoundUrl),
  );
  const [checkedOverrides, setCheckedOverrides] = useState<Record<number, boolean | undefined>>({});
  const [selectedPeriod, setSelectedPeriod] = useState<OverviewPeriod>("weekly");
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);

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
        const response = await taskService.updateTask(task.id, { completed: nextChecked });
        if (nextChecked && !task.completed) {
          const expDelta = 10 + 2 * task.importance;
          emitXpGained(expDelta);
        }

        if (response.level_up && response.new_level != null) {
          emitLevelup(response.new_level);
        }
      } catch (error) {
        console.error(error);
        setCheckedOverrides((prev) => ({ ...prev, [task.id]: task.completed }));
      }
    })();
  };

  return (
    <main className="h-full min-h-0 w-full px-6 pt-4 pb-0 lg:px-10">
      <DashboardOverviewHeader
        periodLabel={periodLabel}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />
      <DashboardStatsGrid
        derivedStats={derivedStats}
        periodLabel={periodLabel}
        minutesPlannedText={minutesPlannedText}
        averageCompletedPerDayText={averageCompletedPerDayText}
        averageTaskDurationText={averageTaskDurationText}
        overdueCount={overdueCount}
        overdueToneClass={overdueToneClass}
        streakCount={streakCount}
        streakToneClass={streakToneClass}
      />
      <DashboardAgendaGrid
        tasks={tasks}
        events={events}
        recentTasks={recentTasks}
        checkedOverrides={checkedOverrides}
        periodLabel={periodEmptyLabel}
        profileStats={profileStats}
        onToggleTask={handleToggleTask}
      />
    </main>
  );
};

export default DashboardOverview;
