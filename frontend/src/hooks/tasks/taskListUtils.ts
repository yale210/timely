import moment from "moment";
import type { Task, TaskSubmission, TaskUpdatedResponse } from "@/types";
import type { TaskCompletionFilter, TaskListSections } from "@/hooks/tasks/taskListTypes";

type TaskQueryParams = Record<string, string | number>;

/**
 * Builds the task query params for the current list filters.
 * @param sortBy Current ordering value.
 * @param filterCategory Selected category filter.
 * @param filterCompleted Selected completion filter.
 * @returns Params passed to the tasks API.
 */
export function buildTaskQueryParams(
  sortBy: string,
  filterCategory: number | null,
  filterCompleted: TaskCompletionFilter,
): TaskQueryParams {
  const params: TaskQueryParams = { ordering: sortBy };

  if (filterCategory) {
    params.categories = filterCategory;
  }

  if (filterCompleted === "completed") {
    params.completed = "true";
  } else if (filterCompleted === "pending") {
    params.completed = "false";
  }

  return params;
}

/**
 * Returns true when task edits require the reschedule save endpoint.
 * @param selectedTask Currently selected task.
 * @param data Submitted task payload.
 * @returns Whether the rescheduling save path should be used.
 */
export function didSchedulingInputsChange(
  selectedTask: Task,
  data: TaskSubmission,
): boolean {
  return (
    data.buffer_before_minutes !== undefined
      && data.buffer_before_minutes !== (selectedTask.buffer_before_minutes ?? 0)
  ) || (
    data.buffer_after_minutes !== undefined
      && data.buffer_after_minutes !== (selectedTask.buffer_after_minutes ?? 0)
  ) || (
    data.completed_minutes !== undefined
      && data.completed_minutes !== (selectedTask.completed_minutes ?? 0)
  );
}

/**
 * Extracts the backend reschedule warning message from a saved task.
 * @param savedTask Task response from the backend.
 * @returns Warning string when present.
 */
export function extractRescheduleWarning(
  savedTask: TaskUpdatedResponse | Task,
): string | null {
  return "reschedule_warning" in savedTask
    ? savedTask.reschedule_warning ?? null
    : null;
}

/**
 * Returns whether the task matches the current search and toggle filters.
 * @param task Task being evaluated.
 * @param search Current text search.
 * @param filterHighImportance Whether high-importance filter is enabled.
 * @param filterQuickWins Whether quick-wins filter is enabled.
 * @returns Whether the task passes the active filters.
 */
export function matchesTaskListFilters(
  task: Task,
  search: string,
  filterHighImportance: boolean,
  filterQuickWins: boolean,
): boolean {
  const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
  const matchesHighImportance = !filterHighImportance || task.importance >= 8;
  const matchesQuickWins =
    !filterQuickWins || (task.estimated_minutes > 0 && task.estimated_minutes <= 30);

  return matchesSearch && matchesHighImportance && matchesQuickWins;
}

function buildPastTasks(
  tasks: Task[],
  sevenDaysAgo: moment.Moment,
  now: moment.Moment,
) {
  return tasks.filter(
    (task) => task.completed && moment(task.deadline).isBetween(sevenDaysAgo, now, undefined, "[]"),
  );
}

function buildOverdueTasks(tasks: Task[], now: moment.Moment) {
  return tasks.filter(
    (task) => !task.completed && moment(task.deadline).isBefore(now),
  );
}

function buildTodayTasks(
  tasks: Task[],
  now: moment.Moment,
) {
  return tasks.filter(
    (task) =>
      !task.completed
      && moment(task.deadline).isSame(now, "day")
      && !moment(task.deadline).isBefore(now)
  );
}

function buildUpcomingTasks(tasks: Task[], now: moment.Moment) {
  return tasks.filter(
    (task) =>
      !task.completed
      && moment(task.deadline).isAfter(now)
  );
}

function buildCompletedTasks(tasks: Task[]) {
  return tasks
    .filter((task) => task.completed)
    .sort((left, right) => moment(right.deadline).valueOf() - moment(left.deadline).valueOf());
}

function buildUpcomingTaskGroups(upcomingTasks: Task[]) {
  return upcomingTasks.reduce<Record<string, Task[]>>((groups, task) => {
    const date = moment(task.deadline).startOf("day").format("YYYY-MM-DD");
    groups[date] = [...(groups[date] ?? []), task];
    return groups;
  }, {});
}

/**
 * Builds the grouped task sections shown on the task list page.
 * @param filteredTasks Tasks after search and toggle filters are applied.
 * @returns Grouped sections for rendering.
 */
export function buildTaskSections(filteredTasks: Task[]): TaskListSections {
  const now = moment();
  const sevenDaysAgo = moment().subtract(7, "days").startOf("day");
  const pastTasks = buildPastTasks(filteredTasks, sevenDaysAgo, now);
  const overdueTasks = buildOverdueTasks(filteredTasks, now);
  const todayTasks = buildTodayTasks(filteredTasks, now);
  const upcomingTasks = buildUpcomingTasks(filteredTasks, now);
  const completedTasks = buildCompletedTasks(filteredTasks);
  const groupedUpcomingTasks = buildUpcomingTaskGroups(upcomingTasks);

  return {
    pastTasks,
    overdueTasks,
    todayTasks,
    upcomingTasks,
    completedTasks,
    groupedUpcomingTasks,
    sortedUpcomingDates: Object.keys(groupedUpcomingTasks).sort(),
  };
}

/**
 * Formats the upcoming-task group label for display.
 * @param dateStr Task date group.
 * @returns Human-readable day label.
 */
export function formatTaskDayLabel(dateStr: string) {
  const date = moment(dateStr);
  const tomorrow = moment().add(1, "day").startOf("day");

  return date.isSame(tomorrow, "day") ? "Tomorrow" : date.format("ddd D MMM");
}
