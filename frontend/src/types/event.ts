import type { Category } from "./category"

/**
 * Represents a reminder for an event.
 * @interface EventReminder
 */
export interface EventReminder {
  id?: number;
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
