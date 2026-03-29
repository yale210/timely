import { useThemeFont } from "@/hooks/common/useThemeFont";
import { useTaskListState } from "@/hooks/tasks/useTaskListState";
import { useTaskListQueries } from "@/hooks/tasks/useTaskListQueries";
import { useTaskListUiActions } from "@/hooks/tasks/useTaskListUiActions";
import { useTaskListMutations } from "@/hooks/tasks/useTaskListMutations";
import { useTaskListDerivedState } from "@/hooks/tasks/useTaskListDerivedState";
import type { Category, Task, TaskSubmission } from "@/types";
import type { TaskCompletionFilter, TaskListSections, TaskListState } from "@/hooks/tasks/taskListTypes";

interface TaskListActions {
  setSearch: (value: string) => void;
  setSortBy: (value: string) => void;
  setFilterCategory: (value: number | null) => void;
  setFilterCompleted: (value: TaskCompletionFilter) => void;
  toggleFilterHighImportance: () => void;
  toggleFilterQuickWins: () => void;
  openTask: (task: Task) => void;
  openNewTask: () => void;
  closeSidebar: () => void;
  toggleComplete: (id: number) => Promise<void>;
  submitTask: (data: TaskSubmission) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  createCategory: (text: string) => Promise<Category>;
  updateCategory: (id: number, patch: { colour?: string | null; colour_override?: boolean }) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  updateTaskCategories: (id: number, categories: number[]) => Promise<void>;
  refresh: () => Promise<void>;
  formatDayLabel: (dateStr: string) => string;
}

interface UseTaskListReturn {
  state: TaskListState;
  loading: boolean;
  error: string | null;
  actions: TaskListActions;
}

export type { TaskCompletionFilter, TaskListSections, TaskListState };

function buildTaskListStateResult(
  state: ReturnType<typeof useTaskListState>,
  derived: ReturnType<typeof useTaskListDerivedState>,
): UseTaskListReturn["state"] {
  return {
    tasks: state.tasks,
    categories: state.categories,
    isSidebarOpen: state.isSidebarOpen,
    selectedTask: state.selectedTask,
    warning: state.warning,
    search: state.search,
    sortBy: state.sortBy,
    filters: {
      category: state.filterCategory,
      completed: state.filterCompleted,
      highImportance: state.filterHighImportance,
      quickWins: state.filterQuickWins,
    },
    sections: derived.sections,
  };
}

function buildTaskListActionsResult(
  queries: ReturnType<typeof useTaskListQueries>,
  uiActions: ReturnType<typeof useTaskListUiActions>,
  mutations: ReturnType<typeof useTaskListMutations>,
  derived: ReturnType<typeof useTaskListDerivedState>,
): UseTaskListReturn["actions"] {
  return {
    ...uiActions,
    ...mutations,
    refresh: queries.refresh,
    formatDayLabel: derived.formatDayLabel,
  };
}

function buildTaskListResult(
  state: ReturnType<typeof useTaskListState>,
  queries: ReturnType<typeof useTaskListQueries>,
  uiActions: ReturnType<typeof useTaskListUiActions>,
  mutations: ReturnType<typeof useTaskListMutations>,
  derived: ReturnType<typeof useTaskListDerivedState>,
): UseTaskListReturn {
  return {
    state: buildTaskListStateResult(state, derived),
    loading: state.loading,
    error: state.error,
    actions: buildTaskListActionsResult(queries, uiActions, mutations, derived),
  };
}

/**
 * Provides state and actions for the tasks page.
 * @returns The structured task-list state, loading state, errors, and actions.
 */
export const useTaskList = (): UseTaskListReturn => {
  useThemeFont();
  const state = useTaskListState();
  const queries = useTaskListQueries(state);
  const uiActions = useTaskListUiActions(state);
  const mutations = useTaskListMutations({ ...state, fetchTasks: queries.fetchTasks });
  const derived = useTaskListDerivedState({
    tasks: state.tasks,
    search: state.search,
    filterHighImportance: state.filterHighImportance,
    filterQuickWins: state.filterQuickWins,
  });
  return buildTaskListResult(state, queries, uiActions, mutations, derived);
};
