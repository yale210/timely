import type { Category } from "./category"

/**
 * Represents a task with its associated metadata and scheduling information.
 * @interface Task
 * @property id - The unique identifier for the task.
 * @property title - The title or summary of the task.
 * @property description - An optional detailed description of the task.
 * @property start_time - The ISO 8601 timestamp representing when the task should commence.
 * @property deadline - The ISO 8601 timestamp by which the task must be completed.
 * @property importance - A numerical value indicating the priority of the task.
 * @property completed - Indicates whether the task has been finished.
 * @property categories - An array of categories associated with this task.
 * @property estimated_minutes - The anticipated duration of the task in minutes.
 * @property parent_task - The identifier of a parent task, if this is a subtask.
 */
export interface Task {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  deadline: string;
  colour?: string | null;
  importance: number;
  completed: boolean;
  locked?: boolean;
  allow_split?: boolean;
  min_split_minutes?: number;
  max_split_minutes?: number | null;
  categories: Category[];
  estimated_minutes: number;
  parent_task?: number | null;
  allocation?: { start: string; end: string }[];
  total_task_allocations?: number;
}

/**
 * Response payload after updating a task, including progression fields.
 */
export interface TaskUpdatedResponse extends Task {
  level_up?: boolean;
  new_level?: number;
  xp?: number;
}

/**
 * Represents the data structure used when submitting a task to the server.
 * This extends the Task interface but replaces the full category objects with their identifiers.
 * @interface TaskSubmission
 */
export interface TaskSubmission extends Omit<Partial<Task>, "categories"> {
  categories?: number[];
}
