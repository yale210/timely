import { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import * as taskService from "@/services/taskService";
import * as eventService from "@/services/eventService";
import { getWeeklySummary } from "@/services/statsService";
import type { Event, Task, WeeklyStats } from "@/types";

interface DashboardSections {
  todayTasks: Task[];
  pendingTasks: Task[];
  overdueTasks: Task[];
}

interface DashboardCardValues {
  today: string[];
  pending: string[];
  overdue: string[];
}

interface DashboardState {
  tasks: Task[];
  events: Event[];
  weeklyStats: WeeklyStats | null;
  sections: DashboardSections;
  cardValues: DashboardCardValues;
}

interface DashboardLoading {
  tasks: boolean;
  summary: boolean;
}

interface DashboardError {
  tasks: string | null;
  summary: string | null;
}

interface DashboardActions {
  refresh: () => Promise<void>;
}

/**
 * Describes the structured dashboard hook contract.
 */
export interface UseDashboardReturn {
  state: DashboardState;
  loading: DashboardLoading;
  error: DashboardError;
  actions: DashboardActions;
}

/**
 * Provides the dashboard task data and derived card groupings.
 * @returns Dashboard state, grouped loading, grouped error, and refresh actions.
 */
export const useDashboard = (): UseDashboardReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsTasksLoading(true);
    setIsSummaryLoading(true);

    try {
      const startOfWeek = moment().startOf("week").format("YYYY-MM-DD");
      const endOfWeek = moment().endOf("week").format("YYYY-MM-DD");
      const [nextTasks, nextEvents, nextStats] = await Promise.all([
        taskService.getTasks(),
        eventService.getEvents({ start_date: startOfWeek, end_date: endOfWeek }),
        getWeeklySummary(startOfWeek),
      ]);
      setTasks(nextTasks);
      setEvents(nextEvents);
      setWeeklyStats(nextStats);
      setTaskError(null);
      setSummaryError(null);
    } catch (error) {
      console.error(error);
      setTasks([]);
      setEvents([]);
      setTaskError("Failed to load dashboard tasks.");
      setWeeklyStats(null);
      setSummaryError("Failed to load weekly summary.");
    } finally {
      setIsTasksLoading(false);
      setIsSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sections = useMemo<DashboardSections>(() => {
    const now = moment();
    const overdueTasks = tasks.filter(
      (task) => !task.completed && moment(task.deadline).isBefore(now),
    );
    const todayTasks = tasks.filter(
      (task) =>
        !task.completed
        && moment(task.deadline).isSame(now, "day")
        && !overdueTasks.some((overdueTask) => overdueTask.id === task.id),
    );
    const pendingTasks = tasks.filter(
      (task) =>
        !task.completed
        && moment(task.deadline).isAfter(now)
        && !moment(task.deadline).isSame(now, "day"),
    );

    return {
      todayTasks,
      pendingTasks,
      overdueTasks,
    };
  }, [tasks]);

  const cardValues = useMemo<DashboardCardValues>(
    () => ({
      today: sections.todayTasks.map((task) => task.title),
      pending: sections.pendingTasks.map((task) => task.title),
      overdue: sections.overdueTasks.map((task) => task.title),
    }),
    [sections],
  );

  return {
    state: {
      tasks,
      events,
      weeklyStats,
      sections,
      cardValues,
    },
    loading: {
      tasks: isTasksLoading,
      summary: isSummaryLoading,
    },
    error: {
      tasks: taskError,
      summary: summaryError,
    },
    actions: {
      refresh,
    },
  };
};
