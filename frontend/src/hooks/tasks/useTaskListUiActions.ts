import { useMemo } from "react";
import type { Task } from "@/types";
import type { TaskCompletionFilter } from "@/hooks/tasks/taskListTypes";

interface UseTaskListUiActionsArgs {
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  setSortBy: React.Dispatch<React.SetStateAction<string>>;
  setFilterCategory: React.Dispatch<React.SetStateAction<number | null>>;
  setFilterCompleted: React.Dispatch<React.SetStateAction<TaskCompletionFilter>>;
  setFilterHighImportance: React.Dispatch<React.SetStateAction<boolean>>;
  setFilterQuickWins: React.Dispatch<React.SetStateAction<boolean>>;
  setWarning: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedTask: React.Dispatch<React.SetStateAction<Task | undefined>>;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Builds the UI-only actions for the task list page.
 * @param args State setters for task-list UI controls.
 * @returns Memoized UI action callbacks.
 */
function buildTaskListUiActions(args: UseTaskListUiActionsArgs) {
  return {
    setSearch: args.setSearch,
    setSortBy: args.setSortBy,
    setFilterCategory: args.setFilterCategory,
    setFilterCompleted: args.setFilterCompleted,
    toggleFilterHighImportance: () => args.setFilterHighImportance((prev) => !prev),
    toggleFilterQuickWins: () => args.setFilterQuickWins((prev) => !prev),
    openTask: (task: Task) => {
      args.setWarning(null);
      args.setSelectedTask(task);
      args.setIsSidebarOpen(true);
    },
    openNewTask: () => {
      args.setWarning(null);
      args.setSelectedTask(undefined);
      args.setIsSidebarOpen(true);
    },
    closeSidebar: () => {
      args.setIsSidebarOpen(false);
      args.setSelectedTask(undefined);
    },
  };
}

/**
 * Memoizes the UI-only task-list actions.
 * @param args State setters for task-list UI controls.
 * @returns Memoized UI actions.
 */
export function useTaskListUiActions(args: UseTaskListUiActionsArgs) {
  return useMemo(() => buildTaskListUiActions(args), [args]);
}
