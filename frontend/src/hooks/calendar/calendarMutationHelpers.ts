import moment from "moment";
import * as taskService from "@/services/taskService";
import type { Category, Event, Preference, ScheduleResult, Task, TaskSubmission } from "@/types";

const getSelectedTask = (selectedItem: Task | Event | undefined): Task | null =>
  selectedItem && "deadline" in selectedItem ? selectedItem : null;

const getSelectedEvent = (selectedItem: Task | Event | undefined): Event | null =>
  selectedItem && "end_time" in selectedItem ? selectedItem : null;

const getTaskRescheduleDate = (preference: Preference | null): string =>
  moment().tz(preference?.timezone ?? moment.tz.guess()).format("YYYY-MM-DD");

const hasTaskAllocations = (task: Task): boolean => (task.allocation?.length ?? 0) > 0;

const buildScheduleOrder = (results: ScheduleResult[]): Record<number, number> => {
  const nextOrder: Record<number, number> = {};
  results
    .filter((result) => result.success && result.scheduled_start && result.scheduled_end)
    .forEach((result, index) => {
      nextOrder[result.task_id] = index;
    });
  return nextOrder;
};

const updateCategoriesInItems = <T extends { categories: Category[] }>(
  items: T[],
  id: number,
  updated: Category,
): T[] => items.map((item) => ({ ...item, categories: item.categories.map((category) => (category.id === id ? { ...category, ...updated } : category)) }));

const removeCategoryFromItems = <T extends { categories: Category[] }>(items: T[], id: number): T[] =>
  items.map((item) => ({ ...item, categories: item.categories.filter((category) => category.id !== id) }));

const getTaskCompletionPatch = (task: Task) => {
  const completed = !task.completed;
  return { completed, completed_minutes: completed ? task.estimated_minutes : 0 };
};

const isSoundEffectsDisabled = (preference: Preference | null): boolean =>
  preference?.disable_sound_effects
  ?? (typeof window !== "undefined" && localStorage.getItem("disable_sound_effects") === "true");

const saveTaskSubmission = async (
  selectedTask: Task | null,
  data: TaskSubmission,
  preference: Preference | null,
) => {
  if (!selectedTask || selectedTask.id === 0) {
    await taskService.createTask(data);
    return;
  }
  if (shouldRescheduleTaskSave(selectedTask, data)) {
    await taskService.saveAndRescheduleTask(selectedTask.id, data, getTaskRescheduleDate(preference));
    return;
  }
  await taskService.updateTask(selectedTask.id, data);
};

const retryTaskRescheduleSave = async (
  selectedTask: Task,
  data: TaskSubmission,
  preference: Preference | null,
) =>
  taskService.saveAndRescheduleTask(selectedTask.id, data, getTaskRescheduleDate(preference));

/**
 * Determines whether editing a persisted task should trigger save-and-reschedule.
 * @param selectedTask - Existing task being edited.
 * @param data - Submitted task patch.
 * @returns True when scheduling-sensitive fields changed.
 */
export const shouldRescheduleTaskSave = (selectedTask: Task, data: TaskSubmission): boolean => {
  const bufferBeforeChanged = typeof data.buffer_before_minutes === "number"
    && data.buffer_before_minutes !== (selectedTask.buffer_before_minutes ?? 0);
  const bufferAfterChanged = typeof data.buffer_after_minutes === "number"
    && data.buffer_after_minutes !== (selectedTask.buffer_after_minutes ?? 0);
  const completedMinutesChanged = typeof data.completed_minutes === "number"
    && data.completed_minutes !== (selectedTask.completed_minutes ?? 0);
  return bufferBeforeChanged || bufferAfterChanged || completedMinutesChanged;
};

/**
 * Builds warning rows for tasks the scheduler could not place.
 * @param results - Raw scheduling results from the API.
 * @param tasks - Current task list for title lookups.
 * @returns Warning entries for the calendar UI.
 */
export const buildRescheduleWarnings = (
  results: ScheduleResult[],
  tasks: Task[],
): { taskId: number; title: string; reason: string }[] =>
  results
    .filter((result) => !result.success)
    .map((result) => ({
      taskId: result.task_id,
      title: tasks.find((task) => task.id === result.task_id)?.title ?? `Task #${result.task_id}`,
      reason: result.reason ?? "The scheduler could not find enough time before the deadline.",
    }));

/**
 * Groups shared calendar mutation helpers used by the mutations hook.
 */
export const calendarMutationHelpers = {
  getSelectedTask,
  getSelectedEvent,
  hasTaskAllocations,
  buildScheduleOrder,
  buildRescheduleWarnings,
  updateCategoriesInItems,
  removeCategoryFromItems,
  getTaskCompletionPatch,
  isSoundEffectsDisabled,
  saveTaskSubmission,
  retryTaskRescheduleSave,
};
