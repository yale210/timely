import type useTaskFormState from "@/hooks/taskForm/useTaskFormState";
import type { Category, Task } from "@/types";

type TaskFormState = ReturnType<typeof useTaskFormState>;

/**
 * Builds the argument object expected by the task-form derived-state hook.
 * @param categories Available task categories.
 * @param taskState Current task form state.
 * @param initialData Existing task being edited, if any.
 * @returns Derived-state hook input data.
 */
export function buildTaskFormArgs(
  categories: Category[],
  taskState: TaskFormState,
  initialData?: Task,
) {
  return {
    categories,
    selectedCategories: taskState.selectedCategories,
    colour: taskState.colour,
    title: taskState.title,
    description: taskState.description,
    date: taskState.date,
    startTime: taskState.startTime,
    deadline: taskState.deadline,
    deadlineTime: taskState.deadlineTime,
    importance: taskState.importance,
    estimatedMinutes: taskState.estimatedMinutes,
    autoSchedule: taskState.autoSchedule,
    allowSplit: taskState.allowSplit,
    initialData,
    hasSubmitted: taskState.hasSubmitted,
    hasTouchedTime: taskState.hasTouchedTime,
    completedMinutes: taskState.completedMinutes,
    minSplitMinutes: taskState.minSplitMinutes,
    maxSplitMinutes: taskState.maxSplitMinutes,
    bufferEnabled: taskState.bufferEnabled,
    bufferBeforeMinutes: taskState.bufferBeforeMinutes,
    bufferAfterMinutes: taskState.bufferAfterMinutes,
  };
}

/**
 * Returns the deadline validation message for the current form state.
 * @param deadline The current deadline value.
 * @returns A user-facing validation message.
 */
export function renderDeadlineError(deadline: string) {
  return deadline
    ? "Start time must be before the deadline."
    : "Please set a deadline.";
}

const TASK_SERVER_ERROR_LABELS: Record<string, string> = {
  allocation: "Allocation",
  buffer_after_minutes: "Buffer after",
  buffer_before_minutes: "Buffer before",
  categories: "Categories",
  completed_minutes: "Completed minutes",
  deadline: "Deadline",
  description: "Description",
  importance: "Importance",
  max_split_minutes: "Maximum split block minutes",
  min_split_minutes: "Minimum split block minutes",
  start_time: "Start time",
  title: "Title",
};

/**
 * Maps backend field names to user-facing labels in task submit errors.
 * @param field Backend field name.
 * @returns Human-readable field label.
 */
export function getTaskServerFieldLabel(field: string): string {
  return TASK_SERVER_ERROR_LABELS[field] ?? field.replaceAll("_", " ");
}
