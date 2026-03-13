/**
 * Represents a category that can be assigned to a task.
 * @interface Category
 * @property id - The unique identifier for the category.
 * @property text - The display name of the category.
 */
export interface Category {
  id: number;
  text: string;
  colour?: string | null;
  colour_override?: boolean;
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
  colour?: string | null;
  importance: number;
  completed: boolean;
  locked?: boolean;
  allow_split?: boolean;
  categories: Category[];
  estimated_minutes: number;
  parent_task?: number | null;
  allocation?: { start: string; end: string }[];
  total_task_allocations?: number;
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
 * Represents a special date override that blocks scheduling.
 * @interface SpecialDate
 */
export interface SpecialDate {
  id: number;
  date: string;
  text: string;
}

/**
 * Represents a reminder for an event.
 * @interface EventReminder
 */
export interface EventReminder {
  id?: number;
  send_email: boolean;
  send_push: boolean;
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
  colour?: string | null;
  categories: Category[];
  recurrence_interval?: "daily" | "weekly" | "monthly" | "yearly" | null;
  recurrence_end?: string | null;
  reminders: EventReminder[];
  is_override?: boolean;
  is_split_series?: boolean;
  source_event_id?: number;
  split_from_event_id?: number | null;
  original_start_time?: string | null;
  instance_id?: string;
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
 * Mutation scope for recurring event updates/deletes.
 */
export type RecurrenceScope = "this" | "following" | "all";

/**
 * Optional query context for scoped recurring mutations.
 */
export interface EventMutationContext {
  scope?: RecurrenceScope;
  original_start_time?: string;
}

/**
 * Represents a single result of a task scheduling operation.
 */
export interface ScheduleResult {
  task_id: number;
  success: boolean;
  scheduled_start: string | null;
  scheduled_end: string | null;
  reason?: string | null;
}

/**
 * Represents the response from the task scheduling API.
 */
export interface ScheduleResponse {
  start_date: string;
  scheduled_count: number;
  failed_count: number;
  results: ScheduleResult[];
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
  importance_stats: { level: number; completed_count: number }[];
}

/**
 * Represents user preferences.
 * @interface Preference
 */
export interface Preference {
    id: number
    day_start: string
    day_end: string
    day_schedule?: { day: number; start: string; end: string }[]
    max_hours_study_per_day: number
    limit_max_hours?: boolean
    disable_sound_effects?: boolean
    days_off: number[]
}
/**
 * Represents the data structure used to update a Preference
 * @interface PreferenceUpdate
 */
export type PreferenceUpdate = Partial<Pick<
    Preference, "day_start"|"day_end"|"day_schedule"|"max_hours_study_per_day"|"limit_max_hours"|"disable_sound_effects"|"days_off"
>>

/**
 * Represents a friendship between two users.
 * @interface Friendship
 */
export interface Friendship {
  id: number;
  sender: number;
  receiver: number;
  state: "SENT" | "ACCEPTED" | "DECLINED";
  updated_at?: string | null;
}
