/**
 * Represents a category that can be assigned to a task.
 * @interface Category
 * @property id - The unique identifier for the category.
 * @property text - The display name of the category.
 */
export interface Category {
  id: number;
  text: string;
}

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
  importance: number;
  completed: boolean;
  categories: Category[];
  estimated_minutes: number;
  parent_task?: number | null;
}

/**
 * Represents the data structure used when submitting a task to the server.
 * This extends the Task interface but replaces the full category objects with their identifiers.
 * @interface TaskSubmission
 */
export interface TaskSubmission extends Omit<Partial<Task>, "categories"> {
  categories?: number[];
}

/**
 * Represents a reminder for an event.
 * @interface EventReminder
 */
export interface EventReminder {
  id?: number;
  type: "email" | "popup";
  minutes_before: number;
}

/**
 * Represents a calendar event.
 * @interface Event
 */
export interface Event {
  id: number;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  categories: Category[];
  recurrence_interval?: "daily" | "weekly" | "monthly" | "yearly" | null;
  recurrence_end?: string | null;
  reminders: EventReminder[];
}

/**
 * Represents the data structure used when submitting an event to the server.
 * @interface EventSubmission
 */
export interface EventSubmission extends Omit<Partial<Event>, "reminders" | "categories"> {
  reminders?: Omit<EventReminder, "id">[];
  categories?: number[];
}

/**
 * Represents weekly task statistics.
 * @interface WeeklyStats
 */
export interface WeeklyStats {
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
  total_minutes_planned: number;
  daily_stats: { day: string; completed_count: number; total_minutes: number }[];
  difficulty_stats: { level: number; completed_count: number }[];
}
