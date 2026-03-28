import { useMemo } from "react";
import moment from "moment";
import * as taskService from "@/services/taskService";
import * as categoryService from "@/services/categoryService";
import { emitLevelup } from "@/utils/levelUpEvent";
import { emitXpGained } from "@/utils/xpEvents";
import { hasTaskAllocationRescheduleConflict } from "@/utils/apiErrors";
import { didSchedulingInputsChange, extractRescheduleWarning } from "@/hooks/tasks/taskListUtils";
import type { Category, Task, TaskSubmission, TaskUpdatedResponse } from "@/types";

interface UseTaskListMutationsArgs {
  tasks: Task[];
  categories: Category[];
  selectedTask: Task | undefined;
  filterCategory: number | null;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  setSelectedTask: React.Dispatch<React.SetStateAction<Task | undefined>>;
  setWarning: React.Dispatch<React.SetStateAction<string | null>>;
  setFilterCategory: React.Dispatch<React.SetStateAction<number | null>>;
  fetchTasks: () => Promise<void>;
}

function getTodayIsoDate() {
  return moment().format("YYYY-MM-DD");
}

function syncSavedTaskState(
  savedTask: TaskUpdatedResponse | Task | null,
  setSelectedTask: UseTaskListMutationsArgs["setSelectedTask"],
  setWarning: UseTaskListMutationsArgs["setWarning"],
) {
  if (!savedTask) {
    return;
  }

  setSelectedTask(savedTask);
  setWarning(extractRescheduleWarning(savedTask));
}

async function saveTaskSubmission(
  selectedTask: Task | undefined,
  data: TaskSubmission,
) {
  if (!selectedTask) {
    return taskService.createTask(data);
  }

  if (didSchedulingInputsChange(selectedTask, data)) {
    return taskService.saveAndRescheduleTask(selectedTask.id, data, getTodayIsoDate());
  }

  return taskService.updateTask(selectedTask.id, data);
}

async function saveTaskWithConflictRecovery(
  selectedTask: Task | undefined,
  data: TaskSubmission,
  submissionError: unknown,
) {
  if (
    !selectedTask
    || (selectedTask.allocation?.length ?? 0) === 0
    || !hasTaskAllocationRescheduleConflict(submissionError)
  ) {
    throw submissionError;
  }

  return taskService.saveAndRescheduleTask(selectedTask.id, data, getTodayIsoDate());
}

async function handleToggleCompleteAction(
  tasks: Task[],
  id: number,
  fetchTasks: () => Promise<void>,
) {
  const task = tasks.find((item) => item.id === id);
  if (!task) {
    return;
  }

  try {
    const nextCompleted = !task.completed;
    const response = await taskService.updateTask(id, {
      completed: nextCompleted,
      completed_minutes: nextCompleted ? task.estimated_minutes : 0,
    });

    if (nextCompleted && !task.completed) {
      emitXpGained(10 + 2 * task.importance);
    }
    if (response.level_up && response.new_level != null) {
      emitLevelup(response.new_level);
    }

    await fetchTasks();
  } catch (toggleError) {
    console.error(toggleError);
  }
}

async function handleSubmitTaskAction(
  args: UseTaskListMutationsArgs,
  data: TaskSubmission,
) {
  try {
    const savedTask = await saveTaskSubmission(args.selectedTask, data);
    syncSavedTaskState(savedTask, args.setSelectedTask, args.setWarning);
    await args.fetchTasks();
  } catch (submissionError) {
    const savedTask = await saveTaskWithConflictRecovery(
      args.selectedTask,
      data,
      submissionError,
    );
    syncSavedTaskState(savedTask, args.setSelectedTask, args.setWarning);
    await args.fetchTasks();
  }
}

async function handleDeleteTaskAction(
  id: number,
  fetchTasks: () => Promise<void>,
) {
  try {
    await taskService.deleteTask(id);
    await fetchTasks();
  } catch (deleteError) {
    console.error(deleteError);
  }
}

async function handleUpdateTaskCategoriesAction(
  args: UseTaskListMutationsArgs,
  id: number,
  nextCategoryIds: number[],
) {
  const nextCategoryObjects = args.categories.filter((category) => nextCategoryIds.includes(category.id));

  args.setTasks((prev) =>
    prev.map((task) => (task.id === id ? { ...task, categories: nextCategoryObjects } : task)),
  );
  args.setSelectedTask((prev) => (
    prev?.id === id ? { ...prev, categories: nextCategoryObjects } : prev
  ));

  try {
    await taskService.updateTask(id, { categories: nextCategoryIds });
  } catch (updateError) {
    console.error(updateError);
    await args.fetchTasks();
  }
}

async function handleCreateCategoryAction(
  text: string,
  setCategories: UseTaskListMutationsArgs["setCategories"],
) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Category name cannot be empty.");
  }

  const created = await categoryService.createCategory(trimmed);
  setCategories((prev) => {
    const next = prev.some((category) => category.id === created.id) ? prev : [...prev, created];
    return [...next].sort((left, right) => left.text.localeCompare(right.text));
  });

  return created;
}

async function handleUpdateCategoryAction(
  id: number,
  patch: { colour?: string | null; colour_override?: boolean },
  setCategories: UseTaskListMutationsArgs["setCategories"],
  setTasks: UseTaskListMutationsArgs["setTasks"],
) {
  const updated = await categoryService.updateCategory(id, patch);

  setCategories((prev) => prev.map((category) => (
    category.id === id ? { ...category, ...updated } : category
  )));
  setTasks((prev) => prev.map((task) => ({
    ...task,
    categories: task.categories.map((category) => (
      category.id === id ? { ...category, ...updated } : category
    )),
  })));

  return updated;
}

async function handleDeleteCategoryAction(
  args: UseTaskListMutationsArgs,
  id: number,
) {
  await categoryService.deleteCategory(id);

  args.setCategories((prev) => prev.filter((category) => category.id !== id));
  args.setTasks((prev) => prev.map((task) => ({
    ...task,
    categories: task.categories.filter((category) => category.id !== id),
  })));

  if (args.filterCategory === id) {
    args.setFilterCategory(null);
  }
}

/**
 * Builds the data-mutation actions for the task list page.
 * @param args Mutation dependencies and state setters.
 * @returns Memoized mutation callbacks.
 */
function buildTaskItemMutations(args: UseTaskListMutationsArgs) {
  return {
    toggleComplete: (id: number) => handleToggleCompleteAction(args.tasks, id, args.fetchTasks),
    submitTask: (data: TaskSubmission) => handleSubmitTaskAction(args, data),
    deleteTask: (id: number) => handleDeleteTaskAction(id, args.fetchTasks),
    updateTaskCategories: (id: number, nextCategoryIds: number[]) =>
      handleUpdateTaskCategoriesAction(args, id, nextCategoryIds),
  };
}

function buildTaskCategoryMutations(args: UseTaskListMutationsArgs) {
  return {
    createCategory: (text: string) => handleCreateCategoryAction(text, args.setCategories),
    updateCategory: (id: number, patch: { colour?: string | null; colour_override?: boolean }) =>
      handleUpdateCategoryAction(id, patch, args.setCategories, args.setTasks),
    deleteCategory: (id: number) => handleDeleteCategoryAction(args, id),
  };
}

/**
 * Memoizes the task-list mutation callbacks.
 * @param args Mutation dependencies and state setters.
 * @returns Memoized mutation callbacks.
 */
export function useTaskListMutations(args: UseTaskListMutationsArgs) {
  const itemMutations = useMemo(() => buildTaskItemMutations(args), [args]);
  const categoryMutations = useMemo(() => buildTaskCategoryMutations(args), [args]);
  return useMemo(() => ({ ...itemMutations, ...categoryMutations }), [categoryMutations, itemMutations]);
}
