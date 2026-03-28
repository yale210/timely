/**
 * Creates task mutation callbacks used by useTaskMutations.ts.
 */
import * as taskService from "@/services/taskService";
import type { Category, Task, TaskSubmission } from "@/types";

type SetTasks = React.Dispatch<React.SetStateAction<Task[]>>;
type SetSelectedTask = React.Dispatch<React.SetStateAction<Task | undefined>>;

/**
 * Builds a completion toggle handler.
 * @param tasks Current task list.
 * @param fetchTasks Refresh callback.
 */
export function makeToggleComplete(
  tasks: Task[],
  fetchTasks: () => Promise<void>,
) {
  return async (id: number) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    try {
      await taskService.updateTask(id, { completed: !task.completed });
      await fetchTasks();
    } catch (togglingError) {
      console.error(togglingError);
    }
  };
}

/**
 * Builds a submit handler for create/update.
 * @param selectedTask Currently selected task.
 * @param fetchTasks Refresh callback.
 */
export function makeSubmitTask(
  selectedTask: Task | undefined,
  fetchTasks: () => Promise<void>,
) {
  return async (data: TaskSubmission) => {
    try {
      if (selectedTask) {
        await taskService.updateTask(selectedTask.id, data);
      } else {
        await taskService.createTask(data);
      }

      await fetchTasks();
    } catch (submissionError) {
      console.error(submissionError);
      throw submissionError;
    }
  };
}

/**
 * Builds a delete handler.
 * @param fetchTasks Refresh callback.
 */
export function makeDeleteTask(fetchTasks: () => Promise<void>) {
  return async (id: number) => {
    try {
      await taskService.deleteTask(id);
      await fetchTasks();
    } catch (deleteError) {
      console.error(deleteError);
    }
  };
}

function buildNextCategoryObjects(
  categories: Category[],
  nextCategoryIds: number[],
): Category[] {
  return categories.filter((category) => nextCategoryIds.includes(category.id));
}

/**
 * Builds an optimistic category update handler.
 * @param categories Available categories.
 * @param setTasks Task setter.
 * @param setSelectedTask Selected task setter.
 * @param fetchTasks Refresh callback.
 */
export function makeUpdateTaskCategories(
  categories: Category[],
  setTasks: SetTasks,
  setSelectedTask: SetSelectedTask,
  fetchTasks: () => Promise<void>,
) {
  return async (id: number, nextCategoryIds: number[]) => {
    const nextCategoryObjects = buildNextCategoryObjects(categories, nextCategoryIds);

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, categories: nextCategoryObjects } : task,
      ),
    );

    setSelectedTask((prev) =>
      prev?.id === id ? { ...prev, categories: nextCategoryObjects } : prev,
    );

    try {
      await taskService.updateTask(id, { categories: nextCategoryIds });
    } catch (updateError) {
      console.error(updateError);
      await fetchTasks();
    }
  };
}