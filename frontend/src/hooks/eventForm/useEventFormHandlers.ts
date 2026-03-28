import type { TimeUnit, NormalisedEventSubmission } from "@/hooks/eventForm/useEventFormTypes";
import type { EventSubmission } from "@/types";
import { toMinutesBefore, fromMinutesBefore } from "@/hooks/eventForm/eventFormReminderHelpers";
/**
 * Safely convert a Date to ISO string, returning "" for invalid dates.
 * @param d - The date object to convert.
 */
const safeToISOString = (d: Date): string =>
  Number.isNaN(d.getTime()) ? "" : d.toISOString();

const UNIT_TO_MINUTES: Record<TimeUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 1_440,
  weeks: 10_080,
  months: 43_200,
  years: 525_600,
};

export const UNIT_LABELS: { value: TimeUnit; label: string }[] = [
  { value: "minutes", label: "minutes" },
  { value: "hours", label: "hours" },
  { value: "days", label: "days" },
  { value: "weeks", label: "weeks" },
  { value: "months", label: "months" },
  { value: "years", label: "years" },
];
const CLOCK_SKEW_WARNING_THRESHOLD_MS = 5 * 60 * 1_000;
export const INITIAL_VALIDATION_NOW_MS = Date.now();
const getCurrentTimestamp = (): number => Date.now();
const ONE_HOUR_MS = 60 * 60 * 1_000;

const withTime = (base: Date, hour: number, minute: number): Date => {
  const value = new Date(base);
  value.setHours(hour, minute, 0, 0);
  return value;
};

const toLocalDateInputValue = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Helper functions to turn the logic of normaliseEventSubmission below 25 lines.
 * @param minutes_before Minutes before the reminder.
 * @param send_email Boolean of sending an email or not.
 * @param send_push Boolean representing wether or nor a push notification should be sent.
 */
const normaliseReminder = (minutes_before: number, send_email: boolean, send_push: boolean) => ({
  send_email: Boolean(send_email),
  send_push: Boolean(send_push),
  minutes_before: Number(minutes_before),
});
const sortReminders = (left: NormalisedEventSubmission["reminders"][number], right: NormalisedEventSubmission["reminders"][number]) => {
  if (left.minutes_before !== right.minutes_before) return left.minutes_before - right.minutes_before;
  if (left.send_email !== right.send_email) return Number(left.send_email) - Number(right.send_email);
  return Number(left.send_push) - Number(right.send_push);
};

const normaliseEventSubmission = (
  submission: EventSubmission,
): NormalisedEventSubmission => ({
  title: submission.title ?? "",
  description: submission.description ?? "",
  location: submission.location ?? "",
  start_time: submission.start_time ?? "",
  end_time: submission.end_time ?? "",
  colour: submission.colour ?? "",
  categories: [...(submission.categories ?? [])].sort((a, b) => a - b),
  recurrence_interval: submission.recurrence_interval ?? null,
  recurrence_end: submission.recurrence_end ?? null,
  reminders: [...(submission.reminders ?? [])]
    .map((reminder) => (
      normaliseReminder(reminder.minutes_before, reminder.send_email, reminder.send_push)
    ))
    .sort(sortReminders),
});

const isEventSubmissionEqual = (
  left: NormalisedEventSubmission,
  right: NormalisedEventSubmission,
): boolean => JSON.stringify(left) === JSON.stringify(right);

/**
 * Returns methods and constants used in EventForm
 */
export const getEventFormHandlers = () => {
  return {
    safeToISOString,
    UNIT_TO_MINUTES,
    CLOCK_SKEW_WARNING_THRESHOLD_MS,
    INITIAL_VALIDATION_NOW_MS,
    getCurrentTimestamp,
    ONE_HOUR_MS,
    withTime,
    toLocalDateInputValue,
    toMinutesBefore,
    normaliseEventSubmission,
    isEventSubmissionEqual,
    fromMinutesBefore,
  }
}