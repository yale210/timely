import { useCallback, useEffect } from "react";
import * as taskService from "@/services/taskService";
import { buildTaskQueryParams } from "@/hooks/tasks/taskListUtils";
import type { Category, Task } from "@/types";
import type { TaskCompletionFilter } from "@/hooks/tasks/taskListTypes";

interface UseTaskListQueriesArgs {
  sortBy: string;
  filterCategory: number | null;
  filterCompleted: TaskCompletionFilter;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

async function loadTasks(args: UseTaskListQueriesArgs) {
  args.setLoading(true);

  try {
    const params = buildTaskQueryParams(
      args.sortBy,
      args.filterCategory,
      args.filterCompleted,
    );
    const data = await taskService.getTasks(params);
    args.setTasks(data);
    args.setError(null);
  } catch (fetchTasksError) {
    console.error(fetchTasksError);
    args.setError("Failed to load tasks.");
  } finally {
    args.setLoading(false);
  }
}

async function loadCategories(
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>,
) {
  try {
    const data = await taskService.getCategories();
    setCategories(data);
  } catch (fetchCategoriesError) {
    console.error(fetchCategoriesError);
  }
}

function buildLoadTasksArgs(args: UseTaskListQueriesArgs): UseTaskListQueriesArgs {
  return {
    sortBy: args.sortBy,
    filterCategory: args.filterCategory,
    filterCompleted: args.filterCompleted,
    setTasks: args.setTasks,
    setCategories: args.setCategories,
    setLoading: args.setLoading,
    setError: args.setError,
  };
}

function useTaskListRefresh(
  fetchTasks: () => Promise<void>,
  fetchCategories: () => Promise<void>,
) {
  return useCallback(async () => {
    await fetchTasks();
    await fetchCategories();
  }, [fetchCategories, fetchTasks]);
}

/**
 * Builds the task-list fetch and refresh actions.
 * @param args Query configuration and state setters.
 * @returns Query actions for the task list.
 */
export function useTaskListQueries(args: UseTaskListQueriesArgs) {
  const {
    sortBy,
    filterCategory,
    filterCompleted,
    setTasks,
    setCategories,
    setLoading,
    setError,
  } = args;
  const fetchTasks = useCallback(
    () => loadTasks(buildLoadTasksArgs({
      sortBy,
      filterCategory,
      filterCompleted,
      setTasks,
      setCategories,
      setLoading,
      setError,
    })),
    [filterCategory, filterCompleted, setCategories, setError, setLoading, setTasks, sortBy],
  );
  const fetchCategories = useCallback(
    () => loadCategories(setCategories),
    [setCategories],
  );
  const refresh = useTaskListRefresh(fetchTasks, fetchCategories);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { fetchTasks, refresh };
}
