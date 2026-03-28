import { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import * as eventService from "@/services/eventService";
import { getWeeklySummary } from "@/services/statsService";
import * as taskService from "@/services/taskService";
import type { Event, Task, WeeklyStats } from "@/types";
import { getStoredWeekStartsOn } from "@/utils/userPreferences";

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

interface DashboardData {
  tasks: Task[];
  events: Event[];
  weeklyStats: WeeklyStats | null;
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

const EMPTY_DASHBOARD_DATA: DashboardData = {
  tasks: [],
  events: [],
  weeklyStats: null,
};

const EMPTY_DASHBOARD_ERROR: DashboardError = {
  tasks: null,
  summary: null,
};

const LOADING_DASHBOARD_STATE: DashboardLoading = {
  tasks: true,
  summary: true,
};

const READY_DASHBOARD_STATE: DashboardLoading = {
  tasks: false,
  summary: false,
};

const DASHBOARD_FAILURE_ERROR: DashboardError = {
  tasks: "Failed to load dashboard tasks.",
  summary: "Failed to load weekly summary.",
};

const getDashboardWeekRange = () => {
  const weekUnit = getStoredWeekStartsOn() === "sunday" ? "week" : "isoWeek";
  return {
    startOfWeek: moment().startOf(weekUnit).format("YYYY-MM-DD"),
    endOfWeek: moment().endOf(weekUnit).format("YYYY-MM-DD"),
  };
};

const fetchDashboardData = async (): Promise<DashboardData> => {
  const { startOfWeek, endOfWeek } = getDashboardWeekRange();
  const [tasks, events, weeklyStats] = await Promise.all([
    taskService.getTasks(),
    eventService.getEvents({ start_date: startOfWeek, end_date: endOfWeek }),
    getWeeklySummary(startOfWeek),
  ]);
  return { tasks, events, weeklyStats };
};

const buildDashboardSections = (tasks: Task[]): DashboardSections => {
  const now = moment();
  const overdueTasks = tasks.filter((task) => !task.completed && moment(task.deadline).isBefore(now));
  const todayTasks = tasks.filter((task) =>
    !task.completed
    && moment(task.deadline).isSame(now, "day")
    && !overdueTasks.some((overdueTask) => overdueTask.id === task.id)
  );
  const pendingTasks = tasks.filter((task) =>
    !task.completed
    && moment(task.deadline).isAfter(now)
    && !moment(task.deadline).isSame(now, "day")
  );
  return { todayTasks, pendingTasks, overdueTasks };
};

const buildDashboardCardValues = (sections: DashboardSections): DashboardCardValues => ({
  today: sections.todayTasks.map((task) => task.title),
  pending: sections.pendingTasks.map((task) => task.title),
  overdue: sections.overdueTasks.map((task) => task.title),
});

const useDashboardData = () => {
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD_DATA);
  const [loading, setLoading] = useState<DashboardLoading>(LOADING_DASHBOARD_STATE);
  const [error, setError] = useState<DashboardError>(EMPTY_DASHBOARD_ERROR);

  const refresh = useCallback(async () => {
    setLoading(LOADING_DASHBOARD_STATE);
    try {
      setData(await fetchDashboardData());
      setError(EMPTY_DASHBOARD_ERROR);
    } catch (nextError) {
      console.error(nextError);
      setData(EMPTY_DASHBOARD_DATA);
      setError(DASHBOARD_FAILURE_ERROR);
    } finally {
      setLoading(READY_DASHBOARD_STATE);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
};

/**
 * Provides the dashboard task data and derived card groupings.
 * @returns Dashboard state, grouped loading, grouped error, and refresh actions.
 */
export const useDashboard = (): UseDashboardReturn => {
  const { data, loading, error, refresh } = useDashboardData();
  const sections = useMemo(() => buildDashboardSections(data.tasks), [data.tasks]);
  const cardValues = useMemo(() => buildDashboardCardValues(sections), [sections]);

  return {
    state: { ...data, sections, cardValues },
    loading,
    error,
    actions: { refresh },
  };
};
