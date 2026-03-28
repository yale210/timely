import type { Category, Task } from "@/types";

/**
 * Supported completion filters for the task list.
 */
export type TaskCompletionFilter = "all" | "completed" | "pending";

/**
 * Grouped task sections rendered on the task page.
 */
export interface TaskListSections {
  pastTasks: Task[];
  overdueTasks: Task[];
  todayTasks: Task[];
  upcomingTasks: Task[];
  completedTasks: Task[];
  groupedUpcomingTasks: Record<string, Task[]>;
  sortedUpcomingDates: string[];
}

/**
 * Public state returned by the task-list hook.
 */
export interface TaskListState {
  tasks: Task[];
  categories: Category[];
  isSidebarOpen: boolean;
  selectedTask: Task | undefined;
  warning: string | null;
  search: string;
  sortBy: string;
  filters: {
    category: number | null;
    completed: TaskCompletionFilter;
    highImportance: boolean;
    quickWins: boolean;
  };
  sections: TaskListSections;
}
