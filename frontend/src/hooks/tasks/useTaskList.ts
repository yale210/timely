import { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import * as taskService from "@/services/taskService";
import * as categoryService from "@/services/categoryService";
import { type Category, type Task, type TaskSubmission } from "@/types";
import { useThemeFont } from "@/hooks/common/useThemeFont";
import { emitXpGained } from "@/utils/xpEvents";
import { emitLevelup } from "@/utils/levelUpEvent";

type TaskCompletionFilter = "all" | "completed" | "pending";

interface TaskListSections {
  pastTasks: Task[];
  overdueTasks: Task[];
  todayTasks: Task[];
  upcomingTasks: Task[];
  completedTasks: Task[];
  groupedUpcomingTasks: Record<string, Task[]>;
  sortedUpcomingDates: string[];
}

interface TaskListState {
  tasks: Task[];
  categories: Category[];
  isSidebarOpen: boolean;
  selectedTask: Task | undefined;
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

/**
 * Provides state and actions for the tasks page.
 */
export const useTaskList = (): UseTaskListReturn => {
  useThemeFont();

const [tasks, setTasks] = useState<Task[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
const [search, setSearch] = useState("");
const [sortBy, setSortBy] = useState("deadline");
const [filterCategory, setFilterCategory] = useState<number | null>(null);
const [filterCompleted, setFilterCompleted] = useState<TaskCompletionFilter>("all");
const [filterHighImportance, setFilterHighImportance] = useState(false);
const [filterQuickWins, setFilterQuickWins] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchTasks = useCallback(async () => {
  setLoading(true);
  try {
    const params: Record<string, string | number> = {
      ordering: sortBy,
    };

    if (filterCategory) {
      params.categories = filterCategory;
    }

    if (filterCompleted === "completed") {
      params.completed = "true";
    } else if (filterCompleted === "pending") {
      params.completed = "false";
    }

    const data = await taskService.getTasks(params);
    setTasks(data);
    setError(null);
  } catch (fetchTasksError) {
    console.error(fetchTasksError);
    setError("Failed to load tasks.");
  } finally {
    setLoading(false);
  }
}, [filterCategory, filterCompleted, sortBy]);

const fetchCategories = useCallback(async () => {
  try {
    const data = await taskService.getCategories();
    setCategories(data);
  } catch (fetchCategoriesError) {
    console.error(fetchCategoriesError);
  }
}, []);

const refresh = useCallback(async () => {
  await fetchTasks();
  await fetchCategories();
}, [fetchCategories, fetchTasks]);

useEffect(() => {
  void refresh();
}, [refresh]);

  const toggleComplete = useCallback(
    async (id: number) => {
      const task = tasks.find((item) => item.id === id);
      if (!task) {
        return;
      }

      try {
        const nextCompleted = !task.completed;
        //await taskService.updateTask(id, { completed: nextCompleted });
        const response = await taskService.updateTask(id, {completed: nextCompleted} )
        console.log("task update response", JSON.stringify(response, null, 2))
        if (nextCompleted && !task.completed) {
          const expDelta = 10 + 2 * task.importance;
          emitXpGained(expDelta);
        }
        if (response.level_up && response.new_level != null) {
          emitLevelup(response.new_level)
        }
        await fetchTasks();
      } catch (toggleError) {
        console.error(toggleError);
      }
    },
  [fetchTasks, tasks],
);

const submitTask = useCallback(
  async (data: TaskSubmission) => {
    try {
      if (selectedTask) {
        await taskService.updateTask(selectedTask.id, data);
      } else {
        await taskService.createTask(data);
      }
      await fetchTasks();
    } catch (submitError) {
      console.error(submitError);
      throw submitError;
    }
  },
  [fetchTasks, selectedTask],
);

const deleteTask = useCallback(
  async (id: number) => {
    try {
      await taskService.deleteTask(id);
      await fetchTasks();
    } catch (deleteError) {
      console.error(deleteError);
    }
  },
  [fetchTasks],
);

const updateTaskCategories = useCallback(
  async (id: number, nextCategoryIds: number[]) => {
    const nextCategoryObjects = categories.filter((category) => nextCategoryIds.includes(category.id));
    setTasks((prev) => prev.map((task) => (
      task.id === id ? { ...task, categories: nextCategoryObjects } : task
    )));
    setSelectedTask((prev) => (
      prev?.id === id ? { ...prev, categories: nextCategoryObjects } : prev
    ));
    try {
      await taskService.updateTask(id, { categories: nextCategoryIds });
    } catch (updateError) {
      console.error(updateError);
      await fetchTasks();
    }
  },
  [categories, fetchTasks],
);

const createCategory = useCallback(async (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Category name cannot be empty.");
  }
  const created = await categoryService.createCategory(trimmed);
  setCategories((prev) => {
    const exists = prev.some((category) => category.id === created.id);
    const next = exists ? prev : [...prev, created];
    return [...next].sort((a, b) => a.text.localeCompare(b.text));
  });
  return created;
}, []);

const updateCategory = useCallback(async (id: number, patch: { colour?: string | null; colour_override?: boolean }) => {
  const updated = await categoryService.updateCategory(id, patch);
  setCategories((prev) => prev.map((category) => (
    category.id === id ? { ...category, ...updated } : category
  )));
  setTasks((prev) => prev.map((task) => ({
    ...task,
    categories: task.categories.map((category) =>
      category.id === id ? { ...category, ...updated } : category
    ),
  })));
  return updated;
}, []);

const deleteCategory = useCallback(async (id: number) => {
  await categoryService.deleteCategory(id);
  setCategories((prev) => prev.filter((category) => category.id !== id));
  setTasks((prev) => prev.map((task) => ({
    ...task,
    categories: task.categories.filter((category) => category.id !== id),
  })));
  if (filterCategory === id) {
    setFilterCategory(null);
  }
}, [filterCategory]);

const openTask = useCallback((task: Task) => {
  setSelectedTask(task);
  setIsSidebarOpen(true);
}, []);

const openNewTask = useCallback(() => {
  setSelectedTask(undefined);
  setIsSidebarOpen(true);
}, []);

const closeSidebar = useCallback(() => {
  setIsSidebarOpen(false);
}, []);

const filteredTasks = useMemo(() => {
  return tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
    const matchesHighImportance = !filterHighImportance || task.importance >= 8;
    const matchesQuickWins =
      !filterQuickWins || (task.estimated_minutes > 0 && task.estimated_minutes <= 30);
    return matchesSearch && matchesHighImportance && matchesQuickWins;
  });
}, [filterHighImportance, filterQuickWins, search, tasks]);

const sections = useMemo<TaskListSections>(() => {
  const now = moment();
  const sevenDaysAgo = moment().subtract(7, "days").startOf("day");

  const pastTasks = filteredTasks.filter(
    (task) => task.completed && moment(task.deadline).isBetween(sevenDaysAgo, now, undefined, "[]"),
  );

  const overdueTasks = filteredTasks.filter(
    (task) => !task.completed && moment(task.deadline).isBefore(now),
  );

  const todayTasks = filteredTasks.filter(
    (task) =>
      moment(task.deadline).isSame(now, "day") &&
      !overdueTasks.some((overdueTask) => overdueTask.id === task.id) &&
      !pastTasks.some((pastTask) => pastTask.id === task.id),
  );

  const upcomingTasks = filteredTasks.filter(
    (task) =>
      !task.completed
      && moment(task.deadline).isAfter(now)
      && !moment(task.deadline).isSame(now, "day"),
  );

  const completedTasks = filteredTasks
    .filter((task) => task.completed)
    .sort((a, b) => moment(b.deadline).valueOf() - moment(a.deadline).valueOf());

  const groupedUpcomingTasks = upcomingTasks.reduce<Record<string, Task[]>>((groups, task) => {
    const date = moment(task.deadline).startOf("day").format("YYYY-MM-DD");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(task);
    return groups;
  }, {});

  const sortedUpcomingDates = Object.keys(groupedUpcomingTasks).sort();

  return {
    pastTasks,
    overdueTasks,
    todayTasks,
    upcomingTasks,
    completedTasks,
    groupedUpcomingTasks,
    sortedUpcomingDates,
  };
}, [filteredTasks]);

const formatDayLabel = useCallback((dateStr: string) => {
  const date = moment(dateStr);
  const tomorrow = moment().add(1, "day").startOf("day");
  if (date.isSame(tomorrow, "day")) {
    return "Tomorrow";
  }
  return date.format("ddd D MMM");
}, []);

return {
  state: {
    tasks,
    categories,
    isSidebarOpen,
    selectedTask,
    search,
    sortBy,
    filters: {
      category: filterCategory,
      completed: filterCompleted,
      highImportance: filterHighImportance,
      quickWins: filterQuickWins,
    },
    sections,
  },
  loading,
  error,
  actions: {
    setSearch,
    setSortBy,
    setFilterCategory,
    setFilterCompleted,
    toggleFilterHighImportance: () => {
      setFilterHighImportance((prev) => !prev);
    },
    toggleFilterQuickWins: () => {
      setFilterQuickWins((prev) => !prev);
    },
    openTask,
    openNewTask,
    closeSidebar,
    toggleComplete,
    submitTask,
    deleteTask,
    createCategory,
    updateCategory,
    deleteCategory,
    updateTaskCategories,
    refresh,
    formatDayLabel,
  },
};
};
