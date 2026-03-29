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

function useTaskListTasksQuery(args: UseTaskListQueriesArgs) {
  const {
    sortBy,
    filterCategory,
    filterCompleted,
    setTasks,
    setCategories,
    setLoading,
    setError,
  } = args;

  return useCallback(
    () => loadTasks({
      sortBy,
      filterCategory,
      filterCompleted,
      setTasks,
      setCategories,
      setLoading,
      setError,
    }),
    [
      filterCategory,
      filterCompleted,
      setCategories,
      setError,
      setLoading,
      setTasks,
      sortBy,
    ],
  );
}

function useTaskListCategoriesQuery(
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>,
) {
  return useCallback(
    () => loadCategories(setCategories),
    [setCategories],
  );
}

function useTaskListInitialFetch(refresh: () => Promise<void>) {
  useEffect(() => {
    void refresh();
  }, [refresh]);
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
  const fetchTasks = useTaskListTasksQuery(args);
  const fetchCategories = useTaskListCategoriesQuery(args.setCategories);
  const refresh = useTaskListRefresh(fetchTasks, fetchCategories);
  useTaskListInitialFetch(refresh);

  return { fetchTasks, refresh };
}
