import { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import * as taskService from "@/services/taskService";
import type { Task } from "@/types";

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
  sections: DashboardSections;
  cardValues: DashboardCardValues;
}

interface DashboardLoading {
  tasks: boolean;
}

interface DashboardError {
  tasks: string | null;
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
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsTasksLoading(true);

    try {
      const nextTasks = await taskService.getTasks();
      setTasks(nextTasks);
      setTaskError(null);
    } catch (error) {
      console.error(error);
      setTasks([]);
      setTaskError("Failed to load dashboard tasks.");
    } finally {
      setIsTasksLoading(false);
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
      sections,
      cardValues,
    },
    loading: {
      tasks: isTasksLoading,
    },
    error: {
      tasks: taskError,
    },
    actions: {
      refresh,
    },
  };
};
